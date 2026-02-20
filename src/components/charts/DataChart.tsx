'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Types for chart data
export interface ChartDataPoint {
  x: string | number | Date
  y: number
  label?: string
  color?: string
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[]
  color?: string
}

export type ChartType = 'line' | 'bar' | 'stacked-bar' | 'area' | 'pie' | 'radar' | 'scatter'

export interface DataChartProps {
  title?: string
  type: ChartType
  data: ChartSeries[]
  width?: number
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  className?: string
}

// Transform data for Recharts format
const transformDataForRecharts = (data: ChartSeries[]) => {
  // Get all unique x values
  const allXValues = new Set<string>()
  data.forEach(series => {
    series.data.forEach(point => {
      const xValue = typeof point.x === 'number' ? point.x.toString() : 
                     point.x instanceof Date ? point.x.toISOString().split('T')[0] : 
                     point.x.toString()
      allXValues.add(xValue)
    })
  })

  // Create combined data structure
  const combinedData = Array.from(allXValues).sort().map(xValue => {
    const dataPoint: any = { x: xValue }
    
    data.forEach(series => {
      const point = series.data.find(p => {
        const pXValue = typeof p.x === 'number' ? p.x.toString() : 
                       p.x instanceof Date ? p.x.toISOString().split('T')[0] : 
                       p.x.toString()
        return pXValue === xValue
      })
      
      dataPoint[series.name] = point ? point.y : null
    })
    
    return dataPoint
  })

  return combinedData
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value ? `${(entry.value / 1000).toFixed(1)} GB` : '—'}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Custom tooltip for pie chart
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">
          {data.name}
        </p>
        <p className="text-sm" style={{ color: data.payload.fill }}>
          {data.value.toLocaleString('cs-CZ')} ({data.percent ? (data.percent * 100).toFixed(1) : 0}%)
        </p>
      </div>
    )
  }
  return null
}

// Custom label for pie chart
const renderCustomLabel = (entry: any) => {
  const percent = entry.percent ? (entry.percent * 100).toFixed(1) : 0
  return `${percent}%`
}

// Default colors
const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function DataChart({
  title,
  type,
  data,
  width = 800,
  height = 400,
  showLegend = true,
  showGrid = true,
  xAxisLabel,
  yAxisLabel,
  className = ''
}: DataChartProps) {
  const transformedData = transformDataForRecharts(data)

  // Format tick values
  const formatXAxisTick = (value: string) => {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })
    }
    return value
  }

  const formatYAxisTick = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)} GB`
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)} GB`
    }
    return `${(numValue / 1000).toFixed(1)} GB`
  }

  const renderChart = () => {
    const commonProps = {
      data: transformedData,
      margin: { top: 5, right: 30, left: 30, bottom: 80 }
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisTick}
              tick={{ fontSize: 12 }}
              label={{ value: xAxisLabel, position: 'insideBottom', offset: -40 }}
            />
            <YAxis 
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend layout="vertical" verticalAlign="top" align="left" />}
            {data.map((series, index) => (
              <Line
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || defaultColors[index % defaultColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisTick}
              tick={{ fontSize: 12 }}
              label={{ value: xAxisLabel, position: 'insideBottom', offset: -40 }}
            />
            <YAxis 
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend layout="vertical" verticalAlign="top" align="left" />}
            {data.map((series, index) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={series.color || defaultColors[index % defaultColors.length]}
              />
            ))}
          </BarChart>
        )

      case 'stacked-bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisTick}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend layout="vertical" verticalAlign="top" align="left" />}
            {data.map((series, index) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                stackId="stack"
                fill={series.color || defaultColors[index % defaultColors.length]}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisTick}
              tick={{ fontSize: 12 }}
              label={{ value: xAxisLabel, position: 'insideBottom', offset: -40 }}
            />
            <YAxis 
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend layout="vertical" verticalAlign="top" align="left" />}
            {data.map((series, index) => (
              <Area
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || defaultColors[index % defaultColors.length]}
                fill={series.color || defaultColors[index % defaultColors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        )

      case 'pie':
        // Transform data for pie chart
        const pieData = data[0]?.data.map((point, index) => ({
          name: point.label || point.x.toString(),
          value: point.y,
          fill: point.color || defaultColors[index % defaultColors.length]
        })) || []

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={Math.min(height, width) / 3}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            {showLegend && <Legend layout="vertical" verticalAlign="top" align="left" />}
          </PieChart>
        )

      case 'scatter':
        // Transform data for scatter chart - create separate data for each series
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis 
              type="number"
              dataKey="x"
              tick={{ fontSize: 12 }}
              name={xAxisLabel || 'X'}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <YAxis 
              type="number"
              dataKey="y"
              tick={{ fontSize: 12 }}
              name={yAxisLabel || 'Y'}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-gray-900">
                        {data.name}
                      </p>
                      <p className="text-sm">
                        X: {data.x?.toLocaleString('cs-CZ')}
                      </p>
                      <p className="text-sm">
                        Y: {data.y?.toLocaleString('cs-CZ')}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            {showLegend && <Legend layout="vertical" verticalAlign="top" align="left" />}
            {data.map((series, index) => {
              const seriesData = series.data.map(point => ({
                x: point.x,
                y: point.y,
                name: series.name
              }))
              
              return (
                <Scatter
                  key={series.name}
                  name={series.name}
                  data={seriesData}
                  fill={series.color || defaultColors[index % defaultColors.length]}
                />
              )
            })}
          </ScatterChart>
        )

      case 'radar':
        // Transform data for radar chart - combine all series data
        const allSubjects = new Set<string>()
        data.forEach(series => {
          series.data.forEach(point => {
            allSubjects.add(point.label || point.x.toString())
          })
        })

        const radarData = Array.from(allSubjects).map(subject => {
          const dataPoint: any = { subject }
          
          data.forEach(series => {
            const point = series.data.find(p => 
              (p.label || p.x.toString()) === subject
            )
            dataPoint[series.name] = point ? point.y : 0
          })
          
          return dataPoint
        })

        return (
          <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 12 }}
              className="text-gray-600"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend layout="vertical" verticalAlign="top" align="left" />}
            {data.map((series, index) => (
              <Radar
                key={series.name}
                name={series.name}
                dataKey={series.name}
                stroke={series.color || defaultColors[index % defaultColors.length]}
                fill={series.color || defaultColors[index % defaultColors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        )

      default:
        return null
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
