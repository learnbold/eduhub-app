import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeStack from './HomeStack';
import ExploreScreen from '../screens/ExploreScreen';
import MyCoursesScreen from '../screens/MyCoursesScreen';
import TeachScreen from '../screens/TeachScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

const TAB_META = {
  HomeTab: {
    label: 'Home',
    iconName: 'home-outline',
    activeIconName: 'home',
  },
  ExploreTab: {
    label: 'Explore',
    iconName: 'search-outline',
    activeIconName: 'search',
  },
  MyCoursesTab: {
    label: 'My Learning',
    iconName: 'play-circle-outline',
    activeIconName: 'play-circle',
  },
  TeachTab: {
    label: 'Teach',
    iconName: 'create-outline',
    activeIconName: 'create',
  },
  ProfileTab: {
    label: 'Profile',
    iconName: 'person-outline',
    activeIconName: 'person',
  },
};

const TabIcon = ({ color, focused, routeName }) => {
  const meta = TAB_META[routeName];
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={focused ? meta.activeIconName : meta.iconName}
        size={24}
        color={color}
      />
    </Animated.View>
  );
};

export default function TabNavigator() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

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
        name="ExploreTab"
        component={ExploreScreen}
        options={{
          title: TAB_META.ExploreTab.label,
          tabBarLabel: TAB_META.ExploreTab.label,
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
      {isTeacher && (
        <Tab.Screen
          name="TeachTab"
          component={TeachScreen}
          options={{
            title: TAB_META.TeachTab.label,
            tabBarLabel: TAB_META.TeachTab.label,
          }}
        />
      )}
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
