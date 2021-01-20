FROM node:14-alpine

COPY backend/package.json backend/package-lock.json backend/tsconfig.json /app/backend/
COPY frontend/package.json frontend/package-lock.json frontend/tsconfig.json /app/frontend/

WORKDIR /app/backend
RUN npm install

WORKDIR /app/frontend
RUN npm install

COPY backend/src /app/backend/src
COPY frontend/src /app/frontend/src

WORKDIR /app/backend
RUN npm run build

COPY backend/src/game/views /app/backend/dist/backend/src/game/views

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
