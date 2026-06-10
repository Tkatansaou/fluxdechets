'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'

interface DataPoint {
  mois: string
  taux: number
}

interface Props {
  data: DataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg">
      <p className="font-medium mb-0.5">{label}</p>
      <p className="text-emerald-300">{payload[0].value}% de recouvrement</p>
    </div>
  )
}

export default function RecouvChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="mois"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
        <ReferenceLine
          y={80}
          stroke="#EF4444"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: '80%', position: 'right', fontSize: 10, fill: '#EF4444' }}
        />
        <Bar dataKey="taux" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.taux >= 80 ? '#16A34A' : entry.taux >= 60 ? '#F59E0B' : '#EF4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
