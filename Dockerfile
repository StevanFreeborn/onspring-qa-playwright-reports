FROM node:lts

WORKDIR /app

COPY package*.json ./

RUN npm run build:render

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:render"]
