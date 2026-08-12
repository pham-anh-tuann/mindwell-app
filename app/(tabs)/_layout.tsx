import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={22} style={{ marginBottom: -3 }} {...props} />; 
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: '#999',
        
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0, 
          elevation: 10, 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          

          ...(Platform.OS === 'ios' && {
             height: 85,
             paddingBottom: 25,
          })
        },
        
        tabBarLabelStyle: {
          fontSize: 9, 
          fontWeight: '600',
          marginTop: 2, 
          paddingBottom: Platform.OS === 'android' ? 5 : 0, 
        }
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat AI',
          tabBarIcon: ({ color }) => <TabBarIcon name="chatbubbles-outline" color={color} />,
        }}
      />

      {/* 👇 ĐÃ THÊM CỬA VÀO PHÒNG CHAT CỘNG ĐỒNG CỦA SẾP 👇 */}
      <Tabs.Screen
        name="community"
        options={{
          title: 'Cộng đồng',
          tabBarIcon: ({ color }) => <TabBarIcon name="people-outline" color={color} />,
        }}
      />

      <Tabs.Screen
        name="mood"
        options={{
          title: 'Cảm xúc',
          tabBarIcon: ({ color }) => <TabBarIcon name="happy-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: 'Bài test',
          tabBarIcon: ({ color }) => <TabBarIcon name="stats-chart-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule" 
        options={{
          title: 'Lịch học', 
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}