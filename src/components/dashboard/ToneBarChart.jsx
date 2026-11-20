import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_INK, TONE_COLORS } from '../../utils/chartColors';
import { STATUS_TONES } from '../../utils/constants';

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip__swatch" style={{ background: payload[0].payload.fill }} />
      <strong>{name}</strong>
      <span>
        {value} {unit}
      </span>
    </div>
  );
}

/**
 * Single-series bar chart where each bar is coloured by its status tone
 * (category names are always printed on the axis, so colour is never the only cue).
 * data: [{ name, value }]
 */
export default function ToneBarChart({ data = [], unit = '', height = 260, layout = 'horizontal' }) {
  const rows = data.map((d) => ({ ...d, fill: TONE_COLORS[STATUS_TONES[d.name] || 'info'] }));
  const vertical = layout === 'vertical';
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout={layout} margin={{ top: 20, right: vertical ? 36 : 8, left: vertical ? 8 : -16, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke={CHART_INK.grid} vertical={vertical} horizontal={!vertical} />
        {vertical ? (
          <>
            <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_INK.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={96} tick={{ fill: CHART_INK.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fill: CHART_INK.text, fontSize: 12 }} axisLine={{ stroke: CHART_INK.grid }} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={{ fill: CHART_INK.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip cursor={{ fill: 'rgba(15, 27, 51, 0.05)' }} content={<ChartTooltip unit={unit} />} />
        <Bar dataKey="value" radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
          {rows.map((r) => (
            <Cell key={r.name} fill={r.fill} />
          ))}
          <LabelList dataKey="value" position={vertical ? 'right' : 'top'} fill={CHART_INK.text} fontSize={12} fontWeight={600} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
