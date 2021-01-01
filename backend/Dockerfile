FROM node:14-alpine

COPY package.json package-lock.json tsconfig.json /app/

WORKDIR /app

RUN npm install

COPY src src

RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
