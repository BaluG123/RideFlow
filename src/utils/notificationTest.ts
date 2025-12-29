import { BackgroundTrackingService } from '../services/backgroundTracking';
import { Trip } from '../store/tripSlice';

export const testBackgroundNotifications = () => {
    console.log('🧪 Testing Firebase background notifications...');
    
    // Initialize the Firebase service
    BackgroundTrackingService.initialize();
    
    // Create a mock trip for testing
    const mockTrip: Trip = {
        id: 'test-trip-' + Date.now(),
        name: 'Test Ride',
        date: new Date().toISOString(),
        distance: 5.2,
        duration: 1800, // 30 minutes
        activeDuration: 1650, // 27.5 minutes (accounting for pauses)
        coordinates: [],
        avgSpeed: 11.3,
        maxSpeed: 25.8,
        calories: 234,
        startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        pausedTime: 150, // 2.5 minutes paused
    };
    
    // Test different Firebase notification scenarios
    setTimeout(() => {
        console.log('🧪 Testing active Firebase tracking notification...');
        BackgroundTrackingService.startTracking(mockTrip, false);
    }, 1000);
    
    setTimeout(() => {
        console.log('🧪 Testing paused Firebase tracking notification...');
        BackgroundTrackingService.pauseTracking();
    }, 3000);
    
    setTimeout(() => {
        console.log('🧪 Testing resumed Firebase tracking notification...');
        BackgroundTrackingService.resumeTracking();
    }, 5000);
    
    setTimeout(() => {
        console.log('🧪 Testing Firebase trip completed notification...');
        BackgroundTrackingService.showTripCompletedNotification(mockTrip);
        BackgroundTrackingService.stopTracking();
    }, 7000);
    
    setTimeout(() => {
        console.log('🧪 Testing Firebase GPS warning notification...');
        BackgroundTrackingService.showGPSAccuracyWarning();
    }, 9000);
    
    setTimeout(() => {
        console.log('🧪 Testing Firebase permission reminder notification...');
        BackgroundTrackingService.showLocationPermissionReminder();
    }, 11000);
    
    console.log('🧪 Firebase notification tests scheduled. Check your notification panel!');
};