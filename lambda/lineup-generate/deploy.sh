#!/bin/bash
set -e

REGION="eu-west-1"
FUNCTION_NAME="lineup-generate"
PROFILE="daniele17"
S3_BUCKET="casalpoglio-social-assets"
S3_KEY="lambda-deployments/lineup-generate-function.zip"
ROLE="arn:aws:iam::608962157912:role/app-remotion-invoker-role"

echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install --omit=dev

echo "📦 Creating deployment package..."
rm -f function.zip
zip -r function.zip index.js package.json node_modules -q

echo "📤 Uploading to S3..."
aws s3 cp function.zip s3://${S3_BUCKET}/${S3_KEY} --profile ${PROFILE}

echo "🔄 Deploying Lambda function..."

# Create function if it doesn't exist (first deploy)
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

  # Allow public invoke (Function URL has auth-type NONE)
  aws lambda add-permission \
    --function-name ${FUNCTION_NAME} \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    --region ${REGION} \
    --profile ${PROFILE} 2>/dev/null || true
else
  echo "♻️ Updating Lambda function code..."
  aws lambda update-function-code \
    --function-name ${FUNCTION_NAME} \
    --s3-bucket ${S3_BUCKET} \
    --s3-key ${S3_KEY} \
    --region ${REGION} \
    --profile ${PROFILE} \
    --query 'LastUpdateStatus' \
    --output text

  echo "⏳ Waiting for code update to finish..."
  aws lambda wait function-updated \
    --function-name ${FUNCTION_NAME} \
    --region ${REGION} \
    --profile ${PROFILE}

  # Ensure env var exists/updated
  aws lambda update-function-configuration \
    --function-name ${FUNCTION_NAME} \
    --environment "Variables={ASSET_BUCKET=${S3_BUCKET}}" \
    --region ${REGION} \
    --profile ${PROFILE}
fi

echo "✅ Done! Lambda function '${FUNCTION_NAME}' is deployed."
echo "💡 Get Function URL with: aws lambda get-function-url-config --function-name ${FUNCTION_NAME} --region ${REGION} --profile ${PROFILE} --query 'FunctionUrl' --output text"
echo "💡 Set REACT_APP_LINEUP_IMAGE_URL in your frontend .env if using lineup-generate"
