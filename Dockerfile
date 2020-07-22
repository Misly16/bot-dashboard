# This file is fully optional and can be configured to your needs.
FROM node:latest
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm ci --only=production
COPY . .
CMD npm start
