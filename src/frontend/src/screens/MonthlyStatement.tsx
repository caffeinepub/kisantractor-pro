import { ArrowLeft, Download, FileText } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Booking, Party } from "../backend.d";
import type { Language } from "../i18n";

interface Props {
  party: Party;
  bookings: Booking[];
  onBack: () => void;
  businessName: string;
  businessLogo: string | null;
  language: Language;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
}

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_GU = [
  "જાન્યુઆરી",
  "ફેબ્રુઆરી",
  "માર્ચ",
  "એપ્રિલ",
  "મે",
  "જૂન",
  "જુલાઈ",
  "ઑગસ્ટ",
  "સપ્ટેમ્બર",
  "ઑક્ટોબર",
  "નવેમ્બર",
  "ડિસેમ્બર",
];

export default function MonthlyStatement({
  party,
  bookings,
  onBack,
  businessName,
  businessLogo,
  language,
  selectedMonth,
  selectedYear,
  onMonthChange,
}: Props) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        .print-hidden { display: none !important; }
        body { background: white; }
        .print-container { box-shadow: none !important; border: none !important; }
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
    };
  }, []);

  const months = language === "gu" ? MONTHS_GU : MONTHS_EN;
  const now = new Date();

  // Build last 12 months options
  const monthOptions: { month: number; year: number; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      label: `${months[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  // Filter bookings for selected month/year
  const filtered = bookings.filter((bk) => {
    const d = new Date(Number(bk.date));
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalAmount = filtered.reduce((sum, bk) => sum + bk.finalAmount, 0);
  const totalDiscount = filtered.reduce(
    (sum, bk) => sum + (bk.totalAmount - bk.finalAmount),
    0,
  );

  const formatDate = (ts: bigint) => new Date(Number(ts)).toLocaleDateString();

  const handleWhatsApp = () => {
    const monthLabel = `${months[selectedMonth]} ${selectedYear}`;
    let msg = `*${businessName}*\n`;
    msg +=
      language === "gu"
        ? `*માસિક નિવેદન - ${party.name}*\n${monthLabel}\n\n`
        : `*Monthly Statement - ${party.name}*\n${monthLabel}\n\n`;

    for (const bk of filtered) {
      msg += `📅 ${formatDate(bk.date)} | ${bk.workType} | ₹${bk.finalAmount}\n`;
    }
    msg += "\n";
    msg +=
      language === "gu"
        ? `કુલ: ₹${totalAmount.toLocaleString()}`
        : `Total: ₹${totalAmount.toLocaleString()}`;

    const phone = party.phone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const selectedLabel =
    monthOptions.find(
      (o) => o.month === selectedMonth && o.year === selectedYear,
    )?.label ?? `${months[selectedMonth]} ${selectedYear}`;

  return (
    <div className="p-4 space-y-4">
      {/* Top bar -- hidden on print */}
      <div className="flex items-center gap-3 print-hidden">
        <button
          type="button"
          onClick={onBack}
          data-ocid="monthly_statement.back_button"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-green-600" />
          {language === "gu" ? "માસિક નિવેદન" : "Monthly Statement"}
        </h1>
      </div>

      {/* Month selector -- hidden on print */}
      <div className="print-hidden">
        <select
          value={`${selectedMonth}-${selectedYear}`}
          onChange={(e) => {
            const [m, y] = e.target.value.split("-").map(Number);
            onMonthChange(m, y);
          }}
          data-ocid="monthly_statement.month.select"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:border-green-600"
        >
          {monthOptions.map((o) => (
            <option key={`${o.month}-${o.year}`} value={`${o.month}-${o.year}`}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Statement document */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow print-container p-5 space-y-4">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-4 space-y-1">
          {businessLogo && (
            <img
              src={businessLogo}
              alt="logo"
              className="mx-auto mb-2"
              style={{ maxHeight: 64, objectFit: "contain" }}
            />
          )}
          <h2 className="text-xl font-bold text-green-700">{businessName}</h2>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
            {language === "gu" ? "માસિક નિવેદન" : "Monthly Statement"}
          </p>
          <p className="text-sm text-gray-500">{selectedLabel}</p>
        </div>

        {/* Party info */}
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {language === "gu" ? "પાર્ટી" : "Party"}:
          </p>
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {party.name}
          </p>
          {party.phone && (
            <p className="text-sm text-gray-500">{party.phone}</p>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div
            className="text-center py-8 text-gray-400"
            data-ocid="monthly_statement.empty_state"
          >
            {language === "gu"
              ? "આ મહિનામાં કોઈ વ્યવહાર નથી"
              : "No transactions this month"}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="text-left p-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  {language === "gu" ? "તારીખ" : "Date"}
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  {language === "gu" ? "સેવા" : "Service"}
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  {language === "gu" ? "પ્રકાર" : "Type"}
                </th>
                <th className="text-right p-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  {language === "gu" ? "રકમ" : "Amount"}
                </th>
                <th className="text-center p-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  {language === "gu" ? "મોડ" : "Mode"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bk, idx) => (
                <tr
                  key={Number(bk.id)}
                  data-ocid={`monthly_statement.item.${idx + 1}`}
                  className="even:bg-gray-50 dark:even:bg-gray-700/50"
                >
                  <td className="p-2 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    {formatDate(bk.date)}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 capitalize">
                    {bk.workType}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-600">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        bk.advancePaid > 0 && bk.balanceDue > 0
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {bk.advancePaid > 0 && bk.balanceDue > 0
                        ? language === "gu"
                          ? "એડ્વાન્સ"
                          : "Advance"
                        : language === "gu"
                          ? "બાકી"
                          : "Balance"}
                    </span>
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-600 text-right font-semibold text-green-700 dark:text-green-400">
                    ₹{bk.finalAmount.toLocaleString()}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        bk.paymentMode === "upi"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {bk.paymentMode?.toUpperCase() || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Summary */}
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {language === "gu" ? "કુલ વ્યવહારો" : "Total Transactions"}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {filtered.length}
              </span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {language === "gu" ? "કુલ છૂટ" : "Total Discount"}
                </span>
                <span className="font-semibold text-red-500">
                  - ₹{totalDiscount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-green-700 dark:text-green-400 text-base border-t pt-2">
              <span>{language === "gu" ? "કુલ રકમ" : "Total Amount"}</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 border-t pt-3">
          {businessName} • {new Date().getFullYear()}
        </div>
      </div>

      {/* Action buttons -- hidden on print */}
      <div className="flex gap-3 print-hidden">
        <button
          type="button"
          onClick={() => window.print()}
          data-ocid="monthly_statement.pdf.button"
          className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl text-sm"
        >
          <Download size={18} />
          {language === "gu" ? "PDF ડાઉનલોડ" : "PDF Download"}
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          data-ocid="monthly_statement.whatsapp.button"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b358] text-white font-bold py-3 rounded-xl text-sm"
        >
          💬 {language === "gu" ? "WhatsApp પર મોકલો" : "WhatsApp par Bhejo"}
        </button>
      </div>
    </div>
  );
}
