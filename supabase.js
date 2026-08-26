// js/supabase.js
// 1. As chaves (O Cofre)
const SUPABASE_URL = 'https://ttluojmseqmdylzscfit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PoOjjqsJfXF5H1gXngXY5w_HHZ86R0C';

// 2. Criamos a conexão e deixamos ela "pendurada" na janela principal (window)
// Assim, o dashboard.js e o orcamentos.js podem apenas usar "banco.from(...)"
window.banco = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("🟢 Supabase Conectado com Sucesso!");
