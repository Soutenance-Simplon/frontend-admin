# ============================================================
# DIAM-YARAAM — Tableau de Bord Administrateur (Vue 3 + Vite)
# Multi-stage Dockerfile: Node 22 Alpine -> Nginx 1.27 Alpine
# ============================================================

# Stage 1: Build de l'application SPA
FROM node:22-alpine AS builder
WORKDIR /app

# Déclaration de l'URL API Gateway configurable au build
ARG VITE_API_BASE_URL=http://localhost:8090/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Optimisation du cache des dépendances npm
COPY package.json package-lock.json ./
RUN npm ci

# Copie du code source et compilation de production
COPY . .
RUN npm run build

# Stage 2: Serveur Web Nginx minimaliste et ultra-sécurisé
FROM nginx:1.27-alpine

# Suppression de la configuration Nginx par défaut
RUN rm -rf /etc/nginx/conf.d/*

# Copie de la configuration Nginx personnalisée pour SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des artefacts statiques compilés depuis le builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
