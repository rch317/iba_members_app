# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime stage ----
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy production dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY src/       ./src/
COPY public/    ./public/
COPY package.json ./

# App Runner / ECS expect the container to listen on PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

# Run as non-root
USER node

CMD ["node", "src/server.js"]
