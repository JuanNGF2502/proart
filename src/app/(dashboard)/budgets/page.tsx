"use client";

import { useState } from "react";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { useBudgets } from "@/hooks";

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  aprovado: { label: "Aprovado", bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  recusado: { label: "Recusado", bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  expirado: { label: "Expirado", bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export default function BudgetsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const { budgets, loading, error } = useBudgets({ status: filter === 'todos' ? undefined : filter });

  const filteredBudgets = budgets.filter(b => {
    const clientName = b.client?.name || '';
    const matchesSearch = clientName.toLowerCase().includes(search.toLowerCase()) ||
                          (b.budget_number || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <Header
        title="Orçamentos"
        description={`${budgets.length} orçamentos`}
        actions={
          <Link href="/budgets/new" className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Plus className="h-5 w-5 text-white" />
          </Link>
        }
      />

      <div className="p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar orçamentos..."
            className="input pl-12"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
          {["todos", "pendente", "aprovado", "recusado", "expirado"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                filter === tab
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Erro ao carregar orçamentos: {error}</p>
          </div>
        )}

        {/* Budgets List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredBudgets.map((budget, index) => {
              const status = statusConfig[budget.status] || statusConfig.pendente;
              const StatusIcon = status.icon;
              const itemsCount = budget.items?.length || 0;

              return (
                <Link key={budget.id} href={`/budgets/${budget.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="card hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">#{budget.budget_number}</p>
                          <p className="text-xs text-gray-400">{formatDate(budget.created_at)}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>

                    <p className="font-semibold text-gray-900 mb-1">{budget.client?.name || 'Cliente não especificado'}</p>
                    <p className="text-sm text-gray-500 mb-4">{itemsCount} item{itemsCount !== 1 ? "s" : ""}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(budget.total)}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Acessar</span>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && filteredBudgets.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum orçamento encontrado</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
