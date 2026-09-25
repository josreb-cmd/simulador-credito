import React, { useState, useEffect } from 'react';
import RegrasBdP2026 from './RegrasBdP2026';

// Fonte única de tabelas fiscais (IMT, Imposto do Selo, Benefício Jovem)
const TABELAS_URL = 'https://tabelas.solucoeseficazes.pt/impostos.json';

// Fallback local — espelho de impostos.json v2026.1, usado se o fetch falhar
const TABELAS_FALLBACK = {
  imt: {
    hpp: [
      { ate: 106346, taxa: 0, abater: 0 },
      { ate: 145470, taxa: 0.02, abater: 2126.92 },
      { ate: 198347, taxa: 0.05, abater: 6491.02 },
      { ate: 330539, taxa: 0.07, abater: 10457.96 },
      { ate: 660982, taxa: 0.08, abater: 13763.35 },
      { ate: 1150853, taxa: 0.06, abater: 0, taxa_unica: true },
      { ate: null, taxa: 0.075, abater: 0, taxa_unica: true },
    ],
    secundaria: [
      { ate: 106346, taxa: 0.01, abater: 0 },
      { ate: 145470, taxa: 0.02, abater: 1063.46 },
      { ate: 198347, taxa: 0.05, abater: 5427.56 },
      { ate: 330539, taxa: 0.07, abater: 9394.50 },
      { ate: 660982, taxa: 0.08, abater: 12699.89 },
      { ate: 1150853, taxa: 0.06, abater: 0, taxa_unica: true },
      { ate: null, taxa: 0.075, abater: 0, taxa_unica: true },
    ],
  },
  selo_aquisicao_imovel: { verba: '1.1', taxa: 0.008 },
  selo_credito: {
    geral: {
      verba: '17.1',
      escaloes: [
        { prazo_max_meses: 12, taxa_mensal: 0.0004, verba_detalhe: '17.1.1' },
        { prazo_min_anos: 1, prazo_max_anos: 5, taxa: 0.005, verba_detalhe: '17.1.2' },
        { prazo_min_anos: 5, prazo_max_anos: null, taxa: 0.006, verba_detalhe: '17.1.3' },
      ],
    },
  },
  beneficio_jovem: {
    idade_maxima: 35,
    limite_isencao_total: 330539,
    limite_isencao_parcial: 660982,
  },
};

const isEscaloes = (arr) =>
  Array.isArray(arr) && arr.length > 0 && arr.every(e => typeof e.taxa === 'number' && typeof e.abater === 'number');

// Valida o JSON remoto; secções inválidas ou em falta caem para o fallback
function mergeTabelas(data) {
  const f = TABELAS_FALLBACK;
  if (!data || typeof data !== 'object') return f;
  const bj = data.beneficio_jovem;
  const escaloesCredito = data.selo_credito?.geral?.escaloes;
  const isBeneficioJovemValido =
    bj && typeof bj.limite_isencao_total === 'number' && typeof bj.limite_isencao_parcial === 'number';
  return {
    imt: {
      hpp: isEscaloes(data.imt?.hpp) ? data.imt.hpp : f.imt.hpp,
      secundaria: isEscaloes(data.imt?.secundaria) ? data.imt.secundaria : f.imt.secundaria,
    },
    selo_aquisicao_imovel:
      typeof data.selo_aquisicao_imovel?.taxa === 'number' ? data.selo_aquisicao_imovel : f.selo_aquisicao_imovel,
    selo_credito: Array.isArray(escaloesCredito) ? data.selo_credito : f.selo_credito,
    beneficio_jovem: isBeneficioJovemValido ? { ...f.beneficio_jovem, ...bj } : f.beneficio_jovem,
  };
}

// IMT por escalões: taxa marginal com parcela a abater, ou taxa única nos escalões de topo
function calcPorEscaloes(price, escaloes) {
  const escalao = escaloes.find(e => e.ate === null || price <= e.ate);
  if (!escalao) return 0;
  if (escalao.taxa_unica) return price * escalao.taxa;
  return Math.max(0, price * escalao.taxa - escalao.abater);
}

// Taxa da Verba 17.1.3 (crédito com prazo ≥ 5 anos)
function taxaSeloCredito(tabelas) {
  const escalao = tabelas.selo_credito.geral.escaloes.find(e => e.prazo_min_anos === 5 && typeof e.taxa === 'number');
  return escalao ? escalao.taxa : 0.006;
}

// Estado da taxa de esforço (DSTI): label e classes de cor para badge e barra
const DSTI_EXCELLENT_MAX = 35;
const DSTI_LIMIT = 45;
function getDSTIStatus(dsti) {
  if (dsti <= DSTI_EXCELLENT_MAX) {
    return { label: 'Excelente', color: { badge: 'bg-green-50 text-green-700', bar: 'bg-green-600' } };
  }
  if (dsti <= DSTI_LIMIT) {
    return { label: 'Aceitável', color: { badge: 'bg-amber-50 text-amber-700', bar: 'bg-yellow-400' } };
  }
  return { label: 'Risco Elevado', color: { badge: 'bg-red-50 text-red-700', bar: 'bg-red-600' } };
}

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

  // Tipo de imóvel e Benefício Jovem (DL 48-A/2024)
  const [tipoImovel, setTipoImovel] = useState('hpp'); // 'hpp' ou 'secundaria'
  const [isJovem, setIsJovem] = useState(false);
  const [idadeMutuario, setIdadeMutuario] = useState(30);

  // Tabelas fiscais: começa no fallback, substitui pelo JSON remoto se válido
  const [tabelas, setTabelas] = useState(TABELAS_FALLBACK);

  useEffect(() => {
    const controller = new AbortController();
    fetch(TABELAS_URL, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setTabelas(mergeTabelas(data)))
      .catch(err => {
        if (err.name !== 'AbortError') console.warn('Tabelas fiscais remotas indisponíveis, a usar fallback local:', err);
      });
    return () => controller.abort();
  }, []);

  // Função auxiliar para tratar valores vazios de forma segura
  const safeNum = (val) => (val === '' || isNaN(val) ? 0 : Number(val));

  // 2. Lógica de Cálculo
  const {
    limite_isencao_total: limiteIsencaoTotal,
    limite_isencao_parcial: limiteIsencaoParcial,
    idade_maxima: idadeMaximaJovem,
  } = tabelas.beneficio_jovem;
  const isJovemElegivel = safeNum(idadeMutuario) > 0 && safeNum(idadeMutuario) <= idadeMaximaJovem;

  // Isenção Jovem só se aplica a HPP: 'total', 'parcial' ou null
  const getIsencaoJovem = (price, tipo, jovem) => {
    if (!jovem || tipo !== 'hpp') return null;
    if (price <= limiteIsencaoTotal) return 'total';
    if (price <= limiteIsencaoParcial) return 'parcial';
    return null;
  };

  const calculateIMT = (price, tipo, jovem) => {
    const escaloes = tipo === 'secundaria' ? tabelas.imt.secundaria : tabelas.imt.hpp;
    const isencao = getIsencaoJovem(price, tipo, jovem);
    if (isencao === 'total') return 0;
    if (isencao === 'parcial') {
      return Math.max(0, calcPorEscaloes(price, tabelas.imt.hpp) - calcPorEscaloes(limiteIsencaoTotal, tabelas.imt.hpp));
    }
    return calcPorEscaloes(price, escaloes);
  };

  // Verba 1.1 — sobre o valor de aquisição; isenção Jovem só em HPP
  const calculateStampDutyAcquisition = (price, tipo, jovem) => {
    const taxa = tabelas.selo_aquisicao_imovel.taxa;
    const isencao = getIsencaoJovem(price, tipo, jovem);
    if (isencao === 'total') return 0;
    if (isencao === 'parcial') return (price - limiteIsencaoTotal) * taxa;
    return price * taxa;
  };

  const calculatePMT = (loan, annualRatePct, years) => {
    if (loan <= 0 || annualRatePct <= 0 || years <= 0) return 0;
    const monthlyRate = annualRatePct / 100 / 12;
    const months = years * 12;
    return (loan * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const loanAmount = safeNum(propertyPrice) * (safeNum(ltvPct) / 100);
  const downPayment = safeNum(propertyPrice) - loanAmount;
  const beneficioJovemAtivo = isJovem && isJovemElegivel;
  const isencaoJovem = getIsencaoJovem(safeNum(propertyPrice), tipoImovel, beneficioJovemAtivo);
  const isencaoJovemLabel =
    isencaoJovem === 'total' ? ' (isento — Jovem)' : isencaoJovem === 'parcial' ? ' (isenção parcial — Jovem)' : '';
  const imt = calculateIMT(safeNum(propertyPrice), tipoImovel, beneficioJovemAtivo);
  const stampDutyAcquisition = calculateStampDutyAcquisition(safeNum(propertyPrice), tipoImovel, beneficioJovemAtivo);
  const stampDutyLoan = loanAmount * taxaSeloCredito(tabelas); // Verba 17.1.3 — crédito com prazo ≥ 5 anos (0,6%); nunca isento pelo Benefício Jovem
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
  const dstiBaseStatus = getDSTIStatus(dstiBase);
  const dstiStressStatus = getDSTIStatus(dstiStress);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  const formatPct = (value) => `${value.toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row border border-slate-300">

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

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Imóvel</label>
              <select
                value={tipoImovel}
                onChange={e => setTipoImovel(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              >
                <option value="hpp">HPP</option>
                <option value="secundaria">Hab. Secundária</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Idade do Mutuário</label>
              <input
                type="number"
                value={idadeMutuario}
                onChange={e => setIdadeMutuario(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>

            <div>
              <label className={`flex items-center gap-2 text-sm font-medium ${isJovemElegivel ? '' : 'text-gray-400'}`}>
                <input
                  type="checkbox"
                  checked={beneficioJovemAtivo}
                  disabled={!isJovemElegivel}
                  onChange={e => setIsJovem(e.target.checked)}
                  className="w-4 h-4 bg-gray-700 rounded border border-gray-600"
                />
                Benefício Jovem
              </label>
              {safeNum(idadeMutuario) > idadeMaximaJovem && (
                <p className="text-xs text-yellow-400 mt-1">Só disponível até aos {idadeMaximaJovem} anos.</p>
              )}
              {beneficioJovemAtivo && tipoImovel === 'secundaria' && (
                <p className="text-xs text-yellow-400 mt-1">Não se aplica a Habitação Secundária.</p>
              )}
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
                <div className="flex justify-between"><span>IMT ({tipoImovel === 'secundaria' ? 'Hab. Secundária' : 'HPP'}){isencaoJovemLabel}:</span> <strong>{formatCurrency(imt)}</strong></div>
                <div className="flex justify-between"><span>Imp. Selo (Aquisição 0,8%){isencaoJovemLabel}:</span> <strong>{formatCurrency(stampDutyAcquisition)}</strong></div>
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
          <div className="p-6 rounded-lg border shadow-sm" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8 13 13.7l-4-4L3 16.3"/></svg>
              </span>
              Taxa de Esforço (DSTI)
            </h3>

            {/* Cenário Atual */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Cenário Atual</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${dstiBaseStatus.color.badge}`}>
                  {dstiBaseStatus.label}
                </span>
              </div>
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-2xl font-bold text-gray-900 tabular-nums">
                  {formatPct(dstiBase).replace('.', ',')}
                </span>
                <span className="text-xs text-gray-400">limite 45%</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-white border border-violet-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${dstiBaseStatus.color.bar}`}
                  style={{ width: `${Math.min(dstiBase, 100)}%` }}
                ></div>
                <div className="absolute -top-[3px] -bottom-[3px] w-0.5 bg-violet-300" style={{ left: '45%' }}></div>
              </div>
            </div>

            {rateType === 'variable' && (
              <>
                <div className="h-px bg-violet-200/60 mb-6"></div>

                {/* Cenário de Stress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Cenário de Stress</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${dstiStressStatus.color.badge}`}>
                      {dstiStressStatus.label}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-2xl font-bold text-gray-900 tabular-nums">
                      {formatPct(dstiStress).replace('.', ',')}
                    </span>
                    <span className="text-xs text-gray-400">Limite Regulação: 45%</span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-white border border-violet-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dstiStressStatus.color.bar}`}
                      style={{ width: `${Math.min(dstiStress, 100)}%` }}
                    ></div>
                    <div className="absolute -top-[3px] -bottom-[3px] w-0.5 bg-violet-300" style={{ left: '45%' }}></div>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Regras do Banco de Portugal 2026 */}
          <RegrasBdP2026 />

        </div>
      </div>
    </div>
  );
}
