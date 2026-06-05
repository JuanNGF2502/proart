"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, CheckCircle, Clock, XCircle, FileText, Loader2, FileDown, MessageCircle, Trash2, ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { downloadBudgetPDF, type BudgetData } from "@/shared/lib/pdf-generator";
import { supabase } from "@/lib/supabase";

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  aprovado: { label: "Aprovado", bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  recusado: { label: "Recusado", bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  expirado: { label: "Expirado", bg: "bg-gray-100", text: "text-gray-700", icon: Clock },
};

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const [budget, setBudget] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudget = async () => {
      setLoading(true);
      try {
        // Fetch budget
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('*')
          .eq('id', budgetId)
          .single();

        if (budgetError || !budgetData) {
          setBudget(null);
          setLoading(false);
          return;
        }

        setBudget(budgetData);

        // Fetch client if exists
        if (budgetData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', budgetData.client_id)
            .single();
          setClient(clientData);
        }

        // Fetch budget items
        const { data: itemsData } = await supabase
          .from('budget_items')
          .select('*')
          .eq('budget_id', budgetId)
          .order('sort_order');

        setItems(itemsData || []);
      } catch (e) {
        console.error('Erro ao carregar orçamento:', e);
        setBudget(null);
      } finally {
        setLoading(false);
      }
    };

    if (budgetId) {
      fetchBudget();
    }
  }, [budgetId]);

  const handleApprove = async () => {
    console.log('=== INICIANDO APROVAÇÃO ===');
    console.log('budget:', budget);
    console.log('budgetId:', budgetId);
    console.log('items:', items);

    if (!budget || !budgetId) {
      alert('Erro: orçamento não carregado');
      console.error('Budget ou budgetId vazio');
      return;
    }

    setIsUpdating(true);
    try {
      // Calculate totals from items
      const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
      const discount = budget.discount || 0;
      const total = subtotal - discount;

      console.log('subtotal:', subtotal, 'discount:', discount, 'total:', total);

      // Create order from budget FIRST
      const year = new Date().getFullYear().toString().slice(-2);
      console.log('Buscando último pedido...');

      const { data: lastOrderData, error: lastOrderError } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('lastOrderData:', lastOrderData, 'error:', lastOrderError);

      const seq = lastOrderData && lastOrderData[0]?.order_number
        ? parseInt(lastOrderData[0].order_number.slice(-4)) + 1
        : 1;
      const orderNumber = `${year}${seq.toString().padStart(4, '0')}`;
      console.log('Novo orderNumber:', orderNumber);

      // Create order FIRST
      console.log('Criando pedido...');
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          client_id: budget.client_id || null,
          budget_id: budgetId,
          status: 'aguardando',
          priority: 'medium',
          subtotal: subtotal,
          discount: discount,
          total: total,
          amount_paid: 0,
          notes: budget.notes || null,
        })
        .select()
        .single();

      console.log('newOrder:', newOrder, 'orderError:', orderError);

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        throw new Error(`Erro ao criar pedido: ${orderError.message}`);
      }

      if (!newOrder) {
        throw new Error('Pedido não foi criado');
      }

      // Create order items from budget items
      if (items.length > 0) {
        const orderItems = items.map((item, index) => ({
          order_id: newOrder.id,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit: item.unit || 'und',
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
          material: item.material || null,
          finish: item.finish || null,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) {
          console.error('Erro ao criar itens:', itemsError);
        }
      }

      // Update budget status LAST (after order is created)
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({ status: 'aprovado', approved_at: new Date().toISOString() })
        .eq('id', budgetId);

      if (budgetError) {
        console.error('Erro ao atualizar status do orçamento:', budgetError);
      }

      setBudget({ ...budget, status: 'aprovado' });
      setCreatedOrderId(newOrder.id);
      setCreatedOrderNumber(orderNumber);
    } catch (e: any) {
      console.error('Erro ao aprovar:', e);
      alert(e.message || 'Erro ao aprovar orçamento');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      await supabase
        .from('budgets')
        .update({ status: 'recusado', rejected_at: new Date().toISOString() })
        .eq('id', budgetId);

      await supabase.from('timeline').insert({
        budget_id: budgetId,
        event_type: 'budget_rejected',
        title: 'Orçamento recusado',
      });

      setBudget({ ...budget, status: 'recusado' });
    } catch (e) {
      console.error('Erro ao recusar:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!budget) return;

    setIsGenerating(true);

    const budgetData: BudgetData = {
      id: budget.budget_number,
      clientName: client?.name || 'Cliente',
      clientPhone: client?.phone || '',
      clientEmail: client?.email || '',
      items: items.map((item, index) => ({
        id: String(index + 1),
        name: item.name,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      notes: budget.notes || '',
      validity: Math.ceil((new Date(budget.valid_until).getTime() - new Date(budget.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      date: new Date(budget.created_at),
      total: budget.total,
    };

    downloadBudgetPDF(budgetData);
    setIsGenerating(false);
  };

  const handleSendWhatsApp = async () => {
    if (!budget) return;
    setIsGenerating(true);
    const budgetData: BudgetData = {
      id: budget.budget_number,
      clientName: client?.name || 'Cliente',
      clientPhone: client?.phone || '',
      items: items.map((item, i) => ({ id: String(i + 1), name: item.name, quantity: item.quantity, price: item.unit_price })),
      notes: budget.notes || '',
      validity: 30,
      date: new Date(budget.created_at),
      total: budget.total,
    };
    await downloadBudgetPDF(budgetData);
    setIsGenerating(false);

    const msg = encodeURIComponent(
      `Olá ${client?.name || ''}! Segue o orçamento ProArt.\n` +
      `Valor: ${formatCurrency(budget.total)}\n` +
      `Para mais informações, entre em contato.`
    );
    const phone = client?.phone?.replace(/\D/g, '') || '';
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
    }
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

  if (!budget) {
    return (
      <DashboardLayout>
        <Header title="Orçamento não encontrado" />
        <div className="p-5 text-center">
          <p className="text-gray-500 mb-4">Este orçamento não existe.</p>
          <Link href="/budgets" className="text-primary hover:underline">
            Voltar para orçamentos
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[budget.status] || statusConfig.pendente;
  const StatusIcon = status.icon;

  return (
    <DashboardLayout>
      <Header
        title={`Orçamento #${budget.budget_number}`}
        description={formatDate(budget.created_at)}
        actions={
          <Link href="/budgets" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
        }
      />

      <div id="budget-content" className="p-5 space-y-6">
        {/* Status and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${status.bg} ${status.text}`}>
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </span>

          <div className="flex gap-2">
            {(budget.status === 'pendente' || budget.status === 'expirado') && (
              <>
                <button
                  onClick={handleReject}
                  disabled={isUpdating}
                  className="h-10 px-4 bg-red-100 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Recusar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isUpdating}
                  className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Created Order Card */}
        {createdOrderId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Pedido criado com sucesso!</p>
                  <p className="text-sm text-emerald-600">#{createdOrderNumber}</p>
                </div>
              </div>
              <Link
                href={`/orders/${createdOrderId}`}
                className="h-10 px-4 bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                Ver Pedido
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
            transition={{ delay: 0.05 }}
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
              <p className="text-sm text-gray-500">{client.email}</p>
            )}
          </motion.div>
        )}

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Itens do Orçamento</h3>
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum item</p>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity}x {formatCurrency(item.unit_price)}</p>
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
          transition={{ delay: 0.15 }}
          className="card bg-gray-900"
        >
          <div className="space-y-3">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(budget.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Desconto</span>
              <span>{formatCurrency(budget.discount || 0)}</span>
            </div>
            <div className="h-px bg-gray-700" />
            <div className="flex justify-between text-white">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold">{formatCurrency(budget.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        {budget.notes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
            <p className="text-gray-600">{budget.notes}</p>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Criado em</p>
              <p className="font-medium text-gray-900">{formatDate(budget.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-500">Validade</p>
              <p className="font-medium text-gray-900">{formatDate(budget.valid_until)}</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="h-14 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 disabled:opacity-50"
            >
              <FileDown className="h-5 w-5 shrink-0" />
              <span className="text-sm">Baixar PDF</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              disabled={isGenerating}
              className="h-14 bg-emerald-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">Enviar WhatsApp</span>
            </button>
          </div>

          <Link
            href={`/budgets/new?edit=true&data=${encodeURIComponent(JSON.stringify({
              id: budget.id,
              clientId: budget.client_id,
              name: client?.name || '',
              phone: client?.phone || '',
              email: client?.email || '',
              items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.unit_price,
              })),
              notes: budget.notes || '',
              validity: 30,
            }))}`}
            className="block w-full h-14 bg-primary text-gray-900 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
          >
            <Pencil className="h-5 w-5" />
            Editar Orçamento
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
