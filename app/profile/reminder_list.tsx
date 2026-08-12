import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, StatusBar, StyleSheet,
  Switch, Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,   
    shouldPlaySound: true,  
    shouldSetBadge: true,   
  } as any), 
});

export default function ReminderListScreen() {
  const router = useRouter();
  
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ moodCheck: true, water: false, sleep: true });

  useEffect(() => {
    loadSettings();
    fetchNotifications(); 
    requestNotificationPermission(); 
  }, []);

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Chưa cấp quyền thông báo đẩy!');
    }
  };

  const getAuthToken = async () => {
    const userDataStr = await AsyncStorage.getItem('user_data');
    const userData = JSON.parse(userDataStr || '{}');
    let token = userData.token || (userData.user && userData.user.token);
    if (!token) token = await AsyncStorage.getItem('user_token');
    return token;
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (response.ok) {
        const now = new Date();
        
        const validReminders = data.filter((item: any) => {
          const timeValue = new Date(item.time || item.createdAt);
          return isNaN(timeValue.getTime()) || timeValue <= now;
        });

        validReminders.sort((a: any, b: any) => new Date(b.time || b.createdAt).getTime() - new Date(a.time || a.createdAt).getTime());
        
        setReminders(validReminders);
      }
    } catch (error) {
      console.log("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id: string) => {
    setReminders(reminders.map(i => i._id === id ? {...i, read: true} : i));
    try {
      const token = await getAuthToken();
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) { console.log(error); }
  };

  const handleDelete = (id: string) => { 
    Alert.alert("Xóa", "Xóa tin này khỏi lịch sử?", [
      { text: "Hủy", style: "cancel" }, 
      { 
        text: "Xóa", style: "destructive",
        onPress: async () => {
          const oldReminders = [...reminders]; 
          setReminders(reminders.filter(i => i._id !== id)); 
          try {
            const token = await getAuthToken();
            await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
          } catch (error) { setReminders(oldReminders); }
        }
      }
    ]); 
  };

  const clearAll = () => {
    if (reminders.length) {
      Alert.alert("Xóa hết", "Bạn có chắc muốn dọn sạch lịch sử thông báo?", [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: async () => {
            try {
              setLoading(true); 
              const token = await getAuthToken();
              const response = await fetch(`${API_URL}/notifications/clear-all`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
              if (response.ok) setReminders([]); 
            } catch (error) { console.log(error); } finally { setLoading(false); }
          }
        }
      ]);
    }
  };

  const loadSettings = async () => {
    try {
        const savedSettings = await AsyncStorage.getItem('notification_settings');
        if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) {}
  };

  const toggleSwitch = async (key: keyof typeof settings, label: string) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));

    if (key === 'water' && newSettings.water) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Uống nước thôi sếp ơi!",
          body: "Đã 2 tiếng trôi qua rồi, nạp nước để não bộ tỉnh táo cày code nào!",
          sound: true,
        },
        trigger: { 
          seconds: 7200, 
          repeats: true 
        } as any, 
      });
      Alert.alert("Đã bật", "MindWell sẽ nhắc bạn uống nước sau mỗi 2 giờ.");
    } else if (key === 'water' && !newSettings.water) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert("Đã tắt", "Đã hủy các lời nhắc uống nước.");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'water': return { name: 'water-outline', color: '#29B6F6', bg: '#E1F5FE' };
      case 'mood': return { name: 'emoticon-happy-outline', color: '#FF7043', bg: '#FBE9E7' };
      case 'sleep': return { name: 'moon-waning-crescent', color: '#7E57C2', bg: '#EDE7F6' };
      case 'study': return { name: 'book-open-page-variant-outline', color: '#10B981', bg: '#D1FAE5' };
      default: return { name: 'bell-outline', color: Colors.light.primary, bg: '#E0F2F1' };
    }
  };

  const formatNotificationTime = (item: any) => {
    const timeValue = item.createdAt || item.time;
    
    if (timeValue === "vừa xong") {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    try {
      const d = new Date(timeValue);
      if (!isNaN(d.getTime())) {
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
    } catch (e) {}

    return timeValue; 
  };

  const renderSettingsHeader = () => (
    <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Cài đặt lời nhắc</Text>
        <View style={styles.settingCard}>
            <View style={styles.settingItem}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.miniIcon, {backgroundColor: '#FBE9E7'}]}><MaterialCommunityIcons name="emoticon-happy-outline" size={20} color="#FF7043" /></View>
                    <Text style={styles.settingText}>Check-in Cảm xúc (20:00)</Text>
                </View>
                <Switch value={settings.moodCheck} onValueChange={() => toggleSwitch('moodCheck', 'Check-in Cảm xúc')} trackColor={{ false: "#E0E0E0", true: Colors.light.primary }} thumbColor={"#FFF"} />
            </View>
            <View style={styles.separator} />
            <View style={styles.settingItem}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.miniIcon, {backgroundColor: '#E1F5FE'}]}><MaterialCommunityIcons name="water-outline" size={20} color="#29B6F6" /></View>
                    <Text style={styles.settingText}>Nhắc uống nước (9h, 13h)</Text>
                </View>
                <Switch value={settings.water} onValueChange={() => toggleSwitch('water', 'Uống nước')} trackColor={{ false: "#E0E0E0", true: Colors.light.primary }} thumbColor={"#FFF"} />
            </View>
            <View style={styles.separator} />
            <View style={styles.settingItem}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.miniIcon, {backgroundColor: '#EDE7F6'}]}><MaterialCommunityIcons name="moon-waning-crescent" size={20} color="#7E57C2" /></View>
                    <Text style={styles.settingText}>Nhắc ngủ ngon (23:00)</Text>
                </View>
                <Switch value={settings.sleep} onValueChange={() => toggleSwitch('sleep', 'Ngủ ngon')} trackColor={{ false: "#E0E0E0", true: Colors.light.primary }} thumbColor={"#FFF"} />
            </View>
        </View>

        <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Lịch sử thông báo</Text>
            {reminders.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Text style={styles.clearAllBtn}>Xóa tất cả</Text>
              </TouchableOpacity>
            )}
        </View>
    </View>
  );

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
            <Text style={styles.headerTitle}>Trung Tâm Thông Báo</Text>
            <View style={{ width: 24 }} /> 
          </View>
        </SafeAreaView>
      </View>

      <FlatList 
        data={reminders}
        keyExtractor={item => item._id} 
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={renderSettingsHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {loading ? <ActivityIndicator size="large" color={Colors.light.primary} style={{marginTop: 30}} /> : <Text style={{ color: '#999', fontSize: 16 }}>Chưa có thông báo nào!</Text>}
          </View>
        )}
        renderItem={({ item }) => {
            const iconData = getIcon(item.type);
            return (
                <View style={[styles.card, !item.read && styles.unreadCard]}>
                    <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}} onPress={() => handleRead(item._id)}>
                        <View style={[styles.iconBox, { backgroundColor: iconData.bg }]}><MaterialCommunityIcons name={iconData.name as any} size={24} color={iconData.color} /></View>
                        <View style={{flex: 1, paddingRight: 10}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                                <Text style={[styles.title, !item.read && {fontWeight: 'bold'}]} numberOfLines={1}>{item.title}</Text>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                  {!item.read && <View style={styles.dot} />}
                                  {/* 👇 ĐÃ ÁP DỤNG HÀM XỬ LÝ THỜI GIAN MỚI TẠI ĐÂY 👇 */}
                                  <Text style={styles.time}>{formatNotificationTime(item)}</Text>
                                </View>
                            </View>
                            <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}><Ionicons name="trash-outline" size={20} color="#FF8A80" /></TouchableOpacity>
                </View>
            );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerWrapper: { backgroundColor: Colors.light.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 4, zIndex: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 }, 
  sectionContainer: { padding: 20, paddingBottom: 10 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15, textTransform: 'uppercase' },
  settingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 5, elevation: 1 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  settingText: { fontSize: 16, color: '#333', marginLeft: 12, fontWeight: '500' },
  miniIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  separator: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 15 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 5 },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', textTransform: 'uppercase' },
  clearAllBtn: { color: '#FF3D00', fontSize: 13, fontWeight: 'bold', paddingVertical: 5 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 12, marginHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  unreadCard: { backgroundColor: '#F0F9F8', borderLeftWidth: 4, borderLeftColor: Colors.light.primary },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  title: { flex: 1, fontSize: 15, color: '#333', marginRight: 10 }, time: { fontSize: 12, color: '#999' },
  desc: { fontSize: 13, color: '#666', lineHeight: 18 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3D00', marginRight: 6 },
  deleteBtn: { padding: 8, marginLeft: 5, backgroundColor: '#FFEBEE', borderRadius: 12 }, emptyContainer: { alignItems: 'center', marginTop: 50, opacity: 0.8 },
});