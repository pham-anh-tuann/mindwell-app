import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { API_URL } from '../utils/apiConfig';

const screenWidth = Dimensions.get('window').width;

interface WeeklyData {
  moodSummary: string;
  testsCompleted: number;
  aiRecommendation: string;
  rawMoods: any[];
  rawTests: any[];
  studyData?: any[]; 
}

export default function WeeklySummary() {
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
        if (!result.studyData) {
            result.studyData = [
                { label: 'T2', totalMinutes: 25 },
                { label: 'T3', totalMinutes: 50 },
                { label: 'T4', totalMinutes: 0 },
                { label: 'T5', totalMinutes: 75 },
                { label: 'T6', totalMinutes: 25 },
                { label: 'T7', totalMinutes: 100 },
                { label: 'CN', totalMinutes: 0 },
            ];
        }
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
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#004D40" },
    propsForLabels: { fontSize: 10, fontWeight: 'bold' },
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const studyChartConfig = { ...chartConfig, color: (opacity = 1) => `rgba(245, 124, 0, ${opacity})` };

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
        <Text style={{marginTop: 10, color: '#666'}}>Đang tải báo cáo tuần...</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={styles.container}>
        
        {/* TỔNG QUAN */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Tổng Quan Tuần Qua</Text>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <MaterialCommunityIcons name="emoticon-happy-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.summaryLabel}>Cảm xúc:</Text>
                </View>
                <Text style={styles.summaryValue}>{data.moodSummary}</Text>
            </View>
            <View style={[styles.summaryRow, {marginTop: 10}]}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={Colors.light.primary} />
                    <Text style={styles.summaryLabel}>Bài test:</Text>
                </View>
                <Text style={styles.summaryValue}>{data.testsCompleted} bài</Text>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Thời Gian Tập Trung (Phút)</Text>
        <View style={styles.chartCard}>
            {data.studyData && data.studyData.length > 0 ? (
                <BarChart
                    data={{
                        labels: data.studyData.map(d => d.label),
                        datasets: [{ data: data.studyData.map(d => d.totalMinutes) }]
                    }}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix="p"
                    chartConfig={studyChartConfig}
                    style={{ borderRadius: 16 }}
                    fromZero={true}
                    showValuesOnTopOfBars={true}
                />
            ) : (
                <View style={{height: 150, justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{color: '#999'}}>Chưa có dữ liệu học tập.</Text>
                </View>
            )}
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

        <Text style={styles.sectionTitle}>Lời Khuyên Từ AI</Text>
        <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
                <MaterialCommunityIcons name="robot-happy" size={28} color="#FFF" />
                <Text style={styles.aiTitle}>Trợ Lý MindWell</Text>
            </View>
            <Text style={styles.aiText}>{data.aiRecommendation}</Text>
        </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingBottom: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { marginLeft: 8, fontSize: 15, color: '#555' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 5 },
  chartCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 10, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, alignItems: 'center' },
  aiCard: { backgroundColor: Colors.light.primary, borderRadius: 16, padding: 20, elevation: 3, shadowColor: Colors.light.primary, shadowOpacity: 0.3 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginLeft: 10 },
  aiText: { fontSize: 15, color: '#E0F2F1', lineHeight: 24, textAlign: 'justify' },
});