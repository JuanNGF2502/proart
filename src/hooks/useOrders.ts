import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, CreateOrderPayload, OrderSummary } from '@/types/database';

export function useOrders(filters?: { status?: string; priority?: string; client_id?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          client:clients(id, name),
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority && filters.priority !== 'todos') {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.priority, filters?.client_id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (payload: CreateOrderPayload) => {
    // Calculate totals
    const subtotal = payload.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    const discount = 0;
    const total = subtotal - discount;

    // Generate order number
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const year = new Date().getFullYear().toString().slice(-2);
    const seq = lastOrder ? parseInt(lastOrder.order_number.slice(-4)) + 1 : 1;
    const orderNumber = `${year}${seq.toString().padStart(4, '0')}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        client_id: payload.client_id,
        budget_id: payload.budget_id,
        priority: payload.priority || 'medium',
        deadline: payload.deadline,
        responsible: payload.responsible,
        subtotal,
        discount,
        total,
        amount_paid: payload.payment?.amount || 0,
        notes: payload.notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const items = payload.items.map((item, index) => ({
      order_id: order.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: 'und',
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      material: item.material,
      finish: item.finish,
      dimensions: item.dimensions,
      sort_order: index,
    }));

    await supabase.from('order_items').insert(items);

    // Create payment if provided
    if (payload.payment) {
      await supabase.from('payments').insert({
        order_id: order.id,
        client_id: payload.client_id,
        amount: payload.payment.amount,
        payment_method: payload.payment.payment_method,
        due_date: payload.payment.due_date,
        status: 'pendente',
      });
    }

    // Create timeline entry
    await supabase.from('timeline').insert({
      client_id: payload.client_id,
      order_id: order.id,
      event_type: 'order_created',
      title: `Pedido #${orderNumber} criado`,
      description: `Valor: R$ ${total.toFixed(2)}`,
    });

    await fetchOrders();
    return order;
  };

  const updateOrder = async (id: string, payload: Partial<Order>) => {
    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchOrders();
    return data;
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const updates: Partial<Order> = { status };

    if (status === 'arte') {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'concluido') {
      updates.finished_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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
      order_id: id,
      event_type: `order_${status}`,
      title: `Pedido em ${statusLabels[status]}`,
    });

    await fetchOrders();
    return data;
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    await fetchOrders();
  };

  return { orders, loading, error, fetchOrders, createOrder, updateOrder, updateOrderStatus, deleteOrder };
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            client:clients(*),
            budget:budgets(*),
            items:order_items(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return { order, loading, error };
}

export function useOrderSummary() {
  const [summary, setSummary] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('order_summary')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSummary(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { summary, loading };
}

export function useProductionOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductionOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(id, name),
          items:order_items(*)
        `)
        .in('status', ['aguardando', 'arte', 'impressao', 'producao', 'acabamento'])
        .order('priority', { ascending: false })
        .order('deadline', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductionOrders();
  }, [fetchProductionOrders]);

  const updateStatus = async (id: string, status: Order['status']) => {
    const updates: Partial<Order> = { status };

    if (status === 'arte') {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'concluido') {
      updates.finished_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchProductionOrders();
  };

  return { orders, loading, fetchOrders: fetchProductionOrders, updateStatus };
}
