import React from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'success' | 'info';
}

export default function CustomAlert({ 
  visible, 
  title, 
  message, 
  onClose,
  type = 'error' 
}: CustomAlertProps) {
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const iconName = 
    type === 'error' ? 'close-circle' : 
    type === 'success' ? 'checkmark-circle' : 'information-circle';
    
  const iconColor = 
    type === 'error' ? '#ef4444' : 
    type === 'success' ? '#10b981' : '#3b82f6';

  const buttonColor = 
    type === 'error' ? 'bg-red-500' : 
    type === 'success' ? 'bg-emerald-500' : 'bg-blue-500';

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <Animated.View 
          style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}
          className="bg-white rounded-3xl w-5/6 max-w-sm overflow-hidden shadow-2xl"
        >
          {/* Header Area */}
          <View className="items-center justify-center pt-8 pb-4">
            <Text className="text-2xl font-bold text-zinc-800 text-center px-4">{title}</Text>
          </View>
          
          {/* Message Content */}
          <View className="px-6 pb-6 items-center">
            <Text className="text-base text-zinc-500 text-center leading-relaxed">
              {message}
            </Text>
          </View>
          
          {/* Footer Action */}
          <View className="px-6 pb-6 w-full">
            <TouchableOpacity 
              onPress={onClose}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-2xl items-center justify-center ${buttonColor} shadow-sm`}
            >
              <Text className="text-white font-bold text-lg tracking-wide">OK</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
