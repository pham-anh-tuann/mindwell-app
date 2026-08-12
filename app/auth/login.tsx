import { Colors } from '@/constants/Colors';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../utils/apiConfig';

export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email.trim() || !password.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Email và Mật khẩu');
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('user_token', data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data)); 
        
        router.replace('/(tabs)');
      } else {
        Alert.alert('Đăng nhập thất bại', data.message || 'Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error) {
      console.error("[Login Error]:", error);
      Alert.alert(
        'Lỗi kết nối', 
        `Không thể kết nối tới server (${API_URL}). Vui lòng kiểm tra lại Wifi/4G hoặc IP config!`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1}}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
          
          <SafeAreaView style={styles.header}>
            <View style={styles.logoContainer}>
               <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="leaf" size={40} color="#FFF" />
               </View>
               <Text style={styles.logoText}>MindWell</Text>
            </View>
          </SafeAreaView>

          <View style={styles.content}>
            <Text style={styles.title}>Chào mừng trở lại!</Text>
            <Text style={styles.subTitle}>Đăng nhập để tiếp tục hành trình chăm sóc tâm trí của bạn.</Text>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Mật khẩu"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.rowBetween}>
                <TouchableOpacity 
                  style={styles.rememberBox} 
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <Ionicons 
                    name={rememberMe ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={rememberMe ? Colors.light.primary : "#666"} 
                  />
                  <Text style={styles.rememberText}>Ghi nhớ tôi</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Đăng Nhập</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text style={styles.registerLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { alignItems: 'center', marginTop: 40 },
  logoContainer: { alignItems: 'center' },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: Colors.light.primary, shadowOpacity: 0.3, shadowRadius: 8 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: Colors.light.primary, marginTop: 10, letterSpacing: 1 },
  content: { paddingHorizontal: 30, paddingTop: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subTitle: { fontSize: 15, color: '#777', textAlign: 'center', marginTop: 8, lineHeight: 22, marginBottom: 35 },
  form: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  rememberBox: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { marginLeft: 8, color: '#666', fontSize: 14 },
  forgotText: { color: Colors.light.primary, fontSize: 14, fontWeight: '600' },
  loginBtn: { backgroundColor: Colors.light.primary, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: Colors.light.primary, shadowOpacity: 0.3, shadowRadius: 5 },
  loginBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 40 },
  footerText: { color: '#666', fontSize: 15 },
  registerLink: { color: Colors.light.primary, fontSize: 15, fontWeight: 'bold' }
});