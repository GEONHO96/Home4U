# =============================================================
# Home4U Frontend Dockerfile
# Multi-stage: Vite build → nginx static serve
# =============================================================

# ---- Stage 1. build ----
FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts eslint.config.js index.html ./
COPY public ./public
COPY src ./src

RUN npm run build

# ---- Stage 2. nginx ----
FROM nginx:1.27-alpine AS runtime

# SPA 라우팅용 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
