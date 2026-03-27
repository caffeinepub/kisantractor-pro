import {
  ArrowLeftRight,
  BarChart2,
  Bell,
  Check,
  IndianRupee,
  LayoutDashboard,
  Menu,
  Pencil,
  Receipt,
  Settings,
  Tractor,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Booking, Party } from "./backend.d";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useSettingsSync } from "./hooks/useSettingsSync";
import { translations } from "./i18n";
import BookingDetail from "./screens/BookingDetail";
import Bookings from "./screens/Bookings";
import Credits from "./screens/Credits";
import Dashboard from "./screens/Dashboard";
import Drivers from "./screens/Drivers";
import Expenses from "./screens/Expenses";
import Invoice from "./screens/Invoice";
import NewBooking from "./screens/NewBooking";
import NewTransaction from "./screens/NewTransaction";
import Parties from "./screens/Parties";
import PartyDetail from "./screens/PartyDetail";
import PaymentIn from "./screens/PaymentIn";
import Reports from "./screens/Reports";
import SettingsScreen from "./screens/Settings";
import TractorScreen from "./screens/Tractors";
import Transactions from "./screens/Transactions";
import { useAppStore } from "./store";

export type Screen =
  | "dashboard"
  | "bookings"
  | "newBooking"
  | "bookingDetail"
  | "tractors"
  | "drivers"
  | "expenses"
  | "reports"
  | "credits"
  | "settings"
  | "invoice"
  | "parties"
  | "partyDetail"
  | "transactions"
  | "newTransaction"
  | "paymentIn";

const drawerNavItems = [
  {
    id: "dashboard" as Screen,
    label_en: "Dashboard",
    label_gu: "ડેશબોર્ડ",
    icon: LayoutDashboard,
  },
  {
    id: "transactions" as Screen,
    label_en: "Transactions",
    label_gu: "વ્યવહારો",
    icon: ArrowLeftRight,
  },
  {
    id: "parties" as Screen,
    label_en: "Parties",
    label_gu: "પક્ષકારો",
    icon: Users,
  },
  {
    id: "tractors" as Screen,
    label_en: "Tractors",
    label_gu: "ટ્રેક્ટર",
    icon: Tractor,
  },
  {
    id: "expenses" as Screen,
    label_en: "Expenses",
    label_gu: "ખર્ચ",
    icon: Receipt,
  },
  {
    id: "reports" as Screen,
    label_en: "Reports",
    label_gu: "અહેવાલ",
    icon: BarChart2,
  },
  {
    id: "credits" as Screen,
    label_en: "Udhar",
    label_gu: "ઉધાર",
    icon: IndianRupee,
  },
  {
    id: "settings" as Screen,
    label_en: "Settings",
    label_gu: "સેટિંગ",
    icon: Settings,
  },
];

const mainScreens: Screen[] = [
  "dashboard",
  "transactions",
  "parties",
  "tractors",
  "expenses",
  "reports",
  "credits",
  "settings",
];

export default function App() {
  const { language, darkMode } = useAppStore();
  useSettingsSync();
  const _t = translations[language];
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [businessName, setBusinessName] = useState<string>(
    () => localStorage.getItem("businessName") || "KisanTractor Pro",
  );
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(businessName);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const saveBusinessName = (name: string) => {
    localStorage.setItem("businessName", name);
  };

  const openBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setScreen("bookingDetail");
  };

  const openInvoice = (booking: Booking) => {
    setInvoiceBooking(booking);
    setScreen("invoice");
  };

  const openPartyDetail = (party: Party) => {
    setSelectedParty(party);
    setScreen("partyDetail");
  };

  const navigateTo = (s: Screen) => {
    setScreen(s);
    setDrawerOpen(false);
  };

  const showActionBar = mainScreens.includes(screen);

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${darkMode ? "dark" : ""} bg-background`}>
        <div className="max-w-md mx-auto min-h-screen flex flex-col bg-background relative overflow-hidden">
          {/* Drawer Overlay */}
          {drawerOpen && (
            <div
              role="presentation"
              className="fixed inset-0 z-40 bg-black/40"
              onKeyDown={() => setDrawerOpen(false)}
              onClick={() => setDrawerOpen(false)}
            />
          )}

          {/* Slide-out Drawer */}
          <div
            className={`fixed top-0 left-0 h-full w-72 bg-card z-50 shadow-2xl transform transition-transform duration-250 ease-out ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ maxWidth: "calc(100vw - 60px)" }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-primary">
              <div>
                <p className="text-primary-foreground font-bold text-lg leading-tight">
                  🚜 KisanTractor
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full bg-white/20 text-primary-foreground"
                data-ocid="app.close_drawer.button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Items */}
            <nav className="py-3">
              {drawerNavItems.map((item) => {
                const Icon = item.icon;
                const active = screen === item.id;
                const label = language === "gu" ? item.label_gu : item.label_en;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    data-ocid={`nav.${item.id}.link`}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground border-r-4 border-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        active ? "text-primary" : "text-muted-foreground"
                      }
                    />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Top App Bar */}
          <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                data-ocid="app.open_drawer.button"
              >
                <Menu size={22} className="text-foreground" />
              </button>
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const trimmed = nameInput.trim() || "KisanTractor Pro";
                        setBusinessName(trimmed);
                        setNameInput(trimmed);
                        saveBusinessName(trimmed);
                        setEditingName(false);
                      }
                      if (e.key === "Escape") {
                        setNameInput(businessName);
                        setEditingName(false);
                      }
                    }}
                    className="font-bold text-foreground text-base bg-transparent border-b-2 border-primary outline-none w-40 max-w-[50vw]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = nameInput.trim() || "KisanTractor Pro";
                      setBusinessName(trimmed);
                      setNameInput(trimmed);
                      saveBusinessName(trimmed);
                      setEditingName(false);
                    }}
                    className="p-1 rounded text-primary"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(businessName);
                    setEditingName(true);
                  }}
                  className="flex items-center gap-1 group"
                >
                  <span className="font-bold text-foreground text-base">
                    {businessName}
                  </span>
                  <Pencil
                    size={13}
                    className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                data-ocid="app.notifications.button"
              >
                <Bell size={20} className="text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => navigateTo("settings")}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                data-ocid="app.settings.button"
              >
                <Settings size={20} className="text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-24">
            {screen === "dashboard" && (
              <Dashboard
                onBookingTap={openBookingDetail}
                onNavigate={setScreen}
              />
            )}
            {screen === "transactions" && (
              <Transactions
                onNewTransaction={() => setScreen("newTransaction")}
              />
            )}
            {screen === "newTransaction" && (
              <NewTransaction
                onBack={() => setScreen("transactions")}
                onSaved={() => setScreen("transactions")}
              />
            )}
            {screen === "paymentIn" && (
              <PaymentIn
                onBack={() => setScreen("transactions")}
                onSaved={() => setScreen("transactions")}
              />
            )}
            {screen === "bookings" && (
              <Bookings
                onNewBooking={() => setScreen("newBooking")}
                onBookingTap={openBookingDetail}
              />
            )}
            {screen === "newBooking" && (
              <NewBooking
                onBack={() => setScreen("bookings")}
                onSaved={() => setScreen("bookings")}
              />
            )}
            {screen === "bookingDetail" && selectedBooking && (
              <BookingDetail
                booking={selectedBooking}
                onBack={() => setScreen("bookings")}
                onInvoice={openInvoice}
                onUpdated={(b) => setSelectedBooking(b)}
              />
            )}
            {screen === "tractors" && <TractorScreen />}
            {screen === "drivers" && <Drivers />}
            {screen === "expenses" && <Expenses />}
            {screen === "reports" && <Reports onNavigate={setScreen} />}
            {screen === "credits" && <Credits />}
            {screen === "parties" && <Parties onPartyTap={openPartyDetail} />}
            {screen === "partyDetail" && selectedParty && (
              <PartyDetail
                party={selectedParty}
                onBack={() => setScreen("parties")}
              />
            )}
            {screen === "settings" && (
              <SettingsScreen
                onBack={() => setScreen("dashboard")}
                onNavigate={(s) => setScreen(s as Screen)}
              />
            )}
            {screen === "invoice" && invoiceBooking && (
              <Invoice
                booking={invoiceBooking}
                onBack={() => setScreen("bookingDetail")}
              />
            )}
          </main>

          {/* Vyapar-style Bottom Action Bar */}
          {showActionBar && (
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-20">
              <div className="bg-card border-t border-border px-4 py-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigateTo("paymentIn")}
                  data-ocid="app.payment_lo.button"
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm text-center shadow-md active:scale-95 transition-transform"
                >
                  {language === "gu" ? "ચૂકવણી લો" : "Payment In"}
                </button>

                <button
                  type="button"
                  onClick={() => setScreen("newTransaction")}
                  data-ocid="app.naya_kaam.button"
                  className="flex-1 py-3 rounded-full font-bold text-sm text-center shadow-md active:scale-95 transition-transform"
                  style={{ background: "oklch(0.65 0.19 47)", color: "white" }}
                >
                  {language === "gu" ? "વ્યવહાર" : "Transaction"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
