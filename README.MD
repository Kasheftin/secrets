Deploy:

back-end:

- copy backend/.env.sample to the backend/.env and fill it;
- copy backend/src/config/config.sample.js to backend/src/config/config.js and fill it;
- run ./01-backend-start.sh

front-end:

- copy frontend/.env.sample to the frontend/.env and fill it;
- change frontend/package.json PORT=45315 if required;
- run ./02-frontend-start.sh

tests:
cd backend && npm run test

The link to the (probably) live demo:
http://secrets.rag.lt/ or https://secrets.rag.lt/
