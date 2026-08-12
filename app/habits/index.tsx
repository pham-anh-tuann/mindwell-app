import { API_URL } from '@/utils/apiConfig';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform, ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ConfettiCannon from 'react-native-confetti-cannon';

const COLORS = {
  primary: '#047857',
  lightBg: '#E0F2F1',
  background: '#F5F7FA',
  textTitle: '#333333',
  textDesc: '#666666',
  cardBg: '#FFFFFF',
  border: '#E0E0E0'
};

const { width } = Dimensions.get('window');

interface AppHabit {
  _id: string;
  title: string;
  description: string;
  iconName: string;
  isCustom: boolean;
  completedDates: string[];
}

export default function HabitsScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState<AppHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('default');

  const confettiRef = useRef<any>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/habits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) setHabits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async (id: string) => {
    setHabits(prev => prev.map(h => {
        if (h._id === id) {
            const isCompletedToday = h.completedDates.includes(todayStr);
            let newDates = [...h.completedDates];
            if (isCompletedToday) newDates = newDates.filter(d => d !== todayStr);
            else newDates.push(todayStr);
            return { ...h, completedDates: newDates };
        }
        return h;
    }));

    try {
      const token = await AsyncStorage.getItem('user_token');
      const response = await fetch(`${API_URL}/habits/${id}/toggle`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ date: todayStr })
      });

      if (response.ok) {
          const habit = habits.find(h => h._id === id);
          if (habit && !habit.completedDates.includes(todayStr)) {
              const updatedHabits = habits.map(h => h._id === id ? {...h, completedDates: [...h.completedDates, todayStr]} : h);
              const allCompleted = updatedHabits.every(h => h.completedDates.includes(todayStr));
              
              if (allCompleted) {
                  confettiRef.current && confettiRef.current.start();
                  Alert.alert(
  "Tuyệt vời quá!🎉", 
  "100% thói quen đã được hoàn thành. Những bước đi nhỏ mỗi ngày đang tạo nên một phiên bản tốt hơn của bạn. Tự hào nhé!"
);
              }
          }
      }

    } catch (error) {
      loadHabits(); 
    }
  };

  const handleAddHabit = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên thói quen.');
      return;
    }

    setSubmitLoading(true);
    try {
        const token = await AsyncStorage.getItem('user_token');
        const response = await fetch(`${API_URL}/habits`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
                title: newTitle,
                description: newDesc || 'Mục tiêu cá nhân',
                iconName: newIcon,
                isCustom: true
            })
        });

        if (response.ok) {
            await loadHabits();
            setModalVisible(false);
            setNewTitle('');
            setNewDesc('');
            setNewIcon('default');
        } else {
            Alert.alert('Lỗi', 'Không thể thêm thói quen');
        }
    } catch (error) {
        Alert.alert('Lỗi mạng', 'Vui lòng thử lại sau');
    } finally {
        setSubmitLoading(false);
    }
  };

  const handleDeleteHabit = (id: string) => {
    Alert.alert('Xóa thói quen', 'Bạn chắc chắn muốn xóa?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('user_token');
            await fetch(`${API_URL}/habits/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setHabits(prev => prev.filter(h => h._id !== id));
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa');
          }
      }}
    ]);
  };

  const getIcon = (name: string, size: number = 24) => {
    const color = COLORS.primary; 
    switch (name) {
      case 'water': return <Ionicons name="water" size={size} color={color} />;
      case 'meditation': return <MaterialCommunityIcons name="meditation" size={size} color={color} />;
      case 'book': return <Ionicons name="book" size={size} color={color} />;
      case 'walk': return <FontAwesome5 name="walking" size={size} color={color} />;
      case 'journal': return <Ionicons name="create" size={size} color={color} />;
      case 'gym': return <Ionicons name="barbell" size={size} color={color} />;
      case 'code': return <Ionicons name="laptop-outline" size={size} color={color} />;
      case 'music': return <Ionicons name="musical-notes" size={size} color={color} />;
      case 'sleep': return <Ionicons name="moon" size={size} color={color} />;
      case 'eat': return <Ionicons name="nutrition" size={size} color={color} />;
      case 'sun': return <Ionicons name="sunny" size={size} color={color} />;
      case 'clean': return <Ionicons name="sparkles" size={size} color={color} />;
      case 'money': return <Ionicons name="wallet" size={size} color={color} />;
      default: return <Ionicons name="checkmark-circle-outline" size={size} color={color} />;
    }
  };

  const renderItem = ({ item }: { item: AppHabit }) => {
    const isCompleted = item.completedDates.includes(todayStr);

    return (
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.7}
          onPress={() => toggleCompletion(item._id)}
        >
          <View style={styles.iconBox}>
             {getIcon(item.iconName)}
          </View>
          
          <View style={{ flex: 1, paddingHorizontal: 15 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          </View>

          <View style={styles.actionRow}>
             <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
                {isCompleted && <Ionicons name="checkmark" size={16} color="#FFF" />}
             </View>
             
             {item.isCustom && (
               <TouchableOpacity onPress={() => handleDeleteHabit(item._id)} style={{marginLeft: 15}}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
               </TouchableOpacity>
             )}
          </View>
        </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerWrapper}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Thói Quen Hàng Ngày</Text>
            
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity onPress={() => router.push('/habits/history')} style={styles.iconBtn}>
                   <MaterialCommunityIcons name="history" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={{width: 10}} />
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconBtn}>
                   <Ionicons name="add-circle-outline" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <Text style={styles.dateText}>
            Danh Sách Hôm Nay ({format(new Date(), 'dd/MM')})
        </Text>
        <Text style={styles.subText}>Hoàn thành các thói quen để xây dựng lối sống lành mạnh.</Text>
        
        <View style={{height: 15}} />

        {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
        ) : (
            <FlatList
                data={habits}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={{alignItems: 'center', marginTop: 50}}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={50} color="#DDD" />
                        <Text style={{color: '#999', marginTop: 10}}>Chưa có thói quen nào.</Text>
                        <Text style={{color: '#999'}}>Bấm dấu (+) để thêm mới nhé!</Text>
                    </View>
                }
            />
        )}
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Thêm Thói Quen Mới</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <TextInput 
                    style={styles.input} placeholder="Tên thói quen (VD: Ngủ sớm)" 
                    value={newTitle} onChangeText={setNewTitle}
                />
                <TextInput 
                    style={styles.input} placeholder="Mô tả (VD: Trước 23h)" 
                    value={newDesc} onChangeText={setNewDesc}
                />

                <Text style={styles.label}>Chọn biểu tượng:</Text>
                
                <View style={{height: 150}}>
                    <ScrollView showsVerticalScrollIndicator={true}>
                        <View style={styles.iconGrid}>
                            {[
                              'water', 'gym', 'walk', 'meditation',
                              'book', 'code', 'journal', 'music',
                              'sleep', 'eat', 'sun', 'clean',
                              'money', 'default'
                            ].map(icon => (
                                <TouchableOpacity 
                                    key={icon} 
                                    style={[styles.iconOption, newIcon === icon && styles.iconOptionSelected]}
                                    onPress={() => setNewIcon(icon)}
                                >
                                    {getIcon(icon, 22)}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <TouchableOpacity 
                    style={[styles.addBtn, submitLoading && {opacity: 0.7}]} 
                    onPress={handleAddHabit}
                    disabled={submitLoading}
                >
                    {submitLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.addBtnText}>Thêm Ngay</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfettiCannon 
          ref={confettiRef}
          count={50} 
          origin={{x: width / 2, y: -20}} 
          autoStart={false} 
          fadeOut={true} 
          fallSpeed={3000} 
          colors={[COLORS.primary, COLORS.lightBg, '#faad14', '#FF5252']} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  headerWrapper: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
    paddingBottom: 20, elevation: 5, zIndex: 10,
    shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10
  },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  iconBtn: { padding: 8 },

  body: { flex: 1, padding: 20 },
  dateText: { fontSize: 22, fontWeight: '700', color: COLORS.textTitle },
  subText: { fontSize: 14, color: COLORS.textDesc, marginTop: 5, lineHeight: 20 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg, 
    borderRadius: 16, padding: 16, marginBottom: 15,
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  iconBox: {
    width: 50, height: 50, borderRadius: 25, 
    backgroundColor: COLORS.lightBg, 
    justifyContent: 'center', alignItems: 'center'
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textTitle, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textDesc, lineHeight: 18 },
  
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  
  checkbox: {
    width: 28, height: 28, borderRadius: 14, 
    borderWidth: 2, borderColor: '#C0C0C0', 
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF'
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20
  },
  modalContent: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 5
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  input: {
    backgroundColor: '#F5F7FA', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  iconGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, paddingBottom: 10 
  },
  iconOption: {
    width: '22%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F0F2F5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  iconOptionSelected: { backgroundColor: COLORS.lightBg, borderWidth: 1, borderColor: COLORS.primary },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 10
  },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});