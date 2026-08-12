import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ContentData {
  _id: string; type: string; title: string; description: string; imageUrl: string; content?: string; category?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Bạn');
  const [loading, setLoading] = useState(true); 
  
  const [hasUnread, setHasUnread] = useState(false);

  const [weeklyReport, setWeeklyReport] = useState({ daysTracked: 0, mood: 'Chưa có' });
  const [dailyTip, setDailyTip] = useState<ContentData | null>(null);
  const [newsList, setNewsList] = useState<ContentData[]>([]);

  const [selectedCategory, setSelectedCategory] = useState('Stress');
  const categories = ['Stress', 'Trầm cảm', 'Lo âu', 'Mất ngủ'];

  const [communityChartData, setCommunityChartData] = useState({
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
  });
  
  const [userRankTop, setUserRankTop] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        const userRes = await fetch(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const userData = await userRes.json();
        if (userRes.ok && userData.name && userData.name.trim() !== "") {
           setUserName(userData.name.trim().split(' ').pop());
        }

        const reportRes = await fetch(`${API_URL}/reports/weekly`, { headers: { Authorization: `Bearer ${token}` } });
        const reportData = await reportRes.json();
        if (reportRes.ok) {
           const days = reportData.rawMoods ? reportData.rawMoods.length : 0;
           let moodText = reportData.moodSummary ? reportData.moodSummary.split(' ')[0] : 'Chưa có';
           setWeeklyReport({ daysTracked: days, mood: moodText });
        }

        const notifRes = await fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        const notifData = await notifRes.json();
        if (notifRes.ok && Array.isArray(notifData)) {
          const unreadExist = notifData.some((n: any) => n.read === false);
          setHasUnread(unreadExist);
        }

        try {
          const communityRes = await fetch(`${API_URL}/sessions/community-report`, { headers: { Authorization: `Bearer ${token}` } });
          const communityDataRaw = await communityRes.json();
          if (communityRes.ok && communityDataRaw.data) {
            const { dailyStats, rank } = communityDataRaw.data;
            
            if (dailyStats && dailyStats.length > 0) {
              setCommunityChartData({
                labels: dailyStats.map((d: any) => d.label),
                datasets: [{ data: dailyStats.map((d: any) => d.usersActive) }] 
              });
            }
            if (rank && rank.topPercentage) {
              setUserRankTop(rank.topPercentage);
            }
          }
        } catch (commErr) {
          console.log("Lỗi tải data cộng đồng:", commErr);
        }
      }

      const [resTip, resNews] = await Promise.all([ 
        fetch(`${API_URL}/content/daily-tip`), 
        fetch(`${API_URL}/content/news`) 
      ]);
      const dataTip = await resTip.json(); const dataNews = await resNews.json();
      if (resTip.ok) setDailyTip(dataTip); if (resNews.ok) setNewsList(dataNews);
      
    } catch (e) { 
        console.log("Lỗi load trang chủ:", e); 
    } finally { 
        setLoading(false); 
    }
  };

  const filteredNews = newsList.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const dataArray = communityChartData.datasets[0].data;
  const maxUsers = Math.max(...dataArray, 0);
  const totalWeeklyUsers = dataArray.reduce((sum, current) => sum + current, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />
      
      <View style={styles.headerWrapper}>
          <SafeAreaView edges={['top', 'left', 'right']}>
              <View style={styles.headerContent}>
                  <View>
                      <Text style={styles.welcomeText}>Xin chào, {userName}!</Text>
                      <Text style={styles.subText}>Hôm nay bạn đã chăm sóc bản thân chưa?</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/profile/reminder_list')} style={styles.bellButton}>
                      <Ionicons name="notifications" size={24} color={Colors.light.primary} />
                      {hasUnread && <View style={styles.redDot} />}
                  </TouchableOpacity>
              </View>
          </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.paddingGlobal}>
          <View style={{height: 24}} />
          
          <TouchableOpacity style={styles.weeklyCard} onPress={() => router.push('/report/weekly')} activeOpacity={0.9}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Phân Tích Cảm Xúc</Text>
              <MaterialIcons name="analytics" size={28} color={Colors.light.primary} />
            </View>
            <View style={{height: 10}} />
            <Text style={styles.cardDesc}>
              Tuần này bạn đã theo dõi <Text style={{fontWeight: 'bold'}}>{weeklyReport.daysTracked}/7 ngày</Text>. 
              Tâm trạng trung bình: <Text style={{fontWeight: 'bold', color: Colors.light.primary}}>{weeklyReport.mood} 🎉</Text>.
            </Text>
          </TouchableOpacity>

          <View style={{height: 24}} />

          <Text style={styles.sectionHeader}>Nhịp Đập Cộng Đồng</Text>
          <Text style={styles.sectionSub}>Thống kê lượng sinh viên cày cuốc tuần này</Text>
          <View style={styles.chartContainer}>
              
              {/* 👇 1. ĐÒN TÂM LÝ "LEO RANK" ĐẬP VÀO MẮT 👇 */}
              {userRankTop !== null && (
                  <View style={styles.rankBadge}>
                      <View style={styles.rankIconBox}>
                          <FontAwesome5 name="trophy" size={22} color="#D97706" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.rankTitle}>Bảng Xếp Hạng Tuần</Text>
                          <Text style={styles.rankText}>
                              {userRankTop === 100 && maxUsers === 0 
                                ? "Bạn chưa có thành tích. Bắt đầu Pomodoro để leo rank ngay!" 
                                : `Tuyệt vời! Bạn đang nằm trong Top ${userRankTop}% sinh viên chăm chỉ nhất tuần này! 🔥`}
                          </Text>
                      </View>
                  </View>
              )}

          <BarChart
                  data={communityChartData} 
                  width={width - 60} 
                  height={200} 
                  yAxisLabel=""
                  yAxisSuffix="" 
                  withHorizontalLabels={false} 
                  showValuesOnTopOfBars={true} 
                  fromZero={true}
                  
                  withInnerLines={false} 

                  chartConfig={{
                      backgroundGradientFrom: "#FFF",
                      backgroundGradientTo: "#FFF",
                      
                      fillShadowGradient: "#EA580C", 
                      fillShadowGradientOpacity: 1,  
                      
                      color: (opacity = 1) => `#EA580C`, 
                      labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`, 
                      barPercentage: 1.1, 
                      decimalPlaces: 0, 
                      propsForLabels: { fontSize: 13, fontWeight: 'bold' },

                      propsForBackgroundLines: { 
                          strokeWidth: 0 
                      }
                  }}
                  style={{ borderRadius: 16, paddingTop: 15, paddingRight: 0 }}
              />

              {/* 👇 2. ĐÒN TÂM LÝ "BẦY ĐÀN" DƯỚI ĐÁY BIỂU ĐỒ 👇 */}
              <View style={styles.communityMotivation}>
                  <FontAwesome5 name="users" size={16} color="#F57C00" />
                  <Text style={styles.motivationText}>
                      <Text style={{fontWeight: 'bold', color: '#E65100'}}>FOMO Alert:</Text> Đã có {totalWeeklyUsers} lượt sinh viên cày cuốc. Bạn đừng để bị tụt hậu nhé!
                  </Text>
              </View>
          </View>

          <View style={{height: 24}} />
          
          <TouchableOpacity style={styles.featuredCardContainer} onPress={() => router.push('/(tabs)/chat')}>
            <LinearGradient colors={[Colors.light.primary, '#2A9D8F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredCardGradient}>
                <View style={styles.iconCircle}><MaterialIcons name="forum" size={30} color={Colors.light.primary} /></View>
                <View style={{width: 15}} />
                <View style={{flex: 1}}>
                    <Text style={styles.featuredTitle}>Trò chuyện cùng AI</Text>
                    <Text style={styles.featuredDesc}>Tâm sự ngay, tôi luôn lắng nghe.</Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={{height: 30}} />
          
          {dailyTip && (
            <View>
              <Text style={styles.sectionHeader}>Gợi Ý Hôm Nay</Text>
              <View style={{height: 10}} />
              <TouchableOpacity style={styles.tipCard} onPress={() => router.push(`/article/${dailyTip._id}`)}>
                  <Image source={{ uri: dailyTip.imageUrl }} style={styles.tipImage} />
                  <View style={styles.tipContent}>
                      <View style={styles.tipBadge}>
                          <Text style={styles.tipBadgeText}>Lời khuyên</Text>
                      </View>
                      <Text style={styles.tipTitle}>{dailyTip.title}</Text>
                      <Text style={styles.tipDesc}>{dailyTip.description}</Text>
                  </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={{height: 30}} />
          
          {newsList.length > 0 && (
            <View>
              <Text style={styles.sectionHeader}>Kiến Thức Tâm Lý</Text>
              <View style={{height: 12}} />

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 15 }}
              >
                {categories.map((cat, index) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterChip,
                        isActive ? styles.filterChipActive : null,
                        index === categories.length - 1 && { marginRight: 32 } 
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                {filteredNews.length > 0 ? (
                  filteredNews.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.horizontalCard} onPress={() => router.push(`/article/${item._id}`)}>
                        <Image source={{ uri: item.imageUrl }} style={styles.horizontalImage} />
                        <View style={styles.horizontalContent}>
                            <Text style={styles.categoryText}>{item.category?.toUpperCase() || 'SỨC KHỎE'}</Text>
                            <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
                        </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: '#888', fontStyle: 'italic', paddingLeft: 16 }}>Chưa có bài viết nào cho chủ đề này...</Text>
                )}
              </ScrollView>
            </View>
          )}

          <View style={{height: 30}} />

          <View>
            <Text style={styles.sectionHeader}>Công Cụ Hỗ Trợ</Text>
            <View style={{height: 15}} />
            <View style={styles.gridContainer}>
              {[
                { title: 'Hít Thở 4-7-8', icon: 'lungs', color: '#009688', lib: FontAwesome5, route: '/tools/breathing' },
                { title: 'Thói Quen Hằng Ngày', icon: 'check-circle', color: '#3F51B5', lib: MaterialIcons, route: '/habits' },
                { title: 'Thiền Định', icon: 'spa', color: '#9C27B0', lib: MaterialIcons, route: '/tools/meditation' },
                { title: 'Pomodoro 25-5', icon: 'stopwatch', color: '#FF5722', lib: FontAwesome5, route: '/tools/pomodoro' },
              ].map((tool, index) => (
                <TouchableOpacity key={index} style={styles.toolCard} onPress={() => tool.route ? router.push(tool.route as any) : alert('Sắp ra mắt!')}>
                  <View style={[styles.toolIconBox, { backgroundColor: `${tool.color}15` }]}>
                      <tool.lib name={tool.icon as any} size={24} color={tool.color} />
                  </View>
                  <View style={{height: 10}} />
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  paddingGlobal: { paddingHorizontal: 16 },
  headerWrapper: { backgroundColor: Colors.light.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, elevation: 4, zIndex: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 10 },
  welcomeText: { fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  subText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  bellButton: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  redDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, backgroundColor: '#FF3D00', borderRadius: 5, borderWidth: 1.5, borderColor: '#FFF' },
  weeklyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 3, borderLeftWidth: 4, borderLeftColor: Colors.light.primary },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 15, color: '#666', lineHeight: 22 },
  
  sectionSub: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  chartContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 3, alignItems: 'center' },
  
  rankBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, marginBottom: 20, width: '100%', borderWidth: 1, borderColor: '#FDE68A' },
  rankIconBox: { width: 44, height: 44, backgroundColor: '#FEF9C3', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  rankTitle: { fontSize: 12, fontWeight: 'bold', color: '#B45309', marginBottom: 2, textTransform: 'uppercase' },
  rankText: { color: '#92400E', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  
  communityMotivation: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF7ED', padding: 12, borderRadius: 10, marginTop: 15, width: '100%' },
  motivationText: { color: '#C2410C', fontSize: 13, marginLeft: 8, flex: 1, lineHeight: 20 },

  featuredCardContainer: { borderRadius: 16, elevation: 5, overflow: 'hidden', backgroundColor: Colors.light.primary },
  featuredCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  featuredTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  featuredDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  tipCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', elevation: 3, marginBottom: 5 },
  tipImage: { width: '100%', height: 160, resizeMode: 'cover', backgroundColor: '#E0E0E0' },
  tipContent: { padding: 15 },
  tipBadge: { backgroundColor: '#E0F2F1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  tipBadgeText: { fontSize: 10, fontWeight: 'bold', color: Colors.light.primary },
  tipTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  tipDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  horizontalCard: { width: 220, backgroundColor: '#FFF', borderRadius: 12, marginRight: 15, marginBottom: 10, elevation: 3, overflow: 'hidden' },
  horizontalImage: { width: '100%', height: 110, resizeMode: 'cover', backgroundColor: '#E0E0E0' },
  horizontalContent: { padding: 12 },
  categoryText: { fontSize: 11, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 4 },
  articleTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', lineHeight: 20 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  toolCard: { width: (width - 32 - 12) / 2, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  toolIconBox: { padding: 10, borderRadius: 12, alignSelf: 'flex-start' },
  toolTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E1E8ED', borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: Colors.light.primary, elevation: 2, shadowColor: Colors.light.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 } },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#FFF' },
});