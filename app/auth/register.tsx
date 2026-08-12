import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { API_URL } from '../../utils/apiConfig';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const data = await AsyncStorage.getItem('temp_onboarding');
        if (data) {
          setOnboardingData(JSON.parse(data));
        }
      } catch (error) {
        console.error("Lỗi đọc hành lý:", error);
      }
    };
    fetchSurvey();
  }, []);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    const missingRules = [];
    if (password.length < 6) missingRules.push("• Ít nhất 6 ký tự");
    if (!/[A-Z]/.test(password)) missingRules.push("• 1 chữ hoa (A-Z)");
    if (!/[a-z]/.test(password)) missingRules.push("• 1 chữ thường (a-z)");
    if (!/\d/.test(password)) missingRules.push("• 1 chữ số (0-9)");
    if (!/[\W_]/.test(password)) missingRules.push("• 1 ký tự đặc biệt (@, !, #,...)");

    if (missingRules.length > 0) {
      Alert.alert("Mật khẩu chưa đạt yêu cầu", "Mật khẩu của bạn còn thiếu:\n\n" + missingRules.join("\n"));
      return; 
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName, 
          email: email,
          password: password,
          onboarding: onboardingData || {} 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.removeItem('temp_onboarding');
        Alert.alert("Thành công 🎉", "Tài khoản đã được tạo! Bạn hãy đăng nhập để bắt đầu nhé.", [
          { text: "Đăng nhập ngay", onPress: () => router.replace('/auth/login') }
        ]);
      } else {
        Alert.alert("Đăng ký thất bại", data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      Alert.alert("Lỗi mạng", "Không thể kết nối đến Server. Vui lòng kiểm tra lại.");
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
            <View style={styles.logoContainer}>
               <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="leaf" size={45} color="#FFF" />
               </View>
               <Text style={styles.logoText}>MindWell</Text>
            </View>
          </SafeAreaView>

          <View style={styles.content}>
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subTitle}>Tham gia cùng MindWell để bắt đầu hành trình chăm sóc bản thân.</Text>

            {/* 👇 ĐÂY RỒI SẾP ƠI: HỘP THÔNG BÁO "ĐỌC VỊ" LÊN SÓNG */}
            {onboardingData && onboardingData[1] && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🌿 MindWell đã sẵn sàng hỗ trợ bạn 
                  <Text style={{fontWeight: 'bold', color: '#1B6A5B'}}>
                    {onboardingData[1] === 'stress' ? ' giảm áp lực học tập' : 
                     onboardingData[1] === 'sleep' ? ' cải thiện giấc ngủ' : 
                     onboardingData[1] === 'emotion' ? ' kiểm soát cảm xúc' : ' chữa lành tâm hồn'}
                  </Text>.
                </Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Họ và tên" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
              </View>

              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>

              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Mật khẩu" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Feather name="shield" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Xác nhận mật khẩu" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.registerBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerBtnText}>Đăng Ký</Text>}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                  <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
  header: { alignItems: 'center', marginTop: 30 },
  logoContainer: { alignItems: 'center' },
  logoCircle: {
    width: 85, height: 85, borderRadius: 45,
    backgroundColor: '#047857',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2
  },
  logoText: { fontSize: 26, fontWeight: 'bold', color: '#1B6A5B', marginTop: 10 },
  
  content: { paddingHorizontal: 30, paddingTop: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subTitle: { fontSize: 14, color: '#777', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },

  infoBox: { 
    backgroundColor: '#E8F3F1', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#CBE5DF'
  },
  infoText: { color: '#333', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F8F9',
    borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 15,
    borderWidth: 1, borderColor: '#EEE'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },

  registerBtn: {
    backgroundColor: '#047857',
    height: 55, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 10, elevation: 4
  },
  registerBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25, marginBottom: 30 },
  footerText: { color: '#666', fontSize: 14 },
  loginLink: { color: '#047857', fontSize: 14, fontWeight: 'bold' }
});