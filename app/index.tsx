import React from 'react';
import { Redirect } from 'expo-router';
import { useAppContext } from '../src/context/AppContext';

let splashShown = false;

export default function Index() {
  const { isAuthenticated, isAuthHydrated } = useAppContext();

  if (!isAuthHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/Dashboard" />;
  }

  if (!splashShown) {
    splashShown = true;
    return <Redirect href="/Splash" />;
  }

  return <Redirect href="/Login" />;
}
