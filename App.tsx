import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/database';
import { FirebaseService } from './src/services/firebase';
import NotificationBanner from './src/components/NotificationBanner';

const App = () => {
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
    // Initialize services on app start
    const initializeServices = async () => {
      try {
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

    initializeServices();
  }, []);

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
