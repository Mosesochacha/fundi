# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json .sequelizerc sequelize.config.js run-migrations.js nodemon.json ./
COPY src ./src

RUN npm run build


FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache tini

COPY package.json package-lock.json ./
RUN npm ci

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/sequelize.config.js ./sequelize.config.js
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY --from=builder /app/run-migrations.js ./run-migrations.js

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown -R node:node /app

USER node

EXPOSE 5001

ENTRYPOINT ["/sbin/tini", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
