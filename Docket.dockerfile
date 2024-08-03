FROM alpine
RUN apk add --update nodejs npm
COPY . /src
WORKDIR /src
EXPOSE 3001
ENTRYPOINT ["node", "./app.js"]