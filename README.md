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
