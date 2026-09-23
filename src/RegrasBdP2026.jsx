import { useState } from 'react';

// Painel colapsável com o resumo das alterações da Recomendação Macroprudencial n.º 1/2026
// do Banco de Portugal, aplicável a partir de 1 de agosto de 2026.
export default function RegrasBdP2026() {
  const [aberto, setAberto] = useState(false);

  const regras = [
    {
      titulo: 'Taxa de Esforço (DSTI)',
      resumo: '50% → 45%',
      detalhe: 'O regime de exceções foi simplificado e apertado: apenas 10% do montante de crédito concedido por cada banco, em cada semestre, pode originar uma taxa de esforço superior a 45% (antes, a margem era de 15%).',
      icone: 'trend',
    },
    {
      titulo: 'Prazos Máximos',
      resumo: 'Por idade',
      detalhe: 'Elimina-se o critério de maturidade média da carteira de cada banco. Passam a existir dois limites diretos: até 40 anos de prazo para mutuários com 35 anos ou menos, e até 35 anos para quem tem mais de 35 anos.',
      icone: 'clock',
    },
    {
      titulo: 'LTV (Empréstimo / Valor do Imóvel)',
      resumo: 'Sem alteração',
      detalhe: 'Mantêm-se os limites de 90% para aquisição, construção ou obras em habitação própria e permanente, e de 80% para outras finalidades. Termina a possibilidade de imóveis pertencentes aos bancos beneficiarem, em regra, de financiamento até 100%.',
      icone: 'scale',
    },
    {
      titulo: 'Teste de Esforço (Stress Test)',
      resumo: 'Sem alteração',
      detalhe: 'O DSTI de 45% é calculado após simular a prestação com um agravamento da taxa de juro, escalonado por prazo: +0,5 p.p. até 5 anos, +1 p.p. entre 5 e 10 anos, e +1,5 p.p. acima de 10 anos (o caso de quase todos os créditos habitação). Aplica-se apenas a taxa variável, e à fase variável da taxa mista — numa taxa fixa pura não há este agravamento. Os valores do choque de juro não mudaram: estão em vigor desde outubro de 2023.',
      icone: 'alert',
    },
    {
      titulo: 'Âmbito',
      resumo: 'Locação de imóveis excluída',
      detalhe: 'A locação financeira de bens imóveis foi excluída do âmbito da Recomendação. Mantém-se apenas a locação financeira de bens móveis.',
      icone: 'building',
    },
  ];

  const icones = {
    trend: <path d="M3 3v18h18M7 15l4-6 3 3 4-7" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    scale: <><path d="M12 3v18M7 7l-4 8a4 4 0 0 0 8 0zM21 15a4 4 0 0 1-8 0l4-8z" /><path d="M5 21h14" /></>,
    alert: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
    building: <><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M9 21v-6h6v6" /></>,
  };

  return (
    <div className="rounded-lg border border-indigo-100 shadow-sm overflow-hidden mt-6 bg-indigo-50/60">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-indigo-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M9 21v-6h6v6" />
            </svg>
          </span>
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900 block">
              Regras do Banco de Portugal
            </span>
            <span className="text-xs text-indigo-700/80 font-medium">
              Recomendação Macroprudencial n.º 1/2026 · desde 1 ago 2026
            </span>
          </div>
        </div>
        <span className={`w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm transition-transform ${aberto ? 'rotate-180' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {aberto && (
        <div className="bg-white px-4 pb-4 pt-4 space-y-3">
          {regras.map((r, i) => (
            <div key={i} className="rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-[0_2px_10px_-4px_rgba(79,70,229,0.25)] transition-all p-3 flex gap-3 text-sm">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {icones[r.icone]}
                </svg>
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-gray-800">{r.titulo}</span>
                  <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">{r.resumo}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.detalhe}</p>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
            É uma <strong>recomendação</strong>, não lei vinculativa — as instituições devem cumprir ou justificar ao BdP os desvios ("cumprir ou explicar").
          </div>

          <a
            href="https://www.bportugal.pt/sites/default/files/documents/2026-07/Recomendacao_Macroprudencial_n.1-2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-indigo-600 hover:underline"
          >
            Ver Recomendação Macroprudencial n.º 1/2026 (PDF, Banco de Portugal) →
          </a>
        </div>
      )}
    </div>
  );
}
