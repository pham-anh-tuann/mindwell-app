import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const INHALE_TIME = 4000;
const HOLD_TIME = 7000;
const EXHALE_TIME = 8000;

export default function BreathingExerciseScreen() {
  const router = useRouter();
  
  const [isBreathing, setIsBreathing] = useState(false);
  const [instruction, setInstruction] = useState("Sẵn sàng thư giãn?");
  const [subInstruction, setSubInstruction] = useState("Nhấn Bắt đầu để tập thở 4-7-8");
  
  const isBreathingRef = useRef(false);
  const progress = useSharedValue(0); 

  const stopBreathing = () => {
    setIsBreathing(false);
    isBreathingRef.current = false;
    setInstruction("Sẵn sàng thư giãn?");
    setSubInstruction("Nhấn Bắt đầu để tập thở 4-7-8");
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 1000 });
  };

  const startBreathing = () => {
    setIsBreathing(true);
    isBreathingRef.current = true;
    runBreathingCycle();
  };

  const toggleBreathing = () => {
    if (isBreathing) stopBreathing();
    else startBreathing();
  };

  const runBreathingCycle = async () => {
    if (!isBreathingRef.current) return;

    setInstruction("Hít vào...");
    setSubInstruction("Cảm nhận bụng phình ra");
    progress.value = withTiming(1, { duration: INHALE_TIME, easing: Easing.inOut(Easing.quad) });
    await new Promise(r => setTimeout(r, INHALE_TIME));
    if (!isBreathingRef.current) return;

    setInstruction("Giữ hơi");
    setSubInstruction("Giữ yên tĩnh trong tâm trí");
    await new Promise(r => setTimeout(r, HOLD_TIME));
    if (!isBreathingRef.current) return;

    setInstruction("Thở ra...");
    setSubInstruction("Thở sạch mọi lo âu");
    progress.value = withTiming(0, { duration: EXHALE_TIME, easing: Easing.inOut(Easing.quad) });
    await new Promise(r => setTimeout(r, EXHALE_TIME));
    if (!isBreathingRef.current) return;

    runBreathingCycle();
  };

  useEffect(() => {
    return () => { isBreathingRef.current = false; cancelAnimation(progress); };
  }, []);


  const flowerStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.8]);
    const rotate = interpolate(progress.value, [0, 1], [0, 45]);
    const opacity = interpolate(progress.value, [0, 1], [0.3, 0.6]);

    return {
      transform: [
        { scale },
        { rotate: `${rotate}deg` }
      ],
      opacity: opacity,
    };
  });

  const coreStyle = useAnimatedStyle(() => {
     const rotate = interpolate(progress.value, [0, 1], [0, -20]);
     return {
         transform: [{ rotate: `${rotate}deg` }]
     };
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />

      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Hít Thở 4-7-8</Text>
            <View style={{width: 40}} /> 
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.breathingArea}>
          
          <Animated.View style={[styles.flowerBackground, flowerStyle]}>
             <MaterialCommunityIcons 
                name="weather-sunny" 
                size={220} 
                color={Colors.light.primary} 
             />
          </Animated.View>

          <Animated.View style={[styles.coreCircle, coreStyle]}>
             <MaterialCommunityIcons name="leaf" size={100} color={isBreathing ? "#FFF" : Colors.light.primary} />
          </Animated.View>

        </View>

        <View style={styles.instructionContainer}>
            <Text style={styles.mainText}>{instruction}</Text>
            <Text style={styles.subText}>{subInstruction}</Text>
        </View>

        <View style={{ alignItems: 'center', marginVertical: 30 }}>
            <TouchableOpacity 
                onPress={toggleBreathing}
                style={[
                    styles.actionBtn, 
                    { backgroundColor: isBreathing ? '#c12121' : Colors.light.primary }
                ]}
            >
                <Text style={styles.actionBtnText}>{isBreathing ? "Dừng Lại" : "Bắt Đầu"}</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Tại sao lại là 4-7-8?</Text>
            <Text style={styles.infoDesc}>
                Nhịp thở này hoạt động như một "liều thuốc an thần tự nhiên" cho hệ thần kinh.
            </Text>
            <View style={styles.divider} />
            <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>4s</Text></View>
                <Text style={styles.stepText}>Hít vào (Nạp năng lượng)</Text>
            </View>
            <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>7s</Text></View>
                <Text style={styles.stepText}>Giữ hơi (Trao đổi khí)</Text>
            </View>
            <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>8s</Text></View>
                <Text style={styles.stepText}>Thở ra (Thư giãn sâu)</Text>
            </View>
        </View>

        <View style={{height: 30}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

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

  content: { paddingBottom: 20 },

  breathingArea: { 
      height: 350, justifyContent: 'center', alignItems: 'center', 
      marginTop: 10 
  },
  flowerBackground: {
      position: 'absolute',
      justifyContent: 'center', alignItems: 'center',
      zIndex: -1, 
  },
  coreCircle: {
      width: 140, height: 140, borderRadius: 70,
      backgroundColor: '#FFF',
      justifyContent: 'center', alignItems: 'center',
      elevation: 8, shadowColor: Colors.light.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.25
  },

  instructionContainer: { alignItems: 'center', paddingHorizontal: 20 },
  mainText: { fontSize: 32, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 8 },
  subText: { fontSize: 16, color: '#666', fontWeight: '500' },

  actionBtn: {
      paddingVertical: 16, paddingHorizontal: 60, borderRadius: 30,
      elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3
  },
  actionBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

  infoCard: {
      backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 20, padding: 20,
      elevation: 2
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  infoDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#EEE', marginBottom: 15 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepBadge: { 
      width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', 
      justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  stepNum: { fontWeight: 'bold', color: Colors.light.primary },
  stepText: { fontSize: 16, color: '#333', fontWeight: '500' },
});