// ============================================
// PROART APP - SUPABASE TYPES
// ============================================

export type ClientStatus = 'ativo' | 'recorrente' | 'inadimplente' | 'vip';
export type BudgetStatus = 'pendente' | 'aprovado' | 'recusado' | 'expirado';
export type OrderStatus = 'aguardando' | 'arte' | 'impressao' | 'producao' | 'acabamento' | 'concluido' | 'cancelado';
export type PaymentStatus = 'pendente' | 'parcial' | 'pago' | 'atrasado';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ContactPreference = 'whatsapp' | 'telefone' | 'email';
export type FileType = 'image' | 'pdf' | 'document' | 'archive';

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'manager';
  created_at: string;
  updated_at: string;
}

// ============================================
// CLIENT
// ============================================

export interface Client {
  id: string;
  user_id?: string;

  // Basic Info
  name: string;
  contact_name?: string;
  document?: string;
  document_type?: 'cpf' | 'cnpj';

  // Contact
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;

  // Address
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;

  // Billing Address
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip_code?: string;

  // Delivery Address
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip_code?: string;

  // Status
  status: ClientStatus;

  // Preferences
  preferred_contact: ContactPreference;
  delivery_preference: boolean;
  pickup_preference: boolean;
  favorite_material?: string;
  favorite_finish?: string;

  // Internal
  notes?: string;
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations (optional)
  budgets?: Budget[];
  orders?: Order[];
  client_files?: ClientFile[];
  client_notes?: ClientNote[];
}

// ============================================
// BUDGET
// ============================================

export interface Budget {
  id: string;
  client_id?: string;
  user_id?: string;

  // Budget Info
  budget_number: string;
  status: BudgetStatus;

  // Dates
  valid_until: string;
  approved_at?: string;
  rejected_at?: string;

  // Financial
  subtotal: number;
  discount: number;
  total: number;

  // Notes
  notes?: string;
  internal_notes?: string;

  // PDF
  pdf_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  client?: Client;
  items?: BudgetItem[];
  user?: User;
}

// ============================================
// BUDGET ITEM
// ============================================

export interface BudgetItem {
  id: string;
  budget_id: string;

  // Item Info
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;

  // Product reference
  product_id?: string;

  // Order
  sort_order: number;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  product?: Product;
}

// ============================================
// PRODUCT
// ============================================

export interface Product {
  id: string;
  user_id?: string;

  // Basic Info
  name: string;
  description?: string;
  sku?: string;

  // Pricing
  unit_price: number;
  unit: string;

  // Category
  category?: string;

  // Materials & Finishes
  materials?: string[];
  finishes?: string[];

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Image
  image_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================
// ORDER
// ============================================

export interface Order {
  id: string;
  client_id?: string;
  user_id?: string;
  budget_id?: string;

  // Order Info
  order_number: string;
  status: OrderStatus;
  priority: Priority;

  // Production
  responsible?: string;

  // Dates
  deadline?: string;
  started_at?: string;
  finished_at?: string;
  delivered_at?: string;

  // Financial
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;

  // Notes
  notes?: string;
  internal_notes?: string;
  production_notes?: string;

  // Specifications
  specifications?: Record<string, any>;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  client?: Client;
  budget?: Budget;
  items?: OrderItem[];
  user?: User;
}

// ============================================
// ORDER ITEM
// ============================================

export interface OrderItem {
  id: string;
  order_id: string;

  // Item Info
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;

  // Product reference
  product_id?: string;

  // Specifications
  material?: string;
  finish?: string;
  dimensions?: string;

  // Status per item
  status: string;

  // Order
  sort_order: number;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  product?: Product;
}

// ============================================
// PAYMENT
// ============================================

export interface Payment {
  id: string;
  client_id?: string;
  order_id?: string;
  budget_id?: string;
  user_id?: string;

  // Payment Info
  amount: number;
  payment_method: 'pix' | 'dinheiro' | 'transferencia' | 'credito' | 'debito' | 'boleto' | 'cheque';
  status: PaymentStatus;

  // Reference
  description?: string;
  receipt_url?: string;

  // Dates
  due_date?: string;
  paid_at?: string;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  client?: Client;
  order?: Order;
}

// ============================================
// CLIENT FILE
// ============================================

export interface ClientFile {
  id: string;
  client_id: string;
  user_id?: string;

  // File Info
  name: string;
  file_url: string;
  file_type: FileType;
  file_size?: number;

  // Category
  category?: 'logo' | 'arte' | 'referencia' | 'contrato' | 'documento' | 'outro';

  // Description
  description?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================
// CLIENT NOTE
// ============================================

export interface ClientNote {
  id: string;
  client_id: string;
  user_id?: string;

  // Note Info
  note: string;
  note_type: 'general' | 'preference' | 'complaint' | 'internal' | 'follow_up';

  // Internal flag
  is_internal: boolean;

  // Follow up
  follow_up_date?: string;
  follow_up_done: boolean;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
}

// ============================================
// TIMELINE
// ============================================

export interface Timeline {
  id: string;
  client_id?: string;
  order_id?: string;
  budget_id?: string;
  user_id?: string;

  // Event Info
  event_type: string;
  title: string;
  description?: string;

  // Additional data
  metadata?: Record<string, any>;

  // Metadata
  created_at: string;

  // Relations
  client?: Client;
  order?: Order;
  budget?: Budget;
  user?: User;
}

// ============================================
// SETTINGS
// ============================================

export interface Settings {
  id: string;
  user_id?: string;

  // Company Info
  company_name?: string;
  company_document?: string;
  company_phone?: string;
  company_email?: string;
  company_address?: string;
  company_logo_url?: string;

  // Budget Settings
  budget_validity_days: number;
  budget_prefix: string;

  // Order Settings
  order_prefix: string;

  // Preferences
  primary_color: string;
  dark_color: string;

  // WhatsApp
  whatsapp_number?: string;
  whatsapp_message_template?: string;

  // Email
  email_smtp_host?: string;
  email_smtp_port?: number;
  email_smtp_user?: string;
  email_smtp_password?: string;
  email_from?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================
// VIEWS
// ============================================

export interface ClientSummary {
  id: string;
  name: string;
  status: ClientStatus;
  total_orders: number;
  total_spent: number;
  completed_orders: number;
  last_order_date?: string;
}

export interface BudgetSummary {
  id: string;
  budget_number: string;
  status: BudgetStatus;
  total: number;
  valid_until: string;
  client_name?: string;
  item_count: number;
  created_at: string;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  priority: Priority;
  total: number;
  deadline?: string;
  client_name?: string;
  responsible?: string;
  created_at: string;
}

export interface PendingPayment {
  id: string;
  client_id?: string;
  order_id?: string;
  amount: number;
  due_date?: string;
  status: PaymentStatus;
  client_name?: string;
  order_number?: string;
}

// ============================================
// API PAYLOADS
// ============================================

export interface CreateBudgetPayload {
  client_id?: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    product_id?: string;
  }>;
  notes?: string;
  internal_notes?: string;
  discount?: number;
  validity_days?: number;
}

export interface CreateOrderPayload {
  client_id?: string;
  budget_id?: string;
  priority?: Priority;
  deadline?: string;
  responsible?: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    material?: string;
    finish?: string;
    dimensions?: string;
  }>;
  notes?: string;
  payment?: {
    amount: number;
    payment_method: string;
    due_date?: string;
  };
}

export interface CreateClientPayload {
  name: string;
  contact_name?: string;
  document?: string;
  document_type?: 'cpf' | 'cnpj';
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status?: ClientStatus;
  notes?: string;
  preferred_contact?: ContactPreference;
  delivery_preference?: boolean;
  pickup_preference?: boolean;
  favorite_material?: string;
  favorite_finish?: string;
}
