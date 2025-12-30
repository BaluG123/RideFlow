import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AnalyticsService, DailyStats, WeeklyStats, MonthlyStats } from '../services/analytics';
import TrackingStatusBar from '../components/TrackingStatusBar';
import { colors } from '../theme/colors';
import { Calendar, TrendingUp, Award, Target } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type ViewMode = 'today' | 'week' | 'month';

const AnalyticsScreen = () => {
    const { trips } = useSelector((state: RootState) => state.trips);
    const [viewMode, setViewMode] = useState<ViewMode>('today');
    const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        calculateStats();
    }, [trips]);

    const calculateStats = () => {
        // Today's stats
        const today = AnalyticsService.getDailyStats(trips, new Date());
        setTodayStats(today);

        // Weekly stats
        const weekly = AnalyticsService.getWeeklyStats(trips);
        setWeeklyStats(weekly);

        // Monthly stats
        const monthly = AnalyticsService.getMonthlyStats(trips);
        setMonthlyStats(monthly);

        // Streak
        const currentStreak = AnalyticsService.getCurrentStreak(trips);
        setStreak(currentStreak);
    };

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const StatCard = ({ title, value, unit, icon: Icon, color = colors.primary }: any) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statHeader}>
                <Icon size={20} color={color} />
                <Text style={styles.statTitle}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color }]}>
                {value} <Text style={styles.statUnit}>{unit}</Text>
            </Text>
        </View>
    );

    const renderTodayView = () => {
        if (!todayStats) return null;

        return (
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Today's Progress</Text>
                
                <StatCard
                    title="Distance Covered"
                    value={todayStats.distance.toFixed(2)}
                    unit="km"
                    icon={TrendingUp}
                    color={colors.primary}
                />
                
                <StatCard
                    title="Ride Time"
                    value={formatDuration(todayStats.duration)}
                    unit=""
                    icon={Calendar}
                    color={colors.secondary}
                />
                
                <StatCard
                    title="Trips Completed"
                    value={todayStats.trips}
                    unit="rides"
                    icon={Target}
                    color={colors.success}
                />
                
                <StatCard
                    title="Calories Burned"
                    value={todayStats.calories}
                    unit="cal"
                    icon={Award}
                    color={colors.warning}
                />

                {streak > 0 && (
                    <View style={[styles.streakCard, { backgroundColor: colors.success + '20' }]}>
                        <Award size={24} color={colors.success} />
                        <Text style={styles.streakText}>
                            🔥 {streak} day{streak > 1 ? 's' : ''} streak!
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderWeeklyView = () => {
        if (!weeklyStats) return null;

        return (
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>This Week</Text>
                
                <StatCard
                    title="Total Distance"
                    value={weeklyStats.totalDistance.toFixed(2)}
                    unit="km"
                    icon={TrendingUp}
                    color={colors.primary}
                />
                
                <StatCard
                    title="Total Time"
                    value={formatDuration(weeklyStats.totalDuration)}
                    unit=""
                    icon={Calendar}
                    color={colors.secondary}
                />
                
                <StatCard
                    title="Average Daily"
                    value={weeklyStats.avgDailyDistance.toFixed(1)}
                    unit="km/day"
                    icon={Target}
                    color={colors.success}
                />
                
                <StatCard
                    title="Total Rides"
                    value={weeklyStats.totalTrips}
                    unit="rides"
                    icon={Award}
                    color={colors.warning}
                />

                <View style={styles.dailyBreakdown}>
                    <Text style={styles.breakdownTitle}>Daily Breakdown</Text>
                    {weeklyStats.dailyStats.map((day, index) => (
                        <View key={`day-${index}-${day.date}`} style={styles.dayRow}>
                            <Text style={styles.dayName}>
                                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                            </Text>
                            <Text style={styles.dayDistance}>
                                {day.distance.toFixed(1)} km
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderMonthlyView = () => {
        if (!monthlyStats) return null;

        return (
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>
                    {monthlyStats.month} {monthlyStats.year}
                </Text>
                
                <StatCard
                    title="Total Distance"
                    value={monthlyStats.totalDistance.toFixed(2)}
                    unit="km"
                    icon={TrendingUp}
                    color={colors.primary}
                />
                
                <StatCard
                    title="Total Time"
                    value={formatDuration(monthlyStats.totalDuration)}
                    unit=""
                    icon={Calendar}
                    color={colors.secondary}
                />
                
                <StatCard
                    title="Average Weekly"
                    value={monthlyStats.avgWeeklyDistance.toFixed(1)}
                    unit="km/week"
                    icon={Target}
                    color={colors.success}
                />
                
                <StatCard
                    title="Total Rides"
                    value={monthlyStats.totalTrips}
                    unit="rides"
                    icon={Award}
                    color={colors.warning}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                {(['today', 'week', 'month'] as ViewMode[]).map((mode) => (
                    <TouchableOpacity
                        key={`tab-${mode}`}
                        style={[
                            styles.tab,
                            viewMode === mode && styles.activeTab,
                        ]}
                        onPress={() => setViewMode(mode)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                viewMode === mode && styles.activeTabText,
                            ]}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {viewMode === 'today' && renderTodayView()}
                {viewMode === 'week' && renderWeeklyView()}
                {viewMode === 'month' && renderMonthlyView()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        margin: 16,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.gray,
    },
    activeTabText: {
        color: colors.white,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statTitle: {
        fontSize: 14,
        color: colors.gray,
        marginLeft: 8,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    statUnit: {
        fontSize: 16,
        fontWeight: 'normal',
        color: colors.gray,
    },
    streakCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    streakText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.success,
        marginLeft: 12,
    },
    dailyBreakdown: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 12,
        marginTop: 12,
    },
    breakdownTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    dayName: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    dayDistance: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: 'bold',
    },
});

export default AnalyticsScreen;