"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Factory, Clock, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, Search, Package, Play, User, X, Phone, Mail, MapPin, FileText, Loader2 } from "lucide-react";
import { useProductionOrders } from "@/hooks";
import type { Order } from "@/types/database";

type ProductionStatus = "aguardando" | "arte" | "impressao" | "producao" | "acabamento" | "concluido";
type Priority = "urgent" | "high" | "medium" | "low";

const statusConfig: Record<ProductionStatus, { label: string; bg: string; text: string; next: ProductionStatus | null; prev: ProductionStatus | null }> = {
  aguardando: { label: "Aguardando", bg: "bg-gray-100", text: "text-gray-600", next: "arte", prev: null },
  arte: { label: "Arte", bg: "bg-purple-100", text: "text-purple-700", next: "impressao", prev: "aguardando" },
  impressao: { label: "Impressão", bg: "bg-cyan-100", text: "text-cyan-700", next: "producao", prev: "arte" },
  producao: { label: "Produção", bg: "bg-blue-100", text: "text-blue-700", next: "acabamento", prev: "impressao" },
  acabamento: { label: "Acabamento", bg: "bg-amber-100", text: "text-amber-700", next: "concluido", prev: "producao" },
  concluido: { label: "Concluído", bg: "bg-emerald-100", text: "text-emerald-700", next: null, prev: "acabamento" },
};

const priorityConfig: Record<Priority, { label: string; bg: string; text: string }> = {
  urgent: { label: "Urgente", bg: "bg-red-500", text: "text-white" },
  high: { label: "Alta", bg: "bg-orange-500", text: "text-white" },
  medium: { label: "Média", bg: "bg-blue-500", text: "text-white" },
  low: { label: "Baixa", bg: "bg-gray-400", text: "text-white" },
};

const stages: ProductionStatus[] = ["aguardando", "arte", "impressao", "producao", "acabamento", "concluido"];

const getProgressByStatus = (status: ProductionStatus): number => {
  const idx = stages.indexOf(status);
  return ((idx + 1) / stages.length) * 100;
};

export default function ProductionPage() {
  const { orders, loading, updateStatus } = useProductionOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | "todos">("todos");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "todos">("todos");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const clientName = order.client?.name || '';
      const matchesSearch = clientName.toLowerCase().includes(search.toLowerCase()) ||
        (order.order_number || '').includes(search);
      const matchesStatus = statusFilter === "todos" || order.status === statusFilter;
      const matchesPriority = priorityFilter === "todos" || order.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, search, statusFilter, priorityFilter]);

  // Calculate stats dynamically
  const stats = useMemo(() => {
    const emProducao = orders.filter(i => ["arte", "impressao", "producao", "acabamento"].includes(i.status as ProductionStatus)).length;
    const prazoProximo = orders.filter(i => {
      if (!i.deadline || i.status === 'concluido') return false;
      const daysLeft = Math.ceil((new Date(i.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 2 && daysLeft >= 0;
    }).length;
    const atrasados = orders.filter(i => {
      if (!i.deadline || i.status === 'concluido') return false;
      const daysLeft = Math.ceil((new Date(i.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft < 0;
    }).length;
    const concluidos = orders.filter(i => i.status === 'concluido').length;
    return { emProducao, prazoProximo, atrasados, concluidos };
  }, [orders]);

  // Advance order to next status
  const advanceOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      const nextStatus = statusConfig[order.status as ProductionStatus].next;
      if (nextStatus) {
        await updateStatus(id, nextStatus);
      }
    }
  };

  // Go back order to previous status
  const revertOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      const prevStatus = statusConfig[order.status as ProductionStatus].prev;
      if (prevStatus) {
        await updateStatus(id, prevStatus);
      }
    }
  };

  // Get days left
  const getDaysLeft = (deadline: string) => {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  // Get first item name
  const getFirstItemName = (order: Order) => {
    if (order.items && order.items.length > 0) {
      return order.items[0].name;
    }
    return 'Sem itens';
  };

  // Get total quantity
  const getTotalQty = (order: Order) => {
    if (order.items && order.items.length > 0) {
      return order.items.reduce((acc, item) => acc + (item.quantity || 1), 0);
    }
    return 1;
  };

  return (
    <DashboardLayout>
      <Header
        title="Produção"
        description={`${orders.filter(i => i.status !== "concluido").length} na fila`}
      />

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Em Produção", value: stats.emProducao, icon: Factory, color: "bg-blue-100 text-blue-600", filter: "todos" },
            { label: "Prazo Próximo", value: stats.prazoProximo, icon: Clock, color: "bg-amber-100 text-amber-600", filter: "todos" },
            { label: "Atrasados", value: stats.atrasados, icon: AlertTriangle, color: "bg-red-100 text-red-600", filter: "todos" },
            { label: "Concluídos", value: stats.concluidos, icon: CheckCircle, color: "bg-emerald-100 text-emerald-600", filter: "concluido" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter(stat.filter as any)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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

        {/* Filters Row */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
            {(["todos", "urgent", "high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  priorityFilter === p
                    ? p === "urgent" ? "bg-red-500 text-white" :
                      p === "high" ? "bg-orange-500 text-white" :
                      p === "medium" ? "bg-blue-500 text-white" :
                      p === "low" ? "bg-gray-500 text-white" :
                      "bg-white text-gray-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "todos" ? "Todos" : priorityConfig[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
          {(["todos", "aguardando", "arte", "impressao", "producao", "acabamento", "concluido"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {status === "todos" ? "Todos" : statusConfig[status].label}
              {status !== "todos" && (
                <span className="ml-1.5 opacity-70">
                  {orders.filter(i => i.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Production Queue */}
        {!loading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhum item encontrado</p>
                </motion.div>
              ) : (
                filteredOrders.map((order, index) => {
                  const daysLeft = order.deadline ? getDaysLeft(order.deadline) : 999;
                  const progress = getProgressByStatus(order.status as ProductionStatus);
                  const clientName = order.client?.name || 'Cliente';

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className={`card transition-all ${order.status === "concluido" ? "opacity-75" : ""}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${statusConfig[order.status as ProductionStatus]?.bg} ${statusConfig[order.status as ProductionStatus]?.text}`}>
                            {statusConfig[order.status as ProductionStatus]?.label}
                          </span>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${priorityConfig[order.priority as Priority]?.bg} ${priorityConfig[order.priority as Priority]?.text}`}>
                            {priorityConfig[order.priority as Priority]?.label}
                          </span>
                          <span className="text-xs font-semibold text-gray-400">#{order.order_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.deadline && (
                            <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg ${
                              daysLeft < 0 ? "bg-red-100 text-red-700" :
                              daysLeft === 0 ? "bg-amber-100 text-amber-700" :
                              daysLeft <= 2 ? "bg-orange-100 text-orange-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              <Clock className="h-3 w-3" />
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d` :
                               daysLeft === 0 ? "Hoje" :
                               `${daysLeft}d`}
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            title="Ver dados do cliente"
                          >
                            <User className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="font-semibold text-gray-900 mb-1">{clientName}</p>
                      <p className="text-sm text-gray-500 mb-4">{getTotalQty(order)}x {getFirstItemName(order)}</p>

                      {/* Progress Bar */}
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${
                            order.status === "concluido" ? "bg-emerald-500" : "bg-gray-900"
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-4">
                        <span>Aguardando</span>
                        <span>Arte</span>
                        <span>Impressão</span>
                        <span>Produção</span>
                        <span>Acabamento</span>
                        <span>OK</span>
                      </div>

                      {/* Action Buttons */}
                      {order.status !== "concluido" && (
                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                          {statusConfig[order.status as ProductionStatus]?.prev && (
                            <button
                              onClick={() => revertOrder(order.id)}
                              className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                            >
                              <ArrowLeft className="h-4 w-4" />
                              Voltar
                            </button>
                          )}
                          <button
                            onClick={() => advanceOrder(order.id)}
                            className="flex-1 h-11 bg-primary text-gray-900 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
                          >
                            <Play className="h-4 w-4" />
                            Avançar
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Client Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Dados do Pedido</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.client?.name || 'Cliente'}</p>
                    <p className="text-sm text-gray-500">#{selectedOrder.order_number}</p>
                  </div>
                </div>

                {selectedOrder.client?.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telefone</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.client.phone}</p>
                    </div>
                  </div>
                )}

                {selectedOrder.client?.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.client.email}</p>
                    </div>
                  </div>
                )}

                {selectedOrder.client?.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Endereço</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.client.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pedido</p>
                    <p className="font-semibold text-gray-900">{getTotalQty(selectedOrder)}x {getFirstItemName(selectedOrder)}</p>
                    <p className="text-sm text-gray-500">
                      Status: {statusConfig[selectedOrder.status as ProductionStatus]?.label} | Prioridade: {priorityConfig[selectedOrder.priority as Priority]?.label}
                    </p>
                    {selectedOrder.deadline && (
                      <p className="text-sm text-gray-500">
                        Prazo: {new Date(selectedOrder.deadline).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full h-12 bg-gray-900 text-white rounded-xl font-semibold mt-6 hover:bg-gray-800 transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
