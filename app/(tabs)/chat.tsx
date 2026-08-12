import { API_URL } from '@/utils/apiConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import { Bubble, Composer, GiftedChat, IMessage, InputToolbar, Send } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GiftedChatComponent = GiftedChat as any;
const { width } = Dimensions.get('window');

const BOT_ID = 2;
const BOT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'; 

const HeaderGreen = '#047857'; 
const FreshGreen = '#10B981';  
const FreshBlue = '#0284C7'; 

const SUGGESTIONS = [
  { id: 1, text: '🌿 Giúp tôi thư giãn', icon: 'leaf' },
  { id: 2, text: '😟 Tôi thấy lo âu', icon: 'sad' },
  { id: 3, text: '💤 Mẹo ngủ ngon', icon: 'moon' },
  { id: 4, text: '🎯 Lời khuyên', icon: 'bulb' },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets(); 
  const HEADER_HEIGHT = 60; 
  const KEYBOARD_OFFSET = Platform.OS === 'ios' ? HEADER_HEIGHT + insets.top : 0;

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const [isCallMode, setIsCallMode] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [siriSubtitle, setSiriSubtitle] = useState('Chạm và giữ nút Micro để tâm sự với mình nhé!');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const userIdRef = useRef<number | null>(null);
  const params = useLocalSearchParams();
  const hasAutoChatted = useRef(false);
  
  useEffect(() => {
    loadInitialData();
    setupAudioMode(true);
    return () => { Speech.stop(); };
  }, []);

  useEffect(() => {
    if (params.autoChat === 'true' && params.testTitle && !hasAutoChatted.current) {
      hasAutoChatted.current = true; 
      setShowSuggestions(false);
      const autoPrompt = `Mình vừa làm bài test "${params.testTitle}" và đạt ${params.testScore} điểm. Kết luận là: ${params.testResult}. Bạn phân tích và cho mình lời khuyên nhé?`;
      const newUserMsg: IMessage = { _id: Date.now().toString(), text: autoPrompt, createdAt: new Date(), user: { _id: 1 } };
      setMessages(previousMessages => GiftedChat.append(previousMessages, [newUserMsg]));
      handleBotResponseText(autoPrompt); 
    }
  }, [params.autoChat, params.testTitle]); 

  const setupAudioMode = async (speaker: boolean) => {
    try {
      await Audio.setIsEnabledAsync(false);
      await Audio.setIsEnabledAsync(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, 
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: !speaker,
        shouldDuckAndroid: false,
        interruptionModeIOS: 1, 
        interruptionModeAndroid: 1,
      });
    } catch (e) { console.log("Lỗi Setup Audio:", e); }
  };

  const toggleSpeaker = async () => {
    const newState = !isSpeakerOn;
    setIsSpeakerOn(newState);
    await setupAudioMode(newState);
  };

  const loadInitialData = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) return;
      const response = await fetch(`${API_URL}/chat/history`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      });
      const responseData = await response.json(); 
      if (response.ok && responseData.success && Array.isArray(responseData.data)) {
        const historyMessages: IMessage[] = [];
        responseData.data.forEach((chat: any) => {
          
          historyMessages.push({
            _id: `user_${chat._id}`, 
            text: chat.message, 
            audio: chat.audioUrl ? `${API_URL}${chat.audioUrl}` : undefined, 
            createdAt: new Date(chat.createdAt), 
            user: { _id: 1 },
          });

          if (chat.response) {
            const botTime = new Date(chat.createdAt).getTime() + 100; 
            const cleanResponse = chat.response.replace(/\*\*/g, '').replace(/### /g, '');
            historyMessages.push({
              _id: `bot_${chat._id}`, text: cleanResponse, createdAt: new Date(botTime), user: { _id: BOT_ID, name: 'MindWell', avatar: BOT_AVATAR },
            });
          }
        });
        historyMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMessages(historyMessages);
      }
    } catch (e) { console.log("Lỗi tải lịch sử:", e); }
  };

  const speakWithAIVoice = async (text: string) => {
    Speech.stop();

    try {
      await setupAudioMode(isSpeakerOn);
    } catch (e) { console.log(e); }

    setTimeout(() => {
      Speech.speak(text, {
        language: 'vi-VN',
        rate: Platform.OS === 'ios' ? 1.15 : 1.0, 
        pitch: 1.0,
        volume: 1.0, 
        onDone: () => {
          if (isCallMode) setCallState('idle');
        },
      });
    }, 800); 
  };

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    Speech.stop(); 
    setShowSuggestions(false); 
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    const userText = newMessages[0].text;
    handleBotResponseText(userText);
  }, []);

  const startRecording = async () => {
    Speech.stop(); 
    if (isCallMode) {
      setCallState('listening');
      setSiriSubtitle('Mình đang lắng nghe bạn nói...');
    }
    
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ 
          allowsRecordingIOS: true, 
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false 
        });
        
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording; 
        setIsRecording(true); 
      } else {
        Alert.alert("Cấp quyền", "MindWell cần bạn cấp quyền Micro để lắng nghe bạn nhé!");
      }
    } catch (err) {
      console.error('Lỗi khi bắt đầu ghi âm:', err);
      recordingRef.current = null;
      setIsRecording(false);
      if (isCallMode) {
        setCallState('idle');
        setSiriSubtitle('Lỗi Micro rồi, bạn thử lại nhé!');
      }
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recordingRef.current) {
      setIsRecording(false);
      if (isCallMode) setCallState('idle');
      return; 
    }
    setIsRecording(false); 
    if (isCallMode) {
      setCallState('thinking');
      setSiriSubtitle('Đợi mình phân tích một chút nhé...');
    }
    
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null; 
      
      await setupAudioMode(isSpeakerOn);

      if (uri) sendVoiceToServer(uri);
    } catch (error) {
      recordingRef.current = null;
      if (isCallMode) {
        setCallState('idle');
        setSiriSubtitle('Lỗi thu âm, bạn nói lại nha.');
      }
    }
  };

  const sendVoiceToServer = async (uri: string) => {
    setIsTyping(true);
    setShowSuggestions(false);
    const audioMsgPlaceholder: IMessage = { _id: Date.now().toString(), text: "🎤 Đang phân tích tin nhắn thoại...", createdAt: new Date(), user: { _id: 1 } };
    
    if (!isCallMode) setMessages(previous => GiftedChat.append(previous, [audioMsgPlaceholder]));

    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) return;

      const historyData = messages
        .filter(msg => msg.text && !msg.text.includes("Đang phân tích")) 
        .slice(0, 6) 
        .reverse()   
        .map(msg => ({
          role: msg.user._id === 1 ? 'user' : 'assistant',
          content: msg.text
        }));

      const formData = new FormData();
      formData.append('audio', { uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, type: 'audio/m4a', name: 'voice_msg.m4a' } as any);
      formData.append('history', JSON.stringify(historyData));
      formData.append('isCallMode', isCallMode ? 'true' : 'false'); 

      const response = await fetch(`${API_URL}/chat/voice-chat`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await response.json();

      if (!isCallMode) setMessages(previous => previous.filter(msg => msg._id !== audioMsgPlaceholder._id));

      if (response.ok && data.success) {
        const cleanReply = data.data.aiReply.replace(/\*\*/g, '').replace(/### /g, '');
        
        if (isCallMode) {
          setCallState('speaking');
          setSiriSubtitle(cleanReply); 
          speakWithAIVoice(cleanReply);
        } else {
          const userVoiceMsg: IMessage = { _id: Math.round(Math.random() * 1000000).toString(), text: '', audio: uri, createdAt: new Date(), user: { _id: 1 } };
          const botMsg: IMessage = { _id: (Math.round(Math.random() * 1000000) + 1).toString(), text: cleanReply, createdAt: new Date(new Date().getTime() + 1000), user: { _id: BOT_ID, name: 'MindWell', avatar: BOT_AVATAR } };
          setMessages(previous => GiftedChat.append(previous, [botMsg, userVoiceMsg]));
        }
      } else {
        throw new Error(data.message || "Lỗi AI Phân tích");
      }
    } catch (error) {
      if (isCallMode) {
        setCallState('idle'); 
        setSiriSubtitle('Kết nối mạng yếu quá, bạn thử lại nhé!');
      } else {
        setMessages(previous => previous.filter(msg => msg._id !== audioMsgPlaceholder._id));
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleBotResponseText = async (text: string) => {
    setIsTyping(true);
    try {
      const token = await AsyncStorage.getItem('user_token'); 
      if (!token) return;
      const response = await fetch(`${API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ message: text }) });
      const data = await response.json();

      if (response.ok) {
        const cleanReply = data.response.replace(/\*\*/g, '').replace(/### /g, '');
        const botMsg: IMessage = { _id: Math.round(Math.random() * 1000000), text: cleanReply, createdAt: new Date(), user: { _id: BOT_ID, name: 'MindWell', avatar: BOT_AVATAR } };
        setMessages(previous => GiftedChat.append(previous, [botMsg]));
      }
    } catch (error) { console.error("Lỗi Chat:", error); } 
    finally { setIsTyping(false); }
  };

  const onSuggestionPress = (text: string) => {
    const msg: IMessage = { _id: Math.round(Math.random() * 1000000).toString(), text: text, createdAt: new Date(), user: { _id: 1 } };
    onSend([msg]);
  };

  const playSound = async (uri: string, msgId: string) => {
    Speech.stop();
    try {
      setPlayingAudioId(msgId);
      await setupAudioMode(isSpeakerOn);

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1.0 });
      await sound.setVolumeAsync(1.0);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setPlayingAudioId(null);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      setPlayingAudioId(null);
    }
  };

  const renderBubble = (props: any) => {
    if (props.position === 'right') {
      return (
        <LinearGradient colors={[FreshBlue, FreshGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 5 }}>
          <Bubble {...props} wrapperStyle={{ right: { backgroundColor: 'transparent' } }} textStyle={{ right: { color: '#FFFFFF', fontWeight: '500' } }} renderCustomView={() => null} />
        </LinearGradient>
      );
    }
    return <Bubble {...props} wrapperStyle={{ left: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 5 } }} textStyle={{ left: { color: '#1E293B', lineHeight: 22 } }} />;
  };

  const renderInputToolbar = (props: any) => (
    <InputToolbar {...props} containerStyle={{ backgroundColor: '#F7F9FC', borderTopWidth: 0, paddingHorizontal: 12, paddingBottom: Platform.OS === 'ios' ? 0 : 4 }} primaryStyle={{ alignItems: 'center' }} />
  );

  const renderSend = (props: any) => {
    if (props.text && props.text.trim().length > 0) {
      return (
        <Send {...props} containerStyle={{ justifyContent: 'center', marginBottom: 8, marginLeft: 8 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: FreshGreen, justifyContent: 'center', alignItems: 'center', elevation: 2 }}>
            <Ionicons name="arrow-up" size={24} color="#FFF" />
          </View>
        </Send>
      );
    }
    return (
      <View style={{ justifyContent: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
        <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecordingAndSend} activeOpacity={0.8} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isRecording ? '#EF4444' : '#E2E8F0', justifyContent: 'center', alignItems: 'center', transform: [{ scale: isRecording ? 1.2 : 1 }] }}>
          <Ionicons name="mic" size={24} color={isRecording ? '#FFF' : FreshGreen} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderComposer = (props: any) => (
    <Composer {...props} textInputStyle={{ color: '#333', backgroundColor: '#FFF', borderRadius: 24, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 16, marginLeft: 0, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 16, lineHeight: 22 }} placeholder={isRecording ? "Đang ghi âm..." : "Nhập tin nhắn..."} multiline />
  );

  const renderAccessory = () => {
    if (!showSuggestions) return null;
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestTitle}>Gợi ý nhanh:</Text>
        <View style={styles.chipsRow}>
          {SUGGESTIONS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.chip} onPress={() => onSuggestionPress(item.text)}>
              <Ionicons name={item.icon as any} size={14} color={FreshGreen} style={{marginRight: 5}} />
              <Text style={styles.chipText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const endCall = () => {
    setIsCallMode(false); 
    Speech.stop(); 
    setCallState('idle');
    setSiriSubtitle('Chạm và giữ nút Micro để tâm sự với mình nhé!');
  };

  return (
    <View style={styles.container}>
      <StatusBar 
  barStyle="light-content" 
  backgroundColor="transparent" 
  translucent={true}           
/>
      
      <View style={[
  styles.header, 
  { 
    paddingTop: insets.top + (Platform.OS === 'android' ? 15 : 10), 
    height: 70 + insets.top 
  }
]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarBorder}>
             <Image source={{ uri: BOT_AVATAR }} style={styles.avatarImg} />
             <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.botName}>MindWell AI</Text>
            <Text style={styles.botStatus}>Luôn lắng nghe</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setIsCallMode(true)} style={[styles.clearBtn, { marginRight: 10, backgroundColor: 'rgba(16, 185, 129, 0.4)' }]}>
            <Ionicons name="call" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMessages([]); setShowSuggestions(true); Speech.stop(); }} style={styles.clearBtn}>
            <MaterialCommunityIcons name="broom" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <Image source={{ uri: 'https://img.freepik.com/free-vector/white-abstract-background-design_23-2148825582.jpg' }} style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]} resizeMode="cover" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={KEYBOARD_OFFSET}>
          <GiftedChatComponent
            messages={messages} onSend={(msgs: any) => onSend(msgs)} user={{ _id: 1 }} renderBubble={renderBubble}
            renderMessageAudio={(props: any) => {
              const isMe = props.position === 'right';
              const audioUri = props.currentMessage.audio;
              const isPlaying = playingAudioId === props.currentMessage._id;
              return (
                <TouchableOpacity activeOpacity={0.7} onPress={() => { if (!isPlaying && audioUri) playSound(audioUri, props.currentMessage._id.toString()); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, width: 160 }}>
                  <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={28} color={isMe ? '#FFF' : FreshGreen} />
                  <View style={{ flex: 1, height: 3, backgroundColor: isMe ? 'rgba(255,255,255,0.4)' : '#E2E8F0', marginHorizontal: 8, borderRadius: 2 }}>
                     <View style={{ width: isPlaying ? '100%' : '40%', height: '100%', backgroundColor: isMe ? '#FFF' : FreshGreen, borderRadius: 2 }} />
                  </View>
                  <Text style={{ color: isMe ? '#FFF' : '#64748B', fontSize: 12 }}>{isPlaying ? 'Đang phát' : 'Nghe'}</Text>
                </TouchableOpacity>
              );
            }}
            renderInputToolbar={renderInputToolbar} renderSend={renderSend} renderComposer={renderComposer} renderAccessory={renderAccessory} 
            minInputToolbarHeight={60} alwaysShowSend scrollToBottom isKeyboardInternallyHandled={false} 
            listViewProps={{ contentContainerStyle: { paddingBottom: 20, paddingTop: 20 }, showsVerticalScrollIndicator: false }}
          />
        </KeyboardAvoidingView>
      </View>

      <Modal 
  visible={isCallMode} 
  animationType="fade" 
  transparent={true}
  statusBarTranslucent={true} 
>
        <LinearGradient colors={['#0F172A', '#064E3B']} style={styles.callModalContainer}>
          <View style={styles.callContent}>
            
            <View style={[styles.avatarGlowContainer, callState === 'speaking' && styles.avatarSpeakingGlow]}>
               <Image source={{ uri: BOT_AVATAR }} style={styles.callAvatar} />
            </View>
            <Text style={styles.callName}>Dr. Mind</Text>
            
            <View style={styles.subtitleWrapper}>
               <Text style={[styles.subtitleText, callState === 'idle' ? { opacity: 0.6, fontStyle: 'italic', fontWeight: '400' } : { opacity: 1 }]}>
                 {siriSubtitle}
               </Text>
            </View>

            <View style={styles.callActionsContainer}>
               <TouchableOpacity onPress={endCall} style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}>
                  <MaterialCommunityIcons name="phone-hangup" size={30} color="#FFF" />
               </TouchableOpacity>

               <TouchableOpacity 
                  onPressIn={startRecording} onPressOut={stopRecordingAndSend} activeOpacity={0.8}
                  style={[ 
                    styles.giantMicBtn, 
                    callState === 'listening' ? { backgroundColor: '#F59E0B', transform: [{ scale: 1.1 }] } : 
                    callState === 'speaking' ? { backgroundColor: FreshBlue } : 
                    { backgroundColor: FreshGreen } 
                  ]}
                >
                  {callState === 'thinking' ? <MaterialCommunityIcons name="brain" size={44} color="#FFF" /> : callState === 'speaking' ? <Ionicons name="volume-medium" size={44} color="#FFF" /> : <Ionicons name="mic" size={44} color="#FFF" />}
               </TouchableOpacity>
               
               <TouchableOpacity 
                  onPress={toggleSpeaker} 
                  style={[styles.actionBtn, { backgroundColor: isSpeakerOn ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.5)' }]}
                >
                  <Ionicons name={isSpeakerOn ? "volume-high" : "volume-medium"} size={30} color={isSpeakerOn ? "#FFF" : "#94A3B8"} />
               </TouchableOpacity>
            </View>

          </View>
        </LinearGradient>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: HeaderGreen }, 
  header: { paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: HeaderGreen, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, zIndex: 10, elevation: Platform.OS === 'android' ? 10 : 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  avatarBorder: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  onlineDot: { width: 12, height: 12, backgroundColor: '#4CAF50', borderRadius: 6, borderWidth: 2, borderColor: HeaderGreen, position: 'absolute', bottom: 0, right: 0 },
  botName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  botStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  clearBtn: { width: 42, height: 42, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1, backgroundColor: '#F8FAFC', marginTop: -20, paddingTop: 20, zIndex: 1 },
  suggestionsContainer: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: 'transparent' }, 
  suggestTitle: { fontSize: 13, color: '#64748B', marginBottom: 8, marginLeft: 4, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0', elevation: Platform.OS === 'android' ? 3 : 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1 },
  chipText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  callModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callContent: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  avatarGlowContainer: { padding: 6, borderRadius: 100, backgroundColor: 'transparent' },
  avatarSpeakingGlow: { backgroundColor: 'rgba(16, 185, 129, 0.4)', elevation: Platform.OS === 'android' ? 25 : 20, shadowColor: FreshGreen, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.9, shadowRadius: 35 },
  callAvatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#FFF' },
  callName: { fontSize: 32, fontWeight: '800', color: '#FFF', marginTop: 15, marginBottom: 30, letterSpacing: 1.5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 5 },
subtitleWrapper: {
  backgroundColor: 'rgba(255,255,255,0.12)', 
  padding: 25,
  borderRadius: 25,
  width: '90%',
  minHeight: 140,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 70,
  borderWidth: 1.5, 
  borderColor: 'rgba(255,255,255,0.2)', 
  
  elevation: 0, 
  
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 20,
},

subtitleText: { 
  fontSize: 20, 
  color: '#FFFFFF', 
  textAlign: 'center', 
  lineHeight: 32, 
  fontWeight: '600', 
  textShadowColor: 'rgba(0, 0, 0, 0.5)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
},
  callActionsContainer: { position: 'absolute', bottom: 60, flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', alignItems: 'center' },
  actionBtn: { width: 66, height: 66, borderRadius: 33, justifyContent: 'center', alignItems: 'center', elevation: Platform.OS === 'android' ? 8 : 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3 },
  giantMicBtn: { width: 94, height: 94, borderRadius: 47, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: Platform.OS === 'android' ? 15 : 10, borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)' },
});