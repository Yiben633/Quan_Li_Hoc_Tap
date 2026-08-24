FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_AI_ENABLED=true
ARG VITE_AI_PROVIDER=mock
ENV VITE_AI_ENABLED=$VITE_AI_ENABLED
ENV VITE_AI_PROVIDER=$VITE_AI_PROVIDER
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD wget -qO- http://localhost/ || exit 1
