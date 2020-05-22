Deploy:

back-end:
1. copy backend/.env.sample to the backend/.env and fill it;
2. copy backend/src/config/config.sample.js to backend/src/config/config.js and fill it;
3. run ./01-backend-start.sh

frontend:
4. copy frontend/.env.sample to the frontend/.env and fill it;
5. change frontend/package.json PORT=45315 if required;
6. run ./02-frontend-start.sh

tests:
cd backend && npm run test

The link to the (probably) live demo:
http://secrets.rag.lt/ or https://secrets.rag.lt/
