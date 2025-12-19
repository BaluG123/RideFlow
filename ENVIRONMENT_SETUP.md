# Environment Variables Setup Guide

This guide explains how to set up environment variables for the RideFlow app.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the values in `.env`:**
   - Replace `your-web-client-id-here.apps.googleusercontent.com` with your actual Firebase Web Client ID

3. **Get your Firebase Web Client ID:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon) > General
   - Scroll down to "Your apps" section
   - Find the Web app configuration
   - Copy the Web Client ID (ends with `.apps.googleusercontent.com`)

## Environment Variables

### Required Variables

- **FIREBASE_WEB_CLIENT_ID**: Your Firebase Web Client ID for Google Sign-In
  - Format: `XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com`
  - Where to find: Firebase Console > Project Settings > General > Web apps

### Optional Variables

- **APP_NAME**: Application name (default: RideFlow)
- **APP_VERSION**: Application version (default: 1.0.0)

## File Structure

```
.env                 # Your actual environment variables (DO NOT COMMIT)
.env.example         # Template file (safe to commit)
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to version control
- The `.env` file is already in `.gitignore`
- Always use `.env.example` as a template for other developers
- Keep your Firebase credentials secure

## Troubleshooting

### App crashes on startup
- Ensure `.env` file exists in the project root
- Verify all required variables are set
- Check that values don't have extra spaces or quotes

### Google Sign-In not working
- Verify `FIREBASE_WEB_CLIENT_ID` is correct
- Ensure it ends with `.apps.googleusercontent.com`
- Check Firebase Console that Google Sign-In is enabled

### Changes not reflecting
After modifying `.env`:
1. Clean the build:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```
2. Rebuild the app:
   ```bash
   npm run android
   ```

## For Team Members

When setting up the project:
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Ask the team lead for the actual environment variable values
4. Update your `.env` file with the provided values
5. Build and run the app

## Technical Details

This project uses `react-native-config` to manage environment variables:
- Variables are loaded at build time
- Access them in code: `import Config from 'react-native-config'`
- TypeScript types are defined in `src/types/env.d.ts`
- Android configuration is in `android/app/build.gradle`