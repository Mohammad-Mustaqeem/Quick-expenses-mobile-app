import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useStore } from '@/store/useStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ── Root error boundary — catches JS errors that would otherwise crash silently ──
interface EBState { error: Error | null }
class RootErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Something went wrong</Text>
          <Text style={eb.message}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
const eb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F9F9F9' },
  title:     { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  message:   { fontSize: 13, color: '#787776', textAlign: 'center' },
});

function RootLayout() {
  const loadData = useStore((s) => s.loadData);
  const isLoading = useStore((s) => s.isLoading);

  useEffect(() => {
    loadData()
      .then(() => SplashScreen.hideAsync())
      .catch(() => SplashScreen.hideAsync());
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

export default function Layout() {
  return (
    <RootErrorBoundary>
      <RootLayout />
    </RootErrorBoundary>
  );
}
