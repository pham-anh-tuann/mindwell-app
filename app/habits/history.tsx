import { Colors } from '@/constants/Colors';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compareDesc, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SectionList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../utils/apiConfig';

interface Habit {
  _id: string;
  title: string;
  iconName: string;
  completedDates: string[]; 
}

interface HistorySection {
  title: string; 
  dateObj: Date;
  data: Habit[];
}

export default function HabitHistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<HistorySection[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const response = await fetch(`${API_URL}/habits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const habits: Habit[] = await response.json();

      if (response.ok) {
        processHistoryData(habits);
      } else {
        Alert.alert('Lỗi', 'Không thể tải lịch sử');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi mạng', 'Kiểm tra kết nối internet');
    } finally {
      setLoading(false);
    }
  };

  const processHistoryData = (habits: Habit[]) => {
    const mapDateToHabits: { [key: string]: Habit[] } = {};

    habits.forEach(habit => {
      if (habit.completedDates && Array.isArray(habit.completedDates)) {
        habit.completedDates.forEach(dateStr => {
          if (!mapDateToHabits[dateStr]) {
            mapDateToHabits[dateStr] = [];
          }
          mapDateToHabits[dateStr].push(habit);
        });
      }
    });

    const result: HistorySection[] = Object.keys(mapDateToHabits).map(dateStr => {
        const dateObj = parseISO(dateStr);
        let title = format(dateObj, 'EEEE, dd/MM', { locale: vi });
        
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

        if (dateStr === today) title = `Hôm nay, ${format(dateObj, 'dd/MM')}`;
        else if (dateStr === yesterday) title = `Hôm qua, ${format(dateObj, 'dd/MM')}`;
        
        title = title.charAt(0).toUpperCase() + title.slice(1);

        return {
            title: title,
            dateObj: dateObj, 
            data: mapDateToHabits[dateStr]
        };
    });

    result.sort((a, b) => compareDesc(a.dateObj, b.dateObj));

    setSections(result);
  };

  const getIcon = (name: string, color: string, size: number = 24) => {
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lịch Sử Hoàn Thành</Text>
            <TouchableOpacity onPress={loadHistory} style={styles.iconBtn}>
              <Ionicons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        {loading ? (
           <ActivityIndicator size="large" color={Colors.light.primary} style={{marginTop: 50}} />
        ) : (
           <SectionList
             sections={sections}
             keyExtractor={(item, index) => item._id + index}
             contentContainerStyle={{ paddingBottom: 50 }}
             stickySectionHeadersEnabled={false}
             renderSectionHeader={({ section: { title } }) => (
               <Text style={styles.sectionHeader}>{title}</Text>
             )}
             renderItem={({ item }) => (
               <View style={styles.historyItem}>
                  <View style={styles.iconBox}>
                     {getIcon(item.iconName, Colors.light.primary)}
                  </View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
               </View>
             )}
             ListEmptyComponent={
                <View style={{alignItems: 'center', marginTop: 80}}>
                   <MaterialCommunityIcons name="history" size={50} color="#DDD" />
                   <Text style={{textAlign: 'center', marginTop: 15, color: '#999'}}>
                      Chưa có lịch sử nào.{'\n'}Hãy hoàn thành thói quen ngay hôm nay!
                   </Text>
                </View>
             }
           />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerWrapper: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    paddingBottom: 20, elevation: 4, zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 5 },

  body: { flex: 1, padding: 20 },
  
  sectionHeader: {
    fontSize: 16, fontWeight: 'bold', color: '#555', 
    marginTop: 20, marginBottom: 10, marginLeft: 5
  },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', padding: 15, marginBottom: 10, borderRadius: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2F1',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  itemTitle: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
});