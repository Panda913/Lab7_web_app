FROM node:14

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install
COPY . .
CMD [ "node", "lab2.js"]