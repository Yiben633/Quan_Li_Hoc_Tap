FROM node:22-alpine AS deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app/backend
COPY backend/tsconfig.json backend/.prettierrc ./
COPY backend/src ./src
COPY backend/api ./api
COPY backend/scripts ./scripts
COPY database/prisma /app/database/prisma
RUN mkdir -p /app/database/node_modules && cp -R /app/backend/node_modules/@prisma /app/database/node_modules/@prisma
RUN npm run build

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/database/prisma /app/database/prisma
COPY backend/package*.json ./
EXPOSE 4000
CMD ["node", "dist/src/server.js"]
