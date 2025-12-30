import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { TrackingModule } = NativeModules;

interface TrackingModuleInterface {
    startForegroundService(title: string, content: string, isPaused: boolean): Promise<boolean>;
    stopForegroundService(): Promise<boolean>;
    updateNotification(title: string, content: string, isPaused: boolean): Promise<boolean>;
    isServiceRunning(): Promise<boolean>;
}

class TrackingNativeModule {
    private module: TrackingModuleInterface | null = null;
    private eventEmitter: NativeEventEmitter | null = null;

    constructor() {
        if (Platform.OS === 'android' && TrackingModule) {
            this.module = TrackingModule as TrackingModuleInterface;
            this.eventEmitter = new NativeEventEmitter(TrackingModule);
        }
    }

    async startForegroundService(title: string, content: string, isPaused: boolean = false): Promise<boolean> {
        if (!this.module) {
            console.warn('TrackingModule not available on this platform');
            return false;
        }
        try {
            return await this.module.startForegroundService(title, content, isPaused);
        } catch (error) {
            console.error('Error starting foreground service:', error);
            return false;
        }
    }

    async stopForegroundService(): Promise<boolean> {
        if (!this.module) {
            return false;
        }
        try {
            return await this.module.stopForegroundService();
        } catch (error) {
            console.error('Error stopping foreground service:', error);
            return false;
        }
    }

    async updateNotification(title: string, content: string, isPaused: boolean = false): Promise<boolean> {
        if (!this.module) {
            return false;
        }
        try {
            return await this.module.updateNotification(title, content, isPaused);
        } catch (error) {
            console.error('Error updating notification:', error);
            return false;
        }
    }

    async isServiceRunning(): Promise<boolean> {
        if (!this.module) {
            return false;
        }
        try {
            return await this.module.isServiceRunning();
        } catch (error) {
            console.error('Error checking service status:', error);
            return false;
        }
    }

    addListener(eventName: string, callback: (...args: any[]) => void): any {
        if (!this.eventEmitter) {
            return null;
        }
        return this.eventEmitter.addListener(eventName, callback);
    }

    removeListener(subscription: any) {
        if (subscription && subscription.remove) {
            subscription.remove();
        }
    }
}

export default new TrackingNativeModule();
