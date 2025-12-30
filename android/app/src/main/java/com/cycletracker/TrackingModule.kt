package com.cycletracker

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*

class TrackingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        TrackingService.reactContext = reactContext
    }

    override fun getName(): String {
        return "TrackingModule"
    }

    @ReactMethod
    fun startForegroundService(title: String, content: String, isPaused: Boolean, promise: Promise) {
        try {
            val serviceIntent = Intent(reactApplicationContext, TrackingService::class.java).apply {
                putExtra(TrackingService.EXTRA_TITLE, title)
                putExtra(TrackingService.EXTRA_CONTENT, content)
                putExtra(TrackingService.EXTRA_IS_PAUSED, isPaused)
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(serviceIntent)
            } else {
                reactApplicationContext.startService(serviceIntent)
            }
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        try {
            val serviceIntent = Intent(reactApplicationContext, TrackingService::class.java)
            reactApplicationContext.stopService(serviceIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun updateNotification(title: String, content: String, isPaused: Boolean, promise: Promise) {
        try {
            if (TrackingService.isServiceRunning) {
                // Use the static method to update the running service instance
                TrackingService.updateNotificationFromModule(title, content, isPaused)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        promise.resolve(TrackingService.isServiceRunning)
    }
}
