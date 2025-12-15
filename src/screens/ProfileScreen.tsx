import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateProfile, logout } from '../store/userSlice';
import { colors } from '../theme/colors';
import { Camera, User } from 'lucide-react-native';

const ProfileScreen = () => {
    const dispatch = useDispatch();
    const { profile, isGuest } = useSelector((state: RootState) => state.user);
    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || '');

    const handleSave = () => {
        if (!name || !email) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        dispatch(updateProfile({ name, email }));
        Alert.alert('Success', 'Profile Updated');
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <User size={50} color={colors.white} />
                    </View>
                    <TouchableOpacity style={styles.cameraButton}>
                        <Camera size={20} color={colors.white} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerText}>{isGuest ? 'Guest User' : name}</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Profile</Text>
                </TouchableOpacity>

                {!isGuest && (
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Log Out</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        paddingVertical: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.white,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.secondary,
        padding: 8,
        borderRadius: 20,
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.white,
    },
    form: {
        padding: 20,
        marginTop: 20,
    },
    label: {
        color: colors.gray,
        marginBottom: 5,
        marginLeft: 5,
    },
    input: {
        backgroundColor: colors.white,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButton: {
        marginTop: 20,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.error,
    },
    logoutButtonText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default ProfileScreen;
