import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'MindWellFont': require('../assets/fonts/Cormorant-BoldItalic.ttf'), 
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const navigationState = useRootNavigationState(); 

  useEffect(() => {
    if (!navigationState?.key) return;

    const checkAuth = async () => {
      try {
        //await AsyncStorage.clear();
        const token = await AsyncStorage.getItem('user_token');
        const hasSeenOnboarding = await AsyncStorage.getItem('has_seen_onboarding'); 

        const inAuthGroup = segments[0] === 'auth'; 
        const inOnboarding = segments[0] === 'onboarding'; 
        const inWelcome = segments[0] === 'welcome'; 

        if (!token) {
          if (inAuthGroup) {
            return; 
          }

          if (!hasSeenOnboarding) {
            if (!inWelcome && !inOnboarding) {
              router.replace('/welcome');
            }
          } else {
            if (!inWelcome && !inOnboarding) {
              router.replace('/auth/login');
            }
          }
        } else {
          if (inAuthGroup || inOnboarding || inWelcome) {
            router.replace('/(tabs)');
          }
        }
      } catch (error) {
        console.log("Lỗi Auth:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [segments, navigationState?.key]);

  if (!navigationState?.key || isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#047857" /> 
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} /> 
      <Stack.Screen name="onboarding" options={{ headerShown: false }} /> 
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} /> 
      <Stack.Screen name="auth/register" options={{ headerShown: false }} /> 
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} /> 
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="test" options={{ headerShown: false }} />
    </Stack>
  );
}