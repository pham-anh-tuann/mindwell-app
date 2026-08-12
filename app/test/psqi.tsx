import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,




  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const frequencyAnswers = [
  'Không lần nào trong tháng qua', 
  'Ít hơn 1 lần/tuần', 
  '1 hoặc 2 lần/tuần', 
  '3 lần hoặc nhiều hơn/tuần',
];
const problemAnswers = [
  'Hoàn toàn không là vấn đề',
  'Chỉ là vấn đề rất nhỏ', 
  'Là vấn đề ở mức độ vừa phải',
  'Là vấn đề rất lớn', 
];
const qualityAnswers = [
  'Rất tốt', 
  'Khá tốt', 
  'Khá tệ', 
  'Rất tệ', 
];

export default function PsqiTestScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams();

  const [bedTime, setBedTime] = useState<Date | null>(null);
  const [minutesToSleep, setMinutesToSleep] = useState<string>('');
  const [wakeTime, setWakeTime] = useState<Date | null>(null);
  const [hoursSlept, setHoursSlept] = useState<string>('');
  
  const [q5a, setQ5a] = useState<number | null>(null);
  const [q5b, setQ5b] = useState<number | null>(null);
  const [q5c, setQ5c] = useState<number | null>(null);
  const [q5d, setQ5d] = useState<number | null>(null);
  const [q5e, setQ5e] = useState<number | null>(null);
  const [q5f, setQ5f] = useState<number | null>(null);
  const [q5g, setQ5g] = useState<number | null>(null);
  const [q5h, setQ5h] = useState<number | null>(null);
  const [q5i, setQ5i] = useState<number | null>(null);
  
  const [q6, setQ6] = useState<number | null>(null);
  const [q7, setQ7] = useState<number | null>(null);
  const [q8, setQ8] = useState<number | null>(null);
  const [q9, setQ9] = useState<number | null>(null);

  const [showBedTimePicker, setShowBedTimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  const calculatePsqiScore = () => {
    let component1 = 0;
    let component2 = 0; 
    let component3 = 0; 
    let component4 = 0; 
    let component5 = 0; 
    let component6 = 0;
    let component7 = 0; 

    component1 = q9 ?? 0;

    let scoreC2 = 0;
    const minutes = parseInt(minutesToSleep || '0');
    if (minutes <= 15) scoreC2 = 0;
    else if (minutes <= 30) scoreC2 = 1;
    else if (minutes <= 60) scoreC2 = 2;
    else scoreC2 = 3;

    const scoreC5a = q5a ?? 0;
    const sumC2 = scoreC2 + scoreC5a;
    if (sumC2 === 0) component2 = 0;
    else if (sumC2 <= 2) component2 = 1;
    else if (sumC2 <= 4) component2 = 2;
    else component2 = 3;

    const hours = parseFloat(hoursSlept || '0');
    if (hours > 7) component3 = 0;
    else if (hours >= 6) component3 = 1;
    else if (hours >= 5) component3 = 2;
    else component3 = 3;

    if (bedTime && wakeTime && hours > 0) {
      const bedMin = bedTime.getHours() * 60 + bedTime.getMinutes();
      const wakeMin = wakeTime.getHours() * 60 + wakeTime.getMinutes();
      
      let totalMinutesOnBed = 0;
      if (wakeMin < bedMin) {
        totalMinutesOnBed = (1440 - bedMin) + wakeMin; 
      } else {
        totalMinutesOnBed = wakeMin - bedMin;
      }

      if (totalMinutesOnBed > 0) {
        const efficiency = (hours * 60 / totalMinutesOnBed) * 100;
        if (efficiency >= 85) component4 = 0;
        else if (efficiency >= 75) component4 = 1;
        else if (efficiency >= 65) component4 = 2;
        else component4 = 3;
      }
    }

    const sumC5 = (q5b||0) + (q5c||0) + (q5d||0) + (q5e||0) + (q5f||0) + (q5g||0) + (q5h||0) + (q5i||0);
    if (sumC5 === 0) component5 = 0;
    else if (sumC5 <= 9) component5 = 1;
    else if (sumC5 <= 18) component5 = 2;
    else component5 = 3;

    component6 = q6 ?? 0;

    const sumC7 = (q7 ?? 0) + (q8 ?? 0);
    if (sumC7 === 0) component7 = 0;
    else if (sumC7 <= 2) component7 = 1;
    else if (sumC7 <= 4) component7 = 2;
    else component7 = 3;

    return component1 + component2 + component3 + component4 + component5 + component6 + component7;
  };

  const handleSubmit = () => {
    if (!bedTime || !wakeTime || !minutesToSleep || !hoursSlept || 
        q5a===null || q9===null) {
      Alert.alert('Chưa xong', 'Vui lòng trả lời hết các câu hỏi quan trọng.');
      return;
    }

    const finalScore = calculatePsqiScore();
    console.log('Final Score:', finalScore);

    router.replace({
      pathname: '/test/result',
      params: { score: finalScore, title: title || 'Bài Test PSQI' }
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Chọn giờ';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderSectionTitle = (text: string) => (
    <Text style={styles.sectionTitle}>{text}</Text>
  );

  const renderChoiceQuestion = (
    label: string, 
    choices: string[], 
    selected: number | null, 
    onSelect: (val: number) => void
  ) => (
    <View style={styles.questionBox}>
      {label ? <Text style={styles.questionLabel}>{label}</Text> : null}
      {choices.map((choice, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.radioRow} 
          onPress={() => onSelect(index)}
        >
          <View style={[styles.radioCircle, selected === index && styles.radioSelected]}>
            {selected === index && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioText}>{choice}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      <View style={styles.headerWrapper}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>{title || 'Đánh Giá Giấc Ngủ PSQI'}</Text>
            
            <View style={{width: 40}} /> 
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{height: 10}} />

        <Text style={styles.introText}>
          Các câu hỏi sau đây liên quan đến thói quen ngủ của bạn trong SUỐT THÁNG QUA.
        </Text>
        <View style={styles.divider} />

        <Text style={styles.label}>Câu 1: Bạn thường đi ngủ lúc mấy giờ?</Text>
        <TouchableOpacity 
          style={styles.inputBox} 
          onPress={() => setShowBedTimePicker(true)}
        >
          <Text>{formatTime(bedTime)}</Text>
          <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        {showBedTimePicker && (
          <DateTimePicker
            value={bedTime || new Date()}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowBedTimePicker(false);
              if (date) setBedTime(date);
            }}
          />
        )}

        <Text style={styles.label}>Câu 2: Bạn thường mất bao lâu (phút) để ngủ?</Text>
        <View style={styles.inputBox}>
          <TextInput 
            style={{flex: 1}} 
            placeholder="ví dụ: 15" 
            keyboardType="numeric"
            value={minutesToSleep}
            onChangeText={setMinutesToSleep}
          />
          <Text style={{color: '#888'}}>phút</Text>
        </View>

        <Text style={styles.label}>Câu 3: Bạn thường thức dậy lúc mấy giờ?</Text>
        <TouchableOpacity 
          style={styles.inputBox} 
          onPress={() => setShowWakeTimePicker(true)}
        >
          <Text>{formatTime(wakeTime)}</Text>
          <Ionicons name="alarm-outline" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        {showWakeTimePicker && (
          <DateTimePicker
            value={wakeTime || new Date()}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowWakeTimePicker(false);
              if (date) setWakeTime(date);
            }}
          />
        )}

        <Text style={styles.label}>Câu 4: Bạn ngủ bao nhiêu tiếng mỗi đêm?</Text>
        <View style={styles.inputBox}>
          <TextInput 
            style={{flex: 1}} 
            placeholder="ví dụ: 6.5" 
            keyboardType="numeric"
            value={hoursSlept}
            onChangeText={setHoursSlept}
          />
          <Text style={{color: '#888'}}>giờ</Text>
        </View>

        

        {renderSectionTitle('Câu 5: Trong tháng qua, bạn gặp khó khăn khi ngủ vì:')}
        
        {renderChoiceQuestion('a. Không thể ngủ trong vòng 30 phút', frequencyAnswers, q5a, setQ5a)}
        {renderChoiceQuestion('b. Thức dậy vào nửa đêm hoặc sáng sớm', frequencyAnswers, q5b, setQ5b)}
        {renderChoiceQuestion('c. Phải thức dậy để đi vệ sinh', frequencyAnswers, q5c, setQ5c)}
        {renderChoiceQuestion('d. Không thể thở thoải mái', frequencyAnswers, q5d, setQ5d)}
        {renderChoiceQuestion('e. Ho hoặc ngáy to', frequencyAnswers, q5e, setQ5e)}
        {renderChoiceQuestion('f. Cảm thấy quá lạnh', frequencyAnswers, q5f, setQ5f)}
        {renderChoiceQuestion('g. Cảm thấy quá nóng', frequencyAnswers, q5g, setQ5g)}
        {renderChoiceQuestion('h. Gặp ác mộng', frequencyAnswers, q5h, setQ5h)}
        {renderChoiceQuestion('i. Bị đau', frequencyAnswers, q5i, setQ5i)}

        <View style={styles.divider} />

        {renderSectionTitle('Câu 6: Trong tháng qua, bạn dùng thuốc ngủ?')}
        {renderChoiceQuestion('', frequencyAnswers, q6, setQ6)}

        {renderSectionTitle('Câu 7: Khó khăn khi lái xe, ăn uống, hoạt động xã hội vì buồn ngủ?')}
        {renderChoiceQuestion('', frequencyAnswers, q7, setQ7)}

        {renderSectionTitle('Câu 8: Khó khăn để duy trì sự nhiệt tình?')}
        {renderChoiceQuestion('', problemAnswers, q8, setQ8)}

        {renderSectionTitle('Câu 9: Đánh giá chất lượng giấc ngủ chung?')}
        {renderChoiceQuestion('', qualityAnswers, q9, setQ9)}

        <View style={{height: 20}} />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Hoàn Thành Bài Test</Text>
        </TouchableOpacity>
        <View style={{height: 40}} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  
  headerWrapper: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingBottom: 20, 
    elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.25,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingTop: 10
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center'
  },

  introText: { fontSize: 15, fontStyle: 'italic', color: '#555', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#DDD', marginVertical: 20 },
  
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  inputBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#DDD',
    marginBottom: 20
  },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary, marginTop: 10, marginBottom: 10 },
  questionBox: { marginBottom: 20 },
  questionLabel: { fontSize: 15, fontWeight: '500', marginBottom: 10, color: '#444' },
  
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingVertical: 4 },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#999',
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  radioSelected: { borderColor: Colors.light.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.primary },
  radioText: { fontSize: 14, color: '#333' },

  submitButton: {
    backgroundColor: Colors.light.primary, padding: 18, borderRadius: 12, alignItems: 'center',
    elevation: 3, shadowColor: Colors.light.primary, shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});