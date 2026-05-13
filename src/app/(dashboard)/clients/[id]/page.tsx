"use client";

import { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import {
  ArrowLeft, Edit2, Phone, Mail, MessageCircle, Share2,
  TrendingUp, ShoppingBag, CreditCard, Calendar, CheckCircle,
  XCircle, Clock, DollarSign, Package, FileText, Image,
  MapPin, User, Building2, Tag, Star, AlertCircle, File,
  Plus, Filter, Search, MoreHorizontal, Send, Paperclip,
  ChevronRight, Award, Users, Activity, Target, Loader2
} from "lucide-react";
import Link from "next/link";
import { useClient, useClientFiles, useClientNotes, useTimeline, useOrders, useBudgets } from "@/hooks";

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ativo: { label: "Ativo", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  recorrente: { label: "Recorrente", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  inadimplente: { label: "Inadimplente", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  vip: { label: "VIP", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
};

const orderStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  aguardando: { label: "Aguardando", bg: "bg-gray-100", text: "text-gray-700" },
  arte: { label: "Em Arte", bg: "bg-purple-100", text: "text-purple-700" },
  impressao: { label: "Impressão", bg: "bg-blue-100", text: "text-blue-700" },
  producao: { label: "Produção", bg: "bg-amber-100", text: "text-amber-700" },
  acabamento: { label: "Acabamento", bg: "bg-cyan-100", text: "text-cyan-700" },
  concluido: { label: "Concluído", bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelado: { label: "Cancelado", bg: "bg-red-100", text: "text-red-700" },
};

const budgetStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pendente: { label: "Pendente", bg: "bg-amber-100", text: "text-amber-700" },
  aprovado: { label: "Aprovado", bg: "bg-emerald-100", text: "text-emerald-700" },
  recusado: { label: "Recusado", bg: "bg-red-100", text: "text-red-700" },
  expirado: { label: "Expirado", bg: "bg-gray-100", text: "text-gray-700" },
};

function ClientDetailContent() {
  const params = useParams();
  const clientId = params.id as string;
  const { client, loading: clientLoading } = useClient(clientId);
  const { files } = useClientFiles(clientId);
  const { notes } = useClientNotes(clientId);
  const { events } = useTimeline(clientId);
  const { orders } = useOrders({ client_id: clientId });
  const { budgets } = useBudgets({ client_id: clientId });

  const [activeTab, setActiveTab] = useState("overview");
  const [orderSearch, setOrderSearch] = useState("");
  const [newNote, setNewNote] = useState("");

  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "orders", label: "Pedidos" },
    { id: "budgets", label: "Orçamentos" },
    { id: "files", label: "Arquivos" },
    { id: "notes", label: "Notas" },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente não encontrado</p>
        <Link href="/clients" className="text-primary hover:underline mt-2 inline-block">
          Voltar para clientes
        </Link>
      </div>
    );
  }

  const status = statusConfig[client.status] || statusConfig.ativo;

  // Calculate stats
  const totalSpent = orders
    .filter(o => o.status === 'concluido')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const ordersCount = orders.length;
  const averageTicket = ordersCount > 0 ? totalSpent / ordersCount : 0;
  const approvedBudgets = budgets.filter(b => b.status === 'aprovado').length;
  const rejectedBudgets = budgets.filter(b => b.status === 'recusado').length;
  const openAmount = budgets
    .filter(b => b.status === 'pendente')
    .reduce((acc, b) => acc + (b.total || 0), 0);

  const filteredOrders = orders.filter(o =>
    (o.order_number || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.items?.some((i: any) => i.name.toLowerCase().includes(orderSearch.toLowerCase())))
  );

  const phone = client.phone || client.whatsapp || '';
  const whatsappLink = phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : '#';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/clients" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Clientes</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{client.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Client Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{client.name.charAt(0)}</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <p className="text-gray-500">{client.contact_name} · Cliente desde {formatDate(client.created_at)}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Link href="/budgets/new" className="h-10 px-4 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <FileText className="h-4 w-4" />
                Novo Orçamento
              </Link>
              <Link href="/orders/new" className="h-10 px-4 bg-primary text-gray-900 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-primary-dark transition-colors">
                <Plus className="h-4 w-4" />
                Novo Pedido
              </Link>
              {phone && (
                <a href={whatsappLink} target="_blank" className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="h-10 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors">
                  <Phone className="h-4 w-4" />
                  Ligar
                </a>
              )}
              <button className="h-10 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors">
                <Edit2 className="h-4 w-4" />
                Editar
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <DollarSign className="h-4 w-4" />
                      Total Gasto
                    </div>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <ShoppingBag className="h-4 w-4" />
                      Pedidos
                    </div>
                    <p className="text-xl font-bold text-gray-900">{ordersCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Ticket Médio
                    </div>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(averageTicket)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
                      <CheckCircle className="h-4 w-4" />
                      Aprovados
                    </div>
                    <p className="text-xl font-bold text-emerald-700">{approvedBudgets}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-2 text-red-600 text-xs mb-1">
                      <XCircle className="h-4 w-4" />
                      Recusados
                    </div>
                    <p className="text-xl font-bold text-red-700">{rejectedBudgets}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
                      <Clock className="h-4 w-4" />
                      Em Aberto
                    </div>
                    <p className="text-xl font-bold text-amber-700">{formatCurrency(openAmount)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma atividade ainda</p>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 10).map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.event_type.includes('order') ? "bg-blue-100" :
                            event.event_type.includes('budget') ? "bg-amber-100" :
                            event.event_type.includes('payment') ? "bg-emerald-100" :
                            "bg-gray-100"
                          }`}>
                            {event.event_type.includes('order') && <Package className="h-4 w-4 text-blue-600" />}
                            {event.event_type.includes('budget') && <FileText className="h-4 w-4 text-amber-600" />}
                            {event.event_type.includes('payment') && <DollarSign className="h-4 w-4 text-emerald-600" />}
                            {!event.event_type.includes('order') && !event.event_type.includes('budget') && !event.event_type.includes('payment') && <Activity className="h-4 w-4 text-gray-600" />}
                          </div>
                          {index < Math.min(events.length, 10) - 1 && <div className="w-px h-8 bg-gray-200" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          {event.description && <p className="text-sm text-gray-500">{event.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">{formatDate(event.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
                  <Link href={`/orders?client=${clientId}`} className="text-sm text-primary hover:underline">
                    Ver todos
                  </Link>
                </div>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum pedido ainda</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">#{order.order_number}</p>
                          <p className="text-sm text-gray-500">{order.items?.length || 0} itens</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${orderStatusConfig[order.status]?.bg} ${orderStatusConfig[order.status]?.text}`}>
                            {orderStatusConfig[order.status]?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Personal Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
                <div className="space-y-4">
                  {client.contact_name && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Contato</p>
                        <p className="font-medium text-gray-900">{client.contact_name}</p>
                      </div>
                    </div>
                  )}
                  {client.document && (
                    <div className="flex items-start gap-3">
                      <File className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">{client.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}</p>
                        <p className="font-medium text-gray-900">{client.document}</p>
                      </div>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Telefone</p>
                        <p className="font-medium text-gray-900">{client.phone}</p>
                      </div>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{client.email}</p>
                      </div>
                    </div>
                  )}
                  {client.instagram && (
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Instagram</p>
                        <p className="font-medium text-gray-900">{client.instagram}</p>
                      </div>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Endereço</p>
                        <p className="font-medium text-gray-900">{client.address}</p>
                        <p className="text-sm text-gray-500">{client.city} - {client.state}</p>
                        {client.zip_code && <p className="text-sm text-gray-500">CEP: {client.zip_code}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferências</h2>
                <div className="space-y-3">
                  {client.favorite_material && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Material Favorito</span>
                      <span className="text-sm font-medium text-gray-900">{client.favorite_material}</span>
                    </div>
                  )}
                  {client.favorite_finish && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Acabamento</span>
                      <span className="text-sm font-medium text-gray-900">{client.favorite_finish}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contato Preferido</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{client.preferred_contact}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Entrega</span>
                    <span className={`text-sm font-medium ${client.delivery_preference ? "text-emerald-600" : "text-gray-400"}`}>
                      {client.delivery_preference ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retirada</span>
                    <span className={`text-sm font-medium ${client.pickup_preference ? "text-emerald-600" : "text-gray-400"}`}>
                      {client.pickup_preference ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Smart Indicators */}
              {client.status === 'vip' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-amber-50 to-primary/10 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Cliente VIP</h2>
                  </div>
                  <p className="text-sm text-gray-700">
                    Cliente prioritário com atendimento diferenciado.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search and Filter */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar pedidos..."
                  className="w-full h-11 pl-12 pr-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
              <button className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-200 transition-colors">
                <Filter className="h-4 w-4" />
                Filtros
              </button>
            </div>

            {/* Orders Table */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Prazo</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">#{order.order_number}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(order.created_at)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${orderStatusConfig[order.status]?.bg} ${orderStatusConfig[order.status]?.text}`}>
                            {orderStatusConfig[order.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{order.deadline ? formatDate(order.deadline) : '-'}</td>
                        <td className="px-6 py-4">
                          <Link href={`/orders/${order.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors inline-block">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "budgets" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {budgets.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum orçamento encontrado</p>
                <Link href="/budgets/new" className="text-primary hover:underline mt-2 inline-block">
                  Criar orçamento
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Orçamento</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Validade</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {budgets.map((budget) => (
                      <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">#{budget.budget_number}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(budget.created_at)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(budget.total)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(budget.valid_until)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${budgetStatusConfig[budget.status]?.bg} ${budgetStatusConfig[budget.status]?.text}`}>
                            {budgetStatusConfig[budget.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/budgets/${budget.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors inline-block">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "files" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Arquivos do Cliente</h2>
              <button className="h-10 px-4 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
            {files.length === 0 ? (
              <div className="text-center py-8">
                <File className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum arquivo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div key={file.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        file.file_type === 'image' ? "bg-blue-100" :
                        file.file_type === 'pdf' ? "bg-red-100" : "bg-gray-100"
                      }`}>
                        {file.file_type === 'image' && <Image className="h-5 w-5 text-blue-600" />}
                        {file.file_type === 'pdf' && <FileText className="h-5 w-5 text-red-600" />}
                        {file.file_type !== 'image' && file.file_type !== 'pdf' && <File className="h-5 w-5 text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">{file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''} · {formatDate(file.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "notes" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Add Note */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Nota</h2>
              <div className="space-y-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Adicione uma observação sobre este cliente..."
                  className="w-full h-24 p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary resize-none"
                />
                <button className="h-10 px-4 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors">
                  <Send className="h-4 w-4" />
                  Salvar Nota
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas e Observações</h2>
              {notes.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma nota ainda</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className={`p-4 rounded-xl ${note.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{note.user?.name || 'Sistema'}</span>
                        <span className="text-xs text-gray-500">{formatDate(note.created_at)}</span>
                      </div>
                      <p className="text-gray-700">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes */}
            {client.notes && (
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Anotações Internas</h2>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }>
        <ClientDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}
