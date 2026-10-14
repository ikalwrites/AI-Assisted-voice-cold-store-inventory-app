import React, { useState } from 'react';
import { History, ArrowDownRight, ArrowUpRight, AlertOctagon, Mic, Search, Filter } from 'lucide-react';
import { TransactionRecord } from '../types';
import { LanguageMode, TRANSLATIONS } from '../locales/translations';

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
  lang: LanguageMode;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch =
      tx.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (tx.voiceTranscript && tx.voiceTranscript.toLowerCase().includes(search.toLowerCase())) ||
      (tx.customerOrSupplier && tx.customerOrSupplier.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalSalesVal = transactions
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalValueGHS, 0);

  const totalRestockVal = transactions
    .filter((t) => t.type === 'restock')
    .reduce((sum, t) => sum + t.totalValueGHS, 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D3] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-black text-[#5D544F]">
              {lang === 'tw' ? 'Dwadie Nyinaa (Sales)' : 'Total Sales Recorded'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#C2410C]">
              GH₵ {totalSalesVal.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-[#5D544F] mt-1 block font-medium">
            From {transactions.filter((t) => t.type === 'sale').length} voice & manual orders
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D3] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-black text-[#5D544F]">
              {lang === 'tw' ? 'Nneɛma a Aba (Restocks)' : 'Fresh Stock Received'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1E3A1E]/10 text-[#1E3A1E] flex items-center justify-center font-bold">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1E3A1E]">
              GH₵ {totalRestockVal.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-[#5D544F] mt-1 block font-medium">
            From harbour & warehouse deliveries
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D3] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-black text-[#5D544F]">
              {lang === 'tw' ? 'Nkyerɛwee Dodoɔ' : 'Total Transactions'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFD700]/25 text-[#8B7300] flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1E3A1E]">
              {transactions.length}
            </span>
            <span className="text-xs text-[#5D544F] font-semibold">records</span>
          </div>
          <span className="text-[11px] text-[#1E3A1E] mt-1 block font-bold">
            100% reconciled by Yami AI
          </span>
        </div>
      </div>

      {/* Main Table Controls */}
      <div className="bg-white rounded-3xl border border-[#E8E2D3] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E8E2D3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#1E3A1E] flex items-center gap-2">
              <span>{t.transactionsLog}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F8F5EE] text-[#1E3A1E] font-black border border-[#E8E2D3]">
                {filtered.length}
              </span>
            </h3>
            <p className="text-xs text-[#5D544F] mt-0.5">
              {lang === 'tw'
                ? 'Nneɛma a yɛatɔn, nea yɛagye ne nkyerɛwee a voice assistant no ayɛ'
                : 'Complete audit trail generated from voice orders and inventory adjustments'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5D544F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="tx-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="pl-8 pr-3 py-1.5 bg-[#F8F5EE] border border-[#E8E2D3] rounded-xl text-xs text-[#2C241F] placeholder-[#5D544F]/60 focus:outline-none focus:ring-1 focus:ring-[#1E3A1E]"
              />
            </div>

            <select
              id="tx-type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#F8F5EE] border border-[#E8E2D3] rounded-xl px-3 py-1.5 text-xs text-[#2C241F] focus:outline-none focus:ring-1 focus:ring-[#1E3A1E] font-bold"
            >
              <option value="all">All Types</option>
              <option value="sale">Sales Only</option>
              <option value="restock">Restocks Only</option>
              <option value="spoilage">Damaged / Spoilage</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        {filtered.length > 0 ? (
          <div className="divide-y divide-[#E8E2D3]">
            {filtered.map((tx) => {
              const isSale = tx.type === 'sale';
              const isRestock = tx.type === 'restock';
              const isSpoilage = tx.type === 'spoilage';

              return (
                <div key={tx.id} className="p-5 hover:bg-[#F8F5EE]/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Type badge & Details */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                          isSale
                            ? 'bg-[#C2410C]/10 text-[#C2410C] border border-[#C2410C]/30'
                            : isRestock
                            ? 'bg-[#1E3A1E]/10 text-[#1E3A1E] border border-[#1E3A1E]/30'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isSale ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : isRestock ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <AlertOctagon className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-[#1E3A1E]">
                            {tx.itemName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isSale
                                ? 'bg-[#C2410C] text-white'
                                : isRestock
                                ? 'bg-[#1E3A1E] text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {tx.type}
                          </span>
                          {tx.detectedLanguage && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#FFD700]/25 text-[#8B7300] font-black border border-[#FFD700]">
                              {tx.detectedLanguage === 'Twi' ? '🇬🇭 Twi Voice' : '🇬🇧 English Voice'}
                            </span>
                          )}
                        </div>

                        {/* Voice Transcript Quote */}
                        {tx.voiceTranscript && (
                          <p className="text-xs text-[#2C241F] mt-1 flex items-center gap-1.5 bg-[#F8F5EE] px-3 py-1.5 rounded-xl border border-[#E8E2D3] italic">
                            <Mic className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                            <span>"{tx.voiceTranscript}"</span>
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-[#5D544F] mt-1.5">
                          <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(tx.timestamp).toLocaleDateString()}</span>
                          {tx.customerOrSupplier && (
                            <span>• {tx.customerOrSupplier}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantity & GH₵ total */}
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-base font-black text-[#1E3A1E]">
                        {isSale ? '-' : '+'}{Math.abs(tx.quantity)} {tx.unit}
                      </div>
                      <div className="text-sm font-black text-[#C2410C]">
                        GH₵ {tx.totalValueGHS.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-[#5D544F] font-medium">
                        @ GH₵ {tx.unitPrice}/{tx.unit.replace(/s$/, '')}
                      </span>
                    </div>
                  </div>

                  {/* AI Manager Feedback note */}
                  {(tx.aiResponseTwi || tx.aiResponseEn) && (
                    <div className="mt-3 pt-2 border-t border-[#E8E2D3] text-xs text-[#5D544F] flex items-center gap-1.5">
                      <span className="text-[#C2410C] font-bold">Yami:</span>
                      <span className="italic">
                        {lang === 'tw' && tx.aiResponseTwi ? tx.aiResponseTwi : tx.aiResponseEn}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-[#5D544F]">
            <History className="w-10 h-10 mx-auto mb-2 text-[#5D544F]/40" />
            <p className="text-sm font-bold text-[#1E3A1E]">No transactions found</p>
            <p className="text-xs text-[#5D544F] mt-1">Speak into the microphone to log your first voice stock movement.</p>
          </div>
        )}
      </div>
    </div>
  );
};
