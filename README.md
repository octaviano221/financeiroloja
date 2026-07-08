# Sud Daiana Modas

Sistema web para gestão de loja de roupas familiar, com PDV, estoque, clientes, crediário, delivery, promoções, fidelidade, caixa, fiscal e relatórios.

## Tecnologias

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: MySQL via Prisma ORM
- Autenticação: JWT com senha criptografada
- Layout responsivo para computador, tablet e celular

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie `server/.env` e configure:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/sud_daiana_modas"
JWT_SECRET="troque-essa-chave-em-producao"
```

3. Rode as migrações e alimente o sistema:

```bash
npm run prisma:migrate
npm run seed
```

4. Inicie o sistema:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:3333`

## Acesso inicial

- E-mail: `admin@suddaiana.com`
- Senha: `admin123`

## Seed Premium

O comando abaixo alimenta o banco com produtos, categorias, marcas, clientes, vendas, caixa, promoções, delivery, crediário, nota fiscal de demonstração e pontos de fidelidade:

```bash
npm run seed
```

Ele precisa da variável `DATABASE_URL` configurada no ambiente ou em `server/.env`.

## Implantação na Hostinger

Use estas opções quando a Hostinger pedir os dados da aplicação Node.js:

```text
Branch: main
Diretório raiz: /
Versão do Node: 22.x
Gerenciador de pacotes: npm
Comando de construção: npm run build
Arquivo de entrada: server.js
```

Variáveis de ambiente:

```env
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/NOME_DO_BANCO
JWT_SECRET=crie-uma-chave-grande-e-secreta
```

No painel da Hostinger, a chave já fica separada do valor. Então no campo de valor da `DATABASE_URL`, comece direto com `mysql://`, sem escrever `DATABASE_URL=` de novo.

Para criar as tabelas em produção:

```bash
npm run prisma:deploy
npm run seed
```

## Módulos Incluídos

- Dashboard com indicadores, gráfico e alertas
- PDV com carrinho, cliente, pagamento e baixa de estoque
- Produtos, categorias, marcas e variações por cor/tamanho
- Estoque com alertas de baixo estoque
- Clientes com histórico, fidelidade e WhatsApp
- Crediário com parcelas e recebimentos
- Delivery com status e bairros/taxas
- Promoções e cupons
- Fidelidade por pontos e níveis
- Caixa com abertura, movimentações e fechamento
- Fiscal preparado para NFC-e/NF-e via provedor externo
- Relatórios operacionais
- Vitrine online simples para pedidos
- Configurações da loja, fiscal e permissões

> A emissão fiscal real exige certificado, credenciamento fiscal e integração com SEFAZ ou provedor homologado. O sistema deixa cadastros, histórico e endpoints prontos para essa integração.
