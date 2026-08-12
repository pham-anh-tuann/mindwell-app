import { API_URL } from '@/utils/apiConfig';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Thông báo", "Vui lòng nhập email đã đăng ký tài khoản.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Thành công", 
          "Chúng tôi đã gửi mã xác nhận/hướng dẫn vào email của bạn.",
          [{ text: "OK", onPress: () => router.push('/auth/login') }]
        );
      } else {
        Alert.alert("Lỗi", data.message || "Email không tồn tại trong hệ thống.");
      }
    } catch (error) {
      Alert.alert("Lỗi kết nối", "Server Render có thể đang ngủ, sếp đợi tí thử lại nhé!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1}}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
          
          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#1B6A5B" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
               <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="leaf" size={45} color="#FFF" />
               </View>
               <Text style={styles.logoText}>MindWell</Text>
            </View>
          </SafeAreaView>

          <View style={styles.content}>
            <Text style={styles.title}>Quên mật khẩu?</Text>
            <Text style={styles.subTitle}>
              Đừng lo lắng! Hãy nhập Email đã đăng ký, chúng tôi sẽ giúp bạn lấy lại mật khẩu.
            </Text>

            <View style={styles.form}>
              {/* Ô nhập Email */}
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Nhập email của bạn"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity 
                style={[styles.resetBtn, loading && { opacity: 0.7 }]} 
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.resetBtnText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.footer}
                onPress={() => router.back()}
              >
                <Text style={styles.footerText}>Quay lại </Text>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>

        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginTop: 10 },
  
  logoContainer: { alignItems: 'center', marginTop: 10 },
  logoCircle: {
    width: 85, height: 85, borderRadius: 45,
    backgroundColor: '#047857', 
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2
  },
  logoText: { fontSize: 26, fontWeight: 'bold', color: '#047857', marginTop: 10 },
  
  content: { paddingHorizontal: 30, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subTitle: { fontSize: 15, color: '#777', textAlign: 'center', marginTop: 10, marginBottom: 40, lineHeight: 22 },

  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F8F9', 
    borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 25,
    borderWidth: 1, borderColor: '#EEE'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },

  resetBtn: {
    backgroundColor: '#047857', 
    height: 55, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4
  },
  resetBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#666', fontSize: 15 },
  loginLink: { color: '#047857', fontSize: 15, fontWeight: 'bold' }
});