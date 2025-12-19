import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { CheckSquare, Square } from 'lucide-react-native';

interface ConsentScreenProps {
    onAccept: () => void;
}

const ConsentScreen: React.FC<ConsentScreenProps> = ({ onAccept }) => {
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleAccept = async () => {
        if (!acceptedPrivacy || !acceptedTerms) {
            Alert.alert(
                'Agreement Required',
                'Please accept both the Privacy Policy and Terms of Service to continue.'
            );
            return;
        }

        try {
            await AsyncStorage.setItem('consent_accepted', 'true');
            await AsyncStorage.setItem('consent_date', new Date().toISOString());
            onAccept();
        } catch (error) {
            console.error('Error saving consent:', error);
        }
    };

    const handleDecline = () => {
        Alert.alert(
            'Cannot Use App',
            'You must accept the Privacy Policy and Terms of Service to use RideFlow.',
            [{ text: 'OK' }]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome to RideFlow! 🚴‍♂️</Text>
                    <Text style={styles.subtitle}>
                        Before you start tracking your rides, please review and accept our policies.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 What We Collect</Text>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            <Text style={styles.bold}>Location Data:</Text> GPS coordinates to track your rides
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            <Text style={styles.bold}>Account Info:</Text> Name and email (if you sign in with Google)
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            <Text style={styles.bold}>Ride Data:</Text> Distance, duration, speed, calories
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔒 How We Protect Your Data</Text>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            Your data is stored securely on your device and in Firebase Cloud
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            Only you can access your ride data (isolated by user ID)
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            We never sell your data to third parties
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            You can delete your account and data anytime
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚠️ Safety Notice</Text>
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            <Text style={styles.bold}>IMPORTANT:</Text> Do NOT use your phone while cycling. 
                            Start tracking before you ride, and stop after you finish. Always wear a helmet 
                            and follow traffic laws. Ride at your own risk.
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✅ Your Rights</Text>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            Access and export your data anytime
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            Use the app without cloud sync (local storage only)
                        </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>
                            Delete your account and all data permanently
                        </Text>
                    </View>
                </View>

                <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                    >
                        {acceptedPrivacy ? (
                            <CheckSquare size={24} color={colors.primary} />
                        ) : (
                            <Square size={24} color={colors.gray} />
                        )}
                        <Text style={styles.checkboxText}>
                            I have read and accept the{' '}
                            <Text style={styles.link}>Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => setAcceptedTerms(!acceptedTerms)}
                    >
                        {acceptedTerms ? (
                            <CheckSquare size={24} color={colors.primary} />
                        ) : (
                            <Square size={24} color={colors.gray} />
                        )}
                        <Text style={styles.checkboxText}>
                            I have read and accept the{' '}
                            <Text style={styles.link}>Terms of Service</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.acceptButton,
                            (!acceptedPrivacy || !acceptedTerms) && styles.buttonDisabled,
                        ]}
                        onPress={handleAccept}
                        disabled={!acceptedPrivacy || !acceptedTerms}
                    >
                        <Text style={styles.buttonText}>Accept & Continue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.declineButton]}
                        onPress={handleDecline}
                    >
                        <Text style={[styles.buttonText, styles.declineButtonText]}>
                            Decline
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    By continuing, you agree to our data collection and usage practices as 
                    described above. You can change your preferences in Settings anytime.
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 24,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.gray,
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        fontSize: 16,
        color: colors.primary,
        marginRight: 8,
        fontWeight: 'bold',
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },
    bold: {
        fontWeight: 'bold',
        color: colors.text,
    },
    warningBox: {
        backgroundColor: '#FFF3CD',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    warningText: {
        fontSize: 14,
        color: '#856404',
        lineHeight: 20,
    },
    checkboxContainer: {
        marginTop: 8,
        marginBottom: 24,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: colors.white,
        borderRadius: 12,
    },
    checkboxText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        marginLeft: 12,
        lineHeight: 20,
    },
    link: {
        color: colors.primary,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    buttonContainer: {
        marginBottom: 16,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    acceptButton: {
        backgroundColor: colors.primary,
    },
    buttonDisabled: {
        backgroundColor: colors.gray,
        opacity: 0.5,
    },
    declineButton: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.gray,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.white,
    },
    declineButtonText: {
        color: colors.text,
    },
    footer: {
        fontSize: 12,
        color: colors.gray,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 40,
    },
});

export default ConsentScreen;