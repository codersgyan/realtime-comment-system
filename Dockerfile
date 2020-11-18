FROM node:12
WORKDIR /app
COPY ./package.json /app
RUN npm install
COPY . /app
CMD npm run-script dev
EXPOSE 3000
