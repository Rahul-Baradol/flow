FROM node:22-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install 

COPY . .

RUN npm run build

FROM node:22-alpine

COPY --from=build /usr/src/app/dist /usr/src/app/

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "/usr/src/app"]