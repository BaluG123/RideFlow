import Config from 'react-native-config';

export const validateEnvironmentVariables = () => {
  const requiredVars = ['FIREBASE_WEB_CLIENT_ID'];
  const missing: string[] = [];

  requiredVars.forEach(varName => {
    if (!Config[varName as keyof typeof Config]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please check your .env file and ensure all required variables are set.');
    return false;
  }

  console.log('✅ All required environment variables are present');
  return true;
};

export const getEnvVar = (key: keyof typeof Config, defaultValue?: string): string => {
  const value = Config[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue || '';
};