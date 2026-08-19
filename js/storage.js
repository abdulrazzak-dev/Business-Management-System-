/* ==========================================================================
   Golden - LOCALSTORAGE STATE ENGINE & SEED DATA
   ========================================================================== */

const STORAGE_KEYS = {
  SETTINGS: 'Golden_settings',
  PRODUCTS: 'Golden_products',
  CUSTOMERS: 'Golden_customers',
  ORDERS: 'Golden_orders',
  SESSION: 'Golden_session',
  THEME: 'Golden_theme'
};

// Initial Seed Data
const DEFAULT_SETTINGS = {
  businessName: 'Apex Tech & Retail Solutions',
  businessEmail: 'contact@apextech.com',
  phone: '+1 (555) 234-5678',
  address: '742 Evergreen Terrace, Suite 400, San Francisco, CA',
  currency: 'USD',
  taxRate: 8.5,
  theme: 'light'
};

const DEFAULT_PRODUCTS = [
  { id: 'PRD-1001', name: 'UltraSlim Wireless Keyboard', category: 'Electronics', price: 69.99, stock: 45, status: 'In Stock', minStock: 10 },
  { id: 'PRD-1002', name: 'Ergonomic Optical Mouse', category: 'Electronics', price: 29.50, stock: 8, status: 'Low Stock', minStock: 15 },
  { id: 'PRD-1003', name: '4K Ultra HD Monitor 27"', category: 'Electronics', price: 349.00, stock: 12, status: 'In Stock', minStock: 5 },
  { id: 'PRD-1004', name: 'Leather Executive Chair', category: 'Furniture', price: 249.99, stock: 0, status: 'Out of Stock', minStock: 5 },
  { id: 'PRD-1005', name: 'Standing Desk Converter', category: 'Furniture', price: 189.50, stock: 18, status: 'In Stock', minStock: 8 },
  { id: 'PRD-1006', name: 'Noise-Canceling Headphones', category: 'Audio', price: 199.00, stock: 5, status: 'Low Stock', minStock: 10 },
  { id: 'PRD-1007', name: 'USB-C Multi-Port Hub', category: 'Accessories', price: 42.00, stock: 60, status: 'In Stock', minStock: 20 },
  { id: 'PRD-1008', name: 'HD Webcam with Mic', category: 'Electronics', price: 79.95, stock: 2, status: 'Low Stock', minStock: 10 }
];

const DEFAULT_CUSTOMERS = [
  { id: 'CUST-201', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '+1 (555) 891-2345', address: '123 Pine Street, Seattle, WA', totalSpent: 1240.50, ordersCount: 5 },
  { id: 'CUST-202', name: 'Michael Chang', email: 'mchang@techcorp.io', phone: '+1 (555) 432-8765', address: '88 Tech Boulevard, Austin, TX', totalSpent: 3490.00, ordersCount: 8 },
  { id: 'CUST-203', name: 'Elena Rostova', email: 'elena.rostova@designlab.com', phone: '+1 (555) 901-3412', address: '54 Creative Way, New York, NY', totalSpent: 620.00, ordersCount: 2 },
  { id: 'CUST-204', name: 'David Miller', email: 'dmiller99@gmail.com', phone: '+1 (555) 678-1234', address: '404 Oak Avenue, Chicago, IL', totalSpent: 185.00, ordersCount: 1 },
  { id: 'CUST-205', name: 'Amanda Lewis', email: 'alewis@innovate.org', phone: '+1 (555) 321-9876', address: '12 Market Plaza, Denver, CO', totalSpent: 2150.75, ordersCount: 6 }
];

const DEFAULT_ORDERS = [
  {
    id: 'ORD-5001',
    customerName: 'Michael Chang',
    customerId: 'CUST-202',
    date: '2026-08-14T14:32:00',
    items: [
      { productId: 'PRD-1003', productName: '4K Ultra HD Monitor 27"', price: 349.00, qty: 2 },
      { productId: 'PRD-1007', productName: 'USB-C Multi-Port Hub', price: 42.00, qty: 1 }
    ],
    subtotal: 740.00,
    tax: 62.90,
    total: 802.90,
    status: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-5002',
    customerName: 'Sarah Jenkins',
    customerId: 'CUST-201',
    date: '2026-08-14T11:15:00',
    items: [
      { productId: 'PRD-1001', productName: 'UltraSlim Wireless Keyboard', price: 69.99, qty: 1 },
      { productId: 'PRD-1002', productName: 'Ergonomic Optical Mouse', price: 29.50, qty: 1 }
    ],
    subtotal: 99.49,
    tax: 8.46,
    total: 107.95,
    status: 'Completed',
    paymentMethod: 'PayPal'
  },
  {
    id: 'ORD-5003',
    customerName: 'Elena Rostova',
    customerId: 'CUST-203',
    date: '2026-08-15T09:45:00',
    items: [
      { productId: 'PRD-1006', productName: 'Noise-Canceling Headphones', price: 199.00, qty: 1 }
    ],
    subtotal: 199.00,
    tax: 16.92,
    total: 215.92,
    status: 'Processing',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'ORD-5004',
    customerName: 'Amanda Lewis',
    customerId: 'CUST-205',
    date: '2026-08-15T16:20:00',
    items: [
      { productId: 'PRD-1005', productName: 'Standing Desk Converter', price: 189.50, qty: 2 }
    ],
    subtotal: 379.00,
    tax: 32.22,
    total: 411.22,
    status: 'Pending',
    paymentMethod: 'Bank Transfer'
  }
];

class StorageEngine {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    }
  }

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key} from LocalStorage:`, e);
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to LocalStorage:`, e);
      return false;
    }
  }

  // Helper getters/setters
  getSettings() { return this.get(STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS; }
  saveSettings(settings) { return this.set(STORAGE_KEYS.SETTINGS, settings); }

  getProducts() { return this.get(STORAGE_KEYS.PRODUCTS) || []; }
  saveProducts(products) { return this.set(STORAGE_KEYS.PRODUCTS, products); }

  getCustomers() { return this.get(STORAGE_KEYS.CUSTOMERS) || []; }
  saveCustomers(customers) { return this.set(STORAGE_KEYS.CUSTOMERS, customers); }

  getOrders() { return this.get(STORAGE_KEYS.ORDERS) || []; }
  saveOrders(orders) { return this.set(STORAGE_KEYS.ORDERS, orders); }

  // Currency Formatter
  formatCurrency(amount) {
    const settings = this.getSettings();
    const currency = settings.currency || 'INR';
    const symbolMap = { INR: 'Rs. ', USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' };
    const symbol = symbolMap[currency] || 'Rs. ';
    return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

const storage = new StorageEngine();
