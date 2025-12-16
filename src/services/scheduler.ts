import { AnalyticsService } from './analytics';
import { NotificationService } from './notifications';
import { Trip } from '../store/tripSlice';

export class SchedulerService {
    // Check and send weekly reports (call this when app opens)
    static async checkWeeklyReport(trips: Trip[]) {
        try {
            const lastReportDate = await this.getLastReportDate();
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            // If it's been more than a week since last report, send one
            if (!lastReportDate || lastReportDate < oneWeekAgo) {
                const weeklyStats = AnalyticsService.getWeeklyStats(trips);
                
                if (weeklyStats.totalTrips > 0) {
                    NotificationService.showWeeklyReport(
                        weeklyStats.totalDistance,
                        weeklyStats.totalTrips
                    );
                    
                    await this.setLastReportDate(now);
                }
            }
        } catch (error) {
            console.error('Error checking weekly report:', error);
        }
    }

    // Check for motivational notifications
    static async checkMotivationalNotifications(trips: Trip[]) {
        try {
            if (trips.length === 0) return;

            const lastTrip = trips[0]; // Assuming trips are sorted by date desc
            const lastTripDate = new Date(lastTrip.date);
            const now = new Date();
            const daysSinceLastRide = Math.floor((now.getTime() - lastTripDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSinceLastRide >= 2) {
                const lastMotivationDate = await this.getLastMotivationDate();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                // Only send one motivational notification per day
                if (!lastMotivationDate || lastMotivationDate < oneDayAgo) {
                    NotificationService.showMotivationalNotification(daysSinceLastRide);
                    await this.setLastMotivationDate(now);
                }
            }
        } catch (error) {
            console.error('Error checking motivational notifications:', error);
        }
    }

    // Helper methods for storing dates
    private static async getLastReportDate(): Promise<Date | null> {
        try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            const dateStr = await AsyncStorage.default.getItem('last_weekly_report');
            return dateStr ? new Date(dateStr) : null;
        } catch {
            return null;
        }
    }

    private static async setLastReportDate(date: Date): Promise<void> {
        try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            await AsyncStorage.default.setItem('last_weekly_report', date.toISOString());
        } catch (error) {
            console.error('Error saving last report date:', error);
        }
    }

    private static async getLastMotivationDate(): Promise<Date | null> {
        try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            const dateStr = await AsyncStorage.default.getItem('last_motivation_notification');
            return dateStr ? new Date(dateStr) : null;
        } catch {
            return null;
        }
    }

    private static async setLastMotivationDate(date: Date): Promise<void> {
        try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            await AsyncStorage.default.setItem('last_motivation_notification', date.toISOString());
        } catch (error) {
            console.error('Error saving last motivation date:', error);
        }
    }
}