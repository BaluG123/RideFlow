import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/database';
import { FirebaseService } from './src/services/firebase';
import NotificationBanner from './src/components/NotificationBanner';
import ConsentScreen from './src/screens/ConsentScreen';
import { validateEnvironmentVariables } from './src/utils/env';

const App = () => {
  const [consentAccepted, setConsentAccepted] = useState<boolean | null>(null);
  const [notification, setNotification] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    // Check if user has accepted consent
    checkConsent();
  }, []);

  const checkConsent = async () => {
    try {
      const consent = await AsyncStorage.getItem('consent_accepted');
      setConsentAccepted(consent === 'true');
      
      if (consent === 'true') {
        initializeServices();
      }
    } catch (error) {
      console.error('Error checking consent:', error);
      setConsentAccepted(false);
    }
  };

  const handleConsentAccept = () => {
    setConsentAccepted(true);
    initializeServices();
  };

  const initializeServices = async () => {
    try {
      // Validate environment variables first
      const envValid = validateEnvironmentVariables();
      if (!envValid) {
        setNotification({
          visible: true,
          title: '⚠️ Configuration Error',
          message: 'Missing environment variables. Check .env file.',
          type: 'error',
        });
        return;
      }

      // Initialize database
      initDatabase();
      
      // Initialize Firebase services
      const firebaseInitialized = await FirebaseService.initialize();
      if (firebaseInitialized) {
        console.log('🚀 All services initialized successfully');
        
        // Show welcome notification
        setNotification({
          visible: true,
          title: '🚴‍♂️ RideFlow Ready!',
          message: 'All services initialized. Ready to track your rides!',
          type: 'success',
        });
      } else {
        console.log('⚠️ Firebase initialization failed, app will work in offline mode');
        
        setNotification({
          visible: true,
          title: '⚠️ Offline Mode',
          message: 'App running in offline mode. Sign in for cloud sync.',
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('❌ Service initialization error:', error);
      
      setNotification({
        visible: true,
        title: '❌ Initialization Error',
        message: 'Some services failed to start. App may have limited functionality.',
        type: 'error',
      });
    }
  };

  // Show loading while checking consent
  if (consentAccepted === null) {
    return null; // Or a loading screen
  }

  // Show consent screen if not accepted
  if (!consentAccepted) {
    return (
      <Provider store={store}>
        <ConsentScreen onAccept={handleConsentAccept} />
      </Provider>
    );
  }

  // Show main app if consent accepted
  return (
    <Provider store={store}>
      <AppNavigator />
      <NotificationBanner
        visible={notification.visible}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onDismiss={() => setNotification(prev => ({ ...prev, visible: false }))}
        autoHide={true}
        duration={3000}
      />
    </Provider>
  );
};

export default App;
