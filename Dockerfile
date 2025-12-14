# Stage 1: Build Angular app
FROM node:18-alpine AS client_build

# Set working directory
WORKDIR /app

COPY ./client /app/

# Install Angular CLI
RUN npm ci

# Build Angular app for production
RUN node_modules/.bin/ng build --configuration production

# Stage 2: Serve with nodejs
FROM node:18-alpine AS server_build

# Set working directory
WORKDIR /app

#copy server backend
COPY ./server /app/
COPY --from=client_build /app/dist/webauthn-app /app/dist/webauthn-app

RUN npm install --production

# build docker
FROM node:18-alpine

WORKDIR /app
RUN apk add --no-cache nodejs

COPY --from=server_build /app ./
# Expose port 80
EXPOSE 3000

# Start Nginx
CMD ["node", "server"]
