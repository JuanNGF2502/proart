"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  Receipt,
  Plus,
  ArrowRight,
  DollarSign,
  Users,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { supabase } from "@/lib/supabase";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  aguardando: { label: "Aguardando", bg: "bg-gray-100 text-gray-600", text: "gray" },
  arte: { label: "Arte", bg: "bg-purple-100 text-purple-700", text: "purple" },
  impressao: { label: "Impressão", bg: "bg-slate-800 text-white", text: "slate" },
  producao: { label: "Produção", bg: "bg-blue-100 text-blue-700", text: "blue" },
  acabamento: { label: "Acabamento", bg: "bg-amber-100 text-amber-700", text: "amber" },
  concluido: { label: "Concluído", bg: "bg-emerald-100 text-emerald-700", text: "emerald" },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenueToday: 0,
    activeOrders: 0,
    finishedOrders: 0,
    pendingBudgets: 0,
    approvedBudgets: 0,
    expiredBudgets: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch counts from different tables
      const [
        { count: activeOrders },
        { count: finishedOrders },
        { count: pendingBudgets },
        { count: approvedBudgets },
        { count: expiredBudgets },
        { count: totalClients },
        ordersData,
        clientsData,
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['aguardando', 'arte', 'impressao', 'producao', 'acabamento']),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
        supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('status', 'aprovado'),
        supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('status', 'expirado'),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*, client:clients(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('clients').select('id, name').order('created_at', { ascending: false }).limit(6),
      ]);

      // Calculate revenue from today's completed orders
      const today = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'concluido')
        .gte('finished_at', today);

      const revenueToday = todayOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;

      setStats({
        revenueToday,
        activeOrders: activeOrders || 0,
        finishedOrders: finishedOrders || 0,
        pendingBudgets: pendingBudgets || 0,
        approvedBudgets: approvedBudgets || 0,
        expiredBudgets: expiredBudgets || 0,
      });

      setRecentOrders(Array.isArray(ordersData) ? ordersData : []);
      setRecentClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days < 0 ? `${Math.abs(days)}d` : `${days}d`;
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

  const statCards = [
    {
      title: "Faturamento Hoje",
      value: formatCurrency(stats.revenueToday),
      change: "+0%",
      icon: DollarSign,
      color: "bg-success/10 text-success",
    },
    {
      title: "Pedidos Ativos",
      value: stats.activeOrders.toString(),
      change: "+0",
      icon: Package,
      color: "bg-info/10 text-info",
    },
    {
      title: "Finalizados",
      value: stats.finishedOrders.toString(),
      change: "+0",
      icon: CheckCircle,
      color: "bg-primary/10 text-primary-dark",
    },
    {
      title: "Pendentes",
      value: stats.pendingBudgets.toString(),
      change: "orçamentos",
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
  ];

  return (
    <DashboardLayout>
      <Header
        title="Olá, Admin"
        description={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      />

      <div className="p-5 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="card relative overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <span className="text-xs text-emerald-600 font-semibold">{stat.change}</span>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-gray-50 to-transparent rounded-full opacity-60" />
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="flex gap-3"
        >
          <Link href="/budgets/new" className="btn btn-primary flex-1">
            <Plus className="h-5 w-5" />
            Novo Orçamento
          </Link>
          <Link href="/clients/new" className="btn btn-ghost flex-1">
            <Users className="h-5 w-5" />
            Novo Cliente
          </Link>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-gray-900">Pedidos Recentes</h2>
            <Link href="/orders" className="text-sm font-semibold text-primary flex items-center gap-1">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="card text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum pedido ainda</p>
                <Link href="/budgets/new" className="text-primary text-sm font-semibold mt-2 inline-block">
                  Criar primeiro pedido
                </Link>
              </div>
            ) : (
              recentOrders.map((order, index) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.05 }}
                    className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400">#{order.order_number}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusConfig[order.status]?.bg || "bg-gray-100 text-gray-600"}`}>
                          {statusConfig[order.status]?.label || order.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 truncate">{order.client?.name || 'Cliente'}</p>
                      <p className="text-xs text-gray-500">{getDaysLeft(order.deadline) || 'Sem prazo'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Budget Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-h3 font-semibold text-gray-900 mb-4">Orçamentos</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/budgets?status=pendente" className="card text-center hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBudgets}</p>
              <p className="text-xs text-gray-500 mt-1">Pendentes</p>
            </Link>
            <Link href="/budgets?status=aprovado" className="card text-center hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedBudgets}</p>
              <p className="text-xs text-gray-500 mt-1">Aprovados</p>
            </Link>
            <Link href="/budgets?status=expirado" className="card text-center hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2">
                <Receipt className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiredBudgets}</p>
              <p className="text-xs text-gray-500 mt-1">Expirados</p>
            </Link>
          </div>
        </motion.div>

        {/* Clients Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-gray-900">Clientes Recentes</h2>
            <Link href="/clients" className="text-sm font-semibold text-primary flex items-center gap-1">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
            {recentClients.length === 0 ? (
              <div className="card text-center py-6 w-full">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhum cliente ainda</p>
                <Link href="/clients/new" className="text-primary text-sm font-semibold mt-1 inline-block">
                  Adicionar primeiro cliente
                </Link>
              </div>
            ) : (
              recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="shrink-0 w-28 h-24 card flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">{client.name?.charAt(0) || 'C'}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center line-clamp-2">{client.name}</p>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}