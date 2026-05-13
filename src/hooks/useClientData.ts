import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import type { ClientFile, ClientNote, Timeline, Payment } from '@/types/database';

// ============================================
// CLIENT FILES
// ============================================

export function useClientFiles(clientId: string) {
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File, category: string = 'outro') => {
    if (!clientId) throw new Error('Client ID required');

    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('clients')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('clients')
      .getPublicUrl(fileName);

    // Create record
    const { data, error } = await supabase
      .from('client_files')
      .insert({
        client_id: clientId,
        name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'document',
        file_size: file.size,
        category,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchFiles();
    return data;
  };

  const deleteFile = async (id: string) => {
    const { error } = await supabase.from('client_files').delete().eq('id', id);
    if (error) throw error;
    await fetchFiles();
  };

  return { files, loading, fetchFiles, uploadFile, deleteFile };
}

// ============================================
// CLIENT NOTES
// ============================================

export function useClientNotes(clientId: string) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_notes')
        .select('*, user:users(name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: string, noteType: ClientNote['note_type'] = 'general', isInternal: boolean = false) => {
    if (!clientId) throw new Error('Client ID required');

    const { data, error } = await supabase
      .from('client_notes')
      .insert({
        client_id: clientId,
        note,
        note_type: noteType,
        is_internal: isInternal,
      })
      .select('*, user:users(name)')
      .single();

    if (error) throw error;
    await fetchNotes();
    return data;
  };

  const updateNote = async (id: string, note: string) => {
    const { data, error } = await supabase
      .from('client_notes')
      .update({ note })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchNotes();
    return data;
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('client_notes').delete().eq('id', id);
    if (error) throw error;
    await fetchNotes();
  };

  const markFollowUp = async (id: string, followUpDate: string) => {
    const { error } = await supabase
      .from('client_notes')
      .update({ follow_up_date: followUpDate, note_type: 'follow_up' })
      .eq('id', id);

    if (error) throw error;
    await fetchNotes();
  };

  const completeFollowUp = async (id: string) => {
    const { error } = await supabase
      .from('client_notes')
      .update({ follow_up_done: true })
      .eq('id', id);

    if (error) throw error;
    await fetchNotes();
  };

  return { notes, loading, fetchNotes, addNote, updateNote, deleteNote, markFollowUp, completeFollowUp };
}

// ============================================
// TIMELINE
// ============================================

export function useTimeline(clientId?: string, orderId?: string, budgetId?: string) {
  const [events, setEvents] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('timeline')
          .select('*, user:users(name)')
          .order('created_at', { ascending: false })
          .limit(50);

        if (clientId) {
          query = query.eq('client_id', clientId);
        } else if (orderId) {
          query = query.eq('order_id', orderId);
        } else if (budgetId) {
          query = query.eq('budget_id', budgetId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setEvents(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [clientId, orderId, budgetId]);

  const addEvent = async (eventType: string, title: string, description?: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase
      .from('timeline')
      .insert({
        client_id: clientId,
        order_id: orderId,
        budget_id: budgetId,
        event_type: eventType,
        title,
        description,
        metadata,
      })
      .select('*, user:users(name)')
      .single();

    if (error) throw error;
    setEvents(prev => [data, ...prev]);
    return data;
  };

  return { events, loading, addEvent };
}

// ============================================
// PAYMENTS
// ============================================

export function usePayments(clientId?: string, orderId?: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select('*, client:clients(name), order:orders(order_number)')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clientId, orderId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const addPayment = async (payload: {
    client_id?: string;
    order_id?: string;
    budget_id?: string;
    amount: number;
    payment_method: Payment['payment_method'];
    due_date?: string;
    description?: string;
  }) => {
    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // If payment is for an order, update amount_paid
    if (payload.order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('amount_paid, total')
        .eq('id', payload.order_id)
        .single();

      if (order) {
        const newAmountPaid = (order.amount_paid || 0) + payload.amount;
        const newStatus = newAmountPaid >= order.total ? 'pago' : 'parcial';

        await supabase
          .from('orders')
          .update({ amount_paid: newAmountPaid })
          .eq('id', payload.order_id);
      }
    }

    await fetchPayments();
    return data;
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'pago', paid_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchPayments();
  };

  return { payments, loading, fetchPayments, addPayment, markAsPaid };
}

// ============================================
// PRODUCTS
// ============================================

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('name');

        if (error) throw error;
        setProducts(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading };
}
