package com.cycletracker

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class TrackingService : Service() {

    companion object {
        const val CHANNEL_ID = "tracking_channel"
        const val NOTIFICATION_ID = 1
        const val ACTION_PAUSE = "com.cycletracker.ACTION_PAUSE"
        const val ACTION_RESUME = "com.cycletracker.ACTION_RESUME"
        const val ACTION_FINISH = "com.cycletracker.ACTION_FINISH"
        
        var isServiceRunning = false
        var reactContext: com.facebook.react.bridge.ReactContext? = null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        isServiceRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PAUSE -> {
                sendEventToJS("onPausePressed", null)
            }
            ACTION_RESUME -> {
                sendEventToJS("onResumePressed", null)
            }
            ACTION_FINISH -> {
                sendEventToJS("onFinishPressed", null)
            }
            else -> {
                // Start foreground service
                val notification = createNotification(
                    "Starting ride...",
                    "0.00 km • 0m",
                    false
                )
                startForeground(NOTIFICATION_ID, notification)
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Ride Tracking"
            val descriptionText = "Shows your current ride progress"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun createNotification(title: String, content: String, isPaused: Boolean): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

        // Add action buttons
        if (isPaused) {
            val resumeIntent = Intent(this, TrackingService::class.java).apply {
                action = ACTION_RESUME
            }
            val resumePendingIntent = PendingIntent.getService(
                this, 1, resumeIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            builder.addAction(
                android.R.drawable.ic_media_play,
                "Resume",
                resumePendingIntent
            )
        } else {
            val pauseIntent = Intent(this, TrackingService::class.java).apply {
                action = ACTION_PAUSE
            }
            val pausePendingIntent = PendingIntent.getService(
                this, 2, pauseIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            builder.addAction(
                android.R.drawable.ic_media_pause,
                "Pause",
                pausePendingIntent
            )
        }

        val finishIntent = Intent(this, TrackingService::class.java).apply {
            action = ACTION_FINISH
        }
        val finishPendingIntent = PendingIntent.getService(
            this, 3, finishIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        builder.addAction(
            android.R.drawable.ic_menu_close_clear_cancel,
            "Finish",
            finishPendingIntent
        )

        return builder.build()
    }

    fun updateNotification(title: String, content: String, isPaused: Boolean) {
        val notification = createNotification(title, content, isPaused)
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun sendEventToJS(eventName: String, params: WritableMap?) {
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }
}
