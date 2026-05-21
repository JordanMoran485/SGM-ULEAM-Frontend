import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../src/context/AppContext';

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
        // Color del icono y texto cuando está seleccionado
        tabBarActiveTintColor: '#b0b300', 
        // Color cuando no está seleccionado
        tabBarInactiveTintColor: '#94a3b8', 
        // Estilo de la barra de botones
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#d9e5e0',
          height: Platform.OS === 'ios' ? 70 + insets.bottom : 75 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          position: 'relative',
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={28} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="Incidents"
        options={{
          title: 'Incidencias',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Calendar"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={28} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
