FROM node:16-alpine

WORKDIR /app
COPY . .

RUN npm install

ENV API_HOST=0.0.0.0
EXPOSE 3000 24678

CMD ["npm", "run", "dev"]
