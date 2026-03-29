import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import MyCoursesScreen from '../screens/MyCoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_META = {
  HomeTab: {
    label: 'Home',
    icon: 'H',
  },
  MyCoursesTab: {
    label: 'My Courses',
    icon: 'M',
  },
  ProfileTab: {
    label: 'Profile',
    icon: 'P',
  },
};

const TabIcon = ({ color, focused, routeName }) => {
  const meta = TAB_META[routeName];

  return (
    <View
      style={{
        minWidth: 44,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
      }}
    >
      <Text style={{ color, fontSize: 16, fontWeight: '800' }}>{meta.icon}</Text>
    </View>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      id="MainTabs"
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: {
          backgroundColor: '#0F172A',
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(148, 163, 184, 0.14)',
          backgroundColor: '#0F172A',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
        tabBarIcon: ({ color, focused }) => (
          <TabIcon color={color} focused={focused} routeName={route.name} />
        ),
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: TAB_META.HomeTab.label,
          tabBarLabel: TAB_META.HomeTab.label,
        }}
      />
      <Tab.Screen
        name="MyCoursesTab"
        component={MyCoursesScreen}
        options={{
          title: TAB_META.MyCoursesTab.label,
          tabBarLabel: TAB_META.MyCoursesTab.label,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: TAB_META.ProfileTab.label,
          tabBarLabel: TAB_META.ProfileTab.label,
        }}
      />
    </Tab.Navigator>
  );
}
