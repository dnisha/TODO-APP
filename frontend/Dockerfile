# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Default fallback URL for backend connection to prevent startup crash when omitted in production
ENV BACKEND_URL=http://localhost:8000

# Copy custom nginx configuration template
COPY templates/default.conf.template /etc/nginx/templates/default.conf.template

# Copy build artifacts from stage 1 to nginx public directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
