# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Environment Variables

Create a `.env` file in the project root with the following entries:

```
REACT_APP_ASSET_BASE=https://<bucket>.s3.<regione>.amazonaws.com
ASSET_BASE=https://<bucket>.s3.<regione>.amazonaws.com
ASSET_BUCKET=<bucket-name>
AWS_REGION=<your-region>
```

`REACT_APP_ASSET_BASE` and `ASSET_BASE` define the base URL for static assets used in the frontend and in the server.
Only variables prefixed with `REACT_APP_` end up in the client bundle.

Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in your server's environment
so the backend can generate pre-signed URLs. Do **not** expose these secrets in
the browser or commit them to version control.

To request a temporary URL for an asset stored in S3, call:

```
GET /api/signed-url?key=<object-key>
```

The server responds with `{ url: "https://..." }`, which you can use in the browser before it expires.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
