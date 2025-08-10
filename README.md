# My Goal Video App

This repository contains a React front-end and two AWS Lambda handlers used to render Remotion videos on demand.

## Structure
- `client/`: React app compiled to a static bundle.
- `lambda/start-render`: Lambda handler that starts a render via `renderMediaOnLambda`.
- `lambda/render-status`: Lambda handler that checks render progress.

## Environment variables
Create a `.env` file (for local builds) or set these variables in your deployment:

```
REACT_APP_ASSET_BASE=https://<bucket>.s3.<region>.amazonaws.com
AWS_REGION=<region>
REMOTION_LAMBDA_FUNCTION_NAME=<name-of-remotion-render-lambda>
REMOTION_SERVE_URL=https://<bucket>.s3.<region>.amazonaws.com/sites/<deploy-id>
ASSET_BUCKET=<bucket-name>
```

`REACT_APP_*` variables are embedded into the client at build time.

## Testing
Run the available tests:

```
cd lambda
npm test   # no tests yet

cd ../client
CI=true npm test -- --watchAll=false
```

## Build & deploy

### 1. Client
```
cd client
npm install
npm run build
```
Upload the `build/` directory to an S3 bucket and serve it through CloudFront or Amplify.

### 2. Lambda handlers
```
cd lambda
npm install
zip -r start-render.zip start-render node_modules package.json package-lock.json
zip -r render-status.zip render-status node_modules package.json package-lock.json
```
Create two Lambda functions using Node.js 18 and upload the corresponding zip files.
Set the environment variables listed above.

### 3. API Gateway
- Create an HTTP API with CORS enabled for your client domain.
- Routes:
  - `POST /start-render` → start-render Lambda
  - `GET /render-status` → render-status Lambda

The client can now trigger renders via the API and poll for completion.
