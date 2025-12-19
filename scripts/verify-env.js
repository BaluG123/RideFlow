#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Run this to verify your .env setup is correct
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Environment Setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('📝 Please copy .env.example to .env and update the values');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('✅ .env file found');

// Check required variables
const requiredVars = ['FIREBASE_WEB_CLIENT_ID'];
const foundVars = {};

envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    foundVars[key.trim()] = value.trim();
  }
});

let allGood = true;

requiredVars.forEach(varName => {
  if (foundVars[varName]) {
    if (foundVars[varName].includes('your-') || foundVars[varName].includes('placeholder')) {
      console.error(`❌ ${varName} contains placeholder value`);
      allGood = false;
    } else {
      console.log(`✅ ${varName} is set`);
    }
  } else {
    console.error(`❌ ${varName} is missing`);
    allGood = false;
  }
});

// Check Firebase Web Client ID format
if (foundVars.FIREBASE_WEB_CLIENT_ID) {
  if (!foundVars.FIREBASE_WEB_CLIENT_ID.endsWith('.apps.googleusercontent.com')) {
    console.error('❌ FIREBASE_WEB_CLIENT_ID should end with .apps.googleusercontent.com');
    allGood = false;
  }
}

// Check if .env is in .gitignore
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env')) {
    console.log('✅ .env is properly ignored by git');
  } else {
    console.warn('⚠️  .env should be added to .gitignore');
  }
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 Environment setup is PERFECT!');
  console.log('🚀 Your app is ready to run safely');
  console.log('📦 Safe to push to version control');
} else {
  console.log('❌ Environment setup needs attention');
  console.log('📝 Please fix the issues above before running the app');
  process.exit(1);
}