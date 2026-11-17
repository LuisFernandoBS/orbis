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
1. Vercel → Project → Settings → Environment Variables: `GEMINI_API_KEY` (e opcional `GEMINI_MODEL`). **Não** use prefixo `VITE_`.
2. Faça redeploy.
3. Local: copie `.env.example` para `.env.local`, preencha e rode `npx vercel dev` (o `npm run dev` não serve `/api`).

## Supabase (persistência de todos os dados)
1. Crie um projeto no Supabase e rode `supabase/schema.sql` no SQL Editor (tabela `orbis_state` com RLS: cada usuário só acessa a própria linha).
2. Em Authentication → Providers, mantenha Email habilitado (desative "Confirm email" se quiser entrar sem confirmar).
3. Variáveis públicas (Vercel e `.env.local`): `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave **anon/publishable** usada pelo navegador).
4. Variáveis privadas (apenas Vercel/servidor): `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Nunca use `SUPABASE_SERVICE_ROLE_KEY` em código Vite, `VITE_*` ou arquivos públicos.
5. Primeiro login: se a nuvem estiver vazia, os dados locais/demo são enviados; nos logins seguintes a nuvem prevalece.
Funcionamento: todo o estado fica em uma linha `jsonb` por usuário, gravada ~0,8s após cada alteração, com cache em localStorage. Conflito entre dispositivos: vale a última gravação.
A rota `/api/trail` agora exige login (valida o token no Supabase).
