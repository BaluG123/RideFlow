import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { X, Bell } from 'lucide-react-native';

interface NotificationBannerProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
    onDismiss: () => void;
    onPress?: () => void;
    autoHide?: boolean;
    duration?: number;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
    visible,
    title,
    message,
    type = 'info',
    onDismiss,
    onPress,
    autoHide = true,
    duration = 4000,
}) => {
    const [slideAnim] = useState(new Animated.Value(-100));

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();

            // Auto hide
            if (autoHide) {
                const timer = setTimeout(() => {
                    hideBanner();
                }, duration);

                return () => clearTimeout(timer);
            }
        } else {
            hideBanner();
        }
    }, [visible]);

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onDismiss();
        });
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return colors.success;
            case 'warning':
                return '#FF9500';
            case 'error':
                return colors.error;
            default:
                return colors.primary;
        }
    };

    const getIcon = () => {
        return <Bell size={20} color={colors.white} />;
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <TouchableOpacity
                style={styles.content}
                onPress={onPress}
                activeOpacity={onPress ? 0.8 : 1}
            >
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.message} numberOfLines={2}>
                        {message}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={hideBanner}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <X size={18} color={colors.white} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingTop: 50, // Account for status bar
        paddingHorizontal: 16,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        color: colors.white,
        opacity: 0.9,
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
    },
});

export default NotificationBanner;