FROM node:14

WORKDIR /app

COPY package.json /app

COPY . /app

RUN npm install

EXPOSE 80
VOLUME [ "/app/feedback" ]

CMD [ "node","server.js" ]