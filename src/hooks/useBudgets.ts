import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import type { Budget, CreateBudgetPayload } from '@/types/database';

export function useBudgets(filters?: { status?: string; client_id?: string }) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Budgets fetch error:', error);
        throw error;
      }

      // Fetch client names separately if there are budgets
      if (data && data.length > 0) {
        const clientIds = [...new Set(data.map(b => b.client_id).filter(Boolean))];
        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', clientIds);

          const clientMap = new Map(clients?.map(c => [c.id, c]) || []);

          // Fetch budget items separately
          const budgetIds = data.map(b => b.id);
          const { data: items } = await supabase
            .from('budget_items')
            .select('*')
            .in('budget_id', budgetIds);

          const itemsMap = new Map<string, any[]>();
          items?.forEach(item => {
            if (!itemsMap.has(item.budget_id)) {
              itemsMap.set(item.budget_id, []);
            }
            itemsMap.get(item.budget_id)!.push(item);
          });

          // Combine data
          const combinedData = data.map(budget => ({
            ...budget,
            client: budget.client_id ? clientMap.get(budget.client_id) : null,
            items: itemsMap.get(budget.id) || [],
          }));

          setBudgets(combinedData);
        } else {
          setBudgets(data.map(b => ({ ...b, client: null, items: [] })));
        }
      } else {
        setBudgets([]);
      }
    } catch (e: any) {
      console.error('Budgets error:', e);
      setError(e.message);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.client_id]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = async (payload: CreateBudgetPayload) => {
    const subtotal = payload.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    const discount = payload.discount || 0;
    const total = subtotal - discount;

    // Get validity days from settings
    let validityDays = 30;
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('budget_validity_days')
        .limit(1)
        .single();
      validityDays = settings?.budget_validity_days || 30;
    } catch (e) {
      console.log('No settings found, using default validity');
    }

    // Generate budget number
    const { data: lastBudget } = await supabase
      .from('budgets')
      .select('budget_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const year = new Date().getFullYear().toString().slice(-2);
    const seq = lastBudget ? parseInt(lastBudget.budget_number?.slice(-4) || '0') + 1 : 1;
    const budgetNumber = `${year}${seq.toString().padStart(4, '0')}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create budget
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        budget_number: budgetNumber,
        client_id: payload.client_id || null,
        valid_until: validUntil.toISOString().split('T')[0],
        subtotal,
        discount,
        total,
        notes: payload.notes || null,
        internal_notes: payload.internal_notes || null,
        status: 'pendente',
      })
      .select()
      .single();

    if (budgetError) throw budgetError;

    // Create budget items
    if (payload.items.length > 0) {
      const items = payload.items.map((item, index) => ({
        budget_id: budget.id,
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit || 'und',
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        product_id: item.product_id || null,
        sort_order: index,
      }));

      await supabase.from('budget_items').insert(items);
    }

    // Create timeline entry
    try {
      await supabase.from('timeline').insert({
        client_id: payload.client_id || null,
        budget_id: budget.id,
        event_type: 'budget_created',
        title: `Orçamento #${budgetNumber} criado`,
        description: `Valor: R$ ${total.toFixed(2)}`,
      });
    } catch (e) {
      console.log('Timeline insert failed, continuing...');
    }

    await fetchBudgets();
    return budget;
  };

  const approveBudget = async (id: string) => {
    const { data, error } = await supabase
      .from('budgets')
      .update({ status: 'aprovado', approved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('timeline').insert({
        budget_id: id,
        event_type: 'budget_approved',
        title: 'Orçamento aprovado',
        description: `Valor: R$ ${data.total.toFixed(2)}`,
      });
    } catch (e) {
      console.log('Timeline insert failed');
    }

    await fetchBudgets();
    return data;
  };

  const rejectBudget = async (id: string) => {
    const { data, error } = await supabase
      .from('budgets')
      .update({ status: 'recusado', rejected_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await fetchBudgets();
    return data;
  };

  return { budgets, loading, error, fetchBudgets, createBudget, approveBudget, rejectBudget };
}

export function useBudget(id: string) {
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchBudget = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Fetch client
        let client = null;
        if (data?.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', data.client_id)
            .single();
          client = clientData;
        }

        // Fetch items
        const { data: items } = await supabase
          .from('budget_items')
          .select('*')
          .eq('budget_id', id);

        setBudget({ ...data, client, items: items || [] });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [id]);

  return { budget, loading, error };
}
