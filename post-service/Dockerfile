# use official node.js 18 with alppine linux
FROM node:18-alpine

# set working directory
WORKDIR /use/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD [ "node", "src/server.js" ]