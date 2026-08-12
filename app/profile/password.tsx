import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const router = useRouter();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ các trường mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) {
        Alert.alert("Lỗi", "Phiên đăng nhập hết hạn.");
        return;
      }

      const response = await fetch(`${API_URL}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: oldPassword, 
          newPassword: newPassword  
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Thành công", "Mật khẩu của bạn đã được thay đổi.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Thất bại", data.message || "Không thể đổi mật khẩu.");
      }

    } catch (error) {
      Alert.alert("Lỗi mạng", "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      <View style={styles.headerWrapper}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đổi Mật Khẩu</Text>
            <View style={{ width: 40 }} /> 
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={40} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              Hãy đảm bảo mật khẩu mới của bạn có độ bảo mật cao để bảo vệ dữ liệu cá nhân.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Nhập mật khẩu cũ"
                secureTextEntry={!showPasswords}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
            </View>

            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputWrapper}>
              <Feather name="key" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Nhập mật khẩu mới"
                secureTextEntry={!showPasswords}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <View style={styles.inputWrapper}>
              <Feather name="check-circle" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry={!showPasswords}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity 
              style={styles.showPassRow} 
              onPress={() => setShowPasswords(!showPasswords)}
            >
              <Feather name={showPasswords ? "eye" : "eye-off"} size={18} color={Colors.light.primary} />
              <Text style={styles.showPassText}>{showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Cập Nhật Mật Khẩu</Text>
              )}
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  
  headerWrapper: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    paddingBottom: 20, elevation: 4, zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  body: { padding: 20 },
  
  infoBox: {
    backgroundColor: '#E0F2F1',
    padding: 20, borderRadius: 16,
    alignItems: 'center', marginBottom: 25,
    borderWidth: 1, borderColor: '#B2DFDB'
  },
  infoText: { 
    textAlign: 'center', color: '#004D40', 
    fontSize: 14, marginTop: 10, lineHeight: 20 
  },

  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 15,
    borderWidth: 1, borderColor: '#E0E0E0'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },

  showPassRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginLeft: 5 },
  showPassText: { marginLeft: 8, color: Colors.light.primary, fontSize: 14, fontWeight: '600' },

  submitBtn: {
    backgroundColor: Colors.light.primary,
    height: 55, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: Colors.light.primary, shadowOpacity: 0.3, shadowRadius: 5
  },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});