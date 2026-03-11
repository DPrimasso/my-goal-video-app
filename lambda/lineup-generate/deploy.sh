#!/bin/bash
set -e

REGION="eu-west-1"
FUNCTION_NAME="lineup-generate"
PROFILE="daniele17"
S3_BUCKET="casalpoglio-social-assets"
S3_KEY="lambda-deployments/lineup-generate-function.zip"

echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install --omit=dev

echo "📦 Creating deployment package..."
rm -f function.zip
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
echo "💡 Set REACT_APP_LINEUP_IMAGE_URL in your frontend .env if using lineup-generate"
