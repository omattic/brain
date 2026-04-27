import type { AWS } from '@serverless/typescript';
import "./defaults"

const serverlessConfiguration: AWS & { provider: { tracing: boolean } } = {
  service: 'support-component',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
    // 'serverless-domain-manager',
    'serverless-plugin-tracing'
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    tracing: true,
    stage: process.env.BRANCH_NAME || 'main',
    deploymentBucket: process.env.DEPLOYMENT_BUCKET,
    // apiGateway: {
    //   minimumCompressionSize: 1024,
    //   shouldStartNameWithService: true,
    // },
    environment: {
      AWS_ACCOUNT: process.env.AWS_ACCOUNT,
      BUCKET_NAME: process.env.BUCKET_NAME,
      BRANCH: process.env.BRANCH,
      REGION: process.env.REGION,
      SERVERLESS: "true",
      IS_SERVERLESS: "true",
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow", // xray permissions (required)
            Action: [
              "xray:PutTraceSegments",
              "xray:PutTelemetryRecords",
              "xray:GetSamplingRules",
              "xray:GetSamplingTargets",
              "xray:GetSamplingStatisticSummaries"
            ],
            Resource: "*",
          },
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: "*",
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: [
              `arn:aws:sqs:${process.env.REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT}:*`
            ],
          },
        ]
      }
    },
  },
  functions: {},
  // custom: {
  //   "customDomain": {
  //     "domainName": "${self:provider.stage}-${self:service}.r.r3js.com",
  //     "stage": "${self:provider.stage}",
  //     "basePath": "",
  //     "certificateName": '*.r.r3js.com',
  //     "createRoute53Record": false,
  //     "endpointType": 'regional',
  //     "securityPolicy": "tls_1_2",
  //     "apiType": "http",
  //     "autoDomain": true
  //   }
  // },
  package: {
    "exclude": [
      "node_modules/.pnpm/**",
      "node_modules/.ignored/**",
      "node_modules/aws-sdk/**",
    ]
  }
};

(serverlessConfiguration as any).provider.region = process.env.REGION || 'us-east-1'

serverlessConfiguration.resources = {
  Resources: {
  }
}

const components = ["support"]

for (let componentName of components) {
  serverlessConfiguration.functions[componentName] = {
    handler: `src/components/${componentName}/index.sqs`,
    memorySize: 256,
    timeout: 900,
    // reservedConcurrency: 1,
    events: [
      {
        sqs: {
          arn: {
            'Fn::GetAtt': ["ComponentSQS" + componentName, 'Arn'],
          },
          batchSize: 1,
          // maximumBatchingWindow: 60,
          // maximumConcurrency: 1,
          functionResponseType: 'ReportBatchItemFailures',
        },
      },
    ],
  }
  serverlessConfiguration.resources.Resources["ComponentSQS" + componentName] = {
    Type: 'AWS::SQS::Queue',
    Properties: {
      QueueName: `${process.env.BRANCH_NAME}-${componentName}`,
      VisibilityTimeout: 900,
      MessageRetentionPeriod: 345600,
      ReceiveMessageWaitTimeSeconds: 20,
      RedrivePolicy: {
        deadLetterTargetArn: {
          'Fn::GetAtt': [
            "ComponentDLQ" + componentName,
            'Arn',
          ],
        },
        maxReceiveCount: 3,
      },
    },
  }
  serverlessConfiguration.resources.Resources["ComponentDLQ" + componentName] = {
    Type: 'AWS::SQS::Queue',
    Properties: {
      QueueName: `${process.env.BRANCH_NAME}-${componentName}-dlq`,
      VisibilityTimeout: 900,
      MessageRetentionPeriod: 345600,
      ReceiveMessageWaitTimeSeconds: 20,
    },
  }
}

serverlessConfiguration.provider.environment.SQS_PREFIX = `${process.env.BRANCH_NAME}-`;

console.log("serverlessConfiguration", JSON.stringify(serverlessConfiguration, null, 2))

module.exports = serverlessConfiguration;
