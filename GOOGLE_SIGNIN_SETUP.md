# Google Sign-In Setup for RideFlow

## 🔑 Your SHA-1 Fingerprint (Already Generated!)

**Debug SHA-1:**  `FC:A9:F9:2D:8B:20:C4:10:60:10:68:C1:F4:D3:70:38:62:BB:BA:AA`

## 1. Firebase Console Setup

### Step 1: Add SHA-1 Fingerprint
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **cycletracker-22e5b** project
3. Go to **Project Settings** (gear icon) > **Your apps**
4. Click on your Android app (com.cycletracker)
5. Scroll down to **SHA certificate fingerprints**
6. Click **Add fingerprint** and paste: `FC:A9:F9:2D:8B:20:C4:10:60:10:68:C1:F4:D3:70:38:62:BB:BA:AA`
7. Click **Save**

### Step 2: Enable Google Authentication (This Creates the Web Client ID!)
1. Go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Click **Enable**
4. Set **Project support email** (your email)
5. Click **Save**

**⚠️ IMPORTANT:** After enabling Google auth, Firebase automatically creates the Web Client ID!

### Step 3: Get Web Client ID (Now Available!)
1. Go to **Project Settings** > **General** tab
2. Scroll down to **Your apps** section
3. Click on your Android app (com.cycletracker)
4. In the **SDK setup and configuration** section, you'll now see:
   ```
   Configuration file
   google-services.json
   
   SDK setup and configuration
   Server key: AIzaSy... (ignore this)
   Web client ID: 206602606190-abc123def456.apps.googleusercontent.com ← COPY THIS!
   ```
5. Copy the **Web client ID** (starts with `206602606190-` and ends with `.apps.googleusercontent.com`)

### Step 4: Download Updated Config
1. Still in **Project Settings** > **Your apps**
2. Click **Download google-services.json** 
3. Replace the existing file in `android/app/google-services.json`
4. The new file will have OAuth client configuration

### Step 5: Update Your Code
Replace the placeholder in `src/services/firebase.ts`:
```typescript
// Change this line:
webClientId: '206602606190-PLACEHOLDER.apps.googleusercontent.com',

// To your actual Web Client ID:
webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
```

## 2. Quick Setup Commands

If you need to regenerate the keystore later:
```bash
# Create debug keystore (already done for you!)
keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"

# Get SHA-1 fingerprint
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## 3. Download Configuration Files

### Android
1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`

### iOS
1. Download `GoogleService-Info.plist` from Firebase Console  
2. Place it in `ios/RideFlow/GoogleService-Info.plist`

## 4. Update Firebase Configuration

In `src/services/firebase.ts`, replace the placeholder with your actual Web Client ID:

```typescript
GoogleSignin.configure({
    webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
});
```

**Current placeholder:** `206602606190-PLACEHOLDER.apps.googleusercontent.com`
**Replace with:** Your actual Web Client ID from Firebase Console

## 5. Android Configuration

Add to `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

## 6. iOS Configuration

Add to `ios/Podfile`:

```ruby
pod 'GoogleSignIn'
```

Then run:
```bash
cd ios && pod install
```

## 7. Permissions (Android)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
```

## ✅ What's Already Done

- ✅ SHA-1 fingerprint generated: `FC:A9:F9:2D:8B:20:C4:10:60:10:68:C1:F4:D3:70:38:62:BB:BA:AA`
- ✅ Android configuration updated
- ✅ Google services plugin enabled
- ✅ Dependencies added
- ✅ Permissions configured

## 🚀 Next Steps (Do These in Order!)

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **cycletracker-22e5b** project
3. **First:** Add SHA-1 fingerprint: `FC:A9:F9:2D:8B:20:C4:10:60:10:68:C1:F4:D3:70:38:62:BB:BA:AA`
4. **Then:** Enable Google Authentication (this creates the Web Client ID)
5. **Finally:** Get the Web Client ID and update your code

### 2. Update Web Client ID
Replace the placeholder in `src/services/firebase.ts`:
```typescript
webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
```

### 3. Test the App
```bash
npx react-native run-android
```

## 🎯 Expected Results

After setup:
- ✅ Google Sign-In button works
- ✅ User profile shows in Settings
- ✅ Cloud sync enabled
- ✅ Achievement notifications work
- ✅ Analytics track properly

## Troubleshooting

- **"Developer Error"**: Add SHA-1 to Firebase Console
- **"Network Error"**: Update `google-services.json`
- **Build Issues**: Run `cd android && ./gradlew clean`