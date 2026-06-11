import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useStore } from '@/store/useStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadData = useStore((s) => s.loadData);
  const isLoading = useStore((s) => s.isLoading);

  useEffect(() => {
    loadData().then(() => SplashScreen.hideAsync());
  }, []);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9F9F9' },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
