Running the Expo app (ritmofit-mobile)

Quick start (Android emulator / device)

1) Install dependencies (already done when project was created):

   cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-mobile"
   npm install

2) Start Expo Metro server:

   npx expo start

3) Run on Android emulator (AVD) or physical device:

- If emulator is running: press "a" in the Metro terminal or click "Run on Android device/emulator" in the Expo devtools.
- If using a physical device: install Expo Go and scan the QR code shown by Metro.

Important networking notes for backend connectivity

- When running on Android emulator (default Android Studio AVD) use the host 10.0.2.2 to reach your PC's localhost. The mobile project already selects this automatically when Platform.OS === 'android'.

- When running on an iOS simulator or on web, the app will use http://localhost:3000/api by default.

- If you want to use your machine IP (accessible from the phone), add the explicit URL in `app.json` as `extra.EXPLICIT_API_URL` like:

  {
    "expo": {
      "extra": {
        "EXPLICIT_API_URL": "http://192.168.1.100:3000/api"
      }
    }
  }

- Make sure the backend (server.js) is running and firewall allows incoming connections to port 3000 if testing from a different device.

Run the app:

   npx expo start --android

Or just:

   npx expo start

then press 'a' to open the emulator.
