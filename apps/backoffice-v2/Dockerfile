FROM node:18.16-alpine3.17 as dev

WORKDIR /app

COPY . .

RUN mv /app/.env.example /app/.env; npm install --legacy-peer-deps; npm run build; apk add xdg-utils

ENV PATH="$PATH:/app/node_modules/.bin"

EXPOSE 5137

CMD ["npm", "run", "dev", "--host"]

FROM nginx:stable-alpine as prod

COPY --from=dev /app/dist /usr/share/nginx/html

COPY example.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
