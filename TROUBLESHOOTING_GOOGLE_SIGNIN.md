# 🔧 Google Sign-In Troubleshooting Guide

## ✅ Current Status Check

Your configuration looks correct:
- ✅ SHA-1 fingerprint: `FC:A9:F9:2D:8B:20:C4:10:60:10:68:C1:F4:D3:70:38:62:BB:BA:AA`
- ✅ Web Client ID: `206602606190-gbt0v1c0gp0qhjeivus1r99f13k2cdjt.apps.googleusercontent.com`
- ✅ Package name: `com.cycletracker`

## 🚨 Most Likely Issue: Google Authentication Not Enabled

### Step 1: Enable Google Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **cycletracker-22e5b** project
3. Click **Authentication** in the left sidebar
4. Click **Sign-in method** tab
5. Find **Google** in the list
6. Click on **Google** provider
7. **Toggle the Enable switch to ON**
8. Set your **Project support email** (required)
9. Click **Save**

### Step 2: Verify OAuth 2.0 Client IDs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your **cycletracker-22e5b** project
3. Go to **APIs & Services** > **Credentials**
4. You should see OAuth 2.0 Client IDs:
   - Web client (auto created by Firebase)
   - Android client (created when you added SHA-1)

### Step 3: Double-Check SHA-1 Fingerprint

1. In Firebase Console > **Project Settings**
2. Scroll to **Your apps** section
3. Click on your Android app
4. In **SHA certificate fingerprints** section
5. Verify: `FC:A9:F9:2D:8B:20:C4:10:60:10:68:C1:F4:D3:70:38:62:BB:BA:AA`

## 🔄 Alternative Solutions

### Solution 1: Clean and Rebuild
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Solution 2: Clear Google Play Services Cache
1. Go to Android Settings > Apps
2. Find "Google Play Services"
3. Clear Cache and Data
4. Restart the emulator/device

### Solution 3: Regenerate Debug Keystore
```bash
# Delete existing keystore
rm ~/.android/debug.keystore

# Generate new keystore
keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"

# Get new SHA-1
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Solution 4: Update google-services.json
1. Download fresh `google-services.json` from Firebase Console
2. Replace `android/app/google-services.json`
3. Clean and rebuild

## 🧪 Test Commands

### Test 1: Check Google Play Services
```bash
adb shell pm list packages | grep google
```

### Test 2: Check App Permissions
```bash
adb shell dumpsys package com.cycletracker | grep permission
```

### Test 3: View Logs
```bash
npx react-native log-android
```

## 📱 Manual Testing Steps

1. Open RideFlow app
2. Go to Settings tab
3. Tap "Sign in with Google"
4. Should see Google account picker
5. Select account
6. Should see success message

## 🚨 Common Error Messages & Solutions

### "DEVELOPER_ERROR"
- **Cause**: SHA-1 not added or Google Auth not enabled
- **Solution**: Follow Step 1 above

### "Network Error"
- **Cause**: Internet connection or Firebase config
- **Solution**: Check internet, update google-services.json

### "Invalid Credentials"
- **Cause**: Wrong Web Client ID
- **Solution**: Verify Web Client ID matches google-services.json

### "Sign-in cancelled"
- **Cause**: User cancelled or no Google account
- **Solution**: Normal behavior, try again

## 🎯 Quick Fix Checklist

- [ ] Google Authentication enabled in Firebase Console
- [ ] SHA-1 fingerprint added correctly
- [ ] google-services.json is latest version
- [ ] App rebuilt after config changes
- [ ] Google Play Services working on device/emulator
- [ ] Internet connection available

## 📞 If Still Not Working

Try this debug version of the sign-in function:

```typescript
// Add this to test Google Sign-In setup
static async debugGoogleSignIn() {
    try {
        console.log('🔍 Debug: Starting Google Sign-In...');
        
        // Check if Google Play Services available
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        console.log('🔍 Debug: Play Services available:', hasPlayServices);
        
        // Check current user
        const currentUser = await GoogleSignin.getCurrentUser();
        console.log('🔍 Debug: Current user:', currentUser);
        
        // Try sign in
        const result = await GoogleSignin.signIn();
        console.log('🔍 Debug: Sign-in result:', result);
        
        return result;
    } catch (error) {
        console.error('🔍 Debug: Sign-in error details:', error);
        throw error;
    }
}
```

Most likely, you just need to **enable Google Authentication in Firebase Console**! 🎯