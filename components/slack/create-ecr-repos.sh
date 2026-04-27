#!/bin/bash

# Set environment variables
REGION="ca-central-1"
REPOSITORIES=("dapr-slack-bot")

echo "Creating ECR repositories in $REGION region..."

# Loop through repositories and create them if they don't exist
for REPO in "${REPOSITORIES[@]}"; do
  # Check if repository exists
  if aws ecr describe-repositories --repository-names "$REPO" --region "$REGION" &> /dev/null; then
    echo "Repository $REPO already exists in $REGION"
  else
    # Create repository
    echo "Creating repository $REPO in $REGION..."
    aws ecr create-repository \
      --repository-name "$REPO" \
      --region "$REGION" \
      --image-scanning-configuration scanOnPush=true
    
    if [ $? -eq 0 ]; then
      echo "Repository $REPO created successfully"
    else
      echo "Failed to create repository $REPO"
      exit 1
    fi
  fi
done

echo "ECR repository creation process completed successfully!"
