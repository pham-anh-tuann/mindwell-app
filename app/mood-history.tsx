import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOODS = [
  { label: 'Rất tệ', icon: 'sentiment-very-dissatisfied', color: '#C62828' },      
  { label: 'Tệ', icon: 'sentiment-dissatisfied', color: '#EF6C00' },          
  { label: 'Bình thường', icon: 'sentiment-neutral', color: '#757575' },      
  { label: 'Tốt', icon: 'sentiment-satisfied', color: '#7CB342' },            
  { label: 'Rất tốt', icon: 'sentiment-very-satisfied', color: Colors.light.primary }, 
];

export default function MoodHistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/mood`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const sorted = data.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistory(sorted);
      }
    } catch (e) {
      console.log('Lỗi API:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const moodIndex = item.score - 1;
    const moodConfig = MOODS[moodIndex];
    
    const dateObj = item.createdAt ? new Date(item.createdAt) : new Date();
    const timeStr = format(dateObj, 'HH:mm'); 
    const dateStr = format(dateObj, 'dd/MM/yyyy'); 

    return (
      <View style={styles.historyCard}>
        {/* Icon Box */}
        <View style={[styles.historyIconBox, { backgroundColor: moodConfig ? `${moodConfig.color}15` : '#EEE' }]}>
            <MaterialIcons name={moodConfig ? (moodConfig.icon as any) : 'help-outline'} size={24} color={moodConfig ? moodConfig.color : '#999'} />
        </View>
        
        <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                <Text style={styles.historyTime}>{timeStr}</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.historyDate}>{dateStr}</Text>
            </View>

            <Text style={styles.historyNote} numberOfLines={1}>
                {item.note ? item.note : 'Không có ghi chú'}
            </Text>
        </View>
        
        <View style={{alignItems: 'flex-end'}}>
             <View style={[styles.scoreBadge, { backgroundColor: moodConfig ? `${moodConfig.color}15` : '#EEE' }]}>
                <Text style={[styles.scoreText, { color: moodConfig?.color }]}>
                    {moodConfig?.label}
                </Text>
             </View>
        </View>
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>Lịch Sử Cảm Xúc</Text>
            <TouchableOpacity onPress={loadHistory} style={styles.backBtn}>
               <Ionicons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        {loading ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        ) : (
            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <MaterialIcons name="history-toggle-off" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>Chưa có dữ liệu nào.</Text>
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
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingBottom: 20, 
    elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.25,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },

  body: { flex: 1, marginTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },

  historyCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#FFF', padding: 15, 
      borderRadius: 16, 
      marginBottom: 12,
      elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
      borderWidth: 1, borderColor: '#F0F0F0'
  },
  historyIconBox: {
      width: 44, height: 44, borderRadius: 14, 
      justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  
  historyTime: { fontSize: 14, fontWeight: 'bold', color: Colors.light.primary },
  dotSeparator: { marginHorizontal: 6, color: '#CCC' },
  historyDate: { fontSize: 14, color: '#666', fontWeight: '500' },
  
  historyNote: { fontSize: 13, color: '#888', marginTop: 2 },
  
  scoreBadge: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-end'
  },
  scoreText: { fontSize: 12, fontWeight: 'bold' }
});