#!/bin/bash

# Set environment variables
REGION="ca-central-1"
ECR_REPO_BASE="122610481075.dkr.ecr.$REGION.amazonaws.com"
PLATFORMS="linux/amd64,linux/arm64"

echo "Starting deployment process..."

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Warning: GITHUB_TOKEN is not set. Private GitHub repositories might not be accessible during the build."
  echo "To set it, run: export GITHUB_TOKEN=your_github_personal_access_token"
fi

# Step 1: AWS ECR Login
# echo "Logging into AWS ECR..."
# aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO_BASE

# Step 2: Enable buildx if not already created
# echo "Setting up Docker buildx..."
# if ! docker buildx ls | grep -q "mybuilder"; then
#   docker buildx create --name mybuilder --use
# else
#   docker buildx use mybuilder
# fi

# Step 3: Build and push image
echo "Building and pushing slack-bot image..."
cd .
docker buildx build --platform $PLATFORMS \
  --build-arg GITHUB_TOKEN=${GITHUB_TOKEN:-''} \
  -t $ECR_REPO_BASE/dapr-slack-bot:latest --push .
if [ $? -ne 0 ]; then
  echo "Failed to build and push checkout image"
  exit 1
fi
cd ..


# Step 5: Apply Kubernetes deployments
echo "Applying Kubernetes deployments..."

# if ! kubectl apply -f ./deploy-eks/redis.yaml; then
#   echo "Failed to apply Redis configuration"
#   exit 1
# fi

# if ! kubectl apply -f ./deploy-eks/pubsub.yaml; then
#   echo "Failed to apply PubSub component"
#   exit 1
# fi

if ! kubectl apply -f ./deploy-eks/slack-bot.yaml; then
  echo "Failed to apply service"
  exit 1
fi


# Step 6: Restart deployments
echo "Restarting deployments..."
kubectl rollout restart deployment slack-bot
# kubectl rollout restart deployment checkout

# Step 7: Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/slack-bot
# kubectl rollout status deployment/checkout

echo "Deployment completed successfully!"
