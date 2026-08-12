import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../utils/apiConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ name: 'Đang tải...', email: '...', avatar: null });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('user_token');
      
      if (!token) {
        setUserInfo({ name: 'Khách', email: 'Vui lòng đăng nhập', avatar: null });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setUserInfo({ 
          name: data.name || 'Người dùng', 
          email: data.email || 'Chưa cập nhật',
          avatar: data.avatar || null 
        });
        await AsyncStorage.setItem('user_data', JSON.stringify(data));
      }
    } catch (e) { 
      console.log("Lỗi:", e); 
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Đồng ý', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user_data');
          await AsyncStorage.removeItem('user_token');
          router.replace('/auth/login'); 
        } 
      }
    ]);
  };

  const renderMenuItem = (icon: any, title: string, route: string, isDestructive = false) => (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={() => route === 'logout' ? handleLogout() : router.push(route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, isDestructive && { backgroundColor: '#FFEBEE' }]}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#D32F2F' : Colors.light.primary} />
      </View>
      <Text style={[styles.menuText, isDestructive && { color: '#D32F2F' }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#E0E0E0" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />
      
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            
            {/* 👇 KHU VỰC AVATAR ĐÃ ĐƯỢC SỬA */}
            <View style={styles.avatarContainer}>
              {loading ? (
                <ActivityIndicator color={Colors.light.primary} />
              ) : (
                userInfo.avatar ? (
                    <Image 
                        source={{ uri: userInfo.avatar }} 
                        style={styles.avatarImage} 
                    />
                ) : (
                    <Ionicons name="person" size={30} color={Colors.light.primary} />
                )
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{userInfo.name}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{userInfo.email}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => router.push('/profile/edit')}
            >
              <MaterialIcons name="edit" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.card}>
            {renderMenuItem('person-outline', 'Chỉnh sửa hồ sơ', '/profile/edit')}
            <View style={styles.divider} />
            {renderMenuItem('lock-closed-outline', 'Đổi mật khẩu', '/profile/password')}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          <View style={styles.card}>
            {renderMenuItem('notifications-outline', 'Cài đặt chung', '/profile/notification')}
            <View style={styles.divider} />
            {renderMenuItem('information-circle-outline', 'Về ứng dụng', '/profile/about')}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#D32F2F" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>MindWell App • Phiên bản 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: Colors.light.primary,
    paddingBottom: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2,
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10
  },
  avatarContainer: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1,
    overflow: 'hidden' 
  },
  avatarImage: {
    width: '100%', height: '100%', resizeMode: 'cover'
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  editButton: {
    padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  bodyContent: { padding: 16, paddingTop: 25 },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 10, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#FFF', borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  iconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F0F4F4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 65 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFEBEE', elevation: 1 },
  logoutText: { color: '#D32F2F', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  versionText: { textAlign: 'center', color: '#BBB', fontSize: 12, marginTop: 10, marginBottom: 30 },
});