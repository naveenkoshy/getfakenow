import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, ComposedChart, Line,
} from "recharts";
import { Loader2, TrendingDown, Calendar } from "lucide-react";

type Period = "daily" | "weekly" | "monthly";

const PERIOD_OPTIONS: { value: Period; label: string; days: number }[] = [
  { value: "daily", label: "Daily", days: 30 },
  { value: "weekly", label: "Weekly", days: 90 },
  { value: "monthly", label: "Monthly", days: 365 },
];

const formatCurrency = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

const formatPeriodLabel = (period: string, type: Period) => {
  if (type === "daily") {
    const d = new Date(period);
    return d.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
  }
  if (type === "weekly") {
    // Format: YYYY-WW or similar
    return `W${period.split("-").pop() || period}`;
  }
  if (type === "monthly") {
    const [year, month] = period.split("-");
    const d = new Date(Number(year), Number(month) - 1);
    return d.toLocaleDateString("en-MY", { month: "short", year: "2-digit" });
  }
  return period;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  periodType: Period;
}

function CustomTooltip({ active, payload, label, periodType }: CustomTooltipProps) {
  if (!active || !payload || !label) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1.5">
        {formatPeriodLabel(label, periodType)}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {entry.name.includes("Amount") ? formatCurrency(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RefundTrendsChart() {
  const [period, setPeriod] = useState<Period>("daily");
  const [chartType, setChartType] = useState<"count" | "amount">("count");

  const selectedOption = PERIOD_OPTIONS.find(o => o.value === period)!;
  const { data: trends, isLoading } = trpc.admin.refunds.trends.useQuery(
    { period, days: selectedOption.days },
  );

  const chartData = useMemo(() => {
    if (!trends) return [];
    return trends.map(t => ({
      ...t,
      label: formatPeriodLabel(t.period, period),
      totalAmountRM: Number((t.totalAmount / 100).toFixed(2)),
    }));
  }, [trends, period]);

  // Summary stats from the trend data
  const summary = useMemo(() => {
    if (!chartData.length) return null;
    const totalRefunds = chartData.reduce((s, d) => s + d.refundCount, 0);
    const totalAmount = chartData.reduce((s, d) => s + d.totalAmount, 0);
    const avgPerPeriod = totalRefunds / chartData.length;
    const peakPeriod = chartData.reduce((max, d) => d.refundCount > max.refundCount ? d : max, chartData[0]);
    return { totalRefunds, totalAmount, avgPerPeriod, peakPeriod };
  }, [chartData]);

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <CardTitle className="text-base font-semibold text-gray-900">
              Refund Trends
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Period toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === opt.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Chart type toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setChartType("count")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartType === "count"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setChartType("amount")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartType === "amount"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Amount
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !chartData.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="h-10 w-10 mb-3" />
            <p className="text-sm font-medium">No refund data for this period</p>
            <p className="text-xs mt-1">Refund trends will appear here once refunds are processed</p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Refunds</p>
                  <p className="text-lg font-bold text-gray-900">{summary.totalRefunds}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Avg per {period === "daily" ? "Day" : period === "weekly" ? "Week" : "Month"}</p>
                  <p className="text-lg font-bold text-gray-900">{summary.avgPerPeriod.toFixed(1)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Peak Period</p>
                  <p className="text-lg font-bold text-gray-900">{summary.peakPeriod.label}</p>
                  <p className="text-xs text-gray-400">{summary.peakPeriod.refundCount} refunds</p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "count" ? (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip periodType={period} />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Bar dataKey="fullCount" name="Full Refunds" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="stack" />
                    <Bar dataKey="partialCount" name="Partial Refunds" fill="#f97316" radius={[3, 3, 0, 0]} stackId="stack" />
                    <Line dataKey="refundCount" name="Total" stroke="#1a1a2e" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
                  </ComposedChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e63946" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#e63946" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `RM ${v}`}
                    />
                    <Tooltip content={<CustomTooltip periodType={period} />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Area
                      dataKey="totalAmountRM"
                      name="Refund Amount (RM)"
                      stroke="#e63946"
                      strokeWidth={2}
                      fill="url(#amountGradient)"
                      type="monotone"
                      dot={{ r: 3, fill: "#e63946" }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
