import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function TestHistoryScreen() {
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

      const response = await fetch(`${API_URL}/test-results/history`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (response.ok) {
        setHistory(data);
      }
    } catch (e) {
      console.log('Lỗi API:', e);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (result: string) => {
    if (!result) return Colors.light.primary;
    const lowerResult = result.toLowerCase();
    if (lowerResult.includes('nặng') || lowerResult.includes('kém') || lowerResult.includes('đáng lo')) return '#D32F2F'; // Đỏ
    if (lowerResult.includes('vừa') || lowerResult.includes('nhẹ')) return '#F57C00'; // Cam
    return Colors.light.primary; 
  };

  const renderItem = ({ item }: { item: any }) => {
    const color = getLevelColor(item.result);
    const dateStr = item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : 'N/A';
    
    let iconName = 'clipboard-text-outline';
    if (item.testTitle?.includes('Lo âu')) iconName = 'brain';
    if (item.testTitle?.includes('Trầm cảm')) iconName = 'emoticon-sad-outline';
    if (item.testTitle?.includes('Giấc ngủ')) iconName = 'bed-outline';

    return (
      <View style={styles.historyCard}>
        <View style={[styles.historyIconBox, { backgroundColor: `${color}15` }]}>
            <MaterialCommunityIcons name={iconName as any} size={24} color={color} />
        </View>

        <View style={{flex: 1}}>
            <Text style={styles.historyTitle}>{item.testTitle}</Text>
            <Text style={styles.historyDate}>{dateStr}</Text>
        </View>

        <View style={{alignItems: 'flex-end'}}>
             <View style={[styles.scoreBadge, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.scoreText, { color: color }]}>{item.score}đ</Text>
             </View>
             <Text style={[styles.resultText, { color: color }]} numberOfLines={1}>
                {item.result}
             </Text>
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
            
            <Text style={styles.headerTitle}>Lịch Sử Bài Test</Text>
            
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
                        <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>Bạn chưa làm bài test nào.</Text>
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
      backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12,
      elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
      borderWidth: 1, borderColor: '#F0F0F0'
  },
  historyIconBox: {
      width: 44, height: 44, borderRadius: 14, 
      justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  historyDate: { fontSize: 12, color: '#888' },
  
  scoreBadge: {
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4, alignSelf: 'flex-end'
  },
  scoreText: { fontSize: 12, fontWeight: 'bold' },
  resultText: { fontSize: 12, fontWeight: '600' }
});