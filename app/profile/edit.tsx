import { Colors } from '@/constants/Colors';
import { API_URL } from '@/utils/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Image,
  ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  
  const [phone, setPhone] = useState(''); 

  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null); 
  const [password, setPassword] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user_data');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setName(data.name || '');
        setEmail(data.email || '');
        setGender(data.gender || '');
        
        setPhone(data.phone || '');

        setImage(data.avatar || null); 
        if (data.dob) setDob(new Date(data.dob));
      }
    } catch (e) { console.log(e); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Lỗi', 'Cần quyền truy cập ảnh.');

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4, 
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      const uri = result.assets[0].uri;
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      
      setImage(uri); 
      setImageBase64(base64); 
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Lỗi', 'Tên không được để trống.');
    
    if (!gender) return Alert.alert('Lỗi', 'Vui lòng chọn giới tính của bạn.');
    
    if (phone.trim() && phone.trim().length < 9) {
      return Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (cần ít nhất 9 số).');
    }
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) {
        Alert.alert("Lỗi", "Phiên đăng nhập hết hạn.");
        return;
      }

      const updatePayload: any = {
        name: name,
        gender: gender,
        dob: dob,
        phone: phone.trim(), 
        ...(imageBase64 && { avatar: imageBase64 })
      };
      
      if (password) updatePayload.password = password;

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();

      if (response.ok) {
        const oldDataStr = await AsyncStorage.getItem('user_data');
        const oldData = oldDataStr ? JSON.parse(oldDataStr) : {};
        
        const newData = {
          ...oldData,
          name: data.name,
          gender: data.gender,
          dob: data.dob,
          phone: data.phone, 
          avatar: data.avatar 
        };

        await AsyncStorage.setItem('user_data', JSON.stringify(newData));

        Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!', [
            { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Thất bại', data.message || 'Lỗi server');
      }

    } catch (e) {
      console.log(e);
      Alert.alert('Lỗi', 'Không thể kết nối Server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh Sửa Hồ Sơ</Text>
          <TouchableOpacity onPress={handleSave} style={styles.navBtn} disabled={loading}>
             {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="checkmark" size={26} color="#FFF" />}
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <View style={styles.avatarAbsoluteContainer}>
        <TouchableOpacity style={styles.avatarCircle} onPress={pickImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatarImage} />
          ) : (
             <Text style={{fontSize: 30, color: Colors.light.primary, fontWeight: 'bold'}}>
                {name.charAt(0)?.toUpperCase() || 'U'}
             </Text>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{height: 60}} /> 

        <View style={styles.formCard}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
              placeholder="Nhập tên" 
            />
            
            <View style={styles.divider} />

           <Text style={styles.label}>Số điện thoại cá nhân</Text>
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone} 
              placeholder="VD: 0912345678" 
              keyboardType="phone-pad"
              maxLength={11}
            />
            <Text style={{fontSize: 12, color: '#aaa', fontStyle: 'italic', marginTop: 4}}>
              *Chuyên viên tâm lý MindWell sẽ liên hệ trực tiếp với bạn qua số này nếu kết quả bài test có dấu hiệu cảnh báo đỏ.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.label}>Ngày sinh</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>{dob ? format(dob, 'dd/MM/yyyy') : 'Chọn ngày sinh'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker 
                  value={dob || new Date()} 
                  mode="date" 
                  display="default" 
                  onChange={(e, d) => { setShowDatePicker(false); if(d) setDob(d); }} 
                />
            )}

            <View style={styles.divider} />

            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderRow}>
                {['Nam', 'Nữ', 'Khác'].map(g => (
                    <TouchableOpacity 
                      key={g} 
                      style={[styles.genderChip, gender === g && styles.genderActive]} 
                      onPress={() => setGender(g)}
                    >
                        <Text style={[styles.genderText, gender === g && {color: '#FFF'}]}>{g}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View style={[styles.formCard, {marginTop: 20}]}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, {color: '#999'}]} value={email} editable={false} />
        </View>
        <View style={{height: 40}} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    height: 140, 
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    zIndex: 0,
  },
  safeHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 16, paddingTop: 10 
  },
  navBtn: { padding: 8 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  avatarAbsoluteContainer: {
    position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center', zIndex: 100, elevation: 10,
  },
  avatarCircle: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', 
    justifyContent: 'center', alignItems: 'center', 
    borderWidth: 4, borderColor: '#F5F7FA', overflow: 'hidden', elevation: 5
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraIcon: { 
    position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.light.primary, 
    padding: 6, borderRadius: 12, borderWidth: 2, borderColor: '#FFF' 
  },

  content: { paddingHorizontal: 20, paddingTop: 10 },
  formCard: { 
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, 
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05
  },
  label: { fontSize: 13, color: '#888', marginBottom: 6, fontWeight: '600' },
  input: { fontSize: 16, color: '#333', paddingVertical: 4 },
  inputText: { fontSize: 16, color: '#333', paddingVertical: 4 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  genderRow: { flexDirection: 'row', marginTop: 4 },
  genderChip: { 
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, 
    backgroundColor: '#F5F7FA', marginRight: 10 
  },
  genderActive: { backgroundColor: Colors.light.primary },
  genderText: { color: '#666', fontSize: 14, fontWeight: '500' },
});