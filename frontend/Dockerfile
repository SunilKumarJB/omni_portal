FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_DEMO_API_KEY
ENV VITE_DEMO_API_KEY=$VITE_DEMO_API_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Defaults for docker-compose / local runs; Cloud Run overrides PORT itself and
# deploy-cloud-run.sh overrides BACKEND_URL/BACKEND_HOST via --set-env-vars.
ENV PORT=80
ENV BACKEND_URL=http://backend:8000
ENV BACKEND_HOST=backend

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
