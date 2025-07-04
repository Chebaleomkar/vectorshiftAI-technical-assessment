
# 🚀 VectorShift Technical Assessment – Omkar Chebale

This is a **monorepo** containing the solution for the VectorShift technical assessment. The task involves implementing **OAuth2 integration with HubSpot** using **FastAPI (Python)** and **Redis**, along with a minimal **React.js frontend** to interact with the backend APIs.

---

## 🧠 Project Objectives

* Integrate with HubSpot using the OAuth2 authorization flow
* Store and retrieve user credentials securely using Redis
* Fetch user data (currently: **contacts**) from the HubSpot API
* Expose clean REST APIs for frontend consumption

---

## 📹 Demo Walkthrough (Screen Recording)

Watch the full video walkthrough explaining the Hubspot OAuth2 integration and app demo:  
🔗 [Watch on YouTube](https://www.youtube.com/watch?v=ZPxJ12_wVzc)


## 📁 Folder Structure

```
.
├── frontend/          # React.js frontend
├── backend/           # FastAPI + Redis backend
├── .gitignore
└── README.md
```

---
Great point! Here's the updated **Backend section** of your README with **Docker-based Redis instructions** added in the right place, while keeping the structure and clarity consistent:

---

## ⚙️ Backend (`/backend`)

### 🔧 Tech Stack

* Python 3.10+
* FastAPI
* Redis (via Docker)
* HTTPX (async HTTP client)

### 🏃 Getting Started

1. **Start Redis via Docker**

If you don’t have Redis installed locally, you can run it using Docker:

```bash
docker run --name redis-vectorshift -p 6379:6379 -d redis
```

> This will pull the Redis image and run a container named `redis-vectorshift` on port `6379`.

2. **Run FastAPI Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate     # Use `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

> Make sure Redis is running before starting the FastAPI server.

### 🔌 API Endpoints

| Method | Endpoint                               | Purpose                         |
| ------ | -------------------------------------- | ------------------------------- |
| POST   | `/integrations/hubspot/authorize`      | Starts the OAuth2 flow          |
| GET    | `/integrations/hubspot/oauth2callback` | Handles HubSpot redirect        |
| POST   | `/integrations/hubspot/credentials`    | Fetches and deletes credentials |
| POST   | `/integrations/hubspot/load`           | Fetches contacts from HubSpot   |

---

## 🖼️ Frontend (`/frontend`)

Simple React.js app with buttons to:

* Connect to HubSpot
* Fetch stored credentials
* Load HubSpot data (contacts)

### ▶️ Run Frontend

```bash
cd frontend
npm install
npm run dev
```

> Make sure the backend is running at `http://localhost:8000`.

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:8000/integrations/hubspot/oauth2callback
```

---

## 🧪 Local Development

This project is currently intended for **local testing and development** only.

---

## 🙋‍♂️ Author

**Omkar Chebale**
📬 [omkarchebale0@gmail.com](mailto:omkarchebale0@gmail.com)
🌐 [omkarchebale.vercel.app](https://omkarchebale.vercel.app)
📱 +91 9356975618
