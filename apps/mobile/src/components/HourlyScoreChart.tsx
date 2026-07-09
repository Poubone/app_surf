import { LineChart } from 'react-native-gifted-charts';
import type { HourlyScore } from '../hooks/useSurfConditions';

export function HourlyScoreChart({ data }: { data: HourlyScore[] }) {
  const points = data.map((h) => ({
    value: h.score.total,
    label: new Date(h.time).getHours() + 'h',
  }));
  const nowHour = new Date().getHours();
  return (
    <LineChart
      data={points}
      height={160}
      spacing={28}
      initialSpacing={10}
      color="#2563EB"
      thickness={2}
      hideDataPoints={false}
      xAxisLabelTextStyle={{ fontSize: 10 }}
      showVerticalLines
      verticalLinesColor="rgba(37,99,235,0.3)"
      verticalLinesThickness={nowHour > 0 ? 1 : 0}
    />
  );
}
