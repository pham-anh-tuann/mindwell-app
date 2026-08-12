import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestListScreen() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch(`${API_URL}/tests`);
      const json = await res.json();
      if (json.success) {
        setTests(json.data);
      }
    } catch (error) {
      console.log("Lỗi tải bài test:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      <View style={styles.headerWrapper}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Bài Test Tâm Lý</Text>
              <Text style={styles.headerSubtitle}>Khám phá sức khỏe tinh thần</Text>
            </View>
            <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/test/history')}>
              <Ionicons name="time-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {tests.map((test, index) => (
              <TouchableOpacity 
                key={test._id} 
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => {
                  if (test.code === 'PSQI') { 
                    router.push('/test/psqi');
                  } else {
                    router.push({
                      pathname: '/test/player',
                      params: { id: test._id, title: test.title }
                    });
                  }
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: `${Colors.light.primary}15` }]}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={30} color={Colors.light.primary} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{test.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{test.description || 'Chưa có mô tả'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#DDD" />
              </TouchableOpacity>
            ))}
            <View style={{height: 20}} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  body: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerWrapper: { backgroundColor: Colors.light.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 5, zIndex: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  historyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingTop: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: '#F0F0F0' },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
});