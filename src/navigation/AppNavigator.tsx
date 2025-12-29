import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import DashboardScreen from '../screens/DashboardScreen';
import TrackerScreen from '../screens/TrackerScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TrackingHeader from '../components/TrackingHeader';
import { colors } from '../theme/colors';
import { Bike, Map, BarChart3, Settings } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
    const { isTracking, isPaused, currentTrip } = useSelector((state: RootState) => state.trips);
    const [currentSpeed, setCurrentSpeed] = React.useState(0);
    const [duration, setDuration] = React.useState(0);

    // Update duration every second when tracking
    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        
        if (isTracking && currentTrip && !isPaused) {
            interval = setInterval(() => {
                if (currentTrip.startTime) {
                    const startTime = new Date(currentTrip.startTime).getTime();
                    const now = new Date().getTime();
                    const totalDuration = Math.floor((now - startTime) / 1000);
                    const pausedTime = currentTrip.pausedTime || 0;
                    setDuration(totalDuration - pausedTime);
                }
            }, 1000);
        } else if (currentTrip) {
            // Set duration from current trip when paused
            setDuration(currentTrip.activeDuration || 0);
        } else {
            setDuration(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTracking, isPaused, currentTrip]);

    // Listen for speed updates from the tracker screen
    React.useEffect(() => {
        // This would be better implemented with a context or global state
        // For now, we'll use the maxSpeed from currentTrip as current speed approximation
        if (currentTrip?.maxSpeed) {
            setCurrentSpeed(currentTrip.maxSpeed);
        } else {
            setCurrentSpeed(0);
        }
    }, [currentTrip?.maxSpeed]);

    // Header component for Dashboard only
    const dashboardHeaderComponent = () => (
        <TrackingHeader
            distance={currentTrip?.distance || 0}
            duration={duration}
            speed={currentSpeed}
            isTracking={isTracking}
            isPaused={isPaused}
        />
    );

    // Regular header component for other screens
    const regularHeaderComponent = (title: string) => ({
        headerTitle: title,
        headerStyle: {
            backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
            fontWeight: 'bold' as const,
        },
    });

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.gray,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    height: 70,
                    paddingBottom: 10,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'My Rides',
                    header: () => dashboardHeaderComponent(),
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIcon]}>
                            <Bike color={focused ? colors.white : color} size={24} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Tracker"
                component={TrackerScreen}
                options={{
                    ...regularHeaderComponent('Track Ride'),
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIcon]}>
                            <Map color={focused ? colors.white : color} size={24} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{
                    ...regularHeaderComponent('Analytics'),
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIcon]}>
                            <BarChart3 color={focused ? colors.white : color} size={24} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    ...regularHeaderComponent('Settings'),
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIcon]}>
                            <Settings color={focused ? colors.white : color} size={24} />
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="AppTabs" component={TabNavigator} />
                <Stack.Screen
                    name="TripDetail"
                    component={TripDetailScreen}
                    options={{
                        headerShown: true,
                        title: 'Trip Details',
                        headerStyle: {
                            backgroundColor: colors.primary,
                        },
                        headerTintColor: colors.white,
                        headerTitleStyle: {
                            fontWeight: 'bold' as const,
                        },
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        padding: 10,
        borderRadius: 20,
    },
    activeIcon: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    }
});

export default AppNavigator;