import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestPlayerScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams();
  
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  
  const [hasRedFlag, setHasRedFlag] = useState(false);

  useEffect(() => {
    fetchTestDetail();
  }, [id]);

  const fetchTestDetail = async () => {
    try {
      const res = await fetch(`${API_URL}/tests/${id}`);
      const json = await res.json();
      if (json.success) {
        setTestData(json.data);
      }
    } catch (error) {
      console.log("Lỗi lấy chi tiết test:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <View style={[styles.container, styles.center]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={{marginTop: 10, color: '#666'}}>Đang tải bài Test...</Text>
        </View>
    );
  }

  if (!testData || !testData.questions || testData.questions.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="document-text-outline" size={60} color="#CCC" />
        <Text style={{marginTop: 15, color: '#666', fontSize: 16}}>Không tìm thấy dữ liệu bài test này.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20, padding: 10}}>
            <Text style={{color: Colors.light.primary, fontWeight: 'bold', fontSize: 16}}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const question = testData.questions[currentQ];
  const progress = ((currentQ + 1) / testData.questions.length) * 100;

  const handleAnswer = (score: number, isRedFlag: boolean = false) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (isRedFlag) {
      setHasRedFlag(true);
    }

    if (currentQ < testData.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishTest(newAnswers, hasRedFlag || isRedFlag);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const finishTest = (finalAnswers: number[], finalRedFlag: boolean) => {
    const totalScore = finalAnswers.reduce((a, b) => a + b, 0);
    router.replace({
      pathname: '/test/result',
      params: { 
        id: id, 
        score: totalScore, 
        title: testData.title,
        hasRedFlag: finalRedFlag ? 'true' : 'false'
      }
    });
  };

  const renderIntro = () => (
      <View style={styles.introContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
              <View style={styles.iconBox}>
                  <Ionicons name="newspaper-outline" size={60} color={Colors.light.primary} />
              </View>
              
              <Text style={styles.introTitle}>{testData.title}</Text>
              
              <View style={styles.metaRow}>
                  <View style={styles.metaBadge}>
                      <Ionicons name="list" size={16} color={Colors.light.primary} />
                      <Text style={styles.metaText}>{testData.questions.length} câu hỏi</Text>
                  </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.introSubtitle}>Mô tả bài Test</Text>
              <Text style={styles.introDesc}>
                  {testData.description || "Hãy trả lời các câu hỏi một cách trung thực nhất dựa trên cảm nhận của bạn trong 2 tuần qua. Bài test này giúp bạn đánh giá sơ bộ về tình trạng tâm lý hiện tại."}
              </Text>
              
              <View style={styles.warningBox}>
                  <Ionicons name="information-circle" size={20} color="#F57C00" />
                  <Text style={styles.warningText}>LƯU Ý: Kết quả chỉ mang tính chất tham khảo, không thay thế cho chẩn đoán y khoa.</Text>
              </View>
          </ScrollView>

          <View style={styles.bottomFooter}>
              <TouchableOpacity style={styles.startBtn} onPress={() => setHasStarted(true)} activeOpacity={0.8}>
                  <Text style={styles.startBtnText}>Bắt đầu làm bài</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}} />
              </TouchableOpacity>
          </View>
      </View>
  );

  const renderQuiz = () => (
      <View style={styles.quizContainer}>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>Câu hỏi {currentQ + 1} / {testData.questions.length}</Text>
          <View style={styles.track}><View style={[styles.bar, { width: `${progress}%` }]} /></View>
        </View>

       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.questionCard}>
              <Text style={styles.questionText}>{question.questionText}</Text>
          </View>
          
          <View style={{height: 15}} />

          {question.options.map((opt: any, index: number) => (
            <TouchableOpacity 
              key={index} 
              style={styles.optionButton}
              activeOpacity={0.7}
              onPress={() => handleAnswer(opt.score, opt.isRedFlag)}
            >
              <Text style={styles.optionText}>{opt.optionText}</Text>
              <View style={styles.radioCircle} />
            </TouchableOpacity>
          ))}

          {currentQ > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      <View style={styles.headerWrapper}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
                onPress={() => {
                    if (hasStarted && currentQ > 0) {
                        Alert.alert('Thoát bài test?', 'Dữ liệu đang làm sẽ bị mất.', [
                            { text: 'Ở lại', style: 'cancel'}, 
                            { text: 'Thoát', onPress: () => router.back(), style: 'destructive'}
                        ]);
                    } else {
                        router.back();
                    }
                }} 
                style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle} numberOfLines={1}>
                {!hasStarted ? "Thông tin bài Test" : title}
            </Text>
            <View style={{width: 40}} /> 
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
          {!hasStarted ? renderIntro() : renderQuiz()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerWrapper: { backgroundColor: Colors.light.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 4, zIndex: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  body: { flex: 1 },
  introContainer: { flex: 1, padding: 24 },
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 10, marginBottom: 25 },
  introTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20, lineHeight: 32 },
  metaRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 25 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05 },
  metaText: { fontSize: 14, fontWeight: '600', color: Colors.light.primary, marginLeft: 6 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 20 },
  introSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  introDesc: { fontSize: 15, color: '#555', lineHeight: 24, textAlign: 'justify', marginBottom: 20 },
  warningBox: { flexDirection: 'row', backgroundColor: '#FFF3E0', padding: 15, borderRadius: 12, alignItems: 'center' },
  warningText: { flex: 1, fontSize: 13, color: '#E65100', marginLeft: 10, lineHeight: 20 },
  bottomFooter: { paddingVertical: 15, backgroundColor: '#F5F7FA' },
  startBtn: { backgroundColor: Colors.light.primary, flexDirection: 'row', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: Colors.light.primary, shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4} },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  quizContainer: { flex: 1, paddingHorizontal: 20 },
  progressSection: { marginTop: 20, marginBottom: 15 },
  progressText: { fontSize: 14, color: '#888', marginBottom: 10, fontWeight: 'bold', textAlign: 'right' },
  track: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: Colors.light.primary, borderRadius: 4 },
  scrollContent: { paddingBottom: 40, paddingTop: 10 },
  questionCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#333', lineHeight: 30 },
  optionButton: { backgroundColor: '#FFF', paddingVertical: 18, paddingHorizontal: 20, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: '#E8E8E8' },
  optionText: { flex: 1, fontSize: 16, color: '#444', fontWeight: '500', marginRight: 15, lineHeight: 22 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.light.primary },
   backButton: { marginTop: 15, width: 46, height: 46, borderRadius: 23, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
});