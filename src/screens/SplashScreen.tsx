import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { colors } from '../theme/colors';

const SplashScreen = ({ navigation }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            // Navigate to AppTabs - reduced from 4000ms to 1500ms
            navigation.replace('AppTabs');
        }, 1500);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.title}>RideFlow</Text>
                <Text style={styles.subtitle}>Track Every Mile</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: colors.text,
        marginTop: 10,
        textAlign: 'center',
    },
});

export default SplashScreen;
