import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert,
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
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
  dayNames: ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
};
LocaleConfig.defaultLocale = 'vi';

const MOODS = [
  { label: 'Rất tệ', icon: 'sentiment-very-dissatisfied', color: '#C62828' },      
  { label: 'Tệ', icon: 'sentiment-dissatisfied', color: '#EF6C00' },          
  { label: 'Bình thường', icon: 'sentiment-neutral', color: '#757575' },      
  { label: 'Tốt', icon: 'sentiment-satisfied', color: '#7CB342' },            
  { label: 'Rất tốt', icon: 'sentiment-very-satisfied', color: Colors.light.primary }, 
];

export default function MoodScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null); 
  
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMoodLabel, setSelectedMoodLabel] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false); 
  const [savedMoods, setSavedMoods] = useState<Record<string, { mood: string, note: string }>>({});

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isSelectedToday = selectedDay === todayStr;

  useFocusEffect(
    useCallback(() => {
      fetchMoodHistory();
    }, [])
  );

  const fetchMoodHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) return;
      const response = await fetch(`${API_URL}/mood`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const newMoods: Record<string, { mood: string, note: string }> = {};
        data.forEach((item: any) => {
          const dateStr = item.createdAt.split('T')[0];
          const moodIndex = item.score - 1;
          const moodConfig = MOODS[moodIndex]; 
          if (moodConfig) {
            newMoods[dateStr] = { mood: moodConfig.label, note: item.note };
          }
        });
        setSavedMoods(newMoods);
      }
    } catch (error) { console.log(error); }
  };

  useEffect(() => {
    const data = savedMoods[selectedDay];
    if (data) {
      setSelectedMoodLabel(data.mood);
      setNote(data.note || '');
    } else {
      setSelectedMoodLabel(null);
      setNote('');
    }
  }, [selectedDay, savedMoods]);

  const handleSaveMood = async () => {
    if (!isSelectedToday) {
        Alert.alert('Chế độ xem', 'Bạn chỉ có thể cập nhật cảm xúc cho ngày hôm nay.');
        return;
    }
    if (!selectedMoodLabel) {
      Alert.alert('Chưa chọn cảm xúc', 'Vui lòng chọn một biểu tượng.');
      return;
    }
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) { Alert.alert("Lỗi", "Đăng nhập lại."); return; }
      
      const moodIndex = MOODS.findIndex(m => m.label === selectedMoodLabel);
      const score = moodIndex + 1;

      const response = await fetch(`${API_URL}/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score, note, date: selectedDay })
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Đã lưu tâm trạng!');
        fetchMoodHistory();
      } else { Alert.alert('Lỗi', 'Không thể lưu.'); }
    } catch (error) { Alert.alert('Lỗi mạng', 'Kiểm tra kết nối.'); } finally { setIsSaving(false); }
  };

  const getMarkedDates = () => {
    const marks: any = {};
    Object.keys(savedMoods).forEach(date => {
      const moodLabel = savedMoods[date].mood;
      const moodConfig = MOODS.find(m => m.label === moodLabel);
      marks[date] = { marked: true, dotColor: moodConfig ? moodConfig.color : '#999' };
    });
    marks[selectedDay] = { ...marks[selectedDay], selected: true, selectedColor: Colors.light.primary };
    return marks;
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F5F7FA' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      {/* 👇 2. ScrollView bao trùm cả Header */}
      <ScrollView 
        ref={scrollViewRef} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }} 
        keyboardShouldPersistTaps="handled"
      >
        
        {/* HEADER GIỜ ĐÃ NẰM TRONG SCROLLVIEW (Để nó có thể bị đẩy lên) */}
        <View style={styles.headerWrapper}>
            <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.headerContent}>
                <View>
                <Text style={styles.headerTitle}>Theo Dõi Cảm Xúc</Text>
                <Text style={styles.headerSubtitle}>Lắng nghe bản thân mỗi ngày</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => router.push('/mood-history')} 
                    style={styles.historyBtn}
                    activeOpacity={0.8}
                >
                <Ionicons name="time-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
            </SafeAreaView>
        </View>

        {/* NỘI DUNG CHÍNH (Có thêm padding để tách khỏi header) */}
        <View style={{ padding: 20 }}>
            {/* CALENDAR */}
            <View style={styles.calendarContainer}>
                <Calendar
                    current={selectedDay}
                    onDayPress={(day: { dateString: React.SetStateAction<string>; }) => setSelectedDay(day.dateString)}
                    markedDates={getMarkedDates()}
                    theme={{
                        todayTextColor: Colors.light.primary,
                        arrowColor: Colors.light.primary,
                        textDayFontWeight: '500',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: 'bold',
                    }}
                />
            </View>

            <View style={{ height: 24 }} />

            <Text style={styles.sectionTitle}>
                {isSelectedToday ? "Ngày này bạn cảm thấy thế nào?" : `Cảm xúc ngày ${selectedDay}`}
            </Text>
            
            <View style={styles.moodRow}>
                {MOODS.map((mood, index) => {
                const isSelected = selectedMoodLabel === mood.label;
                return (
                    <TouchableOpacity
                    key={index}
                    onPress={() => isSelectedToday && setSelectedMoodLabel(mood.label)}
                    activeOpacity={isSelectedToday ? 0.7 : 1}
                    style={[
                        styles.moodItem,
                        isSelected && { backgroundColor: `${mood.color}15`, borderColor: mood.color, borderWidth: 2, elevation: 0 },
                        !isSelectedToday && !isSelected && { opacity: 0.3 }
                    ]}
                    >
                    <MaterialIcons name={mood.icon as any} size={isSelected ? 36 : 32} color={mood.color} />
                    <Text style={[styles.moodLabel, isSelected && { color: mood.color, fontWeight: 'bold' }]}>
                        {mood.label}
                    </Text>
                    </TouchableOpacity>
                );
                })}
            </View>

            <View style={{ height: 24 }} />

            <Text style={styles.sectionTitle}>Ghi chú thêm</Text>
            <TextInput
                style={[styles.textInput, !isSelectedToday && { backgroundColor: '#F5F5F5', color: '#999' }]}
                placeholder={isSelectedToday ? "Hôm nay có gì đặc biệt không?" : "Không có ghi chú"}
                multiline numberOfLines={3} 
                value={note} 
                onChangeText={setNote}
                textAlignVertical="top" 
                editable={isSelectedToday} 
                onFocus={() => {
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }}
            />

            <View style={{ height: 24 }} />

            <TouchableOpacity 
                style={[styles.saveButton, (!isSelectedToday || isSaving) && { backgroundColor: '#BDBDBD', elevation: 0 }]} 
                onPress={handleSaveMood} disabled={!isSelectedToday || isSaving}
            >
                {isSaving ? ( <ActivityIndicator color="#FFF" /> ) : (
                    <Text style={styles.saveButtonText}>{isSelectedToday ? 'Lưu Tâm Trạng' : 'Chế độ xem'}</Text>
                )}
            </TouchableOpacity>

            {!isSelectedToday && (
                <Text style={{ textAlign: 'center', color: '#999', marginTop: 15, fontSize: 12, fontStyle: 'italic' }}>
                    * Bạn chỉ có thể chỉnh sửa nhật ký của ngày hôm nay.
                </Text>
            )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: Colors.light.primary, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingBottom: 20, 
    elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.25, 
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  historyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  calendarContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 10, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, marginLeft: 4 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodItem: { alignItems: 'center', padding: 8, borderRadius: 12, width: '18%', borderWidth: 1, borderColor: 'transparent', backgroundColor: '#FFF', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05 },
  moodLabel: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' },
  textInput: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#F0F0F0', fontSize: 15, minHeight: 100, color: '#333', elevation: 1 },
  saveButton: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 16, alignItems: 'center', elevation: 3, shadowColor: Colors.light.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});