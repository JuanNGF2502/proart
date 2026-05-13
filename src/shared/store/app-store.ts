import { create } from "zustand";
import type { Client, Budget, Order, Notification } from "@/shared/types";

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  clients: Client[];
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  moveOrder: (id: string, status: Order["status"]) => void;

  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
}

export const useAppStore = create<AppState>()((set, get) => ({
  sidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

  // Clients
  clients: [],
  setClients: (clients: Client[]) => set({ clients }),
  addClient: (client: Client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (id: string, client: Partial<Client>) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...client } : c)),
    })),
  deleteClient: (id: string) =>
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),

  // Budgets
  budgets: [],
  setBudgets: (budgets: Budget[]) => set({ budgets }),
  addBudget: (budget: Budget) => set((state) => ({ budgets: [...state.budgets, budget] })),
  updateBudget: (id: string, budget: Partial<Budget>) =>
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...budget } : b)),
    })),
  deleteBudget: (id: string) =>
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

  // Orders
  orders: [],
  setOrders: (orders: Order[]) => set({ orders }),
  addOrder: (order: Order) => set((state) => ({ orders: [...state.orders, order] })),
  updateOrder: (id: string, order: Partial<Order>) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...order } : o)),
    })),
  deleteOrder: (id: string) =>
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),
  moveOrder: (id: string, status: Order["status"]) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),

  // Notifications
  notifications: [],
  setNotifications: (notifications: Notification[]) => set({ notifications }),
  addNotification: (notification: Notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
