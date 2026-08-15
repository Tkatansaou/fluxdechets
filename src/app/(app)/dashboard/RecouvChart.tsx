'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

interface DataPoint {
  mois: string
  taux: number
}

interface Props {
  data: DataPoint[]
  objective: number
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg">
      <p className="font-medium mb-0.5">{label}</p>
      <p className="text-emerald-300">{payload[0].value}% de recouvrement</p>
    </div>
  )
}

export default function RecouvChart({ data, objective }: Props) {
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
          y={objective}
          stroke="#DC2626"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: `${objective}%`, position: 'insideTopRight', fontSize: 10, fill: '#DC2626' }}
        />
        <Bar dataKey="taux" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.taux >= objective ? '#15803D' : entry.taux >= Math.max(objective - 20, 0) ? '#D97706' : '#DC2626'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
