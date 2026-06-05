import { Redirect, Tabs, useRouter } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../../src/context/AppContext';

function AddIncidentButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/ReportIncident')}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', top: -18 }}
    >
      <LinearGradient
        colors={['#2D3FE0', '#4A6CF7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#2D3FE0',
          shadowOpacity: 0.40,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <MaterialCommunityIcons name="plus" size={30} color="#ffffff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabLayout() {

  const insets = useSafeAreaInsets();
  const { isAuthenticated, isAuthHydrated } = useAppContext();

  if (!isAuthHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f6f4' }}>
        <ActivityIndicator size="large" color="#0f2f29" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/Login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4A6CF7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E8EDFF',
          height: Platform.OS === 'ios' ? 70 + insets.bottom : 75 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 5,
        },
      }}>

      <Tabs.Screen
        name="Dashboard"
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-variant" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Incidents"
        options={{
          title: 'Incidencias',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: () => <AddIncidentButton />,
        }}
      />

      <Tabs.Screen
        name="Tasks"
        options={{
          title: 'Mis tareas',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-check-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Calendar"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="Notifications"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
