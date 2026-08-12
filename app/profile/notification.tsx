import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const [sound, setSound] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const soundSetting = await AsyncStorage.getItem('app_sound');
      if (soundSetting === 'false') setSound(false);
    } catch (e) { console.log(e); }
  };

  const SettingSwitch = ({ title, sub, val, onToggle, icon, color }: any) => (
    <View style={styles.item}>
      <View style={[styles.iconBox, { backgroundColor: color || '#E0F2F1' }]}>
        <Ionicons name={icon} size={22} color={Colors.light.primary} />
      </View>
      <View style={{flex: 1, marginRight: 10}}>
          <Text style={styles.itemTitle}>{title}</Text>
          {sub ? <Text style={styles.itemSub}>{sub}</Text> : null}
      </View>
      <Switch 
        value={val} 
        onValueChange={onToggle} 
        trackColor={{ false: "#E0E0E0", true: Colors.light.primary }}
        thumbColor={"#FFF"}
      />
    </View>
  );

  const SettingLink = ({ title, icon, onPress, valueText }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: '#F5F5F5' }]}>
        <Ionicons name={icon} size={22} color="#555" />
      </View>
      <View style={{flex: 1, marginRight: 10}}>
          <Text style={styles.itemTitle}>{title}</Text>
      </View>
      {valueText && <Text style={{color: '#888', marginRight: 10}}>{valueText}</Text>}
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cài Đặt Chung</Text>
          <View style={{width: 40}} /> 
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.sectionHeader}>Hệ thống</Text>
        <View style={styles.card}>
          <SettingSwitch 
            title="Âm thanh ứng dụng" 
            val={sound} 
            onToggle={setSound} 
            icon={sound ? "volume-high" : "volume-mute"} 
            color="#E1F5FE"
          />
          <View style={styles.divider} />
          <SettingLink 
            title="Ngôn ngữ" 
            icon="language" 
            valueText="Tiếng Việt" 
            onPress={() => Alert.alert("Thông báo", "Hiện tại chỉ hỗ trợ Tiếng Việt.")} 
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    elevation: 4, zIndex: 10,
    paddingBottom: 20
  },
  safeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 5, elevation: 2, marginBottom: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemSub: { fontSize: 13, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 66 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, marginLeft: 10, textTransform: 'uppercase' },
});