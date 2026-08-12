import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      <View style={styles.headerContainer}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Về MindWell</Text>
            
            <View style={{width: 40}} /> 
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.content}>
        
        <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="leaf" size={70} color={Colors.light.primary} />
        </View>

        <Text style={styles.appName}>MindWell</Text>
        <Text style={styles.version}>Phiên bản 1.0.0</Text>

        <Text style={styles.description}>
          MindWell là ứng dụng hỗ trợ sức khỏe tâm lý dành cho sinh viên, cung cấp các công cụ đánh giá, theo dõi tâm trạng, bài tập thư giãn và kết nối với trợ lý AI.
        </Text>

        <View style={{flex: 1}} /> 
        
        <Text style={styles.copyright}>
          © 2025 [Nguyễn Thị Minh Ngọc/Ba con giời]. All rights reserved.
        </Text>
        <View style={{height: 20}} />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },

  headerContainer: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 20, 
    elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2
  },
  
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingTop: 10 
  },

  backBtn: { 
    width: 40, height: 40, 
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.15)' 
  },
  
  headerTitle: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
  },

  content: { 
    flex: 1, 
    alignItems: 'center', 
    paddingHorizontal: 30, 
    paddingTop: 50 
  },

  logoContainer: { marginBottom: 15 },
  
  appName: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: Colors.light.primary, 
    marginBottom: 5 
  },
  
  version: { fontSize: 14, color: '#999', marginBottom: 30 },

  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },

  copyright: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10
  },
});