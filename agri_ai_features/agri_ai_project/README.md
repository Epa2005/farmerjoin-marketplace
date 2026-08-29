# Agri AI Project — Local Run Instructions

This workspace contains:
- `index.js` — AI features service (listens on port 3000)
- `my-agri-backend/server.js` — Backend proxy/API for frontend (listens on port 3001)
- `client/` — React frontend (Vite)

Quick start (three terminals):

1. Install root and backend dependencies (if not already installed):

```bash
cd c:\Users\Student\OneDrive\Documents\eper\agri_ai_features\agri_ai_project
npm install
cd my-agri-backend
npm install
```

2. Start the AI features service:

```bash
cd c:\Users\Student\OneDrive\Documents\eper\agri_ai_features\agri_ai_project
node index.js
# service runs at http://localhost:3000
```

3. Start the backend:

```bash
cd c:\Users\Student\OneDrive\Documents\eper\agri_ai_features\agri_ai_project\my-agri-backend
node server.js
# backend runs at http://localhost:3001
```

4. Start the React frontend:

```bash
cd c:\Users\Student\OneDrive\Documents\eper\agri_ai_features\agri_ai_project\client
npm install
npm run dev
# open the URL shown (usually http://localhost:5173)
```

Notes:
- The frontend calls the backend (`/api/ask-ai` and `/api/crop-scan`). The backend proxies requests to the AI service at port 3000.
- `crop-scan` expects an image file (the client sends base64). The current AI service returns a placeholder response for image scans.
- If you want production builds, run `npm run build` inside `client/` and serve the static files using a static server.
