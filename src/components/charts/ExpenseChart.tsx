import * as React from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  LinearGradient,
  vec,
  Skia,
} from '@shopify/react-native-skia';
import { useSharedValue, withTiming, withDelay } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 150;
const CHART_WIDTH = width - 80;

interface ChartProps {
  data: number[];
}

export const ExpenseChart: React.FC<ChartProps> = ({ data }) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(500, withTiming(1, { duration: 1500 }));
  }, [data]);

  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = CHART_WIDTH / (data.length - 1);

  const points = data.map((val, i) => ({
    x: i * stepX,
    y: CHART_HEIGHT - ((val - min) / range) * CHART_HEIGHT,
  }));

  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((p) => {
    path.lineTo(p.x, p.y);
  });

  return (
    <View
      style={{ height: CHART_HEIGHT, width: CHART_WIDTH, marginVertical: 20 }}
    >
      <Canvas style={{ flex: 1 }}>
        <Path
          path={path}
          style="stroke"
          strokeWidth={4}
          strokeJoin="round"
          strokeCap="round"
          start={0}
          end={progress}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(CHART_WIDTH, 0)}
            colors={['#007AFF', '#AF52DE', '#FF2D55']}
          />
        </Path>
      </Canvas>
    </View>
  );
};
