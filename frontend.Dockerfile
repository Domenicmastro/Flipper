# Use official Node image to build the app
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Build the Vite project
RUN npm run build --logLevel=info

# Use a lightweight image to serve the app
FROM nginx:alpine

# Copy built assets from the builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]