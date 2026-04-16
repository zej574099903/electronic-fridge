import React from 'react';
import { Text, TextStyle, ViewProps } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientTextProps extends ViewProps {
  colors: string[];
  style?: TextStyle;
  children: string | React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientText = ({ 
  colors, 
  style, 
  children, 
  start = { x: 0, y: 0.5 }, 
  end = { x: 1, y: 0.5 },
  ...props 
}: GradientTextProps) => {
  return (
    <MaskedView
      {...props}
      maskElement={
        <Text style={[style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
      >
        <Text style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};
