FROM node:24-alpine

WORKDIR /app

# First copy source code (except node_modules and package*.json)
COPY tsconfig.json ./
COPY *.ts ./

# Install git and other dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install tsx globally for running TypeScript files directly
RUN npm install -g tsx

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Set the Dapr PubSub name as an environment variable
ENV DAPR_PUBSUB_NAME=slackpubsub

# Command to run the application using tsx
CMD ["tsx", "src/app.ts"]