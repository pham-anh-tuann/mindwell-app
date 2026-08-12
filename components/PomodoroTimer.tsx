import { API_URL } from '@/utils/apiConfig';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const START_GREEN = '#10B981'; 

interface PomodoroTimerProps {
  userId: string;
  taskId?: string;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ userId, taskId }) => {
  const TOTAL_WORK = 5;
  const [timeLeft, setTimeLeft] = useState(TOTAL_WORK);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = 1 - (timeLeft / TOTAL_WORK);

  const getAuthToken = async () => {
    const userDataStr = await AsyncStorage.getItem('user_data');
    const userData = JSON.parse(userDataStr || '{}');
    let token = userData.token || (userData.user && userData.user.token);
    if (!token) token = await AsyncStorage.getItem('user_token');
    return token;
  };

  const handleStart = async () => {
    if (!userId) {
      Alert.alert("Thông báo", "Đang tải dữ liệu, vui lòng thử lại!");
      return;
    }
    setShowConfetti(false);

    try {
      const token = await getAuthToken(); 
      
      const res = await axios.post(`${API_URL}/sessions/start`, 
        { userId, taskId: taskId || null, duration: 25 },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      
      setSessionId(res.data.data._id);
      setIsRunning(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Không thể kết nối đến máy chủ!";
      console.log("Lỗi Start:", errorMsg);
      Alert.alert("Thông báo", errorMsg);
    }
  };

  const handleEndSession = async (status: 'completed' | 'failed') => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (sessionId) {
      try {
        const token = await getAuthToken();

        
        await axios.put(`${API_URL}/sessions/end/${sessionId}`, 
          { status },
          { headers: { Authorization: `Bearer ${token}` } } 
        );
        
        if (status === 'completed') {
          setShowConfetti(true);
          if (confettiRef.current) confettiRef.current.start();
          Vibration.vibrate([0, 500, 500, 500]); 
          
          await axios.post(`${API_URL}/sessions/complete`, 
            { userId: userId, duration: 25, type: 'pomodoro', completedAt: new Date().toISOString() },
            { headers: { Authorization: `Bearer ${token}` } } 
          ).catch(err => console.log("Lỗi lưu phiên (404/500):", err.message));

          Alert.alert("🎉 Tuyệt vời!", "Bạn đã hoàn thành phiên học! Nghỉ ngơi 5 phút thôi!");
        } else {
          Alert.alert("Đã dừng", "Hẹn gặp lại sếp!");
        }
      } catch (e) { 
        console.log("Lỗi End API:", e); 
      }
    }
    setTimeLeft(TOTAL_WORK);
    setSessionId(null);
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleEndSession('completed');
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      
      <View style={styles.timerCard}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <TouchableOpacity 
          style={[styles.mainBtn, { backgroundColor: isRunning ? '#EF4444' : START_GREEN }]} 
          onPress={isRunning ? () => handleEndSession('failed') : handleStart}
        >
          <Text style={styles.mainBtnText}>{isRunning ? 'DỪNG LẠI' : 'BẮT ĐẦU'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        {!isRunning ? (
          <View>
            <Text style={styles.cardTitle}>Tại sao lại là Pomodoro?</Text>
            <Text style={styles.cardDesc}>Giúp não bộ duy trì sự tập trung cao độ mà không bị quá tải.</Text>
            <View style={styles.listItem}>
              <View style={styles.badge}><Text style={styles.badgeText}>25p</Text></View>
              <Text style={styles.listText}>Học tập (Tập trung tuyệt đối)</Text>
            </View>
            <View style={styles.listItem}>
              <View style={[styles.badge, {backgroundColor: '#E0F2FE'}]}><Text style={[styles.badgeText, {color: '#0284C7'}]}>5p</Text></View>
              <Text style={styles.listText}>Nghỉ ngơi (Thư giãn não bộ)</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.cardTitle}>Hành trình tập trung</Text>
            <View style={styles.pathContainer}>
              <View style={styles.trackArea}>
                <View style={styles.bgLine} />
                <View style={[styles.activeLine, { height: `${progress * 100}%` }]} />
                <View style={styles.dotStart} />
                <View style={[styles.movingIcon, { top: `${progress * 88}%` }]}>
                  <FontAwesome5 name="walking" size={16} color={START_GREEN} />
                </View>
                <View style={styles.dotEnd}><MaterialIcons name="flag" size={20} color="#EF4444" /></View>
              </View>
              <View style={styles.labelArea}>
                <View><Text style={styles.labelTitle}>Bắt đầu (0%)</Text><Text style={styles.labelSub}>Đang đi học bài...</Text></View>
                <View><Text style={styles.labelTitle}>Đích đến (100%)</Text><Text style={styles.labelSub}>Sắp được nghỉ 5 phút!</Text></View>
              </View>
            </View>
          </View>
        )}
      </View>

      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={3000}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timerCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 20, padding: 35, alignItems: 'center', marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  timerText: { fontSize: 72, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  mainBtn: { paddingVertical: 14, paddingHorizontal: 50, borderRadius: 30 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  infoCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  cardDesc: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  badge: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#059669' },
  listText: { fontSize: 15, color: '#333' },
  pathContainer: { flexDirection: 'row', height: 160, marginTop: 10 },
  trackArea: { width: 40, alignItems: 'center', marginRight: 15, position: 'relative' },
  bgLine: { width: 4, backgroundColor: '#F3F4F6', borderRadius: 2, height: '100%', position: 'absolute' },
  activeLine: { width: 4, backgroundColor: START_GREEN, borderRadius: 2, position: 'absolute', top: 0 },
  dotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: START_GREEN, position: 'absolute', top: -5 },
  dotEnd: { position: 'absolute', bottom: -10 },
  movingIcon: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  labelArea: { flex: 1, justifyContent: 'space-between', paddingVertical: 5 },
  labelTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  labelSub: { fontSize: 12, color: '#666' },
});

export default PomodoroTimer;