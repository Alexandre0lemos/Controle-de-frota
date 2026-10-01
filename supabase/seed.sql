-- Seed de dados para Supra Frota
-- Datas relativas ao current_date

-- 1. Motoristas
insert into public.drivers (id, nome, cnh, validade_cnh, telefone, status) values
('d1000000-0000-0000-0000-000000000001', 'João Silva', '123456789', current_date + interval '2 years', '11999998888', 'Ativo'),
('d1000000-0000-0000-0000-000000000002', 'Ricardo Santos', '987654321', current_date + interval '1 year', '11988887777', 'Ativo');

-- 2. Veículos
insert into public.vehicles (id, numero, placa, marca, modelo, versao, ano, tipo, carroceria, combustivel, km_atual, motorista_id, setor, status, data_aquisicao) values
('v1000000-0000-0000-0000-000000000001', 115, 'SRV8C01', 'Mercedes', 'Accelo', '1016', 2022, 'Utilitário de carga', 'Baú', 'Diesel', 45000, 'd1000000-0000-0000-0000-000000000001', 'Logística', 'Disponível', '2022-01-15'),
('v1000000-0000-0000-0000-000000000002', 102, 'KZL8B76', 'VW', 'Delivery', 'Express', 2021, 'Utilitário de carga', 'Baú', 'Diesel', 82000, 'd1000000-0000-0000-0000-000000000002', 'Logística', 'Disponível', '2021-06-10'),
('v1000000-0000-0000-0000-000000000003', 108, 'RIR3C78', 'Iveco', 'Daily', '35S', 2023, 'Utilitário de carga', 'Baú', 'Diesel', 12000, 'd1000000-0000-0000-0000-000000000001', 'Logística', 'Em Manutenção', '2023-03-20'),
('v1000000-0000-0000-0000-000000000004', 101, 'LSB3F93', 'Mercedes', 'Atego', '1719', 2020, 'Utilitário de carga', 'Baú', 'Diesel', 155000, 'd1000000-0000-0000-0000-000000000002', 'Logística', 'Disponível', '2020-11-05'),
('v1000000-0000-0000-0000-000000000005', 106, 'RKD1C97', 'VW', 'Constellation', '17.230', 2019, 'Utilitário de carga', 'Baú', 'Diesel', 210000, 'd1000000-0000-0000-0000-000000000001', 'Logística', 'Bloqueado', '2019-08-12');

-- 3. Oficinas
insert into public.workshops (nome, cnpj, contato, especialidade) values
('Oficina Central Supra', '12.345.678/0001-01', '(11) 4002-8922', 'Geral'),
('Diesel Express', '98.765.432/0001-99', '(11) 3344-5566', 'Motor e Câmbio'),
('Pneus Rápido', '11.222.333/0001-44', '(11) 2233-4455', 'Pneumáticos');

-- 4. Trocas de Óleo (Algumas vencidas, algumas próximas)
insert into public.oil_changes (vehicle_id, tipo_oleo, marca, litros, data, km, periodicidade_km, periodicidade_meses, custo) values
('v1000000-0000-0000-0000-000000000001', '15W40', 'Shell', 15, current_date - interval '4 months', 35000, 10000, 6, 450.00),
('v1000000-0000-0000-0000-000000000002', '15W40', 'Mobil', 12, current_date - interval '8 months', 72000, 10000, 6, 420.00), -- Vencida por tempo
('v1000000-0000-0000-0000-000000000003', '15W40', 'Shell', 10, current_date - interval '1 month', 2000, 10000, 6, 380.00);

-- 5. Manutenções Preventivas
insert into public.preventive (vehicle_id, servico, periodicidade_km, periodicidade_meses, ultima_execucao_data, ultima_execucao_km, prioridade) values
('v1000000-0000-0000-0000-000000000001', 'Revisão Freios', 20000, 12, current_date - interval '11 months', 25000, 'Alta'),
('v1000000-0000-0000-0000-000000000002', 'Troca Filtros', 15000, 6, current_date - interval '7 months', 67000, 'Média'),
('v1000000-0000-0000-0000-000000000004', 'Alinhamento/Balanceamento', 10000, 6, current_date - interval '2 months', 145000, 'Média');

-- 6. Manutenções Corretivas (Algumas abertas)
insert into public.maintenance (vehicle_id, tipo, status, oficina, data_entrada, data_prevista, km, problema, servicos, pecas, mao_obra) values
('v1000000-0000-0000-0000-000000000003', 'Corretiva', 'Em manutenção', 'Oficina Central Supra', current_date - interval '2 days', current_date + interval '3 days', 12000, 'Vazamento Radiador', 'Troca de mangueiras e vedação', 200.00, 150.00),
('v1000000-0000-0000-0000-000000000005', 'Corretiva', 'Aguardando Peça', 'Diesel Express', current_date - interval '10 days', current_date + interval '5 days', 210000, 'Falha Injeção', 'Substituição bico injetor', 1200.00, 400.00);

-- 7. Documentos (Alguns vencendo)
insert into public.documents (vehicle_id, tipo, numero, data_vencimento, custo) values
('v1000000-0000-0000-0000-000000000001', 'Licenciamento', 'LIC-123', current_date + interval '15 days', 150.00),
('v1000000-0000-0000-0000-000000000002', 'Seguro', 'SEG-456', current_date - interval '5 days', 1200.00), -- Vencido
('v1000000-0000-0000-0000-000000000004', 'IPVA', 'IPVA-789', current_date + interval '45 days', 800.00);

-- 8. Avarias
insert into public.damages (vehicle_id, data, tipo, descricao, classificacao, status, custo) values
('v1000000-0000-0000-0000-000000000005', current_date - interval '3 days', 'Lataria', 'Amassado porta traseira esquerda', 'Moderada', 'Aberta', 300.00),
('v1000000-0000-0000-0000-000000000002', current_date - interval '15 days', 'Vidro', 'Trinca para-brisa', 'Crítica', 'Aberta', 600.00);
