import React from 'react';
import { Redirect } from 'expo-router';
import { useAppContext } from '../src/context/AppContext';

export default function Index() {
  const { isAuthenticated, isAuthHydrated } = useAppContext();

  if (!isAuthHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/Dashboard" />;
  }

  return <Redirect href="/Login" />;
}
