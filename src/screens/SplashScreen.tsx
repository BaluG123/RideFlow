import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions, Image } from 'react-native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            // Navigate to AppTabs
            navigation.replace('AppTabs');
        }, 4000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
            />
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
    logo: {
        width: width * 0.6,
        height: width * 0.6,
        marginBottom: 20
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 20,
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
