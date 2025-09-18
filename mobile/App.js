// mobile/App.js
import 'react-native-gesture-handler'; // 반드시 최상단
import {setupMock} from './src/shared/mocks/setupMock'
setupMock();

import './global.css'
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { QueryProvider } from './src/app/providers/QueryProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
      <QueryProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryProvider>
  );
}
