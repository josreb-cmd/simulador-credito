import { useState } from 'react';

// Painel colapsável com o resumo das alterações da Recomendação Macroprudencial n.º 1/2026
// do Banco de Portugal, aplicável a partir de 1 de agosto de 2026.
export default function RegrasBdP2026() {
  const [aberto, setAberto] = useState(false);

  const regras = [
    {
      titulo: 'Taxa de Esforço (DSTI)',
      resumo: 'Limite recomendado desce de 50% para 45%',
      detalhe: 'O regime de exceções foi simplificado e apertado: apenas 10% do montante de crédito concedido por cada banco, em cada semestre, pode originar uma taxa de esforço superior a 45% (antes, a margem era de 15%).',
    },
    {
      titulo: 'Prazos Máximos',
      resumo: 'Novo critério baseado na idade do mutuário',
      detalhe: 'Elimina-se o critério de maturidade média da carteira de cada banco. Passam a existir dois limites diretos: até 40 anos de prazo para mutuários com 35 anos ou menos, e até 35 anos para quem tem mais de 35 anos.',
    },
    {
      titulo: 'LTV (Empréstimo / Valor do Imóvel)',
      resumo: 'Mantêm-se os limites gerais — fim do financiamento a 100% em imóveis de banco',
      detalhe: 'Mantêm-se os limites de 90% para aquisição, construção ou obras em habitação própria e permanente, e de 80% para outras finalidades. Termina a possibilidade de imóveis pertencentes aos bancos beneficiarem, em regra, de financiamento até 100%.',
    },
    {
      titulo: 'Teste de Esforço (Stress Test)',
      resumo: 'Mantém-se inalterado — só o limite de DSTI mudou',
      detalhe: 'O DSTI de 45% é calculado após simular a prestação com um agravamento da taxa de juro, escalonado por prazo: +0,5 p.p. até 5 anos, +1 p.p. entre 5 e 10 anos, e +1,5 p.p. acima de 10 anos (o caso de quase todos os créditos habitação). Aplica-se apenas a taxa variável, e à fase variável da taxa mista — numa taxa fixa pura não há este agravamento. Os valores do choque de juro não mudaram: estão em vigor desde outubro de 2023.',
    },
    {
      titulo: 'Âmbito',
      resumo: 'Locação financeira de imóveis excluída',
      detalhe: 'A locação financeira de bens imóveis foi excluída do âmbito da Recomendação. Mantém-se apenas a locação financeira de bens móveis.',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mt-6">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <span className="text-sm font-semibold text-gray-900 block">
            Regras do Banco de Portugal (2026)
          </span>
          <span className="text-xs text-gray-500">
            Recomendação Macroprudencial n.º 1/2026 · em vigor desde 1 de agosto de 2026
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-3 ${aberto ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {regras.map((r, i) => (
            <div key={i} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-gray-800">{r.titulo}</span>
                <span className="text-xs text-blue-600 font-medium text-right">{r.resumo}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.detalhe}</p>
            </div>
          ))}

          <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
            É uma <strong>recomendação</strong>, não lei vinculativa — as instituições devem cumprir ou justificar ao BdP os desvios ("cumprir ou explicar").
          </div>

          <a
            href="https://www.bportugal.pt/sites/default/files/documents/2026-07/Recomendacao_Macroprudencial_n.1-2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-blue-600 hover:underline"
          >
            Ver Recomendação Macroprudencial n.º 1/2026 (PDF, Banco de Portugal) →
          </a>
        </div>
      )}
    </div>
  );
}
