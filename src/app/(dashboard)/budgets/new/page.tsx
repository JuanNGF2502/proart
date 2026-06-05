"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Save, FileText, User, Phone, Mail, Loader2, FileDown, Search, ChevronDown, X, Layers, DollarSign } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/shared/lib/utils";
import { downloadBudgetPDF, type BudgetData } from "@/shared/lib/pdf-generator";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/database";

interface Item {
  id: string;
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Budget {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  email: string;
  items: Item[];
  notes: string;
  validity: number;
}

interface ProductOption {
  id: string;
  name: string;
  unit_price: number;
  unit: string;
  category?: string;
  pricing_mode: 'manual' | 'component_sum';
}

function NewBudgetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client selection
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Products catalog
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [activeProductSearch, setActiveProductSearch] = useState<string | null>(null);

  const [budget, setBudget] = useState<Budget>({
    id: "",
    clientId: "",
    name: "",
    phone: "",
    email: "",
    items: [{ id: "1", name: "", quantity: 1, price: 0, unit: "un" }],
    notes: "",
    validity: 30,
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await supabase
          .from('clients')
          .select('id, name, phone, email')
          .eq('is_active', true)
          .order('name');
        setClients(data || []);

        const editData = searchParams.get("data");
        const editMode = searchParams.get("edit");
        if (editData && editMode === "true" && data) {
          try {
            const parsed = JSON.parse(decodeURIComponent(editData));
            setBudget({
              id: parsed.id || "",
              clientId: parsed.clientId || "",
              name: parsed.name || "",
              phone: parsed.phone || "",
              email: parsed.email || "",
              items: parsed.items && parsed.items.length > 0
                ? parsed.items.map((i: any) => ({ ...i, unit: i.unit || "un" }))
                : [{ id: "1", name: "", quantity: 1, price: 0, unit: "un" }],
              notes: parsed.notes || "",
              validity: parsed.validity || 30,
            });

            if (parsed.clientId) {
              const foundClient = data.find((c: Client) => c.id === parsed.clientId);
              if (foundClient) {
                setSelectedClient(foundClient);
              }
            } else if (parsed.name) {
              setSelectedClient({
                id: parsed.clientId || "",
                name: parsed.name,
                phone: parsed.phone,
                email: parsed.email,
              });
            }

            setIsEditMode(true);
          } catch (e) {
            console.error("Erro ao carregar dados do orçamento:", e);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar clientes:', e);
      }
    };

    const fetchProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, unit_price, unit, category, pricing_mode')
          .eq('is_active', true)
          .order('name');
        setProducts(data || []);
      } catch (e) {
        console.error('Erro ao buscar produtos:', e);
      }
    };

    fetchClients();
    fetchProducts();
  }, []);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setBudget({
      ...budget,
      clientId: client.id,
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
    });
    setShowClientDropdown(false);
    setClientSearch("");
  };

  const handleRemoveClient = () => {
    setSelectedClient(null);
    setBudget({
      ...budget,
      clientId: "",
      name: "",
      phone: "",
      email: "",
    });
  };

  const addItem = () => {
    setBudget({
      ...budget,
      items: [...budget.items, { id: crypto.randomUUID(), name: "", quantity: 1, price: 0, unit: "un" }],
    });
  };

  const removeItem = (id: string) => {
    if (budget.items.length > 1) {
      setBudget({
        ...budget,
        items: budget.items.filter((item) => item.id !== id),
      });
    }
  };

  const updateItem = (id: string, field: keyof Item, value: string | number) => {
    setBudget({
      ...budget,
      items: budget.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleSelectProduct = (itemId: string, product: ProductOption) => {
    setBudget({
      ...budget,
      items: budget.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              product_id: product.id,
              name: product.name,
              price: product.unit_price,
              unit: product.unit,
            }
          : item
      ),
    });
    setActiveProductSearch(null);
  };

  const handleClearProduct = (itemId: string) => {
    setBudget({
      ...budget,
      items: budget.items.map((item) =>
        item.id === itemId
          ? { ...item, product_id: undefined, name: "", price: 0, unit: "un" }
          : item
      ),
    });
  };

  const subtotal = budget.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const total = subtotal;

  const handleSave = async () => {
    const validItems = budget.items.filter(i => i.name && i.price > 0);
    if (validItems.length === 0) {
      setError("Adicione pelo menos um item com nome e valor.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + budget.validity);
      let budgetNumber = "";
      let budgetId = "";

      if (isEditMode && budget.id) {
        const { error: budgetError } = await supabase
          .from('budgets')
          .update({
            client_id: budget.clientId || null,
            valid_until: validUntil.toISOString().split('T')[0],
            subtotal,
            discount: 0,
            total,
            notes: budget.notes || null,
          })
          .eq('id', budget.id);

        if (budgetError) throw budgetError;
        budgetId = budget.id;

        const { data: existingBudget } = await supabase
          .from('budgets')
          .select('budget_number')
          .eq('id', budget.id)
          .single();
        budgetNumber = existingBudget?.budget_number || "";

        await supabase.from('budget_items').delete().eq('budget_id', budget.id);

        const itemsToInsert = validItems.map((item, index) => ({
          budget_id: budget.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'un',
          unit_price: item.price,
          total: item.quantity * item.price,
          product_id: item.product_id || null,
          sort_order: index,
        }));

        await supabase.from('budget_items').insert(itemsToInsert);
      } else {
        const { data: lastBudget } = await supabase
          .from('budgets')
          .select('budget_number')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const year = new Date().getFullYear().toString().slice(-2);
        const seq = lastBudget?.budget_number ? parseInt(lastBudget.budget_number.slice(-4)) + 1 : 1;
        budgetNumber = `${year}${seq.toString().padStart(4, '0')}`;

        const { data: newBudget, error: budgetError } = await supabase
          .from('budgets')
          .insert({
            budget_number: budgetNumber,
            client_id: budget.clientId || null,
            valid_until: validUntil.toISOString().split('T')[0],
            subtotal,
            discount: 0,
            total,
            notes: budget.notes || null,
            status: 'pendente',
          })
          .select()
          .single();

        if (budgetError) throw budgetError;
        budgetId = newBudget.id;

        const itemsToInsert = validItems.map((item, index) => ({
          budget_id: newBudget.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'un',
          unit_price: item.price,
          total: item.quantity * item.price,
          product_id: item.product_id || null,
          sort_order: index,
        }));

        await supabase.from('budget_items').insert(itemsToInsert);
      }

      await supabase.from('timeline').insert({
        budget_id: budgetId,
        client_id: budget.clientId || null,
        event_type: isEditMode ? 'budget_updated' : 'budget_created',
        title: isEditMode ? `Orçamento #${budgetNumber} atualizado` : `Orçamento #${budgetNumber} criado`,
        description: `Valor: R$ ${total.toFixed(2)}`,
      });

      router.push("/budgets");
    } catch (e: any) {
      console.error('Erro ao salvar orçamento:', e);
      setError(e.message || "Erro ao salvar orçamento");
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const validItems = budget.items.filter(i => i.name);

    if (!budget.name || validItems.length === 0) {
      setError("Preencha o nome do cliente e pelo menos um item para gerar o PDF.");
      return;
    }

    const budgetData: BudgetData = {
      id: budget.id || "001",
      clientName: budget.name,
      clientPhone: budget.phone,
      clientEmail: budget.email,
      items: validItems.map((item, index) => ({
        id: String(index + 1),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      notes: budget.notes,
      validity: budget.validity,
      date: new Date(),
      total: total,
    };

    downloadBudgetPDF(budgetData);
  };

  const filteredProducts = (search: string) =>
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <DashboardLayout>
      <Header
        title={isEditMode ? "Editar Orçamento" : "Novo Orçamento"}
        description={isEditMode ? "Editar dados do orçamento" : "Criar orçamento para cliente"}
        actions={
          <Link href="/budgets" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
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

        {/* Client Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Selecionar Cliente</h3>
          </div>

          {selectedClient ? (
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold">{selectedClient.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                  <p className="text-sm text-gray-500">{selectedClient.phone || selectedClient.email}</p>
                </div>
              </div>
              <button
                onClick={handleRemoveClient}
                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Buscar cliente existente..."
                  className="w-full h-12 pl-12 pr-12 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              <AnimatePresence>
                {showClientDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-auto"
                  >
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Nenhum cliente encontrado
                      </div>
                    ) : (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-900">{client.name.charAt(0)}</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.phone || client.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {selectedClient && (
            <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nome do Cliente</label>
                <input
                  type="text"
                  value={budget.name}
                  onChange={(e) => setBudget({ ...budget, name: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
                  <input
                    type="tel"
                    value={budget.phone}
                    onChange={(e) => setBudget({ ...budget, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                  <input
                    type="email"
                    value={budget.email}
                    onChange={(e) => setBudget({ ...budget, email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Itens do Orçamento</h3>
            </div>
            <button
              onClick={addItem}
              className="h-9 px-4 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Item
            </button>
          </div>

          <div className="space-y-4">
            {budget.items.map((item, index) => {
              const matchingProducts = activeProductSearch === item.id && item.name.length >= 1
                ? filteredProducts(item.name)
                : [];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 bg-gray-50 rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      {/* Product search / name input */}
                      <div className="relative">
                        {item.product_id ? (
                          <div className="flex items-center justify-between h-11 px-4 bg-white rounded-xl border border-emerald-200">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary-dark">
                                Catálogo
                              </span>
                            </div>
                            <button
                              onClick={() => handleClearProduct(item.id)}
                              className="p-1 hover:bg-gray-100 rounded-lg ml-2 shrink-0"
                            >
                              <X className="h-3.5 w-3.5 text-gray-400" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Buscar produto do catálogo ou digitar manual..."
                              value={item.name}
                              onChange={(e) => {
                                updateItem(item.id, "name", e.target.value);
                                setActiveProductSearch(item.id);
                              }}
                              onFocus={() => setActiveProductSearch(item.id)}
                              className="w-full h-11 pl-10 pr-4 bg-white rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors"
                            />
                            <AnimatePresence>
                              {matchingProducts.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-auto"
                                >
                                  {matchingProducts.slice(0, 8).map((product) => (
                                    <button
                                      key={product.id}
                                      onClick={() => handleSelectProduct(item.id, product)}
                                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                    >
                                      <div className="text-left min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {product.category && (
                                            <span className="text-[10px] text-gray-400 uppercase">{product.category}</span>
                                          )}
                                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                            product.pricing_mode === 'component_sum'
                                              ? 'bg-primary/10 text-primary-dark'
                                              : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            {product.pricing_mode === 'component_sum' ? (
                                              <><Layers className="h-2.5 w-2.5" /> Componentes</>
                                            ) : (
                                              <><DollarSign className="h-2.5 w-2.5" /> Fixo</>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0 ml-3">
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(product.unit_price)}</p>
                                        <p className="text-[10px] text-gray-400">/{product.unit}</p>
                                      </div>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Qtd</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full h-11 px-4 bg-white rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Valor Unit. ({item.unit})</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                            className="w-full h-11 px-4 bg-white rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 hover:bg-red-200 transition-colors mt-1"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                  <div className="mt-3 text-right flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {item.product_id ? "Produto do catálogo" : "Item avulso"}
                    </div>
                    <span className="text-sm text-gray-500">
                      Subtotal:{" "}
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.price)}
                      </span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Validity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Validade do Orçamento</h3>
              <p className="text-sm text-gray-500">Dias até expirar</p>
            </div>
            <div className="flex items-center gap-3">
              {[15, 30, 60].map((days) => (
                <button
                  key={days}
                  onClick={() => setBudget({ ...budget, validity: days })}
                  className={`h-10 px-4 rounded-xl text-sm font-medium transition-all ${
                    budget.validity === days
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {days} dias
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <h3 className="font-semibold text-gray-900 mb-3">Observações</h3>
          <textarea
            placeholder="Adicione observações ou condições especiais..."
            value={budget.notes}
            onChange={(e) => setBudget({ ...budget, notes: e.target.value })}
            className="w-full h-24 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gray-900"
        >
          <h3 className="font-semibold text-white mb-4">Resumo do Orçamento</h3>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal ({budget.items.filter(i => i.name).length} items)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="h-px bg-gray-700" />
            <div className="flex justify-between text-white">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <button
            onClick={handleDownloadPDF}
            className="w-full h-14 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
          >
            <FileDown className="h-5 w-5" />
            Baixar PDF
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/budgets")}
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
                  Salvar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function NewBudgetPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="p-5 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    }>
      <NewBudgetContent />
    </Suspense>
  );
}
