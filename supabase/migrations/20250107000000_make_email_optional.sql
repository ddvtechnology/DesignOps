-- Tornar o campo email opcional na tabela clients
-- Esta migração permite que clientes sejam criados sem email obrigatório

ALTER TABLE clients ALTER COLUMN email DROP NOT NULL;

-- Comentário: O campo email agora é opcional, permitindo mais flexibilidade no cadastro de clientes 