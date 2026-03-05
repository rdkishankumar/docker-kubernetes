FROM node:14
ARG DEFAULT_PORT=80

WORKDIR /app

COPY package.json /app

COPY . /app

RUN npm install
ENV PORT=80
EXPOSE ${PORT}
# VOLUME [ "/app/feedback" ]

CMD [ "node","start" ]