import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

interface RecenterButtonProps {
  onPress: () => void
  animatedPosition: SharedValue<number>
  screenHeight: number
}

export function RecenterButton({ onPress, animatedPosition, screenHeight }: RecenterButtonProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    bottom: screenHeight - animatedPosition.value + 16,
  }))

  return (
    <Animated.View style={[{ position: 'absolute', right: 16, zIndex: 100 }, animatedStyle]}>
      <TouchableOpacity
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 8,
        }}
        onPress={onPress}
      >
        <Text style={{ fontSize: 22, color: '#3b82f6', lineHeight: 26 }}>⌖</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
