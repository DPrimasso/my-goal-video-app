#!/bin/bash
set -e

REGION="${AWS_REGION:-eu-west-1}"
FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-final-result-image}"
PROFILE="${AWS_PROFILE:-daniele17}"
S3_BUCKET="${LAMBDA_DEPLOY_BUCKET:-casalpoglio-social-assets}"
S3_KEY="${LAMBDA_DEPLOY_KEY:-lambda-deployments/final-result-image-function.zip}"

echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install --production

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
echo ""
echo "Function URL (se presente):"
aws lambda get-function-url-config \
  --function-name "${FUNCTION_NAME}" \
  --region "${REGION}" \
  --profile "${PROFILE}" \
  --query 'FunctionUrl' \
  --output text 2>/dev/null || echo "  (nessuna Function URL — creala in AWS Console → Configuration → Function URL)"
echo ""
echo "💡 Render / build: REACT_APP_FINAL_RESULT_IMAGE_URL=<url sopra>"
