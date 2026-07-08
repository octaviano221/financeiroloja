# Sud Daiana Modas

Sistema web para gestao de loja de roupas familiar, com PDV, estoque, clientes, crediario, delivery, promocoes, fidelidade, caixa, fiscal e relatorios.

## Tecnologias

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: MySQL via Prisma ORM
- Autenticacao: JWT com senha criptografada
- Layout responsivo para computador, tablet e celular

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp server/.env.example server/.env
```

3. Configure o MySQL em `server/.env`:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/sud_daiana_modas"
JWT_SECRET="troque-essa-chave-em-producao"
PORT=3333
```

4. Rode as migracoes e gere dados de exemplo:

```bash
npm run prisma:migrate
npm run seed
```

5. Inicie o sistema:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:3333`

## Acesso inicial

- Email: `admin@suddaiana.com`
- Senha: `admin123`

## Implantacao na Hostinger

1. Suba este repositorio para o GitHub.
2. Crie o banco MySQL no painel da Hostinger.
3. Configure as variaveis do backend com a URL do banco e `JWT_SECRET`.
4. Rode `npm install`, `npm run prisma:migrate`, `npm run seed` e `npm run build`.
5. Publique `client/dist` como frontend estatico e mantenha o backend Node ativo em uma hospedagem com suporte a Node.js.

## Modulos incluidos

- Dashboard com indicadores e alertas
- PDV com carrinho, desconto, cliente, pagamento misto e baixa de estoque
- Produtos, categorias, marcas e variacoes por cor/tamanho
- Estoque com movimentacoes
- Clientes com historico, fidelidade e WhatsApp
- Crediario com parcelas e recebimentos
- Delivery com status e bairros/taxas
- Promocoes e cupons
- Fidelidade por pontos e niveis
- Caixa com abertura, movimentacoes e fechamento
- Trocas e vale-troca
- Fiscal preparado para NFC-e/NF-e via provedor externo
- Relatorios operacionais
- Vitrine online simples para pedidos
- Configuracoes da loja, fiscal e permissoes

> A emissao fiscal real exige certificado, credenciamento fiscal e integracao com SEFAZ ou provedor homologado. O sistema ja deixa cadastros, historico e endpoints prontos para essa integracao.
