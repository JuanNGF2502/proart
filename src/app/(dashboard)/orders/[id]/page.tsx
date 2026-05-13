"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, FileText, Loader2, ArrowRight, CheckCircle, Clock, Package, Play, ArrowLeftRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Order, OrderItem, Client, Budget } from "@/types/database";

const statusConfig: Record<string, { label: string; bg: string; text: string; next: string | null; prev: string | null }> = {
  aguardando: { label: "Aguardando", bg: "bg-gray-100", text: "text-gray-600", next: "arte", prev: null },
  arte: { label: "Arte", bg: "bg-purple-100", text: "text-purple-700", next: "impressao", prev: "aguardando" },
  impressao: { label: "Impressão", bg: "bg-cyan-100", text: "text-cyan-700", next: "producao", prev: "arte" },
  producao: { label: "Produção", bg: "bg-blue-100", text: "text-blue-700", next: "acabamento", prev: "impressao" },
  acabamento: { label: "Acabamento", bg: "bg-amber-100", text: "text-amber-700", next: "concluido", prev: "producao" },
  concluido: { label: "Concluído", bg: "bg-emerald-100", text: "text-emerald-700", next: null, prev: "acabamento" },
};

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  urgent: { label: "Urgente", bg: "bg-red-500", text: "text-white" },
  high: { label: "Alta", bg: "bg-orange-500", text: "text-white" },
  medium: { label: "Média", bg: "bg-blue-500", text: "text-white" },
  low: { label: "Baixa", bg: "bg-gray-400", text: "text-white" },
};

const stages = ["aguardando", "arte", "impressao", "producao", "acabamento", "concluido"];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError || !orderData) {
          setOrder(null);
          setLoading(false);
          return;
        }

        setOrder(orderData);

        // Fetch client if exists
        if (orderData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', orderData.client_id)
            .single();
          setClient(clientData);
        }

        // Fetch budget if exists (link to original budget)
        if (orderData.budget_id) {
          const { data: budgetData } = await supabase
            .from('budgets')
            .select('*')
            .eq('id', orderData.budget_id)
            .single();
          setBudget(budgetData);
        }

        // Fetch order items
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)
          .order('sort_order');

        setItems(itemsData || []);
      } catch (e) {
        console.error('Erro ao carregar pedido:', e);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const updates: Partial<Order> = { status: newStatus as Order['status'] };

      if (newStatus === 'arte') {
        updates.started_at = new Date().toISOString();
      }
      if (newStatus === 'concluido') {
        updates.finished_at = new Date().toISOString();
      }

      await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      // Create timeline entry
      const statusLabels: Record<string, string> = {
        aguardando: 'Aguardando',
        arte: 'Em arte',
        impressao: 'Em impressão',
        producao: 'Em produção',
        acabamento: 'Em acabamento',
        concluido: 'Concluído',
      };

      await supabase.from('timeline').insert({
        order_id: orderId,
        event_type: `order_${newStatus}`,
        title: `Pedido em ${statusLabels[newStatus]}`,
      });

      setOrder({ ...order!, status: newStatus as Order['status'] });
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getProgressByStatus = (status: string): number => {
    const idx = stages.indexOf(status);
    return idx >= 0 ? ((idx + 1) / stages.length) * 100 : 0;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Header title="Carregando..." />
        <div className="p-5 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <Header title="Pedido não encontrado" />
        <div className="p-5 text-center">
          <p className="text-gray-500 mb-4">Este pedido não existe.</p>
          <Link href="/orders" className="text-primary hover:underline">
            Voltar para pedidos
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[order.status] || statusConfig.aguardando;
  const progress = getProgressByStatus(order.status);

  return (
    <DashboardLayout>
      <Header
        title={`Pedido #${order.order_number}`}
        description={formatDate(order.created_at)}
        actions={
          <Link href="/orders" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
        }
      />

      <div className="p-5 space-y-6">
        {/* Status and Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${status.bg} ${status.text}`}>
                <Clock className="h-4 w-4" />
                {status.label}
              </span>
              <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${priorityConfig[order.priority]?.bg} ${priorityConfig[order.priority]?.text}`}>
                {priorityConfig[order.priority]?.label}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                order.status === "concluido" ? "bg-emerald-500" : "bg-gray-900"
              }`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Aguardando</span>
            <span>Arte</span>
            <span>Impressão</span>
            <span>Produção</span>
            <span>Acabamento</span>
            <span>OK</span>
          </div>

          {/* Navigation Buttons */}
          {order.status !== "concluido" && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              {status.prev && (
                <button
                  onClick={() => handleStatusChange(status.prev!)}
                  disabled={isUpdating}
                  className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Voltar para {statusConfig[status.prev]?.label}
                </button>
              )}
              {status.next && (
                <button
                  onClick={() => handleStatusChange(status.next!)}
                  disabled={isUpdating}
                  className="flex-1 h-11 bg-primary text-gray-900 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Avançar para {statusConfig[status.next]?.label}
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Budget Link (if from budget) */}
        {budget && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card bg-blue-50 border border-blue-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">Orçamento de origem</p>
                <p className="font-semibold text-gray-900">#{budget.budget_number}</p>
              </div>
              <Link
                href={`/budgets/${budget.id}`}
                className="h-10 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                Ver Orçamento
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Client Info */}
        {client && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{client.name?.charAt(0) || 'C'}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{client.name}</h3>
                {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
              </div>
            </div>
            {client.email && (
              <p className="text-sm text-gray-500 mb-2">{client.email}</p>
            )}
            {client.address && (
              <p className="text-sm text-gray-500">{client.address}</p>
            )}
          </motion.div>
        )}

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Itens do Pedido</h3>
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum item</p>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity}x {formatCurrency(item.unit_price)}
                      {item.material && ` • ${item.material}`}
                      {item.finish && ` • ${item.finish}`}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Totals */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gray-900"
        >
          <div className="space-y-3">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Desconto</span>
              <span>{formatCurrency(order.discount || 0)}</span>
            </div>
            <div className="h-px bg-gray-700" />
            <div className="flex justify-between text-gray-400">
              <span>Total</span>
              <span className="text-white">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Pago</span>
              <span>{formatCurrency(order.amount_paid || 0)}</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>A receber</span>
              <span>{formatCurrency(order.total - (order.amount_paid || 0))}</span>
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        {order.notes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
            <p className="text-gray-600">{order.notes}</p>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Criado em</p>
              <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
            </div>
            {order.deadline && (
              <div>
                <p className="text-gray-500">Prazo</p>
                <p className="font-medium text-gray-900">{formatDate(order.deadline)}</p>
              </div>
            )}
            {order.started_at && (
              <div>
                <p className="text-gray-500">Iniciado em</p>
                <p className="font-medium text-gray-900">{formatDate(order.started_at)}</p>
              </div>
            )}
            {order.finished_at && (
              <div>
                <p className="text-gray-500">Concluído em</p>
                <p className="font-medium text-gray-900">{formatDate(order.finished_at)}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}