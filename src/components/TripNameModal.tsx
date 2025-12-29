import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Check, X } from 'lucide-react-native';

interface TripNameModalProps {
    visible: boolean;
    onSave: (name: string) => void;
    onCancel: () => void;
    defaultName?: string;
    distance: number;
    duration: number;
}

const TripNameModal: React.FC<TripNameModalProps> = ({
    visible,
    onSave,
    onCancel,
    defaultName,
    distance,
    duration,
}) => {
    const [tripName, setTripName] = useState(defaultName || '');

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const handleSave = () => {
        const name = tripName.trim();
        if (!name) {
            Alert.alert('Trip Name Required', 'Please enter a name for your trip.');
            return;
        }
        onSave(name);
        setTripName('');
    };

    const handleCancel = () => {
        setTripName('');
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Name Your Ride</Text>
                    
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
                            <Text style={styles.statLabel}>Distance</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                            <Text style={styles.statLabel}>Duration</Text>
                        </View>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter trip name..."
                        placeholderTextColor={colors.gray}
                        value={tripName}
                        onChangeText={setTripName}
                        autoFocus
                        maxLength={50}
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <X size={20} color={colors.gray} />
                            <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                        >
                            <Check size={20} color={colors.white} />
                            <Text style={[styles.buttonText, styles.saveText]}>Save Ride</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        paddingVertical: 16,
        backgroundColor: colors.lightGray,
        borderRadius: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: colors.gray,
    },
    input: {
        borderWidth: 2,
        borderColor: colors.lightGray,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        marginBottom: 24,
        backgroundColor: colors.white,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: colors.lightGray,
        borderWidth: 1,
        borderColor: colors.gray,
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelText: {
        color: colors.gray,
    },
    saveText: {
        color: colors.white,
    },
});

export default TripNameModal;