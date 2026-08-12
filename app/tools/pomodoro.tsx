import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PomodoroTimer from '../../components/PomodoroTimer';

export default function PomodoroScreen() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [chatMessage, setChatMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('Chào cậu! Tớ là MindWell AI. Tớ đã nắm được lịch học hôm nay của cậu rồi, cùng nhau tập trung nhé! 🌿');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          
          const preview = { ...userData };
          if (preview.user?.avatar) preview.user.avatar = "[ĐÃ ẨN DATA ẢNH DO QUÁ DÀI]";
          if (preview.avatar) preview.avatar = "[ĐÃ ẨN DATA ẢNH DO QUÁ DÀI]";
          console.log("📂 Dữ liệu trong kho (đã ẩn ảnh):", preview);

          setUserId(userData.user?.id || userData.user?._id || userData._id || userData.id); 
        }
      } catch (error) {
        console.error("Lỗi khi lấy ID user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChatWithAI = async () => {
    if (!chatMessage.trim()) return;
    
    setIsTyping(true);
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      const userData = JSON.parse(userDataStr || '{}');
      
      let token = userData.token || (userData.user && userData.user.token);
      if (!token) {
        token = await AsyncStorage.getItem('user_token');
      }

      if (!token) {
        console.log("❌ LỖI: Trắng tay, không có 1 cái Token nào trong máy!");
        setAiResponse("Vẫn không thấy chìa khóa (Token). Cậu vui lòng ĐĂNG XUẤT rồi ĐĂNG NHẬP lại nhé!");
        setIsTyping(false);
        return;
      }

      const res = await axios.post(
        `${API_URL}/chat`, 
        { message: chatMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAiResponse(res.data.response);
      setChatMessage('');
    } catch (error: any) {
      console.log("❌ Lỗi Chat AI:", error.response?.status || error.message);
      if (error.response?.status === 401) {
        setAiResponse("Hết hạn đăng nhập rồi (Lỗi 401)! Cậu đăng xuất ra vào lại giúp tớ nhé.");
      } else {
        setAiResponse("Tớ hơi chóng mặt, cậu thử nhắn lại sau nhé!");
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

        <View style={styles.headerWrapper}>
          <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Học Tập Cùng ChatAI</Text>
              <View style={{width: 40}} /> 
            </View>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name="stopwatch" size={60} color={Colors.light.primary} />
            </View>
          </View>

          <Text style={styles.mainTitle}>Sẵn sàng chưa?</Text>
          <Text style={styles.subTitle}>Cùng MindWell AI chinh phục mục tiêu hôm nay</Text>

          {loading ? (
             <ActivityIndicator size="large" color={Colors.light.primary} style={{marginTop: 20}} />
          ) : userId ? (
             <>
               <PomodoroTimer userId={userId} />

               <View style={styles.aiContainer}>
                 <View style={styles.aiHeader}>
                   <View style={styles.aiAvatar}>
                     <MaterialCommunityIcons name="robot-confused-outline" size={22} color={Colors.light.primary} />
                   </View>
                   <Text style={styles.aiName}>MindWell Companion</Text>
                   {isTyping && <ActivityIndicator size="small" color={Colors.light.primary} style={{marginLeft: 10}} />}
                 </View>

                 <View style={styles.aiBubble}>
                   <Text style={styles.aiText}>{aiResponse}</Text>
                 </View>

                 <View style={styles.chatInputWrapper}>
                   <TextInput
                     style={styles.chatInput}
                     placeholder="Cậu đang thấy thế nào?..."
                     placeholderTextColor="#94A3B8"
                     value={chatMessage}
                     onChangeText={setChatMessage}
                     multiline
                   />
                   <TouchableOpacity style={styles.sendBtn} onPress={handleChatWithAI}>
                     <Ionicons name="send" size={18} color="#FFF" />
                   </TouchableOpacity>
                 </View>
               </View>
             </>
          ) : (
             <Text style={{color: 'red', marginTop: 20}}>Vui lòng đăng nhập lại nhé!</Text>
          )}
          <View style={{height: 50}} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerWrapper: { backgroundColor: Colors.light.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 4 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 30 },
  iconWrapper: { marginBottom: 15 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 5 },
  subTitle: { fontSize: 14, color: '#64748B', marginBottom: 25, textAlign: 'center' },
  aiContainer: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 18, marginTop: 25, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  aiName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  aiBubble: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 18, borderBottomLeftRadius: 4, marginBottom: 15 },
  aiText: { fontSize: 14, color: '#475569', lineHeight: 21 },
  chatInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 4 },
  chatInput: { flex: 1, paddingHorizontal: 8, fontSize: 14, color: '#1E293B', maxHeight: 80 },
  sendBtn: { backgroundColor: Colors.light.primary, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});