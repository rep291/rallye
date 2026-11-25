# Alternative zu render.yaml: laeuft auf jedem Docker-Hoster (Render, Koyeb, Northflank ...)
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY config ./config
COPY public ./public
COPY assets ./assets
ENV NODE_ENV=production ONLINE=1
EXPOSE 3000
CMD ["node", "server.js"]
