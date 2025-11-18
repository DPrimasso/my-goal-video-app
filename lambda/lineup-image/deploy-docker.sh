#!/bin/bash
set -e

REGION="eu-west-1"
ACCOUNT_ID="608962157912"
REPO_NAME="lineup-image"
IMAGE_NAME="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest"

echo "Tagging Docker image..."
docker tag lineup-image:latest ${IMAGE_NAME}

echo "Logging into ECR..."
aws ecr get-login-password --region ${REGION} --profile daniele17 | docker login --username AWS --password-stdin ${IMAGE_NAME%%:*}

echo "Pushing image to ECR..."
docker push ${IMAGE_NAME}

echo "Updating Lambda function to use container image..."
aws lambda update-function-code \
  --function-name lineup-image \
  --image-uri ${IMAGE_NAME} \
  --region ${REGION} \
  --profile daniele17 \
  --query 'LastUpdateStatus' \
  --output text

echo "Done! Lambda function is being updated."





