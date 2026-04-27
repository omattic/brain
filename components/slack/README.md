# Slack Bot with Dapr

This project is a Slack bot application built with Node.js and Dapr, designed to be deployed on Amazon EKS.

## Project Structure

```
slack-component
├── src/                # Application source code
│   ├── app.ts          # Express application setup
│   ├── index.ts        # Entry point of the application
│   ├── lambda.ts       # AWS Lambda handler
│   ├── websocket.ts    # WebSocket handler
│   ├── components/     # Core components
│   ├── middlewares/    # Slack middleware handlers
│   ├── services/       # External service integrations
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── deploy-eks/         # Kubernetes manifests for EKS deployment
├── .github/workflows/  # GitHub Actions CI/CD pipelines
├── Dockerfile          # Instructions to build the Docker image
├── package.json        # npm configuration file
└── README.md           # Project documentation
```

## Getting Started

To run this application locally, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd slack-component
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file with the necessary credentials (see `.env.example` if available).

4. **Run the application locally:**
   ```
   npm start
   ```

## Deployment Process

The deployment process consists of two parts:

### 1. CI/CD with GitHub Actions

The GitHub Actions workflow (`eks.yml`) handles:
- Building the Docker image for multiple platforms (amd64, arm64)
- Pushing the image to AWS ECR
- Image verification

The workflow is triggered automatically on pushes to the `main` branch.

### 2. Manual Deployment to EKS

Currently, the deployment to EKS is done manually using the following steps:

1. **Apply Kubernetes manifests:**
   ```
   kubectl apply -f deploy-eks/slack-bot.yaml
   ```

2. **Restart the deployment:**
   ```
   kubectl rollout restart deployment slack-bot
   ```

3. **Monitor the deployment:**
   ```
   kubectl logs deployment/slack-bot -f
   ```

A convenience script is available for the complete process:
```
./deploy.sh
```

## Infrastructure Setup

To set up the required infrastructure from scratch:

1. **Create the EKS cluster and install dependencies:**
   ```
   ./deploy-infra.sh
   ```

2. **Configure AWS credentials:**
   ```
   aws eks update-kubeconfig --name dapr-cluster-canada --region ca-central-1
   ```

## Monitoring and Debugging

### Get live logs

```
kubectl logs deployment/slack-bot -f
```

### Quick deployment and log tailing

```
kubectl apply -f deploy-eks/slack-bot.yaml ; kubectl rollout restart deployment slack-bot ; kubectl logs deployment/slack-bot -f
```

## Notes

- The GitHub Actions workflow only handles building and pushing the Docker image to AWS ECR
- Kubernetes manifests are applied manually using `kubectl` or the `deploy.sh` script
- Future improvements will include automating the full deployment process

## Azure K8s setup:

az aks update --name dapr-cluster --resource-group dapr-infra-rg --attach-acr daprinfra

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

