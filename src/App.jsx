import React, { useState } from 'react';

export default function App() {
  const [propertyPrice, setPropertyPrice] = useState(800000);
  const [ltvPct, setLtvPct] = useState(90);
  const [termYears, setTermYears] = useState(30);
  const [euriborPct, setEuriborPct] = useState(2.80);
  const [spreadPct, setSpreadPct] = useState(0.75);
  const [stressBufferPct, setStressBufferPct] = useState(1.50);
  const [netIncome, setNetIncome] = useState(9000);
  const [otherDebts, setOtherDebts] = useState(300);

  const calculateIMT = (price) => {
    if (price <= 101917) return 0;
    if (price <= 139412) return price * 0.02 - 2038.34;
    if (price <= 190086) return price * 0.05 - 6220.70;
    if (price <= 316772) return price * 0.07 - 10022.42;
    if (price <= 633453) return price * 0.08 - 13190.14;
    if (price <= 1102920) return price * 0.06;
    return price * 0.075;
  };

  const calculatePMT = (loan, annualRatePct, years) => {
    if (loan <= 0 || annualRatePct <= 0 || years <= 0) return 0;
    const monthlyRate = annualRatePct / 100 / 12;
    const months = years * 12;
    return (loan * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const loanAmount = propertyPrice * (ltvPct / 100);
  const downPayment = propertyPrice - loanAmount;
  const imt = calculateIMT(propertyPrice);
  const stampDuty = propertyPrice * 0.008 + loanAmount * 0.006;
  const notaryCosts = 1200;
  const totalInitialCash = downPayment + imt + stampDuty + notaryCosts;

  const baseRate = euriborPct + spreadPct;
  const stressRate = baseRate + stressBufferPct;

  const pmtBase = calculatePMT(loanAmount, baseRate, termYears);
  const pmtStress = calculatePMT(loanAmount, stressRate, termYears);

  const dstiBase = netIncome > 0 ? ((pmtBase + otherDebts) / netIncome) * 100 : 0;
  const dstiStress = netIncome > 0 ? ((pmtStress + otherDebts) / netIncome) * 100 : 0;

  const formatCurrency = (value) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  const formatPct = (value) => `${value.toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        
        <div className="w-full md:w-1/3 bg-gray-800 text-white p-6">
          <h2 className="text-xl font-bold mb-6 border-b border-gray-600 pb-2">Parâmetros da Operação</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor do Imóvel (€)</label>
              <input type="number" value={propertyPrice} onChange={e => setPropertyPrice(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white" />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">LTV (%)</label>
                <input type="number" value={ltvPct} onChange={e => setLtvPct(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white" />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Prazo (Anos)</label>
                <input type="number" value={termYears} onChange={e => setTermYears(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Euribor (%)</label>
                <input type="number" step="0.01" value={euriborPct} onChange={e => setEuriborPct(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white" />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Spread (%)</label>
                <input type="number" step="0.01" value={spreadPct} onChange={e => setSpreadPct(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white" />
              </div>
            </div>
            <hr className="border-gray-600 my-4"/>
            <div>
              <label className="block text-sm font-medium mb-1">Rendimento Mensal Líquido (€)</label>
              <input type="number" value={netIncome} onChange={e => setNetIncome(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Outros Créditos Mensais (€)</label>
              <input type="number" value={otherDebts} onChange={e => setOtherDebts(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white" />
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3 p-6 text-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Análise de Risco e Viabilidade</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-4">Capitais Próprios Necessários</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Entrada ({100 - ltvPct}%):</span> <strong>{formatCurrency(downPayment)}</strong></div>
                <div className="flex justify-between"><span>IMT (HPP):</span> <strong>{formatCurrency(imt)}</strong></div>
                <div className="flex justify-between"><span>Imposto Selo:</span> <strong>{formatCurrency(stampDuty)}</strong></div>
                <div className="flex justify-between"><span>Notário/Registo (Est.):</span> <strong>{formatCurrency(notaryCosts)}</strong></div>
                <div className="pt-2 mt-2 border-t border-blue-200 flex justify-between text-base font-bold text-blue-700">
                  <span>Total Inicial:</span> <span>{formatCurrency(totalInitialCash)}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-semibold text-green-900 mb-4">Condições de Financiamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Empréstimo (LTV {ltvPct}%):</span> <strong>{formatCurrency(loanAmount)}</strong></div>
                <div className="flex justify-between"><span>TAN Base:</span> <strong>{formatPct(baseRate)}</strong></div>
                <div className="flex justify-between text-base font-bold text-green-700 mt-2 pt-2 border-t border-green-200">
                  <span>Prestação Base:</span> <span>{formatCurrency(pmtBase)}/mês</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Prestação Stress (+{stressBufferPct}%):</span> <span>{formatCurrency(pmtStress)}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Taxa de Esforço (DSTI)</h3>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm">
                <span>Cenário Atual ({formatPct(dstiBase)})</span>
                <span className={dstiBase > 50 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                  {dstiBase <= 35 ? "Excelente" : dstiBase <= 50 ? "Aceitável" : "Risco Elevado"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${dstiBase > 50 ? 'bg-red-600' : dstiBase > 35 ? 'bg-yellow-400' : 'bg-green-600'}`} style={{ width: `${Math.min(dstiBase, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-sm text-gray-600">
                <span>Cenário de Stress ({formatPct(dstiStress)})</span>
                <span className={dstiStress > 50 ? "text-red-600 font-bold" : "text-yellow-600 font-bold"}>
                  Limite Regulação: 50%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${dstiStress > 50 ? 'bg-red-600' : 'bg-yellow-400'}`} style={{ width: `${Math.min(dstiStress, 100)}%` }}></div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}