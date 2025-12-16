import { Trip } from '../store/tripSlice';

export interface DailyStats {
    date: string;
    distance: number;
    duration: number;
    trips: number;
    calories: number;
}

export interface WeeklyStats {
    weekStart: string;
    weekEnd: string;
    totalDistance: number;
    totalDuration: number;
    totalTrips: number;
    totalCalories: number;
    dailyStats: DailyStats[];
    avgDailyDistance: number;
}

export interface MonthlyStats {
    month: string;
    year: number;
    totalDistance: number;
    totalDuration: number;
    totalTrips: number;
    totalCalories: number;
    weeklyStats: WeeklyStats[];
    avgWeeklyDistance: number;
}

export class AnalyticsService {
    // Calculate calories burned (rough estimate for cycling)
    static calculateCalories(distance: number, duration: number): number {
        // Average: 40-50 calories per km for cycling
        return Math.round(distance * 45);
    }

    // Calculate average speed
    static calculateAvgSpeed(distance: number, duration: number): number {
        if (duration === 0) return 0;
        return (distance / (duration / 3600)); // km/h
    }

    // Get today's total distance
    static getTodayDistance(trips: Trip[]): number {
        const today = new Date().toDateString();
        return trips
            .filter(trip => new Date(trip.date).toDateString() === today)
            .reduce((total, trip) => total + trip.distance, 0);
    }

    // Get daily stats for a specific date
    static getDailyStats(trips: Trip[], date: Date): DailyStats {
        const dateStr = date.toDateString();
        const dayTrips = trips.filter(trip => 
            new Date(trip.date).toDateString() === dateStr
        );

        return {
            date: dateStr,
            distance: dayTrips.reduce((sum, trip) => sum + trip.distance, 0),
            duration: dayTrips.reduce((sum, trip) => sum + trip.duration, 0),
            trips: dayTrips.length,
            calories: dayTrips.reduce((sum, trip) => sum + (trip.calories || 0), 0),
        };
    }

    // Get weekly stats
    static getWeeklyStats(trips: Trip[], weekStart?: Date): WeeklyStats {
        const startOfWeek = weekStart || this.getStartOfWeek(new Date());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const weekTrips = trips.filter(trip => {
            const tripDate = new Date(trip.date);
            return tripDate >= startOfWeek && tripDate <= endOfWeek;
        });

        const dailyStats: DailyStats[] = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            dailyStats.push(this.getDailyStats(trips, currentDate));
        }

        const totalDistance = weekTrips.reduce((sum, trip) => sum + trip.distance, 0);
        const totalDuration = weekTrips.reduce((sum, trip) => sum + trip.duration, 0);
        const totalCalories = weekTrips.reduce((sum, trip) => sum + (trip.calories || 0), 0);

        return {
            weekStart: startOfWeek.toISOString(),
            weekEnd: endOfWeek.toISOString(),
            totalDistance,
            totalDuration,
            totalTrips: weekTrips.length,
            totalCalories,
            dailyStats,
            avgDailyDistance: totalDistance / 7,
        };
    }

    // Get monthly stats
    static getMonthlyStats(trips: Trip[], month?: number, year?: number): MonthlyStats {
        const now = new Date();
        const targetMonth = month ?? now.getMonth();
        const targetYear = year ?? now.getFullYear();

        const monthTrips = trips.filter(trip => {
            const tripDate = new Date(trip.date);
            return tripDate.getMonth() === targetMonth && tripDate.getFullYear() === targetYear;
        });

        // Get all weeks in the month
        const weeklyStats: WeeklyStats[] = [];
        const firstDay = new Date(targetYear, targetMonth, 1);
        const lastDay = new Date(targetYear, targetMonth + 1, 0);
        
        let currentWeekStart = this.getStartOfWeek(firstDay);
        while (currentWeekStart <= lastDay) {
            weeklyStats.push(this.getWeeklyStats(trips, currentWeekStart));
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }

        const totalDistance = monthTrips.reduce((sum, trip) => sum + trip.distance, 0);
        const totalDuration = monthTrips.reduce((sum, trip) => sum + trip.duration, 0);
        const totalCalories = monthTrips.reduce((sum, trip) => sum + (trip.calories || 0), 0);

        return {
            month: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long' }),
            year: targetYear,
            totalDistance,
            totalDuration,
            totalTrips: monthTrips.length,
            totalCalories,
            weeklyStats: weeklyStats.filter(week => 
                new Date(week.weekStart).getMonth() === targetMonth ||
                new Date(week.weekEnd).getMonth() === targetMonth
            ),
            avgWeeklyDistance: totalDistance / 4, // Approximate
        };
    }

    // Helper: Get start of week (Monday)
    private static getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    // Get streak (consecutive days with rides)
    static getCurrentStreak(trips: Trip[]): number {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);

        while (true) {
            const hasRideToday = trips.some(trip => 
                new Date(trip.date).toDateString() === currentDate.toDateString()
            );

            if (hasRideToday) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }
}