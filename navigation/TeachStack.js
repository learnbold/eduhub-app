import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeachDashboardScreen from '../screens/TeachDashboardScreen';
import TeachBatchScreen from '../screens/TeachBatchScreen';

const Stack = createNativeStackNavigator();

export default function TeachStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#0B1120',
        },
      }}
    >
      <Stack.Screen name="TeachDashboard" component={TeachDashboardScreen} />
      <Stack.Screen name="TeachBatch" component={TeachBatchScreen} />
    </Stack.Navigator>
  );
}
