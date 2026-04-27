FROM node:24-alpine

# Set GitHub authentication as build argument (Use ONBUILD or Docker secrets in production)
ARG GITHUB_TOKEN=""

WORKDIR /app

# First copy source code (except node_modules and package*.json)
COPY tsconfig.json ./
COPY *.ts ./

# Install git and other dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies with better token handling
RUN if [ -n "$GITHUB_TOKEN" ]; then \
      git config --global url."https://${GITHUB_TOKEN}:@github.com/".insteadOf "https://github.com/" && \
      npm install --registry=https://registry.npmjs.org/ && \
      npm install -g tsx && \
      git config --global --unset url."https://${GITHUB_TOKEN}:@github.com/".insteadOf; \
    else \
      npm install --registry=https://registry.npmjs.org/ && \
      npm install -g tsx; \
    fi

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Set the Dapr PubSub name as an environment variable
ENV DAPR_PUBSUB_NAME=slackpubsub

# Command to run the application using tsx
CMD ["tsx", "src/app.ts"]