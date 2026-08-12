import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';

const generateWeekDays = () => {
  const days = [];
  const today = new Date();
  
  const dayOfWeek = today.getDay(); 
  const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
  const monday = new Date(new Date().setDate(diffToMonday));

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    
    const isToday = nextDate.toDateString() === new Date().toDateString();

    days.push({
      dateObj: nextDate,
      dayStr: dayNames[nextDate.getDay()],
      dateNum: nextDate.getDate(),
      isToday: isToday 
    });
  }
  return days;
};

export default function ScheduleScreen() {
  const router = useRouter();
  const weekDays = generateWeekDays();

  const todayIndex = weekDays.findIndex(day => day.isToday);
  const [activeDateIndex, setActiveDateIndex] = useState(todayIndex !== -1 ? todayIndex : 0);

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', location: '', type: 'class', colorTag: '#F8FAFC', targetPomodoros: 1,
  });

  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const pastelColors = [
    { bg: '#F8FAFC', border: '#E2E8F0', name: 'Xám Trắng' }, 
    { bg: '#EFF6FF', border: '#BFDBFE', name: 'Xanh Băng' }, 
    { bg: '#F0FDF4', border: '#BBF7D0', name: 'Xanh Bạc Hà' }, 
    { bg: '#FEF2F2', border: '#FECACA', name: 'Hồng Phấn' }, 
    { bg: '#FFFBEB', border: '#FDE68A', name: 'Vàng Kem' }, 
  ];

  useEffect(() => {
    registerForPushNotificationsAsync();
    fetchTasks(weekDays[activeDateIndex].dateObj); 
  }, [activeDateIndex]);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;

      const userDataStr = await AsyncStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        
        const userId = userData._id || userData.id || userData.user?._id || userData.user?.id;
        const authToken = userData.token || userData.user?.token;

        if (!userId) {
            console.log("❌ Lỗi: Không tìm thấy userId trong máy để nộp Push Token!");
            return;
        }

        await axios.post(`${API_URL}/users/push-token`, 
          { userId: userId, token: pushToken },
          { headers: { Authorization: `Bearer ${authToken}` } } 
        );
        
        console.log("✅ Đã nạp đạn (Push Token) lên Server thành công!");
      }
    } catch (error) { 
      console.log("Lỗi Push Token:", error); 
    }
  };

  const fetchTasks = async (selectedDate: Date) => {
    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      if (!userDataStr) return;
      const userData = JSON.parse(userDataStr);
      
      const userId = userData._id || userData.id || userData.user?._id || userData.user?.id;
      const token = userData.token || userData.user?.token;
      
      const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

      const res = await axios.get(`${API_URL}/tasks`, { 
        params: { userId, startDate: new Date(startOfDay).toISOString(), endDate: new Date(endOfDay).toISOString() },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) setTasks(res.data.data);
    } catch (error) { console.log('Lỗi tải lịch:', error); } finally { setLoading(false); }
  };

  const openModal = () => {
    const baseDate = new Date(weekDays[activeDateIndex].dateObj);
    const defaultStart = new Date();
    defaultStart.setMinutes(defaultStart.getMinutes() + 2); 
    setTempStartTime(defaultStart);
    setTempEndTime(new Date(new Date(defaultStart).setHours(defaultStart.getHours() + 1)));
    setModalVisible(true);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowPicker(null);
    if (selectedTime) {
      if (showPicker === 'start') setTempStartTime(selectedTime);
      else if (showPicker === 'end') setTempEndTime(selectedTime);
    }
  };

 const handleCreateTask = async () => {
    if (!newTask.title.trim()) { Alert.alert('Chú ý', 'Sếp chưa nhập tên môn học!'); return; }
    if (tempStartTime >= tempEndTime) { Alert.alert('Lỗi logic', 'Giờ kết thúc phải SAU giờ bắt đầu!'); return; }

    try {
      const userDataStr = await AsyncStorage.getItem('user_data');
      const userData = JSON.parse(userDataStr || '{}');
      const userId = userData._id || userData.id || userData.user?._id || userData.user?.id;
      const token = userData.token || userData.user?.token;

      const res = await axios.post(`${API_URL}/tasks`, {
        userId, 
        title: newTask.title, 
        location: newTask.location, 
        type: newTask.type,
        colorTag: newTask.colorTag, 
        targetPomodoros: newTask.targetPomodoros,
        startTime: tempStartTime.toISOString(), 
        endTime: tempEndTime.toISOString(),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const newlyCreatedTask = {
          _id: Date.now().toString(), 
          title: newTask.title, location: newTask.location, type: newTask.type,
          colorTag: newTask.colorTag, targetPomodoros: newTask.targetPomodoros,
          startTime: tempStartTime.toISOString(), endTime: tempEndTime.toISOString(),
        };

        setTasks(prevTasks => {
          const updatedTasks = [...prevTasks, newlyCreatedTask];
          return updatedTasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        });

        setModalVisible(false);
        setNewTask({ title: '', location: '', type: 'class', colorTag: '#F8FAFC', targetPomodoros: 1 });
        
        Alert.alert("Thành công", "Đã lưu lịch! Hệ thống sẽ tự động nhắc nhở khi đến giờ.");
      }
    } catch (error: any) { 
      Alert.alert('Lỗi', "Lỗi kết nối. Sếp kiểm tra lại nhé!"); 
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert("Xóa Lịch Trình", "Sếp có chắc chắn muốn xóa môn này không? Đã xóa là mất luôn đấy!", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", style: "destructive", 
        onPress: async () => {
          try {
            const userDataStr = await AsyncStorage.getItem('user_data');
            const userData = JSON.parse(userDataStr || '{}');
            const token = userData.token || userData.user?.token;

            const res = await axios.delete(`${API_URL}/tasks/${taskId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
              setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
              Alert.alert("Thành công", "Đã xóa lịch trình!");
            }
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa lúc này. Sếp thử lại nhé!");
            console.log("Lỗi xóa:", error);
          }
        }
      }
    ]);
  };

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Hôm nay,</Text>
          <Text style={styles.headerTitle}>Lịch trình của bạn 🌿</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {weekDays.map((day, index) => {
            const isActive = activeDateIndex === index;
            return (
              <TouchableOpacity key={index} style={[styles.dateBox, isActive && styles.activeDateBox]} onPress={() => setActiveDateIndex(index)}>
                <Text style={[styles.dateText, isActive && styles.activeDateText]}>{day.dayStr}</Text>
                <Text style={[styles.dateNumber, isActive && styles.activeDateNumber]}>{day.dateNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timelineContainer}>
        {loading ? ( <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} /> ) 
        : tasks.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Ngày này thảnh thơi, không có lịch! 🎉</Text></View>
        ) : (
          tasks.map((task, index) => {
            const colorObj = pastelColors.find((c) => c.bg === task.colorTag) || { border: '#E2E8F0' };
            return (
              <View key={task._id} style={styles.timelineRow}>
                <View style={styles.timeColumn}><Text style={styles.timeText}>{formatTime(new Date(task.startTime))}</Text></View>
                <View style={styles.dividerColumn}>
                  <View style={[styles.dot, { borderColor: colorObj.border }]} />
                  {index !== tasks.length - 1 && <View style={styles.verticalLine} />}
                </View>
                <View style={styles.cardColumn}>
                  <View style={[styles.taskCard, { backgroundColor: task.colorTag || '#F8FAFC', borderColor: colorObj.border }]}>
                    
                    {/* 👇 ĐÃ THÊM NÚT THÙNG RÁC GỌI HÀM handleDeleteTask VÀO ĐÂY 👇 */}
                    <View style={styles.cardHeader}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {task.type === 'exam' && <MaterialIcons name="warning-amber" size={22} color="#EF4444" style={{marginRight: 10}} />}
                        <TouchableOpacity onPress={() => handleDeleteTask(task._id)} style={{padding: 4}}>
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* 👆 KẾT THÚC PHẦN NÚT XÓA 👆 */}

                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#64748B" />
                        <Text style={styles.detailText}>{formatTime(new Date(task.startTime))} - {formatTime(new Date(task.endTime))}</Text>
                      </View>
                      {task.location ? (
                        <View style={styles.detailRow}>
                          <Ionicons name="location-outline" size={16} color="#64748B" />
                          <Text style={styles.detailText}>{task.location}</Text>
                        </View>
                      ) : null}
                    </View>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/tools/pomodoro', params: { taskId: task._id } })}>
                      <FontAwesome5 name="stopwatch" size={12} color="#475569" />
                      <Text style={styles.actionBtnText}>Học ({task.targetPomodoros} 🍅)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Lịch Trình</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên môn học / công việc</Text>
              <TextInput style={styles.inputBox} placeholder="VD: Ôn tập C++..." placeholderTextColor="#94A3B8" value={newTask.title} onChangeText={(t) => setNewTask({ ...newTask, title: t })} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Khung giờ</Text>
              <View style={styles.timePickerRow}>
                <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker('start')}>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                  <Text style={styles.timeBtnText}>{formatTime(tempStartTime)}</Text>
                </TouchableOpacity>
                <Text style={styles.timeToText}>đến</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker('end')}>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                  <Text style={styles.timeBtnText}>{formatTime(tempEndTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Loại Lịch & Màu Sắc</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity style={[styles.typeBtn, newTask.type === 'class' && styles.typeBtnClass]} onPress={() => setNewTask({ ...newTask, type: 'class' })}>
                  <Text style={[styles.typeBtnText, newTask.type === 'class' && { color: Colors.light.primary }]}>📚 Học Tập</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, newTask.type === 'exam' && styles.typeBtnExam]} onPress={() => setNewTask({ ...newTask, type: 'exam' })}>
                  <Text style={[styles.typeBtnText, newTask.type === 'exam' && { color: '#EF4444' }]}>⚠️ Lịch Thi</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.colorRow, {marginTop: 15}]}>
                {pastelColors.map((color) => (
                  <TouchableOpacity key={color.bg} style={[styles.colorCircle, { backgroundColor: color.bg, borderColor: color.border }, newTask.colorTag === color.bg && styles.colorCircleActive]} onPress={() => setNewTask({ ...newTask, colorTag: color.bg })} />
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask}>
              <Text style={styles.submitBtnText}>Lưu Lịch Trình</Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : null}>
               {Platform.OS === 'ios' && (
                 <TouchableOpacity onPress={() => setShowPicker(null)} style={styles.doneBtn}>
                   <Text style={styles.doneBtnText}>Xong</Text>
                 </TouchableOpacity>
               )}
               <DateTimePicker
                value={showPicker === 'start' ? tempStartTime : tempEndTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 15 },
  headerSubtitle: { fontSize: 15, color: '#94A3B8', fontWeight: '500' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginTop: 2, letterSpacing: -0.5 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  dateSelector: { marginBottom: 15 },
  dateBox: { width: 60, height: 80, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  activeDateBox: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  dateText: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  activeDateText: { color: '#E0F2FE' },
  dateNumber: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  activeDateNumber: { color: '#FFFFFF' },
  timelineContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 60, padding: 20, backgroundColor: '#F8FAFC', borderRadius: 20 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  timelineRow: { flexDirection: 'row', width: '100%', minHeight: 110 },
  timeColumn: { width: 50, alignItems: 'flex-end', paddingTop: 18 },
  timeText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  dividerColumn: { width: 30, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, backgroundColor: '#FFFFFF', marginTop: 19, zIndex: 10 },
  verticalLine: { width: 1.5, flex: 1, backgroundColor: '#E2E8F0', marginTop: -6 },
  cardColumn: { flex: 1, paddingBottom: 20 },
  taskCard: { width: '100%', borderRadius: 20, padding: 18, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  taskTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', flex: 1 },
  cardDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailText: { fontSize: 13, marginLeft: 6, color: '#64748B' },
  actionBtn: { flexDirection: 'row', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { color: '#475569', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  inputBox: { backgroundColor: '#F8FAFC', height: 54, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBtn: { flex: 0.45, flexDirection: 'row', backgroundColor: '#F8FAFC', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  timeBtnText: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginLeft: 8 },
  timeToText: { color: '#94A3B8', fontWeight: 'bold' },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  typeBtnClass: { borderColor: Colors.light.primary, backgroundColor: '#F0FDF4' },
  typeBtnExam: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  colorCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1 },
  colorCircleActive: { borderWidth: 3, borderColor: '#0F172A' },
  submitBtn: { backgroundColor: '#126E5F', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  iosPickerContainer: { backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0' },
  doneBtn: { alignItems: 'flex-end', padding: 15 },
  doneBtnText: { color: Colors.light.primary, fontWeight: 'bold', fontSize: 16 }
});