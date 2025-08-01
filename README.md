# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

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

## Installazione del progetto

1. Installare le dipendenze:
   ```bash
   npm install
   ```
2. Copiare la clip MP4 da usare nel video nella cartella `public/clips`.
   Ad esempio `public/clips/mio_goal.mp4`.

## Preview con Remotion

Per avviare l'anteprima del video:

```bash
npx remotion preview src/remotion/index.tsx
```

## Generazione del video

È possibile generare il video in due modi.

### Via CLI

```bash
npx remotion render src/remotion/index.tsx GoalComp out/video.mp4 --props='{"playerName":"Mario Rossi","goalClip":"public/clips/mio_goal.mp4"}'
```

### Tramite form

1. Avviare il server backend:
   ```bash
   node server/index.js
   ```
2. In un altro terminale avviare l'app React:
   ```bash
   npm start
   ```
3. Aprire `http://localhost:3000`, compilare il form e caricare la clip MP4.
   Il video verrà salvato nella cartella `videos`.
