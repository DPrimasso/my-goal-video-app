#!/bin/bash
set -e

REGION="eu-west-1"
FUNCTION_NAME="lineup-image"
PROFILE="daniele17"
S3_BUCKET="casalpoglio-social-assets"
S3_KEY="lambda-deployments/lineup-image-function.zip"
ROLE="arn:aws:iam::608962157912:role/app-remotion-invoker-role"

echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install --omit=dev

echo "📦 Creating deployment package..."
rm -f function.zip
zip -r function.zip index.js package.json node_modules -q

echo "📤 Uploading to S3..."
aws s3 cp function.zip s3://${S3_BUCKET}/${S3_KEY} --profile ${PROFILE}

# Create function if it doesn't exist
if ! aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION} --profile ${PROFILE} &>/dev/null; then
  echo "📦 Creating Lambda function (first deploy)..."
  aws lambda create-function \
    --function-name ${FUNCTION_NAME} \
    --runtime nodejs18.x \
    --role ${ROLE} \
    --handler index.handler \
    --timeout 30 \
    --memory-size 2048 \
    --environment "Variables={ASSET_BUCKET=${S3_BUCKET}}" \
    --code S3Bucket=${S3_BUCKET},S3Key=${S3_KEY} \
    --region ${REGION} \
    --profile ${PROFILE} \
    --output text --query 'FunctionArn'
  echo "🔗 Creating Function URL..."
  aws lambda create-function-url-config \
    --function-name ${FUNCTION_NAME} \
    --auth-type NONE \
    --region ${REGION} \
    --profile ${PROFILE} \
    --output text --query 'FunctionUrl'
  # Add permission for public invoke
  aws lambda add-permission \
    --function-name ${FUNCTION_NAME} \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    --region ${REGION} \
    --profile ${PROFILE} 2>/dev/null || true
else
  echo "🔄 Updating Lambda function..."
  aws lambda update-function-code \
    --function-name ${FUNCTION_NAME} \
    --s3-bucket ${S3_BUCKET} \
    --s3-key ${S3_KEY} \
    --region ${REGION} \
    --profile ${PROFILE} \
    --query 'LastUpdateStatus' \
    --output text
fi

echo "✅ Done! Lambda function '${FUNCTION_NAME}' deployed."
echo "💡 Get Function URL: aws lambda get-function-url-config --function-name ${FUNCTION_NAME} --region ${REGION} --profile ${PROFILE} --query 'FunctionUrl' --output text"
