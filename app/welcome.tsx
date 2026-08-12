import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLoginJump = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <Image 
        source={require('../assets/images/welcome_bg.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={3} 
      />
      
      <View style={styles.overlay} />

      <SafeAreaView style={styles.contentWrapper}>
        <View style={styles.centerContent}>
          <MaterialCommunityIcons 
            name="leaf" 
            size={130} 
            color="#047857" 
            style={styles.logoIcon} 
          />
          <Text style={styles.title}>MindWell</Text>
          <Text style={styles.subtitle}>Đồng hành cùng sức khỏe tinh thần bạn</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.startButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/onboarding')} 
          >
            <Text style={styles.startButtonText}>Bắt đầu hành trình</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLoginJump}
          >
            <Text style={styles.loginButtonText}>
              Đã có tài khoản? <Text style={{fontWeight: 'bold'}}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backgroundImage: { position: 'absolute', width: width, height: height },
  overlay: { position: 'absolute', width: width, height: height, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  contentWrapper: { flex: 1, justifyContent: 'space-between', zIndex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logoIcon: { transform: [{ rotate: '-15deg' }], marginBottom: 10 },
  title: {
    fontSize: 72, 
    color: '#047857', 
    fontFamily: 'MindWellFont', 
    fontWeight: '400',
    letterSpacing: -1,
    textShadowColor: 'rgba(22, 91, 74, 0.15)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: '#2F4F4F', 
    fontFamily: 'MindWellFont',
    textAlign: 'center',
    marginTop: -5,
  },
  footer: { paddingHorizontal: 30, paddingBottom: 40, alignItems: 'center' },
  startButton: {
    backgroundColor: '#047857',
    width: '100%',
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
  },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  loginButton: { paddingVertical: 10 },
  loginButtonText: { fontSize: 15, color: '#047857' },
});