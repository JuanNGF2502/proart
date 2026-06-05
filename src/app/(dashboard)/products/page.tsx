"use client";

import { useState } from "react";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { Plus, Search, Package, ArrowRight, Loader2, Layers, DollarSign, Wrench, Settings } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/shared/lib/utils";
import { useProducts } from "@/hooks";

const categoryIcons: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  banner: { icon: Package, bg: "bg-blue-100", color: "text-blue-600" },
  sticker: { icon: Package, bg: "bg-purple-100", color: "text-purple-600" },
  facade: { icon: Package, bg: "bg-amber-100", color: "text-amber-600" },
  tshirt: { icon: Package, bg: "bg-emerald-100", color: "text-emerald-600" },
  mug: { icon: Package, bg: "bg-red-100", color: "text-red-600" },
  custom: { icon: Layers, bg: "bg-gray-100", color: "text-gray-600" },
};

const pricingModeConfig: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  component_sum: { label: "Por Componentes", icon: Layers, bg: "bg-primary/10", text: "text-primary-dark" },
  manual: { label: "Preço Fixo", icon: DollarSign, bg: "bg-gray-100", text: "text-gray-600" },
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { products, loading, error } = useProducts();

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <Header
        title="Produtos e Serviços"
        description={`${products.length} itens cadastrados`}
        actions={
          <Link href="/products/new" className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Plus className="h-5 w-5 text-white" />
          </Link>
        }
      />

      <div className="p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos e serviços..."
            className="input pl-12"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Erro ao carregar produtos: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum produto ou serviço encontrado</p>
                <Link href="/products/new" className="text-primary text-sm font-semibold mt-2 inline-block">
                  Cadastrar primeiro produto
                </Link>
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const catConfig = categoryIcons[product.category || ''] || categoryIcons.custom;
                const CatIcon = catConfig.icon;
                const pricingConfig = pricingModeConfig[product.pricing_mode] || pricingModeConfig.manual;
                const PricingIcon = pricingConfig.icon;
                const componentCount = product.components?.length || 0;

                return (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="card hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${catConfig.bg} flex items-center justify-center shrink-0`}>
                          <CatIcon className={`h-6 w-6 ${catConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            {product.is_featured && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/20 text-primary-dark">
                                DESTAQUE
                              </span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-500 line-clamp-1 mb-2">{product.description}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${pricingConfig.bg} ${pricingConfig.text}`}>
                              <PricingIcon className="h-3 w-3" />
                              {pricingConfig.label}
                            </span>
                            {componentCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-600">
                                <Wrench className="h-3 w-3" />
                                {componentCount} componente{componentCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(product.unit_price)}</p>
                          <p className="text-xs text-gray-400">/{product.unit}</p>
                        </div>
                      </div>
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
