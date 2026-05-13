import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import type { Client, CreateClientPayload, ClientSummary } from '@/types/database';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (payload: CreateClientPayload) => {
    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    await fetchClients();
    return data;
  };

  const updateClient = async (id: string, payload: Partial<Client>) => {
    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchClients();
    return data;
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    await fetchClients();
  };

  return { clients, loading, error, fetchClients, createClient, updateClient, deleteClient };
}

export function useClient(id: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setClient(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  return { client, loading, error };
}

export function useClientSummary() {
  const [summary, setSummary] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('client_summary')
          .select('*')
          .order('total_spent', { ascending: false });

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

export function useClientStats(clientId: string) {
  const [stats, setStats] = useState({
    totalSpent: 0,
    ordersCount: 0,
    averageTicket: 0,
    approvedBudgets: 0,
    rejectedBudgets: 0,
    openAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Get orders
        const { data: orders } = await supabase
          .from('orders')
          .select('total, status')
          .eq('client_id', clientId);

        // Get budgets
        const { data: budgets } = await supabase
          .from('budgets')
          .select('total, status')
          .eq('client_id', clientId);

        // Get pending payments
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, status')
          .eq('client_id', clientId)
          .neq('status', 'pago');

        const ordersArr = orders || [];
        const budgetsArr = budgets || [];
        const paymentsArr = payments || [];

        const totalSpent = ordersArr
          .filter((o: any) => o.status === 'concluido')
          .reduce((acc: number, o: any) => acc + (o.total || 0), 0);

        const ordersCount = ordersArr.length;
        const averageTicket = ordersCount > 0 ? totalSpent / ordersCount : 0;

        const approvedBudgets = budgetsArr.filter((b: any) => b.status === 'aprovado').length;
        const rejectedBudgets = budgetsArr.filter((b: any) => b.status === 'recusado').length;

        const openAmount = paymentsArr
          .filter((p: any) => p.status !== 'pago')
          .reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

        setStats({
          totalSpent,
          ordersCount,
          averageTicket,
          approvedBudgets,
          rejectedBudgets,
          openAmount,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clientId]);

  return { stats, loading };
}
