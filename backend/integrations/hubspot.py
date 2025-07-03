# hubspot.py

import os
import json
import secrets
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
import asyncio
import requests
from integrations.integration_item import IntegrationItem
from dotenv import load_dotenv

from redis_client import add_key_value_redis, get_value_redis, delete_key_redis

load_dotenv();

CLIENT_ID = os.getenv("HUBSPOT_CLIENT_ID")
CLIENT_SECRET = os.getenv("HUBSPOT_CLIENT_SECRET")
REDIRECT_URI = os.getenv("HUBSPOT_REDIRECT_URI")

# HubSpot OAuth scopes
SCOPES = 'oauth%20crm.schemas.contacts.read%20crm.objects.contacts.read'    

authorization_url = f'https://app.hubspot.com/oauth/authorize?client_id={CLIENT_ID}&scope={SCOPES}&redirect_uri={REDIRECT_URI}'

async def authorize_hubspot(user_id, org_id):
    state_data = {
        'state': secrets.token_urlsafe(32),
        'user_id': user_id,
        'org_id': org_id
    }
    encoded_state = json.dumps(state_data)
    await add_key_value_redis(f'hubspot_state:{org_id}:{user_id}', encoded_state, expire=600)

    return f'{authorization_url}&state={encoded_state}'

async def oauth2callback_hubspot(request: Request):
    if request.query_params.get('error'):
        raise HTTPException(status_code=400, detail=request.query_params.get('error'))
    
    code = request.query_params.get('code')
    encoded_state = request.query_params.get('state')
    
    if not encoded_state:
        raise HTTPException(status_code=400, detail='Missing state parameter')
    
    state_data = json.loads(encoded_state)
    original_state = state_data.get('state')
    user_id = state_data.get('user_id')
    org_id = state_data.get('org_id')

    saved_state = await get_value_redis(f'hubspot_state:{org_id}:{user_id}')

    if not saved_state or original_state != json.loads(saved_state).get('state'):
        raise HTTPException(status_code=400, detail='State does not match.')

    # Exchange authorization code for access token
    token_data = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'code': code
    }

    async with httpx.AsyncClient() as client:
        response, _ = await asyncio.gather(
            client.post(
                'https://api.hubapi.com/oauth/v1/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            ),
            delete_key_redis(f'hubspot_state:{org_id}:{user_id}'),
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail='Failed to exchange code for token')

    await add_key_value_redis(f'hubspot_credentials:{org_id}:{user_id}', json.dumps(response.json()), expire=600)
    
    close_window_script = """
    <html>
        <script>
            window.close();
        </script>
    </html>
    """
    return HTMLResponse(content=close_window_script)

async def get_hubspot_credentials(user_id, org_id):
    credentials = await get_value_redis(f'hubspot_credentials:{org_id}:{user_id}')
    if not credentials:
        raise HTTPException(status_code=400, detail='No credentials found.')
    credentials = json.loads(credentials)
    if not credentials:
        raise HTTPException(status_code=400, detail='No credentials found.')
    await delete_key_redis(f'hubspot_credentials:{org_id}:{user_id}')
    return credentials

async def get_items_hubspot(credentials) -> list[IntegrationItem]:

    """Fetch all HubSpot items (contacts, companies, deals, tickets)"""
    credentials = json.loads(credentials)
    access_token = credentials.get('access_token')
    
    if not access_token:
        raise HTTPException(status_code=400, detail='No access token found')
    
    all_items = []
    
    # Define the endpoints and their corresponding types
    endpoints = [
        ('contacts', 'contact'),
        ('companies', 'company'),
        ('deals', 'deal'),
        ('tickets', 'ticket')
    ]
    
    # Fetch data from each endpoint
    for endpoint, item_type in endpoints:
        try:
            items = await fetch_hubspot_data(access_token, endpoint, item_type)
            all_items.extend(items)
            print(f"Fetched {len(items)} {item_type}s from HubSpot")
        except Exception as e:
            print(f"Error fetching {item_type}s: {str(e)}")
            continue
    
    print(f"Total HubSpot items fetched: {len(all_items)}")
    return all_items

async def fetch_hubspot_data(access_token: str, endpoint: str, item_type: str) -> list:
    """Fetch data from HubSpot API endpoint"""
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    all_items = []
    after = None
    
    while True:
        url = f'https://api.hubapi.com/crm/v3/objects/{endpoint}'
        params = {'limit': 100}
        if after:
            params['after'] = after
            
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Error fetching {item_type}: {response.status_code} - {response.text}")
            break
            
        data = response.json()
        results = data.get('results', [])
        
        for item in results:
            all_items.append(create_hubspot_integration_item(item, item_type))
        
        # Check for pagination
        paging = data.get('paging', {})
        if 'next' in paging:
            after = paging['next']['after']
        else:
            break
    
    return all_items

def create_hubspot_integration_item(item_data: dict, item_type: str) -> IntegrationItem:
    """Create an integration item from HubSpot API response"""
    
    # Get the item ID
    item_id = item_data.get('id')
    
    # Extract name based on item type
    properties = item_data.get('properties', {})
    if item_type == 'contact':
        name = f"{properties.get('firstname', '')} {properties.get('lastname', '')}".strip()
        if not name:
            name = properties.get('email', f'Contact {item_id}')
    elif item_type == 'company':
        name = properties.get('name', f'Company {item_id}')
    elif item_type == 'deal':
        name = properties.get('dealname', f'Deal {item_id}')
    elif item_type == 'ticket':
        name = properties.get('subject', f'Ticket {item_id}')
    else:
        name = f'{item_type.capitalize()} {item_id}'
    
    # Extract timestamps
    created_at = properties.get('createdate')
    updated_at = properties.get('lastmodifieddate') or properties.get('hs_lastmodifieddate')
    
    return IntegrationItem(
        id=f'hubspot_{item_type}_{item_id}',
        name=name,
        type=item_type,
        creation_time=created_at,
        last_modified_time=updated_at,
        parent_id=None,
        parent_path_or_name='HubSpot'
    )
