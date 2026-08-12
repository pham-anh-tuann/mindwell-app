import { API_URL } from '@/utils/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bubble, GiftedChat, IMessage, InputToolbar, Send } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io } from "socket.io-client";

const GiftedChatComponent = GiftedChat as any;
const SOCKET_URL = API_URL.replace('/api', ''); 
const socket = io(SOCKET_URL);

const FreshGreen = '#10B981';
const FreshBlue = '#0284C7'; 

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  useEffect(() => {
    setup();

    socket.on("receive_community_msg", (newMsg: any) => {
      setMessages(prev => GiftedChat.append(prev, [{
        ...newMsg,
        createdAt: new Date(newMsg.createdAt)
      }]));
    });

    socket.on("msg_deleted", ({ msgId }: { msgId: string }) => {
      setMessages(prev => prev.map(m => 
        m._id === msgId ? { ...m, text: 'Tin nhắn đã được thu hồi', isDeleted: true } : m
      ));
    });

    socket.on("msg_reacted", ({ msgId, reactions }: any) => {
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions } : m));
    });

    socket.on("someone_typing", (name: string) => setTypingUser(name));
    socket.on("someone_stopped_typing", () => setTypingUser(null));
    
    socket.on("system_warning", (warningMsg: { title: string, message: string }) => {
      Alert.alert(warningMsg.title, warningMsg.message, [{ text: "Tôi hiểu" }]);
    });

    return () => {
      socket.off("receive_community_msg");
      socket.off("msg_deleted");
      socket.off("msg_reacted");
      socket.off("someone_typing");
      socket.off("someone_stopped_typing");
      socket.off("system_warning");
    };
  }, []);

  const setup = async () => {
    await loadUser();
    await loadHistory();
  };

  const loadUser = async () => {
    const userDataStr = await AsyncStorage.getItem('user_data');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      const profile = userData.user || userData;
      setUser({
        _id: profile.id || profile._id,
        name: profile.name || "Đồng đạo ẩn danh",
        avatar: profile.avatar || 'https://cdn-icons-png.flaticon.com/512/924/924874.png',
      });
    }
  };

  const loadHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const res = await fetch(`${API_URL}/community/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        const formattedHistory = json.data.map((msg: any) => ({
          _id: msg._id, 
          text: msg.isDeleted ? 'Tin nhắn đã được thu hồi' : msg.text, 
          createdAt: new Date(msg.createdAt), 
          user: msg.user,
          isDeleted: msg.isDeleted,
          reactions: msg.reactions || []
        }));
        setMessages(formattedHistory);
      }
    } catch (error) {
      console.log("Lỗi tải lịch sử cộng đồng:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSend = useCallback((newMsgs: IMessage[] = []) => {
    const msg = newMsgs[0];
    socket.emit("send_community_msg", {
      text: msg.text,
      user: { _id: user._id, name: user.name, avatar: user.avatar }
    });
    socket.emit("stop_typing");
  }, [user]);

  const renderBubble = (props: any) => {
    const isMyMessage = props.position === 'right';
    const isDeleted = props.currentMessage.isDeleted;
    const reactions = props.currentMessage.reactions || [];

    const bubbleContent = (isMyMessage && !isDeleted) ? (
      <LinearGradient
        colors={[FreshBlue, FreshGreen]} 
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, overflow: 'hidden' }}
      >
        <Bubble {...props} wrapperStyle={{ right: { backgroundColor: 'transparent' } }} textStyle={{ right: { color: '#FFFFFF', fontWeight: '500' } }} renderCustomView={() => null} />
      </LinearGradient>
    ) : (
      <Bubble
        {...props}
        wrapperStyle={{ 
            left: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
            right: isDeleted ? { backgroundColor: '#ECFDF5', borderRadius: 20, borderWidth: 1, borderColor: FreshGreen, borderStyle: 'dashed', padding: 2 } : {}
        }}
        textStyle={{ left: { color: '#1E293B' }, right: { color: isDeleted ? '#94A3B8' : '#FFFFFF' } }}
        renderCustomView={() => null}
        renderMessageText={isDeleted ? () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
            <Ionicons name="ban-outline" size={14} color={isMyMessage ? '#A7F3D0' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text style={{ fontStyle: 'italic', color: isMyMessage ? '#A7F3D0' : '#94A3B8', fontSize: 13 }}>Tin nhắn đã được thu hồi</Text>
          </View>
        ) : undefined}
      />
    );

    return (
      <View style={{ 
          flexDirection: isMyMessage ? 'row-reverse' : 'row', 
          alignItems: 'center', 
          marginBottom: reactions.length > 0 ? 15 : 2 
      }}>
        
        {/* Khối chứa Bong bóng và Cảm xúc */}
        <View style={{ position: 'relative' }}>
          {bubbleContent}

          {/* Cảm xúc đính mép dưới chuẩn Zalo/FB */}
          {reactions.length > 0 && (
            <View style={[styles.floatingReactionContainer, isMyMessage ? { right: 10 } : { left: 10 }]}>
              {reactions.map((r: any, index: number) => (
                <Text key={index} style={{ fontSize: 12, marginHorizontal: 2 }}>{r.emoji}</Text>
              ))}
            </View>
          )}
        </View>

        {!isDeleted && (
          <TouchableOpacity 
            style={{ padding: 6, marginHorizontal: 4 }} 
            onPress={() => setSelectedMessage(props.currentMessage)}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleInputTextChanged = (text: string) => {
    if (text.length > 0) {
      socket.emit("typing", { name: user?.name || "Ai đó" });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socket.emit("stop_typing"), 2000);
    } else {
      socket.emit("stop_typing");
    }
  };

  const renderFooter = () => (typingUser ? (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>{typingUser} đang gõ...</Text>
    </View>
  ) : null);

  const renderInputToolbar = (props: any) => (
    <InputToolbar {...props} containerStyle={styles.inputToolbar} primaryStyle={{ alignItems: 'center' }} />
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 50 : 0} 
      >
        <View style={[styles.announcement, { marginTop: insets.top + 10 }]}>
            <Ionicons name="sparkles" size={18} color="#D97706" />
            <Text style={styles.announcementText}>Hãy chia sẻ văn minh để cùng nhau tốt hơn nhé! ✨</Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {/* Đã đồng bộ màu vòng xoay Load với nút Gửi */}
              <ActivityIndicator size="large" color={FreshGreen} />
          </View>
        ) : (
          <GiftedChatComponent
            messages={messages}
            onSend={(msgs: any) => onSend(msgs)}
            user={user}
            renderUsernameOnMessage={true}
            renderBubble={renderBubble}
            renderFooter={renderFooter}
            renderInputToolbar={renderInputToolbar}
            onInputTextChanged={handleInputTextChanged}
            renderSend={(props: any) => (
                <Send {...props} containerStyle={{ justifyContent: 'center' }}>
                    <View style={styles.sendBtn}>
                        <Ionicons name="send" size={24} color={FreshGreen} />
                    </View>
                </Send>
            )}
          />
        )}
      </KeyboardAvoidingView>

      {/* Modal Menu Sang Trọng (Vẫn Giữ Nguyên Vì UX Quá Đỉnh) */}
      <Modal
        visible={!!selectedMessage}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMessage(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tùy chọn tin nhắn</Text>

            {user && selectedMessage?.user._id === user._id ? (
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => {
                  socket.emit('delete_msg', { msgId: selectedMessage._id });
                  setSelectedMessage(null);
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                <Text style={styles.actionTextDanger}>Thu hồi tin nhắn</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emojiRow}>
                {['❤️', '👍', '🙌', '😂', '🥺','😠'].map(emoji => (
                  <TouchableOpacity 
                    key={emoji} 
                    style={styles.emojiBtn}
                    onPress={() => {
                      socket.emit('react_msg', { msgId: selectedMessage._id, userId: user._id, userName: user.name, emoji });
                      setSelectedMessage(null);
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedMessage(null)}>
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  announcement: { 
    flexDirection: 'row', backgroundColor: '#FEF3C7', padding: 12, marginHorizontal: 15, 
    marginBottom: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A',
  },
  announcementText: { fontSize: 13, color: '#92400E', marginLeft: 8, fontWeight: '500' },
  sendBtn: { marginRight: 15, marginBottom: 5, padding: 5 },
  typingContainer: { paddingHorizontal: 15, paddingVertical: 8 },
  typingText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  inputToolbar: { backgroundColor: '#FFFFFF', borderTopWidth: 0, paddingVertical: 4 },
  
  floatingReactionContainer: { 
    position: 'absolute', 
    bottom: -10, 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    paddingHorizontal: 6, 
    paddingVertical: 3, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, 
    zIndex: 999 
  },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, elevation: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 16, marginBottom: 15 },
  actionTextDanger: { color: '#EF4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25, marginTop: 10 },
  emojiBtn: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 50, borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtn: { backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  cancelText: { color: '#475569', fontSize: 16, fontWeight: 'bold' }
});