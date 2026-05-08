// app/_layout.js

import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/context/AppContext';

export default function RootLayout() {


  return (



    <SafeAreaProvider>
      <AppProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* <Stack.Screen name="Login" />
            <Stack.Screen name="Register" /> */}
          </Stack>
        </PaperProvider>
      </AppProvider>
    </SafeAreaProvider>

  );

}
