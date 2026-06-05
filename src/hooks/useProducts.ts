import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import type { Product, ProductComponent } from '@/types/database';

export function calculateComponentPrice(component: Pick<ProductComponent, 'cost_price' | 'markup_percent'>): number {
  return Math.round((component.cost_price * (1 + component.markup_percent / 100)) * 100) / 100;
}

export function calculateTotalPrice(components: Pick<ProductComponent, 'unit_price' | 'quantity'>[]): number {
  return components.reduce((acc, c) => acc + c.unit_price * c.quantity, 0);
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, components:product_components(*)')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (product: {
    name: string;
    description?: string;
    category?: string;
    unit?: string;
    pricing_mode?: 'manual' | 'component_sum';
    unit_price?: number;
    is_featured?: boolean;
    components?: Omit<ProductComponent, 'id' | 'product_id' | 'created_at' | 'updated_at'>[];
  }) => {
    const pricingMode = product.pricing_mode || 'manual';
    let unitPrice = product.unit_price || 0;

    // Create product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description || null,
        category: product.category || null,
        unit: product.unit || 'un',
        unit_price: unitPrice,
        pricing_mode: pricingMode,
        is_featured: product.is_featured || false,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Create components
    if (product.components && product.components.length > 0) {
      const calculatedComponents = product.components.map((c, i) => {
        const calculatedPrice = calculateComponentPrice(c);
        return {
          product_id: newProduct.id,
          name: c.name,
          type: c.type || 'material',
          description: c.description || null,
          cost_price: c.cost_price || 0,
          markup_percent: c.markup_percent || 0,
          unit_price: c.unit_price || calculatedPrice,
          unit: c.unit || 'un',
          quantity: c.quantity || 1,
          is_editable: c.is_editable ?? true,
          is_required: c.is_required ?? true,
          sort_order: i,
        };
      });

      const { error: compError } = await supabase
        .from('product_components')
        .insert(calculatedComponents);

      if (compError) throw compError;

      // Auto-calculate total from components
      if (pricingMode === 'component_sum') {
        const total = calculateTotalPrice(calculatedComponents);
        await supabase.from('products').update({ unit_price: total }).eq('id', newProduct.id);
      }
    }

    await fetchProducts();
    return newProduct;
  };

  const updateProduct = async (id: string, payload: Partial<Product> & {
    components?: Omit<ProductComponent, 'id' | 'product_id' | 'created_at' | 'updated_at'>[];
  }) => {
    const { components, ...productData } = payload;

    // Update product
    const { error: productError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id);

    if (productError) throw productError;

    // Replace components
    if (components) {
      await supabase.from('product_components').delete().eq('product_id', id);

      if (components.length > 0) {
        const calculatedComponents = components.map((c, i) => {
          const calculatedPrice = calculateComponentPrice(c);
          return {
            product_id: id,
            name: c.name,
            type: c.type || 'material',
            description: c.description || null,
            cost_price: c.cost_price || 0,
            markup_percent: c.markup_percent || 0,
            unit_price: c.unit_price || calculatedPrice,
            unit: c.unit || 'un',
            quantity: c.quantity || 1,
            is_editable: c.is_editable ?? true,
            is_required: c.is_required ?? true,
            sort_order: i,
          };
        });

        const { error: compError } = await supabase
          .from('product_components')
          .insert(calculatedComponents);

        if (compError) throw compError;

        // Recalculate total
        if (productData.pricing_mode === 'component_sum' || (!productData.pricing_mode && productData.unit_price === undefined)) {
          const total = calculateTotalPrice(calculatedComponents);
          await supabase.from('products').update({ unit_price: total }).eq('id', id);
        }
      }
    }

    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  };

  return { products, loading, error, fetchProducts, createProduct, updateProduct, deleteProduct };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, components:product_components(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}

export function useProductsOptions() {
  const [products, setProducts] = useState<Pick<Product, 'id' | 'name' | 'unit_price' | 'unit'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, unit_price, unit')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setProducts(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  return { products, loading };
}
