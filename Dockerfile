# Stage 1: Build Angular app
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build Angular app for production
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular build output to Nginx html directory
COPY --from=build /app/dist/* /usr/share/nginx/html/angular-app

# Copy custom Nginx config (optional, for SPA routing)
#COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
