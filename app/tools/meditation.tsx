import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeditationTimerScreen() {
  const router = useRouter();
  
  const [totalSeconds, setTotalSeconds] = useState(300); 
  const [currentSeconds, setCurrentSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    async function configureAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true, 
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: true,
          staysActiveInBackground: true,
        });
      } catch (e) { console.log(e); }
    }
    configureAudio();

    return () => {
      stopTimer(); 
      unloadSound();
    };
  }, []);

  useEffect(() => {
    if (isRunning && currentSeconds <= 0) {
      stopTimer(); 
      Alert.alert("Hoàn thành 🌿", "Bạn đã hoàn thành phiên thiền. Thật tuyệt vời! 🧘‍♂️");
    }
  }, [currentSeconds, isRunning]);

  const startTimer = async () => {
    setIsRunning(true);
    await playSound(); 

    timerRef.current = setInterval(() => {
      setCurrentSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const stopTimer = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    await stopSound();
  };

  const toggleTimer = () => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const resetTimer = (minutes: number) => {
    stopTimer();
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setCurrentSeconds(seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playSound = async () => {
    try {
      if (soundRef.current) {
        try {
           await soundRef.current.unloadAsync();
        } catch(e) {}
        soundRef.current = null;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
         require('@/assets/sounds/meditation.mp3'),
         { shouldPlay: true, isLooping: true }
      );
      soundRef.current = newSound;
    } catch (e) { 
      console.log('Lỗi play:', e); 
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.stopAsync();
        }
      } catch (e) {}
    }
  };

  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null; 
    }
  };

  const TimeButton = ({ minutes }: { minutes: number }) => {
    const isSelected = totalSeconds === minutes * 60;
    return (
      <TouchableOpacity 
        style={[styles.timeBtn, isSelected && styles.timeBtnSelected]}
        onPress={() => resetTimer(minutes)}
        disabled={isRunning} 
      >
        <Text style={[styles.timeBtnText, isSelected && { color: '#FFF' }]}>{minutes} phút</Text>
      </TouchableOpacity>
    );
  };

  const InstructionStep = ({ number, title, desc }: any) => (
    <View style={styles.stepRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNum}>{number}</Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
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
            <Text style={styles.headerTitle}>Thiền Định</Text>
            <View style={{width: 40}} /> 
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
                <Text style={styles.timerText}>{formatTime(currentSeconds)}</Text>
                <Text style={styles.timerLabel}>{isRunning ? 'Đang thiền...' : 'Sẵn sàng'}</Text>
            </View>
        </View>

        <View style={styles.controls}>
            <TouchableOpacity 
                style={[styles.playBtn, isRunning && { backgroundColor: '#c12121' }]} 
                onPress={toggleTimer}
            >
                <Ionicons name={isRunning ? "pause" : "play"} size={32} color="#FFF" />
                <Text style={styles.playBtnText}>{isRunning ? "Dừng Lại" : "Bắt Đầu"}</Text>
            </TouchableOpacity>
        </View>

        {!isRunning && (
            <View style={styles.timeSelection}>
                <TimeButton minutes={5} />
                <TimeButton minutes={10} />
                <TimeButton minutes={15} />
            </View>
        )}

        <View style={{height: 20}} />

        <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Hướng Dẫn Thiền Cơ Bản</Text>
            <View style={styles.divider} />

            <InstructionStep number="1" title="Chọn tư thế thoải mái" desc="Ngồi thẳng lưng trên ghế hoặc sàn, thả lỏng vai và tay." />
            <InstructionStep number="2" title="Tập trung hơi thở" desc="Nhắm mắt lại, hít sâu bằng mũi và thở ra nhẹ nhàng." />
            <InstructionStep number="3" title="Quan sát suy nghĩ" desc="Nếu tâm trí đi lang thang, hãy nhẹ nhàng đưa nó quay lại hơi thở." />
            <InstructionStep number="4" title="Kết thúc nhẹ nhàng" desc="Khi chuông reo, từ từ mở mắt và cảm nhận sự thư thái." />
        </View>
        <View style={{height: 30}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerWrapper: { backgroundColor: Colors.light.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 4, zIndex: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  timerContainer: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  timerCircle: { width: 260, height: 260, borderRadius: 130, borderWidth: 8, borderColor: 'rgba(0, 77, 64, 0.1)', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: Colors.light.primary, shadowOpacity: 0.2 },
  timerText: { fontSize: 60, fontWeight: 'bold', color: Colors.light.primary, fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 16, color: '#888', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1 },
  controls: { alignItems: 'center', marginBottom: 25 },
  playBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.3 },
  playBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  timeSelection: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 10 },
  timeBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: Colors.light.primary, backgroundColor: '#FFF' },
  timeBtnSelected: { backgroundColor: Colors.light.primary },
  timeBtnText: { color: Colors.light.primary, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  stepRow: { flexDirection: 'row', marginBottom: 18 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 0 },
  stepNum: { fontWeight: 'bold', color: Colors.light.primary, fontSize: 16 },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
});