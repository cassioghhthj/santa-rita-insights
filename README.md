# Santa Rita Insights

Quero um dashboard de gestão interno para o Supermercado Santa Rita. É uso interno, só eu (dono/administrador) vou acessar - não é um app para clientes finais.

IMPORTANTE SOBRE O BANCO DE DADOS: NÃO crie um banco novo (não use o Lovable Cloud / não provisione banco). Eu já tenho um projeto Supabase existente com todos os dados históricos e um pipeline automático (n8n) alimentando ele todo dia. Vou conectar esse projeto Supabase externo pela aba Cloud > Supabase do editor. As tabelas já existem e a Row Level Security já está configurada (policies de SELECT liberadas só pra role "authenticated"). Por isso o app precisa ter uma tela de login (email/senha, via Supabase Auth) - depois de logado, as policies já liberam a leitura sozinhas. Não precisa criar cadastro público, só um login simples (vou criar meu próprio usuário direto no painel do Supabase).

ESQUEMA DAS TABELAS (schema public, todas com coluna empresa_id uuid e RLS ativo):

empresas
- id uuid (pk), nome text

vendas_por_produto (data, codigo_produto) - vendas diárias por produto
- empresa_id, data date, codigo_produto, produto text, total_vendido numeric

vendas_por_pdv (data, pdv)
- empresa_id, data date, pdv int, total_produtos numeric, desconto_aplicado numeric, desconto_concedido numeric, total_venda numeric

vendas_por_forma_pagamento (data, forma_pagamento)
- empresa_id, data date, forma_pagamento text, valor_vendido numeric

vendas_a_prazo (venda_doc é único por empresa)
- empresa_id, data date, cod_cliente int, nome_cliente text, tipo_venda text, coi text, venda_doc text, data_compra date, valor_bruto numeric, descontos numeric, valor_liquido numeric

conferencia_caixa
- empresa_id, data date, conta text (ex: "SANGRIAS", "RECEBIMENTOS"), data_transacao date nullable, descricao text, forma_pagamento text, valor_recebido numeric, valor_pago numeric, saldo numeric, tipo_linha text ("transacao" ou "saldo")

estrutura_gerencial (data, categoria)
- empresa_id, data date, categoria text, valor numeric, info_adicional text

contas_a_receber - ESSA TABELA É UM SNAPSHOT DE SALDO (não histórico de vendas), representa o saldo em aberto de cada cliente na data_referencia
- empresa_id, data_referencia date, cod_cliente int, nome_cliente text, doc_cliente text, saldo_devedor numeric

compras_analitico - linha a linha das notas de compra
- empresa_id, data date, compra_id text, classe_cod text, classe_nome text, nf_serie text, fornecedor_cod text, fornecedor_nome text, produto text, ncm text, quantidade numeric, valor_unitario numeric, valor_total numeric

compras_vendas_classe (data, codigo_produto) - cruza compra x venda por produto/classe
- empresa_id, data date, classe_cod text, classe_nome text, codigo_produto text, produto text, qtde_comprada numeric, vlr_total_compras numeric, preco_medio_compra numeric, qtde_vendida numeric, vlr_total_vendas numeric, preco_medio_venda numeric

contas_recebidas - baixas/recebimentos efetivos de contas a receber
- empresa_id, data date, conta text, cod_cliente int, nome_cliente text, numero_venda text, data_liquidacao date, data_lancamento date, data_vencimento date, valor_original numeric, juros numeric, descontos numeric, valor_liquidado numeric, nota_fiscal text

Todos os dados de hoje pra trás pertencem a uma única empresa (empresa_id fixo = '9b552309-91f5-44bf-9e6f-4e5416de7bff'), então pode simplificar e não precisa de seletor de empresa por enquanto.

O QUE PRECISO NO DASHBOARD (pode fazer em etapas, mas essa é a visão completa):

1. Tela de login simples (email/senha via Supabase Auth).

2. Visão geral / Home: resumo do dia mais recente disponível - total vendido, total de compras, saldo de caixa (conferencia_caixa), total em contas a receber em aberto. Comparação com o dia anterior (variação %).

3. Página de Vendas: gráfico de vendas por dia (série temporal, com filtro de período - hoje, últimos 7 dias, últimos 30 dias, período customizado), breakdown por forma de pagamento, breakdown por PDV, tabela de produtos mais vendidos no período (usando vendas_por_produto).

4. Página de Compras: gráfico de compras por dia, breakdown por classe/categoria, tabela com principais fornecedores no período (agregando compras_analitico).

5. Página de Contas a Receber: saldo total em aberto (mais recente data_referencia), tabela de clientes com maior saldo devedor, e um "aging" simples - como a tabela contas_a_receber é só um snapshot do saldo (não tem data de vencimento por linha), pode mostrar a EVOLUÇÃO do saldo total ao longo dos últimos dias (série temporal por data_referencia) e também comparar com contas_recebidas (quanto foi efetivamente recebido/baixado por dia) pra dar noção de quanto está entrando vs quanto está parado em aberto. Se der pra cruzar cod_cliente entre as duas tabelas pra mostrar "evolução por cliente" (saldo ao longo do tempo de cada cliente), melhor ainda - isso é importante pra mim.

6. Página de Caixa: dados da conferencia_caixa - saldo do dia, sangrias, recebimentos, breakdown por forma de pagamento.

7. Filtro de período global reutilizável (hoje / 7 dias / 30 dias / customizado) que afeta os gráficos das páginas.

Design: limpo, profissional, cores neutras, boa leitura de números grandes (é um dashboard financeiro/operacional, prioriza clareza sobre estética chamativa). Pode usar cards de KPI no topo de cada página.

Pode começar pela estrutura geral (login + navegação entre as páginas) e a página de Visão Geral primeiro. Não se preocupe em criar dados de teste - vou conectar o Supabase real depois que a estrutura estiver pronta.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://santa-rita-insights.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/05ab8a08-47b3-4a98-8adf-a762f3cbefab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
