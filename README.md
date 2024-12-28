# HelpHive Frontend

This folder contains the Expo-based mobile application for the HelpHive platform, targeting Android and iOS platforms.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file based on the `.env.example`:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_BACKEND_URL=
EXPO_PUBLIC_ONESIGNAL_APP_ID=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### 3. Firebase Admin SDK

You need to include the `helphive-firebase-adminsdk.json` from Google Cloud to use OneSignal for push notifications. This file should be securely stored.

### 4. Start the App

For Android:

```bash
npx eas build --profile development --platform android
npx expo run:android
```

### 5. Useful Commands

-   List connected devices:
    ```bash
    adb devices
    ```
-   Start the development server:
    ```bash
    npm start
    ```

### 6. Secrets Management

Create secrets in EAS:

```bash
npx eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value secret-value --type string
```

## Development

### Linting and Formatting

Lint and format checks are automatically run on pull requests. Husky hooks ensure code quality on each commit using ESLint and Prettier.

### Scripts

-   **Start**: `npm run start` - Start the development server.
-   **Android**: `npm run android` - Run the app on an Android emulator or device.
-   **Web**: `npm run web` - Start the app in a web browser.
-   **Lint**: `npm run lint` - Run ESLint to check for code issues.
-   **Format**: `npm run format` - Run Prettier to format code.

## Build

Builds for Android are handled through EAS and Expo.dev. iOS builds have not been configured yet.

## Notes

-   This project uses TypeScript.
-   OneSignal is used for push notifications.

## License

This is a private repository. All rights reserved.
