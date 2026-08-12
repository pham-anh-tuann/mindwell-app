import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../utils/apiConfig';

import RenderHtml from 'react-native-render-html';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const { width, height } = useWindowDimensions();
  
  const insets = useSafeAreaInsets();
  const paddingTopValue = Platform.OS === 'android' ? StatusBar.currentHeight : insets.top;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticleDetail();
  }, [id]);

  const fetchArticleDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/content/detail/${id}`); 
      const data = await response.json();
      if (response.ok) setArticle(data); 
    } catch (error) {
      console.log("Lỗi kết nối:", error);
    } finally {
      setLoading(false);
    }
  };

  const tagsStyles = {
    body: { fontSize: 16, lineHeight: 26, color: '#333' },
    strong: { fontWeight: 'bold', color: Colors.light.primary },
    p: { marginBottom: 15, textAlign: 'left' as const }, 
    h1: { fontSize: 22, fontWeight: 'bold', color: Colors.light.primary, marginTop: 10, marginBottom: 5 },
    h2: { fontSize: 20, fontWeight: 'bold', color: Colors.light.primary, marginTop: 10, marginBottom: 5 },
    h3: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary, marginTop: 10, marginBottom: 5 },
    li: { marginBottom: 8 },
    img: { marginTop: 15, marginBottom: 15, borderRadius: 8 }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} /> 
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={60} color="#CCC" />
          <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>Không tìm thấy bài viết.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: Colors.light.primary, marginTop: 20, fontWeight: 'bold' }}>Quay lại trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const cleanHtmlContent = article.bodyContent 
    ? article.bodyContent
        .replace(/<\/?span[^>]*>/gi, '') 
        .replace(/&nbsp;/g, ' ')         
        .replace(/\u00A0/g, ' ')        
        .replace(/\u200B/g, '')     
        .replace(/justify/gi, "left")   
        .replace(/text-align:\s*center/gi, "text-align:left")
    : "";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.imageContainer}>
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          
          <View style={[styles.topButtons, { paddingTop: (paddingTopValue || 0) + 15 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                  {article.type === 'tip' ? 'GỢI Ý' : 'KIẾN THỨC'}
              </Text>
            </View>
            <Text style={styles.title}>{article.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="#EEE" />
              <Text style={styles.metaText}>5 phút đọc</Text> 
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {cleanHtmlContent ? (
            <RenderHtml
              contentWidth={width - 48}
              source={{ html: cleanHtmlContent }}
              tagsStyles={tagsStyles as any}
              baseStyle={{ textAlign: 'left' }}
              defaultTextProps={{ 
                textBreakStrategy: 'simple',
                android_hyphenationFrequency: 'none',
              } as any}
            />
          ) : (
            <Text style={styles.paragraph} textBreakStrategy="simple">
              {article.description}
            </Text>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  imageContainer: { height: 300, width: '100%', position: 'relative' }, 
  
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  
  topButtons: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', flexDirection: 'row', paddingHorizontal: 20, zIndex: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  
  titleContainer: { position: 'absolute', bottom: 45, left: 20, right: 20, zIndex: 10 },
  
  categoryBadge: { backgroundColor: Colors.light.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  categoryText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8, lineHeight: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#EEE', fontSize: 13, marginLeft: 6 },
  
  contentContainer: { padding: 24, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20 },
  
  paragraph: { fontSize: 16, color: '#333', lineHeight: 26, marginBottom: 12, textAlign: 'left' },
});