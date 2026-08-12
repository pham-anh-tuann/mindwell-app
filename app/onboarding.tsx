import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const MINDWELL_GREEN = '#047857';

const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    title: "Chào bạn 👋\nChào mừng đến với ", 
    subtitle: "Mục tiêu lớn nhất của bạn khi đến đây là gì?",
    options: [
      { id: 'stress', text: 'Giảm áp lực học tập & thi cử', icon: 'book-open-variant' },
      { id: 'sleep', text: 'Cải thiện giấc ngủ', icon: 'moon-waning-crescent' },
      { id: 'emotion', text: 'Kiểm soát cảm xúc tốt hơn', icon: 'heart-pulse' },
      { id: 'talk', text: 'Cần một người lắng nghe', icon: 'comment-quote' },
    ]
  },
  {
    id: 2,
    title: "MindWell",
    subtitle: "Dạo gần đây, mức độ căng thẳng của bạn ở mức nào?",
    options: [
      { id: 'chill', text: 'Khá ổn, mình đang tận hưởng', icon: 'emoticon-happy-outline' },
      { id: 'medium', text: 'Thỉnh thoảng thấy quá tải', icon: 'battery-50' },
      { id: 'high', text: 'Căng như dây đàn, mệt mỏi', icon: 'battery-alert' },
    ]
  },
  {
    id: 3,
    title: "Chỉ một câu nữa thôi 🚀",
    subtitle: "Bạn muốn MindWell hỗ trợ bạn bằng cách nào nhất?",
    options: [
      { id: 'ai', text: 'Trò chuyện với trợ lý AI', icon: 'robot-outline' },
      { id: 'test', text: 'Làm bài kiểm tra tâm lý', icon: 'clipboard-text-outline' },
      { id: 'read', text: 'Đọc mẹo chữa lành', icon: 'leaf' },
    ]
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});

  const currentQ = ONBOARDING_QUESTIONS[currentStep];

  const handleSelect = (optionId: string) => {
    const newAnswers = { ...answers, [currentQ.id]: optionId };
    setAnswers(newAnswers);
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      finishOnboarding(newAnswers); 
    }
  };

  const finishOnboarding = async (finalData?: any) => {
    try {
      const dataToSave = (finalData && !finalData.nativeEvent) ? finalData : answers;
      await AsyncStorage.setItem('temp_onboarding', JSON.stringify(dataToSave));
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      router.replace('/auth/register'); 
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* HEADER */}
      <View style={styles.header}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={() => setCurrentStep(currentStep - 1)}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#333" />
          </TouchableOpacity>
        ) : <View style={{ width: 32 }} />} 
        
        <TouchableOpacity onPress={() => finishOnboarding()}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        {ONBOARDING_QUESTIONS.map((_, index) => (
          <View key={index} style={[styles.progressDot, index <= currentStep && styles.progressDotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.greetingText}>Chào bạn 👋 Chào mừng bạn đến với</Text>
          <Text style={styles.brandText}>MindWell</Text>
        </View>
        
        <Text style={styles.subtitle}>{currentQ.subtitle}</Text>

        <View style={styles.optionsContainer}>
          {currentQ.options.map((opt) => {
            const isSelected = answers[currentQ.id] === opt.id;
            return (
              <TouchableOpacity 
                key={opt.id} 
                style={[styles.optionCard, isSelected && styles.optionCardActive]}
                onPress={() => handleSelect(opt.id)}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxActive]}>
                  <MaterialCommunityIcons name={opt.icon as any} size={26} color={isSelected ? '#FFF' : MINDWELL_GREEN} />
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity onPress={async () => {
        await AsyncStorage.setItem('has_seen_onboarding', 'true');
        router.replace('/auth/login');
      }} style={styles.footer}>
        <Text style={styles.footerText}>Đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
  skipText: { color: '#888', fontSize: 16, fontWeight: '500' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 8 },
  progressDot: { height: 6, width: 24, borderRadius: 3, backgroundColor: '#E0E0E0' },
  progressDotActive: { backgroundColor: MINDWELL_GREEN, width: 40 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },

  titleContainer: {
    marginBottom: 15,
  },
  greetingText: { 
    fontSize: 20,          
    fontWeight: '300',       
    color: '#999',           
    letterSpacing: 0.5,
  },
  brandText: { 
    fontFamily: 'MindWellFont', 
    fontSize: 55,           
    color: MINDWELL_GREEN,   
    fontWeight: 'bold',     
    letterSpacing: -1,       
    marginTop: -5,           
    includeFontPadding: false,
    textShadowColor: 'rgba(22, 91, 74, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  subtitle: { fontSize: 20, color: '#444', marginBottom: 35, lineHeight: 24, fontWeight: '400' },
  optionsContainer: { gap: 14 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' },
  optionCardActive: { borderColor: MINDWELL_GREEN, backgroundColor: '#F0FDF8' },
  iconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#F0F7F6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconBoxActive: { backgroundColor: MINDWELL_GREEN },
  optionText: { fontSize: 16, color: '#444', fontWeight: '500', flex: 1 },
  optionTextActive: { color: MINDWELL_GREEN, fontWeight: 'bold' },
  footer: { alignItems: 'center', paddingBottom: 30 },
  footerText: { color: '#666', fontSize: 15 },
  loginLink: { color: MINDWELL_GREEN, fontWeight: 'bold' },
});