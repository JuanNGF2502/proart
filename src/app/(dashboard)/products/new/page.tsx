"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Package, Layers, Plus, Trash2, DollarSign, Calculator, Loader2, ChevronDown, X, GripVertical } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/shared/lib/utils";
import { supabase } from "@/lib/supabase";

interface Component {
  id: string;
  name: string;
  type: 'material' | 'labor' | 'service' | 'tax' | 'other';
  description: string;
  cost_price: number;
  markup_percent: number;
  unit_price: number;
  unit: string;
  quantity: number;
  is_editable: boolean;
  is_required: boolean;
}

const componentTypes = [
  { value: 'material', label: 'Material', icon: '📦' },
  { value: 'labor', label: 'Mão de Obra', icon: '👷' },
  { value: 'service', label: 'Serviço', icon: '🔧' },
  { value: 'tax', label: 'Taxa', icon: '💰' },
  { value: 'other', label: 'Outro', icon: '📋' },
] as const;

const defaultCategories = [
  { value: '', label: 'Sem categoria' },
  { value: 'banner', label: 'Banner' },
  { value: 'sticker', label: 'Adesivo' },
  { value: 'business_card', label: 'Cartão de Visita' },
  { value: 'facade', label: 'Fachada' },
  { value: 'tshirt', label: 'Camiseta' },
  { value: 'mug', label: 'Caneca' },
  { value: 'planner', label: 'Agenda' },
  { value: 'keychain', label: 'Chaveiro' },
  { value: 'box', label: 'Caixa' },
  { value: 'acrylic', label: 'Acrílico' },
  { value: 'mdf', label: 'MDF' },
  { value: 'dtf', label: 'DTF' },
  { value: 'sublimation', label: 'Sublimação' },
  { value: 'laser', label: 'Laser' },
  { value: 'custom', label: 'Personalizado' },
];

const defaultUnits = [
  { value: 'un', label: 'Unidade' },
  { value: 'm', label: 'Metro' },
  { value: 'm²', label: 'Metro Quadrado' },
  { value: 'pct', label: 'Pacote' },
  { value: 'h', label: 'Hora' },
];

function calculateComponentPrice(cost: number, markup: number): number {
  return Math.round(cost * (1 + markup / 100) * 100) / 100;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("un");
  const [pricingMode, setPricingMode] = useState<'manual' | 'component_sum'>('component_sum');
  const [manualPrice, setManualPrice] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);

  const [components, setComponents] = useState<Component[]>([
    { id: crypto.randomUUID(), name: "", type: "material", description: "", cost_price: 0, markup_percent: 30, unit_price: 0, unit: "un", quantity: 1, is_editable: true, is_required: true },
  ]);

  const totalCalculated = components.reduce((acc, c) => acc + c.unit_price * c.quantity, 0);

  const addComponent = () => {
    setComponents([...components, {
      id: crypto.randomUUID(), name: "", type: "material", description: "", cost_price: 0, markup_percent: 30, unit_price: 0, unit: "un", quantity: 1, is_editable: true, is_required: true,
    }]);
  };

  const removeComponent = (id: string) => {
    if (components.length > 1) {
      setComponents(components.filter(c => c.id !== id));
    }
  };

  const updateComponent = (id: string, field: keyof Component, value: any) => {
    setComponents(components.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };

      if (field === 'cost_price' || field === 'markup_percent') {
        updated.unit_price = calculateComponentPrice(
          field === 'cost_price' ? value : c.cost_price,
          field === 'markup_percent' ? value : c.markup_percent
        );
      }

      return updated;
    }));
  };

  const getTypeLabel = (type: string) => {
    return componentTypes.find(t => t.value === type)?.label || type;
  };

  const handleSave = async () => {
    if (!name) {
      setError("Informe o nome do produto ou serviço.");
      return;
    }

    if (pricingMode === 'component_sum') {
      const validComponents = components.filter(c => c.name);
      if (validComponents.length === 0) {
        setError("Adicione pelo menos um componente de precificação.");
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const unitPrice = pricingMode === 'component_sum' ? totalCalculated : manualPrice;

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name,
          description: description || null,
          category: category || null,
          unit,
          unit_price: unitPrice,
          pricing_mode: pricingMode,
          is_featured: isFeatured,
        })
        .select()
        .single();

      if (productError) throw productError;

      if (pricingMode === 'component_sum') {
        const compsToInsert = components
          .filter(c => c.name)
          .map((c, i) => ({
            product_id: newProduct.id,
            name: c.name,
            type: c.type,
            description: c.description || null,
            cost_price: c.cost_price,
            markup_percent: c.markup_percent,
            unit_price: c.unit_price,
            unit: c.unit,
            quantity: c.quantity,
            is_editable: c.is_editable,
            is_required: c.is_required,
            sort_order: i,
          }));

        if (compsToInsert.length > 0) {
          const { error: compError } = await supabase
            .from('product_components')
            .insert(compsToInsert);

          if (compError) throw compError;
        }
      }

      router.push('/products');
    } catch (e: any) {
      setError(e.message || "Erro ao salvar produto");
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Novo Produto / Serviço"
        description="Cadastrar produto com precificação automática"
        actions={
          <Link href="/products" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
        }
      />

      <div className="p-5 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nome *</label>
              <input
                type="text"
                placeholder="Ex: Quadro Metalon c/ Lona"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Descrição</label>
              <textarea
                placeholder="Descreva o produto ou serviço..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-20 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Categoria</label>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-left flex items-center justify-between"
                >
                  <span className={category ? "text-gray-900" : "text-gray-400"}>
                    {category ? defaultCategories.find(c => c.value === category)?.label : "Selecionar categoria"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <AnimatePresence>
                  {showCategoryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-auto"
                    >
                      {defaultCategories.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => { setCategory(cat.value); setShowCategoryDropdown(false); }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          {cat.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Unidade</label>
                <button
                  onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                  className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-left flex items-center justify-between"
                >
                  <span className="text-gray-900">{defaultUnits.find(u => u.value === unit)?.label}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <AnimatePresence>
                  {showUnitDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg"
                    >
                      {defaultUnits.map((u) => (
                        <button
                          key={u.value}
                          onClick={() => { setUnit(u.value); setShowUnitDropdown(false); }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          {u.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 rounded-lg border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="isFeatured" className="text-sm text-gray-700">
                Produto em destaque (aparece primeiro nas listas)
              </label>
            </div>
          </div>
        </motion.div>

        {/* Pricing Mode */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Modo de Precificação</h3>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPricingMode('component_sum')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                pricingMode === 'component_sum'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Layers className={`h-6 w-6 mb-2 ${pricingMode === 'component_sum' ? 'text-primary-dark' : 'text-gray-400'}`} />
              <p className={`font-semibold text-sm ${pricingMode === 'component_sum' ? 'text-gray-900' : 'text-gray-500'}`}>
                Precificação por Componentes
              </p>
              <p className="text-xs text-gray-400 mt-1">Soma automática de materiais, mão de obra e serviços</p>
            </button>
            <button
              onClick={() => setPricingMode('manual')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                pricingMode === 'manual'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <DollarSign className={`h-6 w-6 mb-2 ${pricingMode === 'manual' ? 'text-primary-dark' : 'text-gray-400'}`} />
              <p className={`font-semibold text-sm ${pricingMode === 'manual' ? 'text-gray-900' : 'text-gray-500'}`}>
                Preço Fixo
              </p>
              <p className="text-xs text-gray-400 mt-1">Valor único definido manualmente</p>
            </button>
          </div>

          {pricingMode === 'manual' && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Preço de Venda</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                  className="input pl-12 text-lg font-bold"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Components */}
        {pricingMode === 'component_sum' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Componentes de Precificação</h3>
                  <p className="text-xs text-gray-500">Cada componente é calculado: (custo × markup) + custo</p>
                </div>
              </div>
              <button
                onClick={addComponent}
                className="h-9 px-4 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Componente
              </button>
            </div>

            <div className="space-y-4">
              {components.map((component, index) => (
                <motion.div
                  key={component.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-gray-50 rounded-2xl border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-2">
                      <GripVertical className="h-4 w-4 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-400">#{index + 1}</span>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do Componente *</label>
                          <input
                            type="text"
                            placeholder="Ex: Impressão, Metalon, Mão de obra..."
                            value={component.name}
                            onChange={(e) => updateComponent(component.id, 'name', e.target.value)}
                            className="w-full h-10 px-4 bg-white rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
                          <select
                            value={component.type}
                            onChange={(e) => updateComponent(component.id, 'type', e.target.value)}
                            className="w-full h-10 px-4 bg-white rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-primary transition-colors"
                          >
                            {componentTypes.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição (opcional)</label>
                        <input
                          type="text"
                          placeholder="Descreva este componente..."
                          value={component.description}
                          onChange={(e) => updateComponent(component.id, 'description', e.target.value)}
                          className="w-full h-10 px-4 bg-white rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Custo (R$)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={component.cost_price}
                            onChange={(e) => updateComponent(component.id, 'cost_price', parseFloat(e.target.value) || 0)}
                            className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Markup (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              step="1"
                              value={component.markup_percent}
                              onChange={(e) => updateComponent(component.id, 'markup_percent', parseFloat(e.target.value) || 0)}
                              className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Venda (R$)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={component.unit_price}
                            onChange={(e) => updateComponent(component.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-gray-900 font-semibold focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Qtd</label>
                          <input
                            type="number"
                            min="0.01"
                            step="1"
                            value={component.quantity}
                            onChange={(e) => updateComponent(component.id, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Cálculo: R$ {component.cost_price.toFixed(2)} × {(100 + component.markup_percent).toFixed(0)}% = <strong className="text-gray-900">R$ {component.unit_price.toFixed(2)}</strong></span>
                          <span className="text-gray-300">|</span>
                          <span>Subtotal: <strong className="text-gray-900">R$ {(component.unit_price * component.quantity).toFixed(2)}</strong></span>
                        </div>
                        <button
                          onClick={() => removeComponent(component.id)}
                          className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-5 bg-gray-900 rounded-2xl">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Total de Componentes</span>
                  <span>{components.filter(c => c.name).length} itens</span>
                </div>
                <div className="h-px bg-gray-700" />
                <div className="flex justify-between text-white">
                  <span className="font-semibold">Preço de Venda Calculado</span>
                  <span className="text-2xl font-bold">{formatCurrency(totalCalculated)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3">
          <button
            onClick={() => router.push("/products")}
            className="flex-1 h-14 bg-gray-100 text-gray-700 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-14 bg-primary text-gray-900 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Produto
              </>
            )}
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
