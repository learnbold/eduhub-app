// IMPORTANT:
// Do NOT use localhost in React Native.
// Use your machine's IP address.
// Phone and computer must be on the same WiFi.
//
// Make sure your backend is listening on 0.0.0.0, for example:
// app.listen(5000, "0.0.0.0");

const DEVELOPMENT_API_URL = 'http://10.50.182.93:5000';
const PRODUCTION_API_URL = 'https://your-production-url.com';

export const API_BASE_URL = __DEV__
  ? DEVELOPMENT_API_URL
  : PRODUCTION_API_URL;
