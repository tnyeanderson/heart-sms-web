## develop stage
FROM node:14-alpine as develop-stage

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install

COPY . .

# Override with default config file
RUN mv public/config/web-config.js.example public/config/web-config.js


## build stage
FROM develop-stage as build-stage
RUN npm run build

## production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Move files to config folder for bind mount
RUN cp /usr/share/nginx/html/config/web-config.js /root/web-config.js.example
COPY --from=build-stage /app/entrypoint.sh /root/entrypoint.sh
RUN chmod +x /root/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/root/entrypoint.sh"]

