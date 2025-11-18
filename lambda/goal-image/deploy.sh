#!/bin/bash
set -e

REGION="eu-west-1"
FUNCTION_NAME="goal-image"
PROFILE="daniele17"
S3_BUCKET="casalpoglio-social-assets"
S3_KEY="lambda-deployments/goal-image-function.zip"

echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install --production

echo "📦 Creating deployment package..."
# Rimuovi vecchio zip se esiste
rm -f function.zip

# Crea il zip con i file necessari
zip -r function.zip index.js package.json node_modules -q

echo "📤 Uploading to S3..."
aws s3 cp function.zip s3://${S3_BUCKET}/${S3_KEY} --profile ${PROFILE}

echo "🔄 Updating Lambda function..."
aws lambda update-function-code \
  --function-name ${FUNCTION_NAME} \
  --s3-bucket ${S3_BUCKET} \
  --s3-key ${S3_KEY} \
  --region ${REGION} \
  --profile ${PROFILE} \
  --query 'LastUpdateStatus' \
  --output text

echo "✅ Done! Lambda function '${FUNCTION_NAME}' is being updated."
echo "💡 Get Function URL with: aws lambda get-function-url-config --function-name ${FUNCTION_NAME} --region ${REGION} --profile ${PROFILE} --query 'FunctionUrl' --output text"
echo "💡 Set REACT_APP_GOAL_IMAGE_URL in your frontend .env and Render environment variables"

