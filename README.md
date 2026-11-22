# Orbis — Sistema Pessoal
React + TypeScript + Vite · Recharts · Lucide · React Router. Persistência local (localStorage).
## Executar
```
npm install
npm run dev      # desenvolvimento
npm run build    # checa tipos e gera build
```
## Estrutura
`src/pages` (telas) · `src/components` (UI reutilizável) · `src/store.ts` (estado) · `src/services/storage.ts` (troque por API) · `src/data/seed.ts` (dados demo) · `src/utils.ts` (cálculos) · `src/styles.css` (tokens Cosmic Obsidian, dark/light).
## Regras de cálculo
- Orçamento = média das ofertas selecionadas × quantidade, dos itens não comprados.
- Progresso do assunto = subtemas concluídos / total (meta sem subtemas conta como 1 unidade).
- Despesas recorrentes são expandidas por cálculo (sem duplicar registros).
## Limitações desta versão
Sem Tailwind (CSS com variáveis), sem mapa neural, trilha com IA, biblioteca de materiais e fotos nos itens/ofertas.

## Gemini via Vercel (variável de ambiente)
A trilha chama `/api/trail` (`api/trail.ts`), que lê `GEMINI_API_KEY` no servidor.
A descoberta de produtos em Compras chama `/api/products/discover` (`api/products/discover.ts`) e usa a mesma chave no servidor.
1. Vercel → Project → Settings → Environment Variables: `GEMINI_API_KEY` (e opcional `GEMINI_MODEL`). **Não** use prefixo `VITE_`.
2. Faça redeploy.
3. Local: copie `.env.example` para `.env.local`, preencha e rode `npx vercel dev` (o `npm run dev` não serve `/api`).

## Supabase (persistência de todos os dados)
1. Crie um projeto no Supabase e rode `supabase/schema.sql` no SQL Editor (tabela `orbis_state` com RLS: cada usuário só acessa a própria linha).
2. Em Authentication → Providers, mantenha Email habilitado (desative "Confirm email" se quiser entrar sem confirmar).
3. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente do servidor (Vercel e `.env.local` usado pelo `vercel dev`). A autenticação, leitura e gravação do Supabase passam pelas APIs do servidor; nenhuma chave Supabase é necessária no navegador.
4. Primeiro login: se a nuvem estiver vazia, os dados locais/demo são enviados; nos logins seguintes a nuvem prevalece.
Funcionamento: todo o estado fica em uma linha `jsonb` por usuário, gravada ~0,8s após cada alteração, com cache em localStorage. Conflito entre dispositivos: vale a última gravação.
As rotas `/api/state` e `/api/trail` validam o login no Supabase antes de operar. A rota `/api/auth` também processa login, cadastro e renovação de sessão no servidor.
