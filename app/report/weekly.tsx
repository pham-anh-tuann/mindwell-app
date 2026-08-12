import { Colors } from '@/constants/Colors';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../utils/apiConfig';

const screenWidth = Dimensions.get('window').width;

interface WeeklyData {
  moodSummary: string;
  testsCompleted: number;
  aiRecommendation: string;
  rawMoods: any[];
  rawTests: any[];
}

export default function WeeklySummaryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklyData | null>(null);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/reports/weekly`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        Alert.alert('Lỗi', 'Không thể tải báo cáo');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không kết nối được Server');
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: "#FFF",
    backgroundGradientTo: "#FFF",
    color: (opacity = 1) => `rgba(0, 77, 64, ${opacity})`,
    strokeWidth: 3, 
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#004D40" },
    propsForLabels: { fontSize: 10, fontWeight: 'bold' },
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={{marginTop: 10, color: '#666'}}>Đang phân tích dữ liệu...</Text>
      </View>
    );
  }

  if (!data) return null;

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
            
            <Text style={styles.headerTitle}>Báo Cáo Tuần</Text>
            
            <View style={{width: 24}} /> 
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.disclaimerCard}>
            <Ionicons name="warning-outline" size={24} color="#F57C00" />
            <Text style={styles.disclaimerText}>
                LƯU Ý: Kết quả này chỉ mang tính tham khảo, KHÔNG thay thế chẩn đoán y tế.
            </Text>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Tổng Quan Tuần Qua</Text>
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <MaterialCommunityIcons name="emoticon-happy-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.summaryLabel}>Xu hướng:</Text>
                </View>
                <Text style={styles.summaryValue}>{data.moodSummary}</Text>
            </View>

            <View style={[styles.summaryRow, {marginTop: 10}]}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.summaryLabel}>Bài test đã làm:</Text>
                </View>
                <Text style={styles.summaryValue}>{data.testsCompleted} bài</Text>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Biểu Đồ Cảm Xúc</Text>
        <View style={styles.chartCard}>
            {data.rawMoods.length > 0 ? (
                <LineChart
                    data={{
                        labels: data.rawMoods.map(m => m.date),
                        datasets: [
                            { data: data.rawMoods.map(m => m.value) },
                            { data: [1], withDots: false }, 
                            { data: [5], withDots: false } 
                        ]
                    }}
                    width={screenWidth - 60} 
                    height={220}
                    yAxisInterval={1}
                    chartConfig={chartConfig}
                    bezier
                    style={{ borderRadius: 16 }}
                    fromZero={false}
                    segments={4}
                    xLabelsOffset={-4}
                    formatYLabel={(yValue) => {
                        const value = Math.round(parseFloat(yValue));
                        if (value === 5) return 'R.Tốt';
                        if (value === 4) return 'Tốt';
                        if (value === 3) return 'B.Thg';
                        if (value === 2) return 'Tệ';
                        if (value === 1) return 'R.Tệ';
                        return '';
                    }}
                />
            ) : (
                <View style={{height: 150, justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{color: '#999'}}>Chưa có dữ liệu cảm xúc.</Text>
                </View>
            )}
        </View>

       <Text style={styles.sectionTitle}>Kết Quả Bài Test Gần Nhất</Text>
        {data.rawTests.length === 0 ? (
            <Text style={{color: '#999', fontStyle: 'italic', marginLeft: 5}}>Chưa có dữ liệu bài test.</Text>
        ) : (
            data.rawTests.slice(0, 5).map((test, index) => (
                <View key={index} style={styles.testCard}>
                    <View style={styles.testIconBox}>
                        <FontAwesome5 name="file-medical-alt" size={20} color={Colors.light.primary} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.testName} numberOfLines={1}>{test.name}</Text>
                        <Text style={styles.testDetail}>Kết quả: {test.level} ({test.score}đ)</Text>
                    </View>
                    <Text style={styles.testDate}>{test.date}</Text>
                </View>
            ))
        )}
        
        {data.rawTests.length > 5 && (
            <Text style={{ textAlign: 'center', color: Colors.light.primary, fontSize: 13, marginTop: 5, marginBottom: 15, fontWeight: '500' }}>
               + {data.rawTests.length - 5} bài test khác trong tuần
            </Text>
        )}
        <Text style={styles.sectionTitle}>Lời Khuyên Từ AI</Text>
        <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
                <MaterialCommunityIcons name="robot-happy" size={28} color="#FFF" />
                <Text style={styles.aiTitle}>Trợ Lý MindWell</Text>
            </View>
            <Text style={styles.aiText}>
                {data.aiRecommendation}
            </Text>
        </View>

        <View style={{height: 30}} />
    
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerWrapper: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    paddingBottom: 20, elevation: 4, zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  content: { padding: 20 },

  disclaimerCard: {
    flexDirection: 'row', backgroundColor: '#FFF3E0', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#FFE0B2', marginBottom: 20
  },
  disclaimerText: { flex: 1, marginLeft: 10, color: '#E65100', fontSize: 13, lineHeight: 18 },

  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 25,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { marginLeft: 8, fontSize: 15, color: '#555' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 5 },
  chartCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 10, marginBottom: 25,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, alignItems: 'center'
  },

  testCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 10,
    elevation: 1
  },
  testIconBox: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  testName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  testDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  testDate: { fontSize: 12, color: '#999' },

  aiCard: {
    backgroundColor: Colors.light.primary, borderRadius: 16, padding: 20,
    elevation: 3, shadowColor: Colors.light.primary, shadowOpacity: 0.3
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginLeft: 10 },
  aiText: { fontSize: 15, color: '#E0F2F1', lineHeight: 24, textAlign: 'justify' },
});