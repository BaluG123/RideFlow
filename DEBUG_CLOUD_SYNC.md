# 🔍 Debug Cloud Sync - Why You Don't See Data

## ✅ Good News First!

**"Start collection" prompt is NORMAL!** Firestore starts empty. Collections are created automatically when you add data.

## 🎯 Let's Find Your Data

### Option 1: Check Firestore Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **cycletracker-22e5b** project
3. Click **Firestore Database** → **Data** tab
4. Look for:
   - **users** collection (should appear after upload)
   - Click on **users** → find your user ID
   - Click on your user → **trips** subcollection

### Option 2: Check Logs in Your App

Run this command to see logs:
```bash
npx react-native log-android
```

Look for these messages:
- ✅ `Trip saved locally: [trip_id]`
- ✅ `Trip synced to cloud: [trip_id]`
- ❌ `Cloud sync failed` (if this appears, there's an issue)

### Option 3: Manual Check in Firestore

1. In Firestore Console → **Data** tab
2. If you see "Start collection" button, click it
3. Enter collection ID: `users`
4. Click **Next**
5. You should see if any documents exist

## 🔍 Common Issues & Solutions

### Issue 1: Not Signed In
**Symptom**: No error, but data doesn't upload
**Check**: 
- Go to Settings in app
- Do you see your profile card with name/email?
- If NO → Sign in again

**Solution**:
```
1. Open app
2. Go to Settings tab
3. Tap "Sign in with Google"
4. Complete sign-in
5. Try uploading again
```

### Issue 2: Security Rules Blocking Upload
**Symptom**: Error in logs: "permission-denied"
**Solution**: Check your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /trips/{tripId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Issue 3: Network Error
**Symptom**: Error in logs: "network error"
**Solution**:
- Check internet connection
- Try again
- Data is saved locally, will sync when online

### Issue 4: Wrong User ID
**Symptom**: Data uploaded but can't find it
**Solution**: Find your user ID

## 🎯 How to Find Your User ID

### Method 1: In App Logs
```bash
npx react-native log-android
```
Look for: `✅ Google Sign-In successful: [name]`
Then look for: `user.uid: [your_user_id]`

### Method 2: In Firebase Console
1. Go to **Authentication** → **Users** tab
2. Find your email
3. Copy the **User UID**
4. Go to **Firestore Database** → **Data**
5. Look for collection `users` → document with that UID

### Method 3: Add Debug Button

I'll add a debug feature to show your user ID in the app.

## 🧪 Test Upload Step-by-Step

### Step 1: Verify Sign-In
1. Open app
2. Go to **Settings** tab
3. Check if you see:
   - Your profile photo
   - Your name
   - Your email
   - "✅ Cloud sync enabled"

If you DON'T see this → Sign in first!

### Step 2: Complete a Ride
1. Go to **Tracker** tab
2. Tap **START RIDE**
3. Wait 30 seconds (let it track some distance)
4. Tap **STOP RIDE**
5. You should see completion alert

### Step 3: Check Logs
Run: `npx react-native log-android`

Look for:
```
✅ Trip saved locally: 1702834567890
✅ Trip synced to cloud: 1702834567890
```

### Step 4: Check Firestore Console
1. Refresh Firestore Console page
2. You should now see:
   - **users** collection (appears!)
   - Your user document
   - **trips** subcollection
   - Your trip data

## 🔧 Quick Fix: Manual Upload

If automatic sync didn't work, try manual upload:

1. Go to **Settings** tab
2. Scroll to **Data Management**
3. Tap **"Upload to Cloud"**
4. Confirm upload
5. Check Firestore Console again

## 📊 What You Should See in Firestore

After successful upload:

```
Firestore Database
└── users (collection) ← This appears after first upload
    └── [your_user_id] (document) ← Your Google user ID
        └── trips (subcollection) ← Your trips
            └── [trip_id] (document)
                ├── id: "1702834567890"
                ├── date: "2024-12-17T10:30:00.000Z"
                ├── distance: 5.42
                ├── duration: 1234
                ├── coordinates: [...]
                ├── avgSpeed: 15.8
                ├── calories: 245
                └── userId: "[your_user_id]"
```

## 🎯 Most Likely Issue

Based on your description, the most likely issue is:

**You're signed in, but the collection hasn't appeared yet in Firestore Console.**

### Try This:
1. **Refresh** the Firestore Console page (F5)
2. Click **"Start collection"** if you still see it
3. Type: `users` as collection ID
4. Click **Next**
5. If data exists, you'll see it
6. If not, try manual upload from Settings

## 🆘 Still Not Working?

### Get Your User ID:
1. Open app
2. Go to Settings
3. Look at your profile card
4. Your user ID is in the logs

### Check Authentication:
1. Firebase Console → **Authentication** → **Users**
2. Do you see your email listed?
3. If YES → Authentication works
4. If NO → Sign in again

### Check Firestore Rules:
1. Firebase Console → **Firestore Database** → **Rules**
2. Make sure rules are published
3. Try this test:
   - Rules playground
   - Location: `/users/test123`
   - Authenticated: YES
   - Auth UID: `test123`
   - Should show: ✅ Allowed

## 💡 Pro Tip: Enable Debug Mode

Add this to see more details:

In Settings screen, I'll add a debug section that shows:
- Current user ID
- Sign-in status
- Last sync time
- Number of trips in cloud

Would you like me to add this debug feature?

## 🎉 Expected Behavior

**After first successful upload:**
1. Firestore Console shows **users** collection
2. Your user document appears
3. **trips** subcollection contains your rides
4. You can click on each trip to see details

**The "Start collection" button disappears once data exists!**

---

**Next Steps:**
1. Try manual upload from Settings
2. Check logs with `npx react-native log-android`
3. Refresh Firestore Console
4. Let me know what you see!
