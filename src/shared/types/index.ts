export type UserRole = "admin" | "production" | "attendance" | "finance";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  cpfCnpj?: string;
  address: Address;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description?: string;
  basePrice: number;
  costPrice?: number;
  unit: "cm" | "m" | "un" | "pct";
  productionTime?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory =
  | "banner"
  | "sticker"
  | "business_card"
  | "facade"
  | "tshirt"
  | "mug"
  | "planner"
  | "keychain"
  | "box"
  | "acrylic"
  | "mdf"
  | "dtf"
  | "sublimation"
  | "laser"
  | "custom";

export interface Budget {
  id: string;
  clientId?: string;
  client?: Client;
  clientName: string;
  clientPhone: string;
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  freight: number;
  deposit: number;
  total: number;
  status: BudgetStatus;
  observations?: string;
  validity?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetItem {
  id: string;
  productId?: string;
  productName: string;
  width: number;
  height: number;
  unit: "cm" | "m" | "un" | "pct";
  quantity: number;
  material?: string;
  finish?: string;
  deadline?: number;
  observations?: string;
  unitPrice: number;
  discount: number;
  total: number;
}

export type BudgetStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export interface Order {
  id: string;
  budgetId: string;
  budget?: Budget;
  clientId: string;
  client?: Client;
  items: BudgetItem[];
  total: number;
  status: OrderStatus;
  priority: Priority;
  deadline: Date;
  observations?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | "pending"
  | "approved"
  | "production"
  | "printing"
  | "finishing"
  | "completed"
  | "delivered";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  link?: string;
  createdAt: Date;
}

export type NotificationType =
  | "new_order"
  | "delay"
  | "budget_approved"
  | "production_completed"
  | "reminder"
  | "info";

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "view"
  | "login"
  | "logout";

export interface DashboardStats {
  todayRevenue: number;
  ordersInProgress: number;
  ordersCompleted: number;
  ordersDelayed: number;
  pendingBudgets: number;
  topProducts: { name: string; count: number }[];
  recentClients: Client[];
}

export interface KanbanColumn {
  id: OrderStatus;
  title: string;
  cards: Order[];
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
