# 📊 How to View Your Cloud Data

## 🔥 View Data in Firebase Firestore Console

### Step 1: Access Firestore
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **cycletracker-22e5b** project
3. Click **Firestore Database** in the left sidebar
4. Click **Data** tab

### Step 2: Navigate to Your Data
Your data structure looks like this:
```
Firestore Database
└── users (collection)
    └── [user_id] (document)
        ├── settings (field)
        └── trips (subcollection)
            ├── [trip_id_1] (document)
            ├── [trip_id_2] (document)
            └── ...
```

### Step 3: View Your Trips
1. Click on **users** collection
2. Click on your user document (shows your user ID)
3. Click on **trips** subcollection
4. You'll see all your synced trips with:
   - `id`: Trip identifier
   - `date`: When the trip started
   - `distance`: Distance in km
   - `duration`: Duration in seconds
   - `coordinates`: Array of GPS points
   - `avgSpeed`: Average speed in km/h
   - `maxSpeed`: Maximum speed
   - `calories`: Calories burned
   - `startTime`: Trip start timestamp
   - `endTime`: Trip end timestamp
   - `userId`: Your user ID

### Step 4: View Individual Trip Details
Click on any trip document to see:
- Full coordinate path
- Exact timestamps
- All calculated metrics

## 📱 View Downloaded Data in App

When you tap **"Download from Cloud"** in Settings:

### What Happens:
1. App fetches all trips from Firestore
2. Merges with local database
3. Shows count in alert: "Found X trips in cloud storage"
4. Data appears in:
   - **Dashboard**: Trip history list
   - **Analytics**: Statistics and charts
   - **Tracker**: Today's total distance

### Where to See Downloaded Trips:
1. **Dashboard Tab** → Scroll through trip history
2. **Analytics Tab** → View aggregated statistics
3. Each trip shows:
   - Date and time
   - Distance covered
   - Duration
   - Average speed
   - Calories burned

## 🔄 Sync Status Indicators

### In Settings Screen:
- ✅ **"Cloud sync enabled"** - You're signed in and syncing
- **Profile card** - Shows your Google account
- **Upload button** - Manual sync to cloud
- **Download button** - Manual sync from cloud

### Auto-Sync Behavior:
- **After each ride**: Automatically uploads to cloud
- **On sign-in**: Downloads existing cloud data
- **Offline mode**: Saves locally, syncs when online

## 🧪 Test Your Cloud Sync

### Test 1: Upload Data
1. Complete a ride in the app
2. Go to Settings → Tap "Upload to Cloud"
3. Check Firestore Console → Should see new trip

### Test 2: Download Data
1. Go to Settings → Tap "Download from Cloud"
2. Check Dashboard → Should see all trips
3. Check Analytics → Statistics should update

### Test 3: Cross-Device Sync
1. Sign in with same Google account on another device
2. Tap "Download from Cloud"
3. All your trips should appear!

## 📊 Understanding Your Data

### Trip Document Example:
```json
{
  "id": "1702834567890",
  "date": "2024-12-17T10:30:00.000Z",
  "distance": 5.42,
  "duration": 1234,
  "coordinates": [
    { "latitude": 37.7749, "longitude": -122.4194 },
    { "latitude": 37.7750, "longitude": -122.4195 },
    ...
  ],
  "avgSpeed": 15.8,
  "maxSpeed": 28.3,
  "calories": 245,
  "startTime": "2024-12-17T10:30:00.000Z",
  "endTime": "2024-12-17T10:50:34.000Z",
  "userId": "abc123xyz789"
}
```

### Calculations:
- **Duration**: In seconds (1234 seconds = 20 minutes 34 seconds)
- **Distance**: In kilometers (5.42 km)
- **Speed**: In km/h (15.8 km/h average)
- **Calories**: Based on distance and duration

## 🔍 Query Your Data

### In Firestore Console:
You can filter and query your trips:
1. Click **Filter** button
2. Add conditions like:
   - `distance >= 10` (trips over 10km)
   - `date >= 2024-12-01` (trips this month)
   - `calories >= 500` (high-calorie rides)

### Export Your Data:
1. Select trips in Firestore Console
2. Click **Export** button
3. Choose format (JSON, CSV)
4. Download for analysis in Excel/Google Sheets

## 🎯 Pro Tips

1. **Regular Backups**: Tap "Upload to Cloud" weekly
2. **Check Sync Status**: Profile card shows sync status
3. **Offline Rides**: Will sync automatically when online
4. **Multiple Devices**: Sign in with same account everywhere
5. **Data Privacy**: Only you can see your trips (secured by user ID)

Your ride data is safe, synced, and accessible anywhere! 🚴‍♂️✨