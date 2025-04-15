
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BarChart2, MapPin } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';

interface ChartDataItem {
  route: string;
  averageTime: number;
  targetTime: number | null;
  percentDiff: number | null;
  difference: number | null;
  flightCount: number;
}

interface DataChartProps {
  chartData: ChartDataItem[];
}

export function DataChart({ chartData }: DataChartProps) {
  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-white">
        <div className="flex flex-col items-center text-muted-foreground">
          <MapPin className="h-10 w-10 mb-2 text-muted" />
          <p className="text-lg">No route data available with current filters</p>
          <p className="text-sm mt-1">Try adjusting your filter options or adding more flights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-[400px] border rounded-md p-4 bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-2 text-primary">Average vs Target Flight Times</h3>
        <ChartContainer className="h-[90%]" 
          config={{
            averageTime: { label: "Average Time", color: "#3b82f6" },
            targetTime: { label: "Target Time", color: "#f59e0b" },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis 
                dataKey="route" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: "#64748b" }}
                tick={{ fill: "#64748b" }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-md p-3 shadow-md">
                        <p className="font-semibold text-primary">{data.route}</p>
                        <p className="text-sm text-muted-foreground">Flight Count: {data.flightCount}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-sm">Average:</span>
                            <span className="font-mono font-medium">{data.averageTime} hrs</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-sm">Target:</span>
                            <span className="font-mono font-medium">{data.targetTime ? `${data.targetTime} hrs` : 'N/A'}</span>
                          </div>
                          {data.difference !== null && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-sm">Difference:</span>
                              <span className={`font-mono font-medium ${data.difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {data.difference > 0 ? '+' : ''}{data.difference.toFixed(2)} hrs
                              </span>
                            </div>
                          )}
                          {data.percentDiff !== null && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-sm">Percent:</span>
                              <span className={`font-mono font-medium ${data.percentDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {data.percentDiff > 0 ? '+' : ''}{data.percentDiff.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="averageTime" fill="#3b82f6" name="Average Time" />
              <Bar dataKey="targetTime" fill="#f59e0b" name="Target Time" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
