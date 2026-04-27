#!/bin/bash

# deploy-infra.sh - Script to set up the infrastructure for Dapr PubSub example
# This script creates an EKS cluster and installs necessary components

# Set environment variables
CLUSTER_NAME="dapr-cluster-canada"
REGION="ca-central-1"
NODE_TYPE="t4g.small"

echo "==============================================="
echo "  Setting up EKS Cluster for Dapr PubSub Demo  "
echo "==============================================="

# Step 1: Create EKS cluster
echo "Creating EKS cluster '$CLUSTER_NAME' in region '$REGION'..."
eksctl create cluster \
  --name $CLUSTER_NAME \
  --version 1.31 \
  --region $REGION \
  --nodegroup-name dapr-workers-slack \
  --node-type $NODE_TYPE \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 4 \
  --managed \
  --node-volume-size 20 \
  --asg-access \
  --external-dns-access \
  --full-ecr-access \
  --appmesh-access \
  --alb-ingress-access #\
  # --node-volume-type gp3 \
  # --with-ebs-csi

# Check if cluster creation was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to create EKS cluster"
  exit 1
fi

echo "EKS cluster created successfully!"
echo ""

# Step 2: Add required Helm repositories
echo "Adding Helm repositories..."
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update

# Step 3: Install AWS EBS CSI Driver
echo "Installing AWS EBS CSI Driver..."
helm upgrade --install aws-ebs-csi-driver \
  --namespace kube-system \
  aws-ebs-csi-driver/aws-ebs-csi-driver

if [ $? -ne 0 ]; then
  echo "Warning: Failed to install AWS EBS CSI Driver"
  echo "You may need to try again later or install it manually"
fi

# Step 4: Install Redis (required for Dapr pubsub)
echo "Installing Redis..."
helm install redis bitnami/redis \
  --set auth.enabled=true \
  --set auth.password=redis \
  --set master.persistence.enabled=false \
  --set replica.persistence.enabled=false

if [ $? -ne 0 ]; then
  echo "Error: Failed to install Redis"
  echo "Continuing with Dapr installation, but pubsub component may not work"
fi

echo "Redis installed successfully!"
echo ""

# Step 5: Install Dapr with basic configuration
echo "Installing Dapr..."
helm upgrade --install dapr dapr/dapr \
  --namespace dapr-system \
  --create-namespace \
  --set global.ha.enabled=false

if [ $? -ne 0 ]; then
  echo "Error: Failed to install Dapr"
  exit 1
fi

echo "Dapr installed successfully!"
echo ""

echo "==================================================================="
echo "Infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Run './deploy-dapr.sh' to configure Dapr with custom settings"
echo "2. Run './deploy.sh' to deploy your application components"
echo ""
echo "To use kubectl with this cluster, make sure your kubeconfig is updated:"
echo "  aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION"
echo "==================================================================="
