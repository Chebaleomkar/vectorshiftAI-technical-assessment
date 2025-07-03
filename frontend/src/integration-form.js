import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Autocomplete,
    Paper,
} from '@mui/material';
import { User, Building, Plug, DatabaseZap } from 'lucide-react';
import { AirtableIntegration } from './integrations/airtable';
import { NotionIntegration } from './integrations/notion';
import { HubspotIntegration } from './integrations/hubspot';
import { DataForm } from './data-form';

const integrationMapping = {
    Notion: NotionIntegration,
    Airtable: AirtableIntegration,
    Hubspot: HubspotIntegration,
};

export const IntegrationForm = () => {
    const [integrationParams, setIntegrationParams] = useState({});
    const [user, setUser] = useState('TestUser');
    const [org, setOrg] = useState('TestOrg');
    const [currType, setCurrType] = useState(null);
    const CurrIntegration = integrationMapping[currType];

    return (
        <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            flexDirection='column'
            sx={{ minHeight: '100vh', backgroundColor: '#f4f6f8', padding: 4 }} 
        >
            <h1>VectorShift </h1>
            <Paper elevation={4} sx={{ padding: 4, width: '100%', maxWidth: 600, borderRadius: 4 }}>
                <Typography variant='h5' gutterBottom display='flex' alignItems='center' gap={1}>
                    <Plug size={24} /> Connect an Integration
                </Typography>
                <TextField
                    label='User'
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    sx={{ mt: 2 }}
                    fullWidth
                    InputProps={{ startAdornment: <User size={18} style={{ marginRight: 8 }} /> }}
                />
                <TextField
                    label='Organization'
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    sx={{ mt: 2 }}
                    fullWidth
                    InputProps={{ startAdornment: <Building size={18} style={{ marginRight: 8 }} /> }}
                />
                <Autocomplete
                    id='integration-type'
                    options={Object.keys(integrationMapping)}
                    sx={{ mt: 2 }}
                    fullWidth
                    renderInput={(params) => (
                        <TextField {...params} label='Integration Type' InputProps={{ ...params.InputProps, startAdornment: <DatabaseZap size={18} style={{ marginRight: 8 }} /> }} />
                    )}
                    onChange={(e, value) => setCurrType(value)}
                />
            </Paper>

            {currType && (
                <Box mt={4} width='100%' maxWidth={800}>
                    <CurrIntegration
                        user={user}
                        org={org}
                        integrationParams={integrationParams}
                        setIntegrationParams={setIntegrationParams}
                    />
                </Box>
            )}

            {integrationParams?.credentials && (
                <Box mt={4} width='100%' maxWidth={1000}>
                    <DataForm
                        integrationType={integrationParams?.type}
                        credentials={integrationParams?.credentials}
                    />
                </Box>
            )}
        </Box>
    );
};
