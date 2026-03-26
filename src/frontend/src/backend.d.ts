import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MonthlyReport {
    month: bigint;
    year: bigint;
    totalJobs: bigint;
    totalEarnings: number;
}
export interface Settings {
    hourlyRate: number;
    language: string;
    darkMode: boolean;
    acreRate: number;
}
export interface DriverPerformance {
    id: bigint;
    name: string;
    totalJobs: bigint;
}
export interface Tractor {
    id: bigint;
    status: string;
    currentBookingId?: bigint;
    name: string;
    addedAt: bigint;
    number: string;
}
export interface Party {
    id: bigint;
    name: string;
    createdAt: bigint;
    village: string;
    phone: string;
}
export interface Driver {
    id: bigint;
    name: string;
    totalJobs: bigint;
    addedAt: bigint;
    phone: string;
}
export interface CreditRecord {
    id: bigint;
    customerName: string;
    lastPaymentDate: bigint;
    totalDue: number;
    amountPaid: number;
    village: string;
    notes: string;
    mobile: string;
}
export interface MaintenanceReminder {
    id: bigint;
    createdAt: bigint;
    dueDate: bigint;
    description: string;
    isDone: boolean;
    tractorId: bigint;
    reminderType: string;
}
export interface Booking {
    id: bigint;
    customerName: string;
    status: string;
    workType: string;
    driverId: bigint;
    finalAmount: number;
    date: bigint;
    hoursWorked: number;
    createdAt: bigint;
    discountType: string;
    acresWorked: number;
    tractorId: bigint;
    totalAmount: number;
    village: string;
    notes: string;
    advancePaid: number;
    discount: number;
    balanceDue: number;
    paymentMode: string;
    mobile: string;
    rateType: string;
    baseRate: number;
}
export interface PartyStats {
    totalJobs: bigint;
    totalEarnings: number;
    udharBalance: number;
}
export interface Expense {
    id: bigint;
    expenseType: string;
    date: bigint;
    createdAt: bigint;
    description: string;
    tractorId?: bigint;
    amount: number;
}
export interface backendInterface {
    createBooking(booking: Booking): Promise<bigint>;
    createCreditRecord(credit: CreditRecord): Promise<bigint>;
    createDriver(driver: Driver): Promise<bigint>;
    createExpense(expense: Expense): Promise<bigint>;
    createMaintenanceReminder(reminder: MaintenanceReminder): Promise<bigint>;
    createParty(party: Party): Promise<bigint>;
    createTractor(tractor: Tractor): Promise<bigint>;
    deleteBooking(id: bigint): Promise<void>;
    deleteCreditRecord(id: bigint): Promise<void>;
    deleteDriver(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteMaintenanceReminder(id: bigint): Promise<void>;
    deleteParty(id: bigint): Promise<void>;
    deleteTractor(id: bigint): Promise<void>;
    getAllBookings(): Promise<Array<Booking>>;
    getAllCreditRecords(): Promise<Array<CreditRecord>>;
    getAllDrivers(): Promise<Array<Driver>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllMaintenanceReminders(): Promise<Array<MaintenanceReminder>>;
    getAllParties(): Promise<Array<Party>>;
    getAllTractors(): Promise<Array<Tractor>>;
    getBooking(id: bigint): Promise<Booking>;
    getBookingsByCustomerName(name: string): Promise<Array<Booking>>;
    getBookingsByDate(date: bigint): Promise<Array<Booking>>;
    getBookingsByStatus(status: string): Promise<Array<Booking>>;
    getCreditRecord(id: bigint): Promise<CreditRecord>;
    getDriver(id: bigint): Promise<Driver>;
    getDriverBookings(driverId: bigint): Promise<Array<Booking>>;
    getDriverPerformance(): Promise<Array<DriverPerformance>>;
    getExpense(id: bigint): Promise<Expense>;
    getExpensesByMonth(month: bigint, year: bigint): Promise<Array<Expense>>;
    getMaintenanceReminder(id: bigint): Promise<MaintenanceReminder>;
    getMonthlyReport(month: bigint, year: bigint): Promise<MonthlyReport>;
    getNetProfit(month: bigint, year: bigint): Promise<number>;
    getParty(id: bigint): Promise<Party>;
    getPartyStats(name: string): Promise<PartyStats>;
    getPendingCredits(): Promise<Array<CreditRecord>>;
    getSettings(): Promise<Settings>;
    getTodayEarnings(today: bigint): Promise<number>;
    getTractor(id: bigint): Promise<Tractor>;
    getTractorBookings(tractorId: bigint): Promise<Array<Booking>>;
    getUpcomingReminders(currentDate: bigint): Promise<Array<MaintenanceReminder>>;
    updateBooking(id: bigint, booking: Booking): Promise<void>;
    updateCreditRecord(id: bigint, credit: CreditRecord): Promise<void>;
    updateDriver(id: bigint, driver: Driver): Promise<void>;
    updateExpense(id: bigint, expense: Expense): Promise<void>;
    updateMaintenanceReminder(id: bigint, reminder: MaintenanceReminder): Promise<void>;
    updateParty(id: bigint, party: Party): Promise<void>;
    updateSettings(newSettings: Settings): Promise<void>;
    updateTractor(id: bigint, tractor: Tractor): Promise<void>;
}
