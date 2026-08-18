// [Agent Dev Mobile] - Action: App Navigator avec Gestion de l'Auth - KonGO User App
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Home, Search, Building2, User } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import AgenciesScreen from '../screens/AgenciesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SeatSelectionScreen from '../screens/SeatSelectionScreen';
import BookingExtrasScreen from '../screens/BookingExtrasScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import LiveTripScreen from '../screens/LiveTripScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_CONFIG = [
  { name: 'Home',     label: 'Accueil',   icon: Home, screen: HomeScreen },
  { name: 'Search',   label: 'Recherche', icon: Search, screen: SearchScreen },
  { name: 'Agencies', label: 'Agences',   icon: Building2, screen: AgenciesScreen },
  { name: 'Profile',  label: 'Profil',    icon: User, screen: ProfileScreen },
];

function TabIcon({ icon: Icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  const color = focused ? '#9EBA15' : '#555';
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      damping: 16,
      stiffness: 180,
      mass: 0.6,
      useNativeDriver: false,
    }).start();
  }, [focused, progress]);

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const indicatorWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 28],
  });

  const indicatorOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[styles.tabIconWrap, { transform: [{ scale: iconScale }] }]}>
        <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            width: indicatorWidth,
            opacity: indicatorOpacity,
          },
        ]}
      />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigation }) => (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const config = TAB_CONFIG.find(t => t.name === route.name)!;
            return (
              <TouchableOpacity 
                key={route.key} 
                style={styles.tabBarItem}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(route.name)}
              >
                <TabIcon icon={config.icon} label={config.label} focused={focused} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    >
      {TAB_CONFIG.map(t => (
        <Tab.Screen key={t.name} name={t.name} component={t.screen} />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8E63C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main Interface is accessible to everyone */}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="SeatSelection"
          component={SeatSelectionScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="BookingExtras"
          component={BookingExtrasScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Confirmation"
          component={ConfirmationScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="MyTickets"
          component={MyTicketsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="LiveTrip"
          component={LiveTripScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        
        {/* Auth Screens (Accessed On-Demand) */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ presentation: 'modal' }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ presentation: 'modal' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabIconWrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    color: '#9EBA15', // Darker green for text in light mode
  },
  tabIndicator: {
    height: 3,
    borderRadius: 999,
    backgroundColor: '#C8E63C',
    marginTop: 2,
  },
});
