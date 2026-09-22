import React, { useState } from 'react';

// Input numérico com formatação de milhares em tempo real (pt-PT: "." como separador de milhares, "," como decimal)
function FormattedNumberInput({ value, onChange, className }) {
  const displayValue =
    value === '' || value === null || isNaN(value)
      ? ''
      : new Intl.NumberFormat('pt-PT').format(value);

  const handleChange = (e) => {
    // mantém apenas dígitos e vírgula decimal (remove separadores de milhares digitados/formatados)
    const raw = e.target.value.replace(/[^\d,]/g, '');
    if (raw === '') {
      onChange('');
      return;
    }
    const normalized = raw.replace(',', '.');
    const num = Number(normalized);
    onChange(isNaN(num) ? '' : num);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      className={className}
    />
  );
}

export default function App() {
  // 1. Estados
  const [propertyPrice, setPropertyPrice] = useState(800000);
  const [ltvPct, setLtvPct] = useState(90);
  const [termYears, setTermYears] = useState(30);

  // Estados para o regime de taxa de juro
  const [rateType, setRateType] = useState('variable'); // 'variable' ou 'fixed'
  const [euriborPct, setEuriborPct] = useState(2.80);
  const [spreadPct, setSpreadPct] = useState(0.75);
  const [fixedRatePct, setFixedRatePct] = useState(3.50);

  const [stressBufferPct, setStressBufferPct] = useState(1.50);
  const [netIncome, setNetIncome] = useState(9000);
  const [otherDebts, setOtherDebts] = useState(300);

  // Campo editável para Custos de Notário/Registo
  const [notaryCosts, setNotaryCosts] = useState(1200);

  // Função auxiliar para tratar valores vazios de forma segura
  const safeNum = (val) => (val === '' || isNaN(val) ? 0 : Number(val));

  // 2. Lógica de Cálculo
  const calculateIMT = (price) => {
    if (price <= 106346) return 0;
    if (price <= 145470) return price * 0.02 - 2126.92;
    if (price <= 198347) return price * 0.05 - 6491.02;
    if (price <= 330539) return price * 0.07 - 10457.96;
    if (price <= 660982) return price * 0.08 - 13763.35;
    if (price <= 1150853) return price * 0.06;
    return price * 0.075;
  };

  const calculatePMT = (loan, annualRatePct, years) => {
    if (loan <= 0 || annualRatePct <= 0 || years <= 0) return 0;
    const monthlyRate = annualRatePct / 100 / 12;
    const months = years * 12;
    return (loan * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const loanAmount = safeNum(propertyPrice) * (safeNum(ltvPct) / 100);
  const downPayment = safeNum(propertyPrice) - loanAmount;
  const imt = calculateIMT(safeNum(propertyPrice));
  const stampDutyAcquisition = safeNum(propertyPrice) * 0.008; // Verba 1.1 — sobre o valor de aquisição
  const stampDutyLoan = loanAmount * 0.006; // Verba 17.1.3 — crédito com prazo ≥ 5 anos (taxa 0,6%)
  const stampDuty = stampDutyAcquisition + stampDutyLoan;
  const currentNotary = safeNum(notaryCosts);
  const totalInitialCash = downPayment + imt + stampDuty + currentNotary;

  // Definição da TAN Base conforme o regime escolhido
  const baseRate = rateType === 'variable' ? (safeNum(euriborPct) + safeNum(spreadPct)) : safeNum(fixedRatePct);
  const stressRate = baseRate + safeNum(stressBufferPct);

  const pmtBase = calculatePMT(loanAmount, baseRate, safeNum(termYears));
  const pmtStress = calculatePMT(loanAmount, stressRate, safeNum(termYears));

  const currentIncome = safeNum(netIncome);
  const currentDebts = safeNum(otherDebts);
  const dstiBase = currentIncome > 0 ? ((pmtBase + currentDebts) / currentIncome) * 100 : 0;
  const dstiStress = currentIncome > 0 ? ((pmtStress + currentDebts) / currentIncome) * 100 : 0;

  const formatCurrency = (value) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  const formatPct = (value) => `${value.toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">

        {/* Painel Esquerdo - Formulário */}
        <div className="w-full md:w-1/3 bg-gray-800 text-white p-6">
          <h2 className="text-xl font-bold mb-6 border-b border-gray-600 pb-2">Parâmetros da Operação</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor do Imóvel (€)</label>
              <FormattedNumberInput
                value={propertyPrice}
                onChange={setPropertyPrice}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">LTV (%)</label>
                <input
                  type="number"
                  value={ltvPct}
                  onChange={e => setLtvPct(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Prazo (Anos)</label>
                <input
                  type="number"
                  value={termYears}
                  onChange={e => setTermYears(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Seleção do Regime de Taxa */}
            <div>
              <label className="block text-sm font-medium mb-1">Regime de Taxa</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRateType('variable')}
                  className={`flex-1 py-1.5 px-3 rounded text-sm font-medium border ${rateType === 'variable' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                >
                  Variável
                </button>
                <button
                  type="button"
                  onClick={() => setRateType('fixed')}
                  className={`flex-1 py-1.5 px-3 rounded text-sm font-medium border ${rateType === 'fixed' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                >
                  Fixa
                </button>
              </div>
            </div>

            {/* Condicional para Taxa Variável ou Fixa */}
            {rateType === 'variable' ? (
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">Euribor (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={euriborPct}
                    onChange={e => setEuriborPct(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">Spread (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={spreadPct}
                    onChange={e => setSpreadPct(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Taxa Fixa (TAN %)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fixedRatePct}
                  onChange={e => setFixedRatePct(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Notário / Registo (€)</label>
              <FormattedNumberInput
                value={notaryCosts}
                onChange={setNotaryCosts}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>

            <hr className="border-gray-600 my-4"/>

            <div>
              <label className="block text-sm font-medium mb-1">Rendimento Mensal Líquido (€)</label>
              <FormattedNumberInput
                value={netIncome}
                onChange={setNetIncome}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Outros Créditos Mensais (€)</label>
              <FormattedNumberInput
                value={otherDebts}
                onChange={setOtherDebts}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* Painel Direito - Resultados */}
        <div className="w-full md:w-2/3 p-6 text-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Análise de Risco e Viabilidade</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

            {/* Cartão de Capitais Próprios */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-4">Capitais Próprios Necessários</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Entrada ({100 - safeNum(ltvPct)}%):</span> <strong>{formatCurrency(downPayment)}</strong></div>
                <div className="flex justify-between"><span>IMT (HPP):</span> <strong>{formatCurrency(imt)}</strong></div>
                <div className="flex justify-between"><span>Imp. Selo (Aquisição 0,8%):</span> <strong>{formatCurrency(stampDutyAcquisition)}</strong></div>
                <div className="flex justify-between"><span>Imp. Selo (Capital 0,6%):</span> <strong>{formatCurrency(stampDutyLoan)}</strong></div>
                <div className="flex justify-between"><span>Notário/Registo:</span> <strong>{formatCurrency(currentNotary)}</strong></div>
                <div className="pt-2 mt-2 border-t border-blue-200 flex justify-between text-base font-bold text-blue-700">
                  <span>Total Inicial:</span> <span>{formatCurrency(totalInitialCash)}</span>
                </div>
              </div>
            </div>

            {/* Cartão de Financiamento */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-semibold text-green-900 mb-4">Condições de Financiamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Empréstimo (LTV {ltvPct}%):</span> <strong>{formatCurrency(loanAmount)}</strong></div>
                <div className="flex justify-between">
                  <span>TAN Base ({rateType === 'fixed' ? 'Fixa' : 'Variável'}):</span> <strong>{formatPct(baseRate)}</strong>
                </div>
                {rateType === 'variable' && (
                  <div className="flex justify-end text-xs text-gray-500 -mt-2">
                    Euribor {formatPct(safeNum(euriborPct))} + Spread {formatPct(safeNum(spreadPct))}
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-green-700 mt-2 pt-2 border-t border-green-200">
                  <span>Prestação Base:</span> <span>{formatCurrency(pmtBase)}/mês</span>
                </div>
                {rateType === 'variable' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Prestação Stress (+{stressBufferPct}%):</span> <span>{formatCurrency(pmtStress)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Taxa de Esforço */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Taxa de Esforço (DSTI)</h3>

            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm">
                <span>Cenário Atual ({formatPct(dstiBase)})</span>
                <span className={dstiBase > 45 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                  {dstiBase <= 35 ? "Excelente" : dstiBase <= 45 ? "Aceitável" : "Risco Elevado"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${dstiBase > 45 ? 'bg-red-600' : dstiBase > 35 ? 'bg-yellow-400' : 'bg-green-600'}`} style={{ width: `${Math.min(dstiBase, 100)}%` }}></div>
              </div>
            </div>

            {rateType === 'variable' && (
              <div>
                <div className="flex justify-between mb-1 text-sm text-gray-600">
                  <span>Cenário de Stress ({formatPct(dstiStress)})</span>
                  <span className={dstiStress > 45 ? "text-red-600 font-bold" : "text-gray-500 font-medium"}>
                    {dstiStress > 45 ? "Acima do Limite (45%)" : "Limite Regulação: 45%"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${dstiStress > 45 ? 'bg-red-600' : dstiStress > 35 ? 'bg-yellow-400' : 'bg-green-600'}`} style={{ width: `${Math.min(dstiStress, 100)}%` }}></div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
