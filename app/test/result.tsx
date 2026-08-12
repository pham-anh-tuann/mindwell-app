import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestResultScreen() {
  const router = useRouter();
  
  const params = useLocalSearchParams();
  const score = parseInt(params.score as string || '0');
  const title = params.title as string || 'Kết Quả Đánh Giá';
  const id = params.id as string || 'unknown'; 
  const hasRedFlag = params.hasRedFlag === 'true'; 

  const [isSaving, setIsSaving] = useState(true);

  const isPSQI = title.includes('PSQI') || title.toLowerCase().includes('giấc ngủ');
  
  let resultText = '';
  let adviceText = '';
  let resultColor = '#4CAF50';
  let isGood = true;

  if (hasRedFlag) {
      resultText = "CẦN LƯU Ý ĐẶC BIỆT 🚨";
      adviceText = "MindWell nhận thấy bạn đang mang những suy nghĩ rất nặng nề và mệt mỏi. Đừng ôm đồm một mình nhé, hãy liên hệ ngay cho chuyên gia hoặc hotline tâm lý học đường để được lắng nghe và hỗ trợ.";
      resultColor = '#cf1322'; 
      isGood = false;
  } else if (isPSQI) {
      isGood = score <= 5;
      resultText = isGood ? 'Giấc ngủ TỐT' : 'Giấc ngủ KÉM';
      adviceText = isGood 
        ? 'Tuyệt vời! Hãy duy trì thói quen sinh hoạt điều độ nhé.' 
        : 'Bạn nên thử các bài tập thư giãn, hạn chế caffeine và thiết lập giờ ngủ cố định.';
      resultColor = isGood ? '#4CAF50' : '#F44336'; 
  } else {
      if (score <= 10) {
          resultText = "Tâm trạng ỔN ĐỊNH";
          adviceText = "Tinh thần bạn đang rất tốt. Hãy tiếp tục duy trì những thói quen tích cực nhé!";
          resultColor = '#4CAF50'; 
          isGood = true;
      } else if (score <= 20) {
          resultText = "Mức độ CẦN LƯU Ý";
          adviceText = "Bạn đang có chút áp lực và mỏi mệt. Hãy dành thêm thời gian thư giãn và hít thở sâu.";
          resultColor = '#FFC107'; 
          isGood = true; 
      } else {
          resultText = "Mức độ ĐÁNG LO NGẠI";
          adviceText = "Bạn đang gặp rất nhiều căng thẳng. Đừng ngại chia sẻ với MindWell AI hoặc chuyên gia để được hỗ trợ nhé.";
          resultColor = '#F44336'; 
          isGood = false;
      }
  }

  useEffect(() => {
    const saveResultToDB = async () => {
        try {
            const token = await AsyncStorage.getItem('user_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/test-results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    testId: id,
                    testTitle: title,
                    score: score,
                    result: resultText,
                    isRedFlag: hasRedFlag 
                })
            });
            console.log("✅ Đã lưu kết quả bài test!");
        } catch (error) {
            console.log("❌ Lỗi lưu bài test:", error);
        } finally {
            setIsSaving(false);
        }
    };

    saveResultToDB();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        router.dismissAll(); 
        return true;
    });
    return () => backHandler.remove();

  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <TouchableOpacity style={styles.closeButton} onPress={() => router.dismissAll()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>

        <View style={{height: 20}} />

        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.subTitle}>Kết quả phân tích từ MindWell</Text>

        <View style={{height: 40}} />

        <View style={[styles.scoreCircle, { borderColor: resultColor }]}>
          <Text style={styles.scoreLabel}>Tổng Điểm</Text>
          <Text style={[styles.scoreValue, { color: resultColor }]}>{score}</Text>
        </View>

        <View style={{height: 30}} />

        <View style={styles.resultCard}>
          {isSaving ? (
             <ActivityIndicator color={Colors.light.primary} style={{marginBottom: 20}} />
          ) : (
            <>
                <Ionicons 
                    name={isGood ? "checkmark-circle" : "warning"} 
                    size={50} 
                    color={resultColor} 
                    style={{marginBottom: 10}}
                />
                <Text style={[styles.resultTitle, { color: resultColor }]}>
                    {resultText}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.adviceText}>
                    {adviceText}
                </Text>
            </>
          )}
        </View>

        <View style={{height: 40}} />

       <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            router.dismissAll(); 
            router.push({
              pathname: '/(tabs)/chat',
              params: {
                autoChat: 'true', 
                testTitle: title,
                testScore: score,
                testResult: resultText
              }
            });
          }} 
        >
          <Text style={styles.primaryButtonText}>Nhận lời khuyên từ AI</Text>
          <Ionicons name="chatbubbles-outline" size={20} color="#FFF" style={{marginLeft: 8}} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.dismissAll()} 
        >
          <Text style={styles.secondaryButtonText}>Quay về</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { padding: 20, alignItems: 'center' },
  closeButton: { alignSelf: 'flex-end', padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subTitle: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' },
  scoreCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: {width: 0, height: 4} },
  scoreLabel: { fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue: { fontSize: 50, fontWeight: 'bold' },
  resultCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 20, padding: 25, alignItems: 'center', minHeight: 150, justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: {width: 0, height: 2} },
  resultTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  divider: { width: '80%', height: 1, backgroundColor: '#EEE', marginBottom: 15 },
  adviceText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  primaryButton: { backgroundColor: Colors.light.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 16, borderRadius: 12, marginBottom: 15, elevation: 3 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { paddingVertical: 15, width: '100%', alignItems: 'center' },
  secondaryButtonText: { color: '#666', fontSize: 16, fontWeight: '500' }
});