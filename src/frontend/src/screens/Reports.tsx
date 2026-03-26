import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Screen } from "../App";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface Props {
  onNavigate: (screen: Screen) => void;
}

export default function Reports({ onNavigate }: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [chartData, setChartData] = useState<
    { month: string; earnings: number }[]
  >([]);
  const [thisMonth, setThisMonth] = useState({
    totalJobs: 0,
    totalEarnings: 0,
    netProfit: 0,
  });
  const [driverPerf, setDriverPerf] = useState<
    { name: string; totalJobs: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    const load = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Load last 6 months
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(year, month - 1 - i, 1);
          return {
            m: d.getMonth() + 1,
            y: d.getFullYear(),
            label: MONTH_NAMES[d.getMonth()],
          };
        }).reverse();

        const reports = await Promise.all(
          months.map((m) => actor.getMonthlyReport(BigInt(m.m), BigInt(m.y))),
        );
        const data = months.map((m, idx) => ({
          month: m.label,
          earnings: reports[idx].totalEarnings,
        }));
        setChartData(data);

        const [currReport, profit, perf] = await Promise.all([
          actor.getMonthlyReport(BigInt(month), BigInt(year)),
          actor.getNetProfit(BigInt(month), BigInt(year)),
          actor.getDriverPerformance(),
        ]);
        setThisMonth({
          totalJobs: Number(currReport.totalJobs),
          totalEarnings: currReport.totalEarnings,
          netProfit: profit,
        });
        setDriverPerf(
          perf.map((p) => ({ name: p.name, totalJobs: Number(p.totalJobs) })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [actor]);

  if (loading)
    return <div className="p-6 text-center text-gray-400">{t.loading}</div>;

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {t.reports}
      </h1>

      {/* This month summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-500">{t.totalJobs}</p>
          <p className="text-xl font-bold text-blue-700">
            {thisMonth.totalJobs}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p className="text-xs text-green-500">{t.totalEarnings}</p>
          <p className="text-xl font-bold text-green-700">
            ₹{thisMonth.totalEarnings.toLocaleString()}
          </p>
        </div>
        <div
          className={`rounded-xl p-3 text-center ${thisMonth.netProfit >= 0 ? "bg-teal-50" : "bg-red-50"}`}
        >
          <p className="text-xs text-teal-500">{t.netProfit}</p>
          <p
            className={`text-xl font-bold ${thisMonth.netProfit >= 0 ? "text-teal-700" : "text-red-700"}`}
          >
            ₹{thisMonth.netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4">
        <h2 className="font-bold text-gray-800 dark:text-white mb-3">
          {t.monthlyReport}
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => [
                `\u20b9${v.toLocaleString()}`,
                t.totalEarnings,
              ]}
            />
            <Bar dataKey="earnings" fill="#2E7D32" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Driver Performance */}
      {driverPerf.length > 0 && (
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4">
          <h2 className="font-bold text-gray-800 dark:text-white mb-3">
            {t.performanceSummary}
          </h2>
          {driverPerf.map((d) => (
            <div
              key={d.name}
              className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-0"
            >
              <span className="text-gray-700 dark:text-gray-300">{d.name}</span>
              <span className="font-bold text-green-700 dark:text-green-400">
                {d.totalJobs} {t.totalJobs}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Credit Summary Button */}
      <button
        type="button"
        onClick={() => onNavigate("credits")}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl"
      >
        {t.udhar} / {t.credits}
      </button>
    </div>
  );
}
