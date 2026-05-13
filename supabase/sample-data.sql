-- ============================================
-- PROART APP - SAMPLE DATA
-- ============================================

-- Insert sample clients
INSERT INTO clients (name, contact_name, document, document_type, phone, whatsapp, email, instagram, address, city, state, zip_code, status, preferred_contact, delivery_preference, favorite_material, favorite_finish, notes) VALUES
('Restaurante Sabor', 'João Silva', '12.345.678/0001-90', 'cnpj', '(11) 99999-1111', '(11) 99999-1111', 'contato@sabor.com.br', '@restaurantesabor', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', 'ativo', 'whatsapp', true, 'Vinil adesivo', 'Fosco', 'Cliente prefere acabamento fosco. Sempre paga no PIX.'),
('Academia Strong', 'Ana Costa', '98.765.432/0001-10', 'cnpj', '(11) 99999-2222', '(11) 99999-2222', 'ana@strong.com', '@academiastrong', 'Rua Augusta, 500', 'São Paulo', 'SP', '01333-000', 'vip', 'whatsapp', true, 'Lona', 'Brilhante', 'Cliente VIP. Pedidos urgentes com frequência.'),
('Escritório Lima', 'Pedro Lima', '45.678.901/0001-23', 'cnpj', '(11) 99999-3333', '(11) 99999-3333', 'pedro@limalima.com', '@escritoriolima', 'Alameda Santos, 200', 'São Paulo', 'SP', '01419-000', 'recorrente', 'email', false, 'Couchê', 'Fosco', 'Prefere contato por email. Paga sempre em dia.'),
('Barbearia Style', 'João Santos', '78.901.234/0001-45', 'cnpj', '(11) 99999-4444', '(11) 99999-4444', 'joao@style.com', '@barbeariastyle', 'Av. Brasil, 300', 'São Paulo', 'SP', '02022-000', 'ativo', 'whatsapp', true, 'Vinil', 'Fosco', NULL),
('Padaria Doce', 'Maria Rosa', '34.567.890/0001-67', 'cnpj', '(11) 99999-5555', '(11) 99999-5555', 'contato@padariadoce.com.br', '@padariadoce', 'Rua das Flores, 50', 'São Paulo', 'SP', '01234-500', 'recorrente', 'telefone', true, 'Banner', 'Brilhante', 'Cliente antigo. Pedidos mensais.');

-- Get client IDs for reference
DO $$
DECLARE
    client1 uuid;
    client2 uuid;
    client3 uuid;
    client4 uuid;
    client5 uuid;
BEGIN
    SELECT id INTO client1 FROM clients WHERE name = 'Restaurante Sabor';
    SELECT id INTO client2 FROM clients WHERE name = 'Academia Strong';
    SELECT id INTO client3 FROM clients WHERE name = 'Escritório Lima';
    SELECT id INTO client4 FROM clients WHERE name = 'Barbearia Style';
    SELECT id INTO client5 FROM clients WHERE name = 'Padaria Doce';

    -- Insert sample budgets
    INSERT INTO budgets (budget_number, client_id, status, valid_until, subtotal, discount, total, notes) VALUES
    ('241001', client1, 'pendente', CURRENT_DATE + 30, 610.00, 0, 610.00, 'Banner para campanha'),
    ('241002', client2, 'aprovado', CURRENT_DATE + 30, 2137.00, 0, 2137.00, 'Material de comunicação'),
    ('241003', client3, 'pendente', CURRENT_DATE + 15, 190.00, 0, 190.00, 'Cartões de visita'),
    ('241004', client4, 'expirado', CURRENT_DATE - 5, 890.00, 0, 890.00, 'Adesivos de parede'),
    ('241005', client1, 'aprovado', CURRENT_DATE + 30, 320.00, 0, 320.00, 'Adesivos');

    -- Insert budget items
    INSERT INTO budget_items (budget_id, name, quantity, unit, unit_price, total, sort_order)
    SELECT b.id, 'Banner 150x90cm', 2, 'und', 250.00, 500.00, 0
    FROM budgets b WHERE b.budget_number = '241001';

    INSERT INTO budget_items (budget_id, name, quantity, unit, unit_price, total, sort_order)
    SELECT b.id, 'Banner 3x2m', 1, 'und', 450.00, 450.00, 0
    FROM budgets b WHERE b.budget_number = '241001';

    INSERT INTO budget_items (budget_id, name, quantity, unit, unit_price, total, sort_order)
    SELECT b.id, 'Camiseta DTF', 50, 'und', 40.00, 2000.00, 0
    FROM budgets b WHERE b.budget_number = '241002';

    INSERT INTO budget_items (budget_id, name, quantity, unit, unit_price, total, sort_order)
    SELECT b.id, 'Moleton personalizado', 3, 'und', 45.67, 137.01, 1
    FROM budgets b WHERE b.budget_number = '241002';

    INSERT INTO budget_items (budget_id, name, quantity, unit, unit_price, total, sort_order)
    SELECT b.id, 'Cartão de Visita', 100, 'und', 1.90, 190.00, 0
    FROM budgets b WHERE b.budget_number = '241003';

    INSERT INTO budget_items (budget_id, name, quantity, unit, unit_price, total, sort_order)
    SELECT b.id, 'Adesivo parede 50x50cm', 10, 'und', 89.00, 890.00, 0
    FROM budgets b WHERE b.budget_number = '241004';

    INSERT INTO budget_items (budget_id, name, quantity, unit, unit_price, total, sort_order)
    SELECT b.id, 'Adesivo recortado', 100, 'und', 3.20, 320.00, 0
    FROM budgets b WHERE b.budget_number = '241005';

    -- Insert sample orders
    INSERT INTO orders (order_number, client_id, status, priority, deadline, responsible, subtotal, discount, total, amount_paid, notes) VALUES
    ('241001', client1, 'impressao', 'high', CURRENT_DATE + 3, 'Carlos', 500.00, 0, 500.00, 250.00, 'Banner urgente'),
    ('241002', client2, 'acabamento', 'high', CURRENT_DATE + 2, 'Ana', 2000.00, 0, 2000.00, 1000.00, 'Camisetas para evento'),
    ('241003', client3, 'arte', 'medium', CURRENT_DATE + 7, 'Carlos', 190.00, 0, 190.00, 0, NULL),
    ('241004', client4, 'aguardando', 'urgent', CURRENT_DATE + 1, 'Ana', 890.00, 0, 890.00, 445.00, 'Adesivos para reforma'),
    ('241005', client5, 'concluido', 'low', CURRENT_DATE - 2, 'Carlos', 450.00, 0, 450.00, 450.00, 'Banner promocional');

    -- Insert order items
    INSERT INTO order_items (order_id, name, quantity, unit, unit_price, total, material, finish, sort_order)
    SELECT o.id, 'Banner 150x90cm', 2, 'und', 250.00, 500.00, 'Lona', 'Brilhante', 0
    FROM orders o WHERE o.order_number = '241001';

    INSERT INTO order_items (order_id, name, quantity, unit, unit_price, total, material, finish, sort_order)
    SELECT o.id, 'Camiseta DTF', 50, 'und', 40.00, 2000.00, 'Algodão', 'Sublimação', 0
    FROM orders o WHERE o.order_number = '241002';

    INSERT INTO order_items (order_id, name, quantity, unit, unit_price, total, material, finish, sort_order)
    SELECT o.id, 'Cartão de Visita', 100, 'und', 1.90, 190.00, 'Couchê 300g', 'Fosco', 0
    FROM orders o WHERE o.order_number = '241003';

    INSERT INTO order_items (order_id, name, quantity, unit, unit_price, total, material, finish, sort_order)
    SELECT o.id, 'Adesivo parede 50x50cm', 10, 'und', 89.00, 890.00, 'Vinil', 'Fosco', 0
    FROM orders o WHERE o.order_number = '241004';

    INSERT INTO order_items (order_id, name, quantity, unit, unit_price, total, material, finish, sort_order)
    SELECT o.id, 'Banner 2x1m', 3, 'und', 150.00, 450.00, 'Lona', 'Fosco', 0
    FROM orders o WHERE o.order_number = '241005';

    -- Insert sample payments
    INSERT INTO payments (client_id, order_id, amount, payment_method, status, due_date, paid_at) VALUES
    (client1, (SELECT id FROM orders WHERE order_number = '241001'), 250.00, 'pix', 'parcial', CURRENT_DATE + 10, NULL),
    (client2, (SELECT id FROM orders WHERE order_number = '241002'), 1000.00, 'pix', 'parcial', CURRENT_DATE + 5, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (client4, (SELECT id FROM orders WHERE order_number = '241004'), 445.00, 'transferencia', 'parcial', CURRENT_DATE + 15, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (client5, (SELECT id FROM orders WHERE order_number = '241005'), 450.00, 'pix', 'pago', CURRENT_DATE - 5, CURRENT_TIMESTAMP - INTERVAL '7 days');

    -- Insert client notes
    INSERT INTO client_notes (client_id, note, note_type, is_internal) VALUES
    (client1, 'Cliente prefere acabamento fosco em todos os materiais', 'preference', false),
    (client1, 'Sempre paga no PIX em até 2 dias', 'general', false),
    (client1, 'Solicitar sinal de 50% antes da produção', 'internal', true),
    (client2, 'Cliente VIP - priorizar sempre', 'internal', true),
    (client2, 'Pedidos urgentes, verificar disponibilidade antes de confirmar', 'general', false),
    (client3, 'Prefere contato por email, não gosta de ligações', 'preference', false);

    -- Insert timeline entries
    INSERT INTO timeline (client_id, budget_id, event_type, title, description) VALUES
    (client1, (SELECT id FROM budgets WHERE budget_number = '241001'), 'budget_created', 'Orçamento #241001 criado', 'Valor: R$ 610,00'),
    (client1, (SELECT id FROM budgets WHERE budget_number = '241001'), 'budget_approved', 'Orçamento aprovado', 'Valor: R$ 610,00'),
    (client1, (SELECT id FROM orders WHERE order_number = '241001'), 'order_created', 'Pedido #241001 criado', 'Valor: R$ 500,00'),
    (client1, (SELECT id FROM orders WHERE order_number = '241001'), 'payment_received', 'Sinal recebido', 'R$ 250,00 via PIX'),
    (client2, (SELECT id FROM budgets WHERE budget_number = '241002'), 'budget_approved', 'Orçamento aprovado', 'Valor: R$ 2.137,00'),
    (client2, (SELECT id FROM orders WHERE order_number = '241002'), 'order_created', 'Pedido #241002 criado', 'Valor: R$ 2.000,00');

END $$;

-- Update settings with company info
UPDATE settings SET
    company_name = 'PROART Gráfica',
    company_document = '12.345.678/0001-90',
    company_phone = '(11) 3333-4444',
    company_email = 'contato@proart.com.br',
    company_address = 'Av. Paulista, 1000 - São Paulo - SP',
    budget_validity_days = 30,
    budget_prefix = 'ORC',
    order_prefix = 'PED'
WHERE id = (SELECT id FROM settings LIMIT 1);

-- If no settings exist, create default
INSERT INTO settings (company_name, budget_validity_days, budget_prefix, order_prefix)
SELECT 'PROART Gráfica', 30, 'ORC', 'PED'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
