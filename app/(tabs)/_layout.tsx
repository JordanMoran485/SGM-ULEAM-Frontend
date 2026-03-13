import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {

  const insets = useSafeAreaInsets();


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
          borderTopWidth: 20,
          height: Platform.OS === 'ios' ? 70 + insets.bottom : 75 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          position: 'absolute', // Hace que la barra parezca flotar
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