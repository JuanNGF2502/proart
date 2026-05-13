"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { Package, Clock, ArrowRight, GripVertical, LayoutGrid, List, Search, Loader2, FileText, ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { useOrders } from "@/hooks/useOrders";
import type { Order, OrderItem } from "@/types/database";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  aguardando: { label: "Aguardando", bg: "bg-gray-100", text: "text-gray-600" },
  arte: { label: "Arte", bg: "bg-purple-100", text: "text-purple-700" },
  impressao: { label: "Impressão", bg: "bg-cyan-100", text: "text-cyan-700" },
  producao: { label: "Produção", bg: "bg-blue-100", text: "text-blue-700" },
  acabamento: { label: "Acabamento", bg: "bg-amber-100", text: "text-amber-700" },
  concluido: { label: "Concluído", bg: "bg-emerald-100", text: "text-emerald-700" },
};

export default function OrdersPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [search, setSearch] = useState("");
  const { orders, loading } = useOrders();

  const filteredOrders = orders.filter(order => {
    const clientName = order.client?.name || '';
    const orderNumber = order.order_number || '';
    return clientName.toLowerCase().includes(search.toLowerCase()) ||
           orderNumber.toLowerCase().includes(search.toLowerCase());
  });

  const kanbanColumns = [
    { id: "aguardando", label: "Aguardando", orders: filteredOrders.filter(o => o.status === "aguardando") },
    { id: "arte", label: "Arte", orders: filteredOrders.filter(o => o.status === "arte") },
    { id: "impressao", label: "Impressão", orders: filteredOrders.filter(o => o.status === "impressao") },
    { id: "producao", label: "Produção", orders: filteredOrders.filter(o => o.status === "producao") },
    { id: "acabamento", label: "Acabamento", orders: filteredOrders.filter(o => o.status === "acabamento") },
    { id: "concluido", label: "Concluído", orders: filteredOrders.filter(o => o.status === "concluido") },
  ];

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getFirstItemName = (items?: OrderItem[]) => {
    if (items && items.length > 0) {
      return items[0].name;
    }
    return 'Sem itens';
  };

  const getTotalQty = (items?: OrderItem[]) => {
    if (items && items.length > 0) {
      return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
    }
    return 0;
  };

  return (
    <DashboardLayout>
      <Header
        title="Pedidos"
        description={`${orders.length} pedidos`}
      />

      <div className="p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou pedido..."
            className="input pl-12"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                viewMode === "kanban" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                viewMode === "list" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : viewMode === "kanban" ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5">
            {kanbanColumns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{column.label}</h3>
                  <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {column.orders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {column.orders.map((order, index) => {
                    const daysLeft = getDaysLeft(order.deadline);
                    return (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="card cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2 mb-3">
                            <GripVertical className="h-4 w-4 text-gray-300" />
                            <span className="text-xs font-semibold text-gray-400">#{order.order_number}</span>
                          </div>
                          <p className="font-semibold text-gray-900 mb-1">{order.client?.name || 'Cliente'}</p>
                          <p className="text-sm text-gray-500 mb-3">{getTotalQty(order.items)}x {getFirstItemName(order.items)}</p>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                            {daysLeft !== null && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                                daysLeft < 0 ? "bg-red-100 text-red-700" :
                                daysLeft <= 2 ? "bg-amber-100 text-amber-700" :
                                "bg-gray-100 text-gray-500"
                              }`}>
                                <Clock className="h-3 w-3" />
                                {daysLeft < 0 ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
              </div>
            ) : (
              filteredOrders.map((order, index) => {
                const daysLeft = getDaysLeft(order.deadline);
                return (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-400">#{order.order_number}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.text}`}>
                            {statusConfig[order.status]?.label}
                          </span>
                          {order.budget_id && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Do orçamento
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 truncate">{order.client?.name || 'Cliente'}</p>
                        <p className="text-sm text-gray-500">{getTotalQty(order.items)}x {getFirstItemName(order.items)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                        {daysLeft !== null && (
                          <div className={`flex items-center gap-1 text-xs font-semibold ${
                            daysLeft < 0 ? "text-red-600" :
                            daysLeft <= 2 ? "text-amber-600" :
                            "text-gray-400"
                          }`}>
                            <Clock className="h-3 w-3" />
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}