import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Printer,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Screen } from "../App";
import type { Booking, Expense, Party, Tractor } from "../backend.d";
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

type View =
  | "main"
  | "party-statement"
  | "party-transactions"
  | "all-parties"
  | "service-wise"
  | "tractor-wise"
  | "monthly-summary";

type DateRange = "week" | "month" | "custom";

interface Props {
  onNavigate: (screen: Screen) => void;
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return toDateString(d);
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function filterByRange(
  bookings: Booking[],
  dateRange: DateRange,
  customStart: string,
  customEnd: string,
): Booking[] {
  let start: string;
  let end: string;
  const today = toDateString(new Date());

  if (dateRange === "week") {
    start = getWeekStart();
    end = today;
  } else if (dateRange === "month") {
    start = getMonthStart();
    end = today;
  } else {
    start = customStart;
    end = customEnd;
  }

  return bookings.filter((bk) => {
    const d = toDateString(new Date(Number(bk.date)));
    return d >= start && d <= end;
  });
}

interface FilterBarProps {
  isGu: boolean;
  dateRange: DateRange;
  customStart: string;
  customEnd: string;
  onRangeChange: (r: DateRange) => void;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
}

function FilterBar({
  isGu,
  dateRange,
  customStart,
  customEnd,
  onRangeChange,
  onCustomStartChange,
  onCustomEndChange,
}: FilterBarProps) {
  const btnBase =
    "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors";
  const active = "bg-primary text-primary-foreground";
  const inactive = "bg-muted text-muted-foreground";

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          data-ocid="reports.filter.tab"
          className={`${btnBase} ${dateRange === "week" ? active : inactive}`}
          onClick={() => onRangeChange("week")}
        >
          {isGu ? "આ અઠવાડ" : "This Week"}
        </button>
        <button
          type="button"
          data-ocid="reports.filter.tab"
          className={`${btnBase} ${dateRange === "month" ? active : inactive}`}
          onClick={() => onRangeChange("month")}
        >
          {isGu ? "આ મહિને" : "This Month"}
        </button>
        <button
          type="button"
          data-ocid="reports.filter.tab"
          className={`${btnBase} ${dateRange === "custom" ? active : inactive}`}
          onClick={() => onRangeChange("custom")}
        >
          {isGu ? "કસ્ટમ" : "Custom"}
        </button>
      </div>
      {dateRange === "custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            data-ocid="reports.custom_start.input"
          />
          <span className="text-xs text-muted-foreground self-center">→</span>
          <input
            type="date"
            className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            data-ocid="reports.custom_end.input"
          />
        </div>
      )}
    </div>
  );
}

export default function Reports({ onNavigate }: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const isGu = language === "gu";

  const [view, setView] = useState<View>("main");

  // Data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);

  // Monthly summary state
  const [chartData, setChartData] = useState<
    { month: string; earnings: number }[]
  >([]);
  const [cashUpiData, setCashUpiData] = useState<
    { month: string; cash: number; upi: number }[]
  >([]);
  const [thisMonth, setThisMonth] = useState({
    totalJobs: 0,
    totalEarnings: 0,
  });

  const [_expenses, setExpenses] = useState<Expense[]>([]);
  const [incomeExpenseData, setIncomeExpenseData] = useState<
    { month: string; income: number; expense: number }[]
  >([]);

  // Party statement
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Date range filter
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [customStart, setCustomStart] = useState(getMonthStart());
  const [customEnd, setCustomEnd] = useState(toDateString(new Date()));

  // Expanded tractor
  const [expandedTractorId, setExpandedTractorId] = useState<bigint | null>(
    null,
  );

  // Fuel log
  const getFuelCostForTractor = (tractorId: bigint): number => {
    try {
      const fuelLog = JSON.parse(
        localStorage.getItem("kisanFuelLog") || "[]",
      ) as Array<{ tractorId: string; amount: number }>;
      return fuelLog
        .filter((e) => e.tractorId === String(tractorId))
        .reduce((s, e) => s + e.amount, 0);
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      actor.getAllBookings(),
      actor.getAllParties(),
      actor.getAllTractors(),
      actor.getAllExpenses(),
    ])
      .then(([b, p, tr, exp]) => {
        setBookings(b);
        setParties(p);
        setTractors(tr);
        setExpenses(exp);
        // Compute this month summary
        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();
        const monthBookings = b.filter((bk) => {
          const d = new Date(Number(bk.date));
          return d.getMonth() + 1 === m && d.getFullYear() === y;
        });
        setThisMonth({
          totalJobs: monthBookings.length,
          totalEarnings: monthBookings.reduce((s, bk) => s + bk.totalAmount, 0),
        });
        // Monthly chart data
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(y, m - 1 - i, 1);
          return {
            m: d.getMonth() + 1,
            y: d.getFullYear(),
            label: MONTH_NAMES[d.getMonth()],
          };
        }).reverse();
        setChartData(
          months.map((mo) => ({
            month: mo.label,
            earnings: b
              .filter((bk) => {
                const d = new Date(Number(bk.date));
                return d.getMonth() + 1 === mo.m && d.getFullYear() === mo.y;
              })
              .reduce((s, bk) => s + bk.totalAmount, 0),
          })),
        );
        setCashUpiData(
          months.map((mo) => {
            const inMonth = b.filter((bk) => {
              const d = new Date(Number(bk.date));
              return d.getMonth() + 1 === mo.m && d.getFullYear() === mo.y;
            });
            return {
              month: mo.label,
              cash: inMonth
                .filter((bk) => bk.paymentMode === "cash")
                .reduce((s, bk) => s + bk.totalAmount, 0),
              upi: inMonth
                .filter((bk) => bk.paymentMode === "upi")
                .reduce((s, bk) => s + bk.totalAmount, 0),
            };
          }),
        );
        setIncomeExpenseData(
          months.map((mo) => {
            const inMonth = b.filter((bk) => {
              const d = new Date(Number(bk.date));
              return d.getMonth() + 1 === mo.m && d.getFullYear() === mo.y;
            });
            const incomeTotal = inMonth.reduce(
              (s, bk) => s + bk.totalAmount,
              0,
            );
            const expMonth = exp.filter((ex) => {
              const d = new Date(Number(ex.date));
              return d.getMonth() + 1 === mo.m && d.getFullYear() === mo.y;
            });
            const expTotal = expMonth.reduce((s, ex) => s + ex.amount, 0);
            return { month: mo.label, income: incomeTotal, expense: expTotal };
          }),
        );
      })
      .catch(console.error);
  }, [actor]);

  const goBack = () => {
    if (view === "party-transactions") {
      setView("party-statement");
      setSelectedParty(null);
    } else {
      setView("main");
    }
  };

  const filteredParties = parties.filter((p) =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()),
  );

  // ---- MAIN VIEW ----
  if (view === "main") {
    const sections = [
      {
        title: isGu ? "પાર્ટી રિપોર્ટ" : "Party Reports",
        items: [
          {
            label: isGu ? "પાર્ટી સ્ટેટમેન્ટ" : "Party Statement",
            view: "party-statement" as View,
          },
          {
            label: isGu ? "બધા પક્ષકારો" : "All Parties Report",
            view: "all-parties" as View,
          },
        ],
      },
      {
        title: isGu ? "સેવા રિપોર્ટ" : "Service Reports",
        items: [
          {
            label: isGu ? "સેવા-અનુસાર કમાણી" : "Service-wise Earnings",
            view: "service-wise" as View,
          },
        ],
      },
      {
        title: isGu ? "ટ્રેક્ટર રિપોર્ટ" : "Tractor Reports",
        items: [
          {
            label: isGu ? "ટ્રેક્ટર-અનુસાર" : "Tractor-wise Work Report",
            view: "tractor-wise" as View,
          },
        ],
      },
      {
        title: isGu ? "અન્ય" : "Other",
        items: [
          {
            label: isGu ? "માસિક સારાંશ" : "Monthly Summary",
            view: "monthly-summary" as View,
          },
          {
            label: isGu ? "ઉધાર / ક્રેડિટ" : "Udhar / Credits",
            view: null as View | null,
          },
        ],
      },
    ];

    return (
      <div className="bg-background min-h-screen pb-6">
        {/* Summary card */}
        <div className="m-4 rounded-xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-xs text-muted-foreground mb-1">
            {isGu ? "આ મહિને" : "This Month"}
          </p>
          <div className="flex justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                ₹{thisMonth.totalEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {isGu ? "કુલ કમાણી" : "Total Earnings"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {thisMonth.totalJobs}
              </p>
              <p className="text-xs text-muted-foreground">
                {isGu ? "કામ" : "Jobs"}
              </p>
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mb-2">
            <p className="text-sm font-bold text-foreground px-4 py-2 bg-muted">
              {section.title}
            </p>
            <div className="bg-card border-b border-border">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  data-ocid={`reports.${item.label
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, "")}.button`}
                  onClick={() => {
                    if (item.view === null) {
                      onNavigate("credits");
                    } else {
                      setView(item.view);
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 border-b border-border last:border-0 active:bg-muted"
                >
                  <span className="text-sm text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-muted-foreground" />
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---- SUB-VIEW HEADER ----
  const subViewTitles: Record<View, string> = {
    main: "",
    "party-statement": isGu ? "પાર્ટી સ્ટેટમેન્ટ" : "Party Statement",
    "party-transactions": selectedParty?.name ?? "",
    "all-parties": isGu ? "બધા પક્ષકારો" : "All Parties Report",
    "service-wise": isGu ? "સેવા-અનુસાર કમાણી" : "Service-wise Earnings",
    "tractor-wise": isGu ? "ટ્રેક્ટર-અનુસાર" : "Tractor-wise Report",
    "monthly-summary": isGu ? "માસિક સારાંશ" : "Monthly Summary",
  };

  return (
    <div className="bg-background min-h-screen pb-6">
      {/* Sub-view header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button
          type="button"
          onClick={goBack}
          data-ocid="reports.back.button"
          className="p-1"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h2 className="font-bold text-foreground text-base flex-1">
          {subViewTitles[view]}
        </h2>
        <button
          type="button"
          onClick={() => window.print()}
          data-ocid="reports.pdf_download.button"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold print:hidden"
          title="Download PDF"
        >
          <Printer size={15} />
          PDF
        </button>
      </div>

      {/* PARTY STATEMENT */}
      {view === "party-statement" && (
        <div>
          <div className="p-3 bg-muted border-b border-border">
            <input
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              placeholder={isGu ? "પાર્ટી શોધો..." : "Search party..."}
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              data-ocid="reports.search_input"
            />
          </div>
          <div className="bg-card">
            {filteredParties.length === 0 && (
              <p
                className="text-center text-muted-foreground py-8 text-sm"
                data-ocid="reports.party_statement.empty_state"
              >
                {isGu ? "કોઈ પાર્ટી નથી" : "No parties found"}
              </p>
            )}
            {filteredParties.map((p, i) => {
              const partyBookings = bookings.filter(
                (b) => b.customerName === p.name,
              );
              const total = partyBookings.reduce(
                (s, b) => s + b.totalAmount,
                0,
              );
              return (
                <button
                  key={p.id.toString()}
                  type="button"
                  data-ocid={`reports.party_statement.item.${i + 1}`}
                  onClick={() => {
                    setSelectedParty(p);
                    setView("party-transactions");
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 border-b border-border last:border-0 active:bg-muted"
                >
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">
                      ₹{total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {partyBookings.length} {isGu ? "કામ" : "jobs"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PARTY TRANSACTIONS */}
      {view === "party-transactions" && selectedParty && (
        <div className="bg-card">
          {bookings.filter((b) => b.customerName === selectedParty.name)
            .length === 0 && (
            <p
              className="text-center text-muted-foreground py-8 text-sm"
              data-ocid="reports.party_transactions.empty_state"
            >
              {isGu ? "કોઈ વ્યવહાર નથી" : "No transactions"}
            </p>
          )}
          {bookings
            .filter((b) => b.customerName === selectedParty.name)
            .sort((a, b) => Number(b.date) - Number(a.date))
            .map((bk, i) => {
              const date = new Date(Number(bk.date)).toLocaleDateString();
              const isAdvance = bk.advancePaid > 0 && bk.balanceDue === 0;
              return (
                <div
                  key={bk.id.toString()}
                  data-ocid={`reports.party_transactions.item.${i + 1}`}
                  className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {bk.workType}
                    </p>
                    <p className="text-xs text-muted-foreground">{date}</p>
                    <p className="text-xs text-muted-foreground">
                      {bk.paymentMode === "cash" ? "💵 Cash" : "📱 UPI"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-sm">
                      ₹{bk.totalAmount.toLocaleString()}
                    </p>
                    {bk.advancePaid > 0 && (
                      <p className="text-xs text-blue-500">
                        Adv: ₹{bk.advancePaid.toLocaleString()}
                      </p>
                    )}
                    {bk.balanceDue > 0 && (
                      <p className="text-xs text-red-500">
                        Baki: ₹{bk.balanceDue.toLocaleString()}
                      </p>
                    )}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isAdvance
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isAdvance
                        ? isGu
                          ? "એડવાન્સ"
                          : "Advance"
                        : isGu
                          ? "સ્થિતિ"
                          : bk.status}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ALL PARTIES */}
      {view === "all-parties" && (
        <div>
          <div className="bg-card">
            <div className="flex px-4 py-2 bg-muted border-b border-border">
              <span className="flex-1 text-xs font-bold text-muted-foreground">
                {isGu ? "નામ" : "Name"}
              </span>
              <span className="w-24 text-right text-xs font-bold text-muted-foreground">
                {isGu ? "કમાણી" : "Earnings"}
              </span>
              <span className="w-20 text-right text-xs font-bold text-muted-foreground">
                {isGu ? "ઉધાર" : "Udhar"}
              </span>
            </div>
            {parties.length === 0 && (
              <p
                className="text-center text-muted-foreground py-8 text-sm"
                data-ocid="reports.all_parties.empty_state"
              >
                {isGu ? "કોઈ પાર્ટી નથી" : "No parties"}
              </p>
            )}
            {parties.map((p, i) => {
              const pb = bookings.filter((b) => b.customerName === p.name);
              const earnings = pb.reduce((s, b) => s + b.totalAmount, 0);
              const udhar = pb.reduce((s, b) => s + b.balanceDue, 0);
              return (
                <div
                  key={p.id.toString()}
                  data-ocid={`reports.all_parties.item.${i + 1}`}
                  className="flex items-center px-4 py-3 border-b border-border last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.phone}</p>
                  </div>
                  <p className="w-24 text-right font-bold text-green-600 text-sm">
                    ₹{earnings.toLocaleString()}
                  </p>
                  <p
                    className={`w-20 text-right font-bold text-sm ${
                      udhar > 0 ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    ₹{udhar.toLocaleString()}
                  </p>
                </div>
              );
            })}
            {/* Total row */}
            {parties.length > 0 && (
              <div className="flex items-center px-4 py-3 bg-muted border-t-2 border-border">
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm">
                    {isGu ? "કુલ" : "Total"}
                  </p>
                </div>
                <p className="w-24 text-right font-bold text-green-700 text-sm">
                  ₹
                  {bookings
                    .reduce((s, b) => s + b.totalAmount, 0)
                    .toLocaleString()}
                </p>
                <p className="w-20 text-right font-bold text-red-600 text-sm">
                  ₹
                  {bookings
                    .reduce((s, b) => s + b.balanceDue, 0)
                    .toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SERVICE-WISE */}
      {view === "service-wise" &&
        (() => {
          const filtered = filterByRange(
            bookings,
            dateRange,
            customStart,
            customEnd,
          );
          const serviceMap: Record<
            string,
            { jobs: number; earnings: number; cash: number; upi: number }
          > = {};
          for (const b of filtered) {
            const key = b.workType || (isGu ? "અન્ય" : "Other");
            if (!serviceMap[key])
              serviceMap[key] = { jobs: 0, earnings: 0, cash: 0, upi: 0 };
            serviceMap[key].jobs += 1;
            serviceMap[key].earnings += b.totalAmount;
            if (b.paymentMode === "cash") {
              serviceMap[key].cash += b.totalAmount;
            } else {
              serviceMap[key].upi += b.totalAmount;
            }
          }
          const entries = Object.entries(serviceMap).sort(
            (a, b) => b[1].earnings - a[1].earnings,
          );
          return (
            <div>
              <div className="bg-card border-b border-border">
                <FilterBar
                  isGu={isGu}
                  dateRange={dateRange}
                  customStart={customStart}
                  customEnd={customEnd}
                  onRangeChange={setDateRange}
                  onCustomStartChange={setCustomStart}
                  onCustomEndChange={setCustomEnd}
                />
              </div>
              <div className="bg-card">
                {entries.length === 0 && (
                  <p
                    className="text-center text-muted-foreground py-8 text-sm"
                    data-ocid="reports.service_wise.empty_state"
                  >
                    {isGu ? "કોઈ ડેટા નથી" : "No data"}
                  </p>
                )}
                {entries.map(([name, stats], i) => (
                  <div
                    key={name}
                    data-ocid={`reports.service_wise.item.${i + 1}`}
                    className="flex items-start justify-between px-4 py-4 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stats.jobs} {isGu ? "સેવા" : "jobs"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-base">
                        ₹{stats.earnings.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        💵 ₹{stats.cash.toLocaleString()} &nbsp;|&nbsp; 📱 ₹
                        {stats.upi.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      {/* TRACTOR-WISE */}
      {view === "tractor-wise" &&
        (() => {
          const filtered = filterByRange(
            bookings,
            dateRange,
            customStart,
            customEnd,
          );
          return (
            <div>
              <div className="bg-card border-b border-border">
                <FilterBar
                  isGu={isGu}
                  dateRange={dateRange}
                  customStart={customStart}
                  customEnd={customEnd}
                  onRangeChange={setDateRange}
                  onCustomStartChange={setCustomStart}
                  onCustomEndChange={setCustomEnd}
                />
              </div>
              <div className="bg-card">
                {tractors.length === 0 && (
                  <p
                    className="text-center text-muted-foreground py-8 text-sm"
                    data-ocid="reports.tractor_wise.empty_state"
                  >
                    {isGu ? "કોઈ ટ્રેક્ટર નથી" : "No tractors"}
                  </p>
                )}
                {tractors.map((tr, i) => {
                  const tb = filtered.filter((b) => b.tractorId === tr.id);
                  const earnings = tb.reduce((s, b) => s + b.totalAmount, 0);
                  const isExpanded = expandedTractorId === tr.id;
                  return (
                    <div key={tr.id.toString()}>
                      <button
                        type="button"
                        data-ocid={`reports.tractor_wise.item.${i + 1}`}
                        onClick={() =>
                          setExpandedTractorId(isExpanded ? null : tr.id)
                        }
                        className="w-full flex items-center justify-between px-4 py-4 border-b border-border active:bg-muted"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-foreground text-sm">
                            {tr.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tr.number} • {tb.length} {isGu ? "કામ" : "jobs"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-bold text-green-600 text-base">
                              ₹{earnings.toLocaleString()}
                            </p>
                            {getFuelCostForTractor(tr.id) > 0 && (
                              <p className="text-xs text-orange-500">
                                ⛽ ₹
                                {getFuelCostForTractor(tr.id).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp
                              size={16}
                              className="text-muted-foreground"
                            />
                          ) : (
                            <ChevronDown
                              size={16}
                              className="text-muted-foreground"
                            />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="bg-muted/40 border-b border-border">
                          {tb.length === 0 && (
                            <p
                              className="text-center text-muted-foreground py-4 text-xs"
                              data-ocid="reports.tractor_wise.empty_state"
                            >
                              {isGu
                                ? "આ ગાળામાં કોઈ કામ નથી"
                                : "No jobs in this period"}
                            </p>
                          )}
                          {tb
                            .sort((a, b) => Number(b.date) - Number(a.date))
                            .map((bk, ji) => {
                              const date = new Date(
                                Number(bk.date),
                              ).toLocaleDateString();
                              return (
                                <div
                                  key={bk.id.toString()}
                                  data-ocid={`reports.tractor_wise.row.${ji + 1}`}
                                  className="flex items-center justify-between px-5 py-2.5 border-b border-border/50 last:border-0"
                                >
                                  <div>
                                    <p className="font-semibold text-foreground text-xs">
                                      {bk.customerName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {bk.workType}
                                    </p>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                                        bk.paymentMode === "cash"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {bk.paymentMode === "cash"
                                        ? "💵 Cash"
                                        : "📱 UPI"}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-foreground text-sm">
                                      ₹{bk.totalAmount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {date}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {/* MONTHLY SUMMARY */}
      {view === "monthly-summary" && (
        <div className="p-4 space-y-5">
          <div className="bg-card rounded-xl shadow p-4">
            <h2 className="font-bold text-foreground mb-3">
              {t.monthlyReport}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [
                    `₹${v.toLocaleString()}`,
                    t.totalEarnings,
                  ]}
                />
                <Bar dataKey="earnings" fill="#2E7D32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl shadow p-4">
            <h2 className="font-bold text-foreground mb-3">
              {isGu ? "માસિક Cash vs UPI" : "Monthly Cash vs UPI"}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashUpiData} barCategoryGap="25%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `₹${value.toLocaleString()}`,
                    name === "cash" ? "💵 Cash" : "📱 UPI",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "cash" ? "💵 Cash" : "📱 UPI"
                  }
                />
                <Bar
                  dataKey="cash"
                  fill="#2E7D32"
                  radius={[4, 4, 0, 0]}
                  name="cash"
                />
                <Bar
                  dataKey="upi"
                  fill="#1565C0"
                  radius={[4, 4, 0, 0]}
                  name="upi"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl shadow p-4">
            <h2 className="font-bold text-foreground mb-3">
              {isGu ? "આવક vs ખર્ચ" : "Income vs Expense"}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={incomeExpenseData}
                barCategoryGap="25%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `₹${value.toLocaleString()}`,
                    name === "income"
                      ? isGu
                        ? "📈 આવક"
                        : "📈 Income"
                      : isGu
                        ? "📉 ખર્ચ"
                        : "📉 Expense",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "income"
                      ? isGu
                        ? "📈 આવક"
                        : "📈 Income"
                      : isGu
                        ? "📉 ખર્ચ"
                        : "📉 Expense"
                  }
                />
                <Bar
                  dataKey="income"
                  fill="#2E7D32"
                  radius={[4, 4, 0, 0]}
                  name="income"
                />
                <Bar
                  dataKey="expense"
                  fill="#C62828"
                  radius={[4, 4, 0, 0]}
                  name="expense"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
