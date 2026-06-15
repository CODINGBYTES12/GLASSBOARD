import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, ViewStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  status?: 'on_track' | 'delayed' | 'blocked';
  showLabel?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  status = 'on_track', 
  showLabel = true,
  style
}) => {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 550,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const getStatusColor = () => {
    switch (status) {
      case 'on_track':
        return '#10B981'; // Emerald Green
      case 'delayed':
        return '#F59E0B'; // Amber Orange
      case 'blocked':
        return '#EF4444'; // Crimson Red
      default:
        return '#8B5CF6'; // Violet
    }
  };

  const statusColor = getStatusColor();
  const widthInterpolation = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>
            Status:{' '}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status.toUpperCase().replace('_', ' ')}
            </Text>
          </Text>
          <Text style={[styles.progressText, { color: statusColor }]}>
            {progress}%
          </Text>
        </View>
      )}
      <View style={styles.track}>
        <Animated.View 
          style={[
            styles.fill, 
            { 
              width: widthInterpolation, 
              backgroundColor: statusColor,
              shadowColor: statusColor,
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 13,
    color: '#94A3B8', // light slate text
    fontWeight: '500',
  },
  statusText: {
    fontWeight: '700',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    // Add subtle glow on web
    ...{
      boxShadow: '0 0 8px currentColor',
    } as any,
  },
});

export default ProgressBar;
