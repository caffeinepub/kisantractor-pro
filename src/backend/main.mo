import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";
import List "mo:core/List";

actor {
  // Types
  type Booking = {
    id : Nat;
    customerName : Text;
    mobile : Text;
    village : Text;
    workType : Text;
    date : Int;
    tractorId : Nat;
    driverId : Nat;
    status : Text;
    hoursWorked : Float;
    acresWorked : Float;
    baseRate : Float;
    rateType : Text;
    totalAmount : Float;
    discount : Float;
    discountType : Text;
    finalAmount : Float;
    paymentMode : Text;
    advancePaid : Float;
    balanceDue : Float;
    notes : Text;
    createdAt : Int;
  };

  type Tractor = {
    id : Nat;
    name : Text;
    number : Text;
    status : Text;
    currentBookingId : ?Nat;
    addedAt : Int;
  };

  type Driver = {
    id : Nat;
    name : Text;
    phone : Text;
    totalJobs : Nat;
    addedAt : Int;
  };

  type Expense = {
    id : Nat;
    expenseType : Text;
    tractorId : ?Nat;
    amount : Float;
    description : Text;
    date : Int;
    createdAt : Int;
  };

  type MaintenanceReminder = {
    id : Nat;
    tractorId : Nat;
    reminderType : Text;
    dueDate : Int;
    description : Text;
    isDone : Bool;
    createdAt : Int;
  };

  type CreditRecord = {
    id : Nat;
    customerName : Text;
    mobile : Text;
    village : Text;
    totalDue : Float;
    amountPaid : Float;
    lastPaymentDate : Int;
    notes : Text;
  };

  type Party = {
    id : Nat;
    name : Text;
    phone : Text;
    village : Text;
    createdAt : Int;
  };

  type PartyStats = {
    totalEarnings : Float;
    totalJobs : Nat;
    udharBalance : Float;
  };

  // Settings returned to frontend (full type)
  type Settings = {
    hourlyRate : Float;
    acreRate : Float;
    language : Text;
    darkMode : Bool;
    services : [Text];
    serviceRates : Text;
    ownerPassword : Text;
  };

  type MonthlyReport = {
    totalJobs : Nat;
    totalEarnings : Float;
    month : Nat;
    year : Nat;
  };

  type DriverPerformance = {
    id : Nat;
    name : Text;
    totalJobs : Nat;
  };

  // Modules for Sorting
  module Booking {
    public func compare(booking1 : Booking, booking2 : Booking) : Order.Order {
      Int.compare(booking2.createdAt, booking1.createdAt);
    };

    public func compareByDate(booking1 : Booking, booking2 : Booking) : Order.Order {
      Int.compare(booking2.date, booking1.date);
    };
  };

  module Expense {
    public func compare(expense1 : Expense, expense2 : Expense) : Order.Order {
      Int.compare(expense2.createdAt, expense1.createdAt);
    };

    public func compareByDate(expense1 : Expense, expense2 : Expense) : Order.Order {
      Int.compare(expense2.date, expense1.date);
    };
  };

  module MaintenanceReminder {
    public func compare(reminder1 : MaintenanceReminder, reminder2 : MaintenanceReminder) : Order.Order {
      Int.compare(reminder2.createdAt, reminder1.createdAt);
    };

    public func compareByDueDate(reminder1 : MaintenanceReminder, reminder2 : MaintenanceReminder) : Order.Order {
      Int.compare(reminder1.dueDate, reminder2.dueDate);
    };
  };

  module CreditRecord {
    public func compare(credit1 : CreditRecord, credit2 : CreditRecord) : Order.Order {
      Int.compare(credit2.lastPaymentDate, credit1.lastPaymentDate);
    };
  };

  module Driver {
    public func compareByTotalJobs(driver1 : Driver, driver2 : Driver) : Order.Order {
      Int.compare(driver2.totalJobs, driver1.totalJobs);
    };
  };

  module Party {
    public func compare(p1 : Party, p2 : Party) : Order.Order {
      Int.compare(p2.createdAt, p1.createdAt);
    };
  };

  // Storage
  let bookings = Map.empty<Nat, Booking>();
  let tractors = Map.empty<Nat, Tractor>();
  let drivers = Map.empty<Nat, Driver>();
  let expenses = Map.empty<Nat, Expense>();
  let maintenanceReminders = Map.empty<Nat, MaintenanceReminder>();
  let creditRecords = Map.empty<Nat, CreditRecord>();
  let parties = Map.empty<Nat, Party>();

  // Keep old settings stable var with original type to avoid compatibility error
  var settings : { hourlyRate : Float; acreRate : Float; language : Text; darkMode : Bool } = {
    hourlyRate = 0.0;
    acreRate = 0.0;
    language = "gu";
    darkMode = false;
  };

  // New settings fields stored as separate stable variables
  var settingsServices : [Text] = ["Ploughing", "Harvesting", "Threshing", "Other"];
  var settingsServiceRates : Text = "{}";
  var settingsOwnerPassword : Text = "1234";

  var nextBookingId = 1;
  var nextTractorId = 1;
  var nextDriverId = 1;
  var nextExpenseId = 1;
  var nextReminderId = 1;
  var nextCreditId = 1;
  var nextPartyId = 1;

  // CRUD Operations
  public shared ({ caller }) func createBooking(booking : Booking) : async Nat {
    let newBooking : Booking = {
      booking with
      id = nextBookingId;
      createdAt = Time.now();
    };
    bookings.add(nextBookingId, newBooking);
    nextBookingId += 1;
    newBooking.id;
  };

  public query ({ caller }) func getBooking(id : Nat) : async Booking {
    switch (bookings.get(id)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) { booking };
    };
  };

  public shared ({ caller }) func updateBooking(id : Nat, booking : Booking) : async () {
    if (not bookings.containsKey(id)) { Runtime.trap("Booking not found") };
    bookings.add(id, booking);
  };

  public shared ({ caller }) func deleteBooking(id : Nat) : async () {
    if (not bookings.containsKey(id)) { Runtime.trap("Booking not found") };
    bookings.remove(id);
  };

  public query ({ caller }) func getAllBookings() : async [Booking] {
    bookings.values().toArray().sort();
  };

  public shared ({ caller }) func createTractor(tractor : Tractor) : async Nat {
    let newTractor : Tractor = {
      tractor with
      id = nextTractorId;
      currentBookingId = null;
      addedAt = Time.now();
    };
    tractors.add(nextTractorId, newTractor);
    nextTractorId += 1;
    newTractor.id;
  };

  public query ({ caller }) func getTractor(id : Nat) : async Tractor {
    switch (tractors.get(id)) {
      case (null) { Runtime.trap("Tractor not found") };
      case (?tractor) { tractor };
    };
  };

  public shared ({ caller }) func updateTractor(id : Nat, tractor : Tractor) : async () {
    if (not tractors.containsKey(id)) { Runtime.trap("Tractor not found") };
    tractors.add(id, tractor);
  };

  public shared ({ caller }) func deleteTractor(id : Nat) : async () {
    if (not tractors.containsKey(id)) { Runtime.trap("Tractor not found") };
    tractors.remove(id);
  };

  public query ({ caller }) func getAllTractors() : async [Tractor] {
    tractors.values().toArray();
  };

  public shared ({ caller }) func createDriver(driver : Driver) : async Nat {
    let newDriver : Driver = {
      driver with
      id = nextDriverId;
      totalJobs = 0;
      addedAt = Time.now();
    };
    drivers.add(nextDriverId, newDriver);
    nextDriverId += 1;
    newDriver.id;
  };

  public query ({ caller }) func getDriver(id : Nat) : async Driver {
    switch (drivers.get(id)) {
      case (null) { Runtime.trap("Driver not found") };
      case (?driver) { driver };
    };
  };

  public shared ({ caller }) func updateDriver(id : Nat, driver : Driver) : async () {
    if (not drivers.containsKey(id)) { Runtime.trap("Driver not found") };
    drivers.add(id, driver);
  };

  public shared ({ caller }) func deleteDriver(id : Nat) : async () {
    if (not drivers.containsKey(id)) { Runtime.trap("Driver not found") };
    drivers.remove(id);
  };

  public query ({ caller }) func getAllDrivers() : async [Driver] {
    drivers.values().toArray();
  };

  public shared ({ caller }) func createExpense(expense : Expense) : async Nat {
    let newExpense : Expense = {
      expense with
      id = nextExpenseId;
      createdAt = Time.now();
    };
    expenses.add(nextExpenseId, newExpense);
    nextExpenseId += 1;
    newExpense.id;
  };

  public query ({ caller }) func getExpense(id : Nat) : async Expense {
    switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?expense) { expense };
    };
  };

  public shared ({ caller }) func updateExpense(id : Nat, expense : Expense) : async () {
    if (not expenses.containsKey(id)) { Runtime.trap("Expense not found") };
    expenses.add(id, expense);
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not expenses.containsKey(id)) { Runtime.trap("Expense not found") };
    expenses.remove(id);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    expenses.values().toArray().sort();
  };

  public shared ({ caller }) func createMaintenanceReminder(reminder : MaintenanceReminder) : async Nat {
    let newReminder : MaintenanceReminder = {
      reminder with
      id = nextReminderId;
      isDone = false;
      createdAt = Time.now();
    };
    maintenanceReminders.add(nextReminderId, newReminder);
    nextReminderId += 1;
    newReminder.id;
  };

  public query ({ caller }) func getMaintenanceReminder(id : Nat) : async MaintenanceReminder {
    switch (maintenanceReminders.get(id)) {
      case (null) { Runtime.trap("Reminder not found") };
      case (?reminder) { reminder };
    };
  };

  public shared ({ caller }) func updateMaintenanceReminder(id : Nat, reminder : MaintenanceReminder) : async () {
    if (not maintenanceReminders.containsKey(id)) { Runtime.trap("Reminder not found") };
    maintenanceReminders.add(id, reminder);
  };

  public shared ({ caller }) func deleteMaintenanceReminder(id : Nat) : async () {
    if (not maintenanceReminders.containsKey(id)) { Runtime.trap("Reminder not found") };
    maintenanceReminders.remove(id);
  };

  public query ({ caller }) func getAllMaintenanceReminders() : async [MaintenanceReminder] {
    maintenanceReminders.values().toArray().sort();
  };

  public shared ({ caller }) func createCreditRecord(credit : CreditRecord) : async Nat {
    let newCredit : CreditRecord = {
      credit with
      id = nextCreditId;
      lastPaymentDate = Time.now();
    };
    creditRecords.add(nextCreditId, newCredit);
    nextCreditId += 1;
    newCredit.id;
  };

  public query ({ caller }) func getCreditRecord(id : Nat) : async CreditRecord {
    switch (creditRecords.get(id)) {
      case (null) { Runtime.trap("Credit record not found") };
      case (?credit) { credit };
    };
  };

  public shared ({ caller }) func updateCreditRecord(id : Nat, credit : CreditRecord) : async () {
    if (not creditRecords.containsKey(id)) { Runtime.trap("Credit record not found") };
    creditRecords.add(id, credit);
  };

  public shared ({ caller }) func deleteCreditRecord(id : Nat) : async () {
    if (not creditRecords.containsKey(id)) { Runtime.trap("Credit record not found") };
    creditRecords.remove(id);
  };

  public query ({ caller }) func getAllCreditRecords() : async [CreditRecord] {
    creditRecords.values().toArray().sort();
  };

  // Party CRUD
  public shared ({ caller }) func createParty(party : Party) : async Nat {
    let newParty : Party = {
      party with
      id = nextPartyId;
      createdAt = Time.now();
    };
    parties.add(nextPartyId, newParty);
    nextPartyId += 1;
    newParty.id;
  };

  public query ({ caller }) func getParty(id : Nat) : async Party {
    switch (parties.get(id)) {
      case (null) { Runtime.trap("Party not found") };
      case (?party) { party };
    };
  };

  public shared ({ caller }) func updateParty(id : Nat, party : Party) : async () {
    if (not parties.containsKey(id)) { Runtime.trap("Party not found") };
    parties.add(id, party);
  };

  public shared ({ caller }) func deleteParty(id : Nat) : async () {
    if (not parties.containsKey(id)) { Runtime.trap("Party not found") };
    parties.remove(id);
  };

  public query ({ caller }) func getAllParties() : async [Party] {
    parties.values().toArray().sort();
  };

  public query ({ caller }) func getBookingsByCustomerName(name : Text) : async [Booking] {
    bookings.values().toArray().sort().filter(func(booking) { booking.customerName == name });
  };

  public query ({ caller }) func getPartyStats(name : Text) : async PartyStats {
    var totalEarnings : Float = 0.0;
    var totalJobs : Nat = 0;
    bookings.values().forEach(
      func(booking) {
        if (booking.customerName == name) {
          totalEarnings += booking.finalAmount;
          totalJobs += 1;
        };
      }
    );
    var udharBalance : Float = 0.0;
    creditRecords.values().forEach(
      func(credit) {
        if (credit.customerName == name) {
          let bal = credit.totalDue - credit.amountPaid;
          if (bal > 0.0) { udharBalance += bal };
        };
      }
    );
    { totalEarnings; totalJobs; udharBalance };
  };

  // Settings: split across old `settings` var + new separate vars to avoid upgrade compatibility error
  public shared ({ caller }) func updateSettings(newSettings : Settings) : async () {
    settings := {
      hourlyRate = newSettings.hourlyRate;
      acreRate = newSettings.acreRate;
      language = newSettings.language;
      darkMode = newSettings.darkMode;
    };
    settingsServices := newSettings.services;
    settingsServiceRates := newSettings.serviceRates;
    settingsOwnerPassword := newSettings.ownerPassword;
  };

  public query ({ caller }) func getSettings() : async Settings {
    {
      hourlyRate = settings.hourlyRate;
      acreRate = settings.acreRate;
      language = settings.language;
      darkMode = settings.darkMode;
      services = settingsServices;
      serviceRates = settingsServiceRates;
      ownerPassword = settingsOwnerPassword;
    };
  };

  // Query Functions
  public query ({ caller }) func getBookingsByDate(date : Int) : async [Booking] {
    bookings.values().toArray().sort().filter(func(booking) { booking.date == date });
  };

  public query ({ caller }) func getBookingsByStatus(status : Text) : async [Booking] {
    bookings.values().toArray().sort().filter(func(booking) { booking.status == status });
  };

  public query ({ caller }) func getTodayEarnings(today : Int) : async Float {
    var total : Float = 0.0;
    bookings.values().forEach(
      func(booking) {
        if (booking.date == today) {
          total += booking.finalAmount;
        };
      }
    );
    total;
  };

  public query ({ caller }) func getMonthlyReport(month : Nat, year : Nat) : async MonthlyReport {
    var totalJobs = 0;
    var totalEarnings : Float = 0.0;
    bookings.values().forEach(
      func(booking) {
        let bDate = booking.date;
        let bYear = bDate / 10000;
        let bMonth = (bDate / 100) % 100;
        if (bYear == year and bMonth == month) {
          totalJobs += 1;
          totalEarnings += booking.finalAmount;
        };
      }
    );
    {
      totalJobs;
      totalEarnings;
      month;
      year;
    };
  };

  public query ({ caller }) func getExpensesByMonth(month : Nat, year : Nat) : async [Expense] {
    expenses.values().toArray().sort().filter(
      func(expense) {
        let eDate = expense.date;
        let eYear = eDate / 10000;
        let eMonth = (eDate / 100) % 100;
        eYear == year and eMonth == month;
      }
    );
  };

  public query ({ caller }) func getNetProfit(month : Nat, year : Nat) : async Float {
    var totalEarnings : Float = 0.0;
    var totalExpenses : Float = 0.0;

    bookings.values().forEach(
      func(booking) {
        let bDate = booking.date;
        let bYear = bDate / 10000;
        let bMonth = (bDate / 100) % 100;
        if (bYear == year and bMonth == month) {
          totalEarnings += booking.finalAmount;
        };
      }
    );

    expenses.values().forEach(
      func(expense) {
        let eDate = expense.date;
        let eYear = eDate / 10000;
        let eMonth = (eDate / 100) % 100;
        if (eYear == year and eMonth == month) {
          totalExpenses += expense.amount;
        };
      }
    );

    totalEarnings - totalExpenses;
  };

  public query ({ caller }) func getDriverPerformance() : async [DriverPerformance] {
    drivers.values().toArray().sort(Driver.compareByTotalJobs).map(
      func(driver) {
        {
          id = driver.id;
          name = driver.name;
          totalJobs = driver.totalJobs;
        };
      }
    );
  };

  public query ({ caller }) func getTractorBookings(tractorId : Nat) : async [Booking] {
    bookings.values().toArray().sort().filter(func(booking) { booking.tractorId == tractorId });
  };

  public query ({ caller }) func getDriverBookings(driverId : Nat) : async [Booking] {
    bookings.values().toArray().sort().filter(func(booking) { booking.driverId == driverId });
  };

  public query ({ caller }) func getUpcomingReminders(currentDate : Int) : async [MaintenanceReminder] {
    maintenanceReminders.values().toArray().sort(MaintenanceReminder.compareByDueDate).filter(
      func(reminder) { reminder.dueDate >= currentDate and not reminder.isDone }
    );
  };

  public query ({ caller }) func getPendingCredits() : async [CreditRecord] {
    creditRecords.values().toArray().sort().filter(func(credit) { credit.totalDue > 0 });
  };
};
