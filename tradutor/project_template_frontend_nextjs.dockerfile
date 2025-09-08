FROM node:18
WORKDIR /app
COPY package*.json ./
RUN yarn
COPY . .
EXPOSE 8001
CMD ["yarn", "dev", "--port", "8001"]