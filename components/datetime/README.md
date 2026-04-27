# Datetime Component with Dapr

This project is a reusable Dapr component template, focused on providing datetime functionality. It's designed to be deployed on Amazon EKS and can be used as a boilerplate for creating additional microservice components.

## Project Structure

```
datetime-component
├── src/                # Application source code
│   ├── app.ts          # Express application setup
│   ├── lambda.ts       # AWS Lambda handler
│   ├── components/     # Core components
│   │   └── datetime/   # Datetime component implementation
│   │       ├── index.ts        # Main component logic
│   │       └── test/           # Component tests
│   ├── middlewares/    # Middleware handlers
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

To run this component locally, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd datetime-component
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

## Component Overview

The datetime component is a simple Dapr-enabled microservice that:

1. Provides the current date and time when invoked
2. Handles authorization through the brain-sdk
3. Exposes a standardized interface that can be called by other services

This component serves as a template for building additional microservices following the same pattern:
- Standard authorization flow
- Simple API structure
- Event-driven architecture using Dapr PubSub
- Easy testability

## Deployment Process

The deployment process consists of two parts:

### 1. CI/CD with GitHub Actions

The GitHub Actions workflow handles:
- Building the Docker image for multiple platforms (amd64, arm64)
- Pushing the image to AWS ECR
- Image verification

The workflow is triggered automatically on pushes to the `main` branch.

### 2. Manual Deployment to EKS

Currently, the deployment to EKS is done manually using the following steps:

1. **Apply Kubernetes manifests:**
   ```
   kubectl apply -f deploy-eks/datetime-component.yaml
   ```

2. **Restart the deployment:**
   ```
   kubectl rollout restart deployment datetime
   ```

3. **Monitor the deployment:**
   ```
   kubectl logs deployment/datetime -f
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
kubectl logs deployment/datetime -f
```

### Quick deployment and log tailing

```
kubectl apply -f deploy-eks/datetime-component.yaml ; kubectl rollout restart deployment datetime ; kubectl logs deployment/datetime -f
```

## Creating a New Component

To use this project as a template for creating a new component:

1. **Clone this repository:**
   ```
   git clone <repository-url> new-component-name
   cd new-component-name
   ```

2. **Rename the component:**
   - Update `package.json` with your component name
   - Create a new component directory in `src/components/`
   - Follow the pattern in `src/components/datetime/index.ts` for your component
   - Update the Kubernetes manifests in `deploy-eks/`

3. **Implement your component logic:**
   - Modify the `run` function in your component's `index.ts`
   - Update the `toolDefinition` to match your component's purpose
   - Create tests in a `test` directory within your component folder

4. **Update deployment files:**
   - Modify the `deploy-eks/datetime-component.yaml` file to reflect your component name
   - Update the Docker image references in deployment files

## Notes

- The GitHub Actions workflow only handles building and pushing the Docker image to AWS ECR
- Kubernetes manifests are applied manually using `kubectl` or the `deploy.sh` script
- Future improvements will include automating the full deployment process
- Consider this as a reference implementation - adapt as needed for your specific use case