"use client";

import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Layers, DollarSign, Calculator, Pencil, Loader2, Wrench, TrendingUp, BadgeCheck, Box } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/shared/lib/utils";
import { useProduct } from "@/hooks";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

const typeConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  material: { label: "Material", bg: "bg-blue-100", text: "text-blue-700", icon: "📦" },
  labor: { label: "Mão de Obra", bg: "bg-amber-100", text: "text-amber-700", icon: "👷" },
  service: { label: "Serviço", bg: "bg-purple-100", text: "text-purple-700", icon: "🔧" },
  tax: { label: "Taxa", bg: "bg-red-100", text: "text-red-700", icon: "💰" },
  other: { label: "Outro", bg: "bg-gray-100", text: "text-gray-700", icon: "📋" },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { product, loading, error } = useProduct(productId);

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

  if (error || !product) {
    return (
      <DashboardLayout>
        <Header title="Produto não encontrado" />
        <div className="p-5 text-center">
          <p className="text-gray-500 mb-4">Produto ou serviço não encontrado.</p>
          <Link href="/products" className="text-primary hover:underline">
            Voltar para produtos
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const components = product.components?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const isComponentPricing = product.pricing_mode === 'component_sum';
  const componentTotal = components.reduce((acc, c) => acc + c.unit_price * c.quantity, 0);
  const costTotal = components.reduce((acc, c) => acc + c.cost_price * c.quantity, 0);
  const profitTotal = componentTotal - costTotal;
  const profitMargin = componentTotal > 0 ? (profitTotal / componentTotal) * 100 : 0;

  return (
    <DashboardLayout>
      <Header
        title={product.name}
        description={product.category || "Sem categoria"}
        actions={
          <Link href="/products" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
        }
      />

      <div className="p-5 space-y-6">
        {/* Status & Price */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${isComponentPricing ? "bg-primary/20 text-primary" : "bg-gray-700 text-gray-300"}`}>
                <Calculator className="h-3.5 w-3.5" />
                {isComponentPricing ? "Por Componentes" : "Preço Fixo"}
              </span>
              {product.is_featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Destaque
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Preço de Venda</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(product.unit_price)}</p>
              <p className="text-xs text-gray-400">/{product.unit}</p>
            </div>
          </div>

          {isComponentPricing && componentTotal > 0 && (
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(profitMargin, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`h-full rounded-full ${profitMargin >= 50 ? "bg-emerald-500" : profitMargin >= 30 ? "bg-amber-500" : "bg-red-500"}`}
              />
            </div>
          )}
        </motion.div>

        {/* Description */}
        {product.description && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Box className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Descrição</h3>
            </div>
            <p className="text-gray-600">{product.description}</p>
          </motion.div>
        )}

        {/* Components Breakdown */}
        {isComponentPricing && components.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Componentes de Precificação</h3>
                  <p className="text-xs text-gray-500">{components.length} componente{components.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {components.map((comp, index) => {
                const config = typeConfig[comp.type] || typeConfig.other;
                const compTotal = comp.unit_price * comp.quantity;
                const compProfit = comp.unit_price - comp.cost_price;
                const compMargin = comp.unit_price > 0 ? (compProfit / comp.unit_price) * 100 : 0;

                return (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{comp.name}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold ${config.bg} ${config.text}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(compTotal)}</p>
                        <p className="text-xs text-gray-400">{comp.quantity}x {formatCurrency(comp.unit_price)}</p>
                      </div>
                    </div>

                    {comp.description && (
                      <p className="text-sm text-gray-500 mb-3">{comp.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-2.5 bg-white rounded-xl">
                        <p className="text-xs text-gray-500">Custo</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(comp.cost_price)}</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl">
                        <p className="text-xs text-gray-500">Markup</p>
                        <p className="font-semibold text-gray-900">{comp.markup_percent}%</p>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl">
                        <p className="text-xs text-gray-500">Margem</p>
                        <p className={`font-semibold ${compMargin >= 40 ? "text-emerald-600" : compMargin >= 20 ? "text-amber-600" : "text-red-600"}`}>
                          {compMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="mt-5 p-5 bg-gray-900 rounded-2xl">
              <h4 className="text-sm font-semibold text-gray-400 mb-4">Resumo Financeiro</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Custo Total</span>
                  <span>{formatCurrency(costTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Preço de Venda</span>
                  <span className="text-white">{formatCurrency(componentTotal)}</span>
                </div>
                <div className="h-px bg-gray-700" />
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Lucro</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(profitTotal)}</p>
                    <p className="text-xs text-emerald-400/70">Margem: {profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Simple pricing info */}
        {!isComponentPricing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Preço Fixo</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(product.unit_price)}</p>
            <p className="text-sm text-gray-500">/{product.unit}</p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          <button
            onClick={() => {/* TODO: edit page */}}
            className="w-full h-14 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
          >
            <Pencil className="h-5 w-5" /> Editar Produto
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
