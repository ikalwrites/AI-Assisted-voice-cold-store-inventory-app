import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  AlertOctagon,
  Sliders,
  Search,
  Download,
  Printer,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Mic,
  CheckCircle2,
  Trash2,
  FileEdit,
  ExternalLink,
  Filter,
  RefreshCw,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { TransactionRecord, InventoryItem } from '../types';

interface AllRecordsTableProps {
  transactions: TransactionRecord[];
  inventory: InventoryItem[];
  onRefreshData?: () => void;
  onNavigateToVoice?: () => void;
  onNavigateToManualLog?: () => void;
}

export const AllRecordsTable: React.FC<AllRecordsTableProps> = ({
  transactions,
  inventory,
  onRefreshData,
  onNavigateToVoice,
  onNavigateToManualLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortField, setSortField] = useState<'timestamp' | 'quantity' | 'totalValueGHS' | 'itemName'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<TransactionRecord | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Map itemId to coldRoomZone
  const zoneMap = useMemo(() => {
    const map = new Map<string, string>();
    inventory.forEach((item) => {
      map.set(item.id, item.coldRoomZone);
    });
    return map;
  }, [inventory]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let salesCtns = 0;
    let salesValue = 0;
    let restockCtns = 0;
    let restockValue = 0;
    let spoilageCtns = 0;
    let spoilageLoss = 0;
    let adjustmentsCount = 0;

    transactions.forEach((tx) => {
      const q = Math.abs(tx.quantity);
      if (tx.type === 'sale') {
        salesCtns += q;
        salesValue += tx.totalValueGHS;
      } else if (tx.type === 'restock') {
        restockCtns += q;
        restockValue += tx.totalValueGHS;
      } else if (tx.type === 'spoilage') {
        spoilageCtns += q;
        spoilageLoss += tx.totalValueGHS;
      } else if (tx.type === 'adjustment') {
        adjustmentsCount++;
      }
    });

    return {
      totalRecords: transactions.length,
      salesCtns,
      salesValue,
      restockCtns,
      restockValue,
      spoilageCtns,
      spoilageLoss,
      adjustmentsCount,
    };
  }, [transactions]);

  // Filtering & Sorting
  const filteredAndSortedRecords = useMemo(() => {
    let list = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      list = list.filter((tx) => tx.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((tx) => {
        return (
          tx.itemName.toLowerCase().includes(q) ||
          (tx.customerOrSupplier && tx.customerOrSupplier.toLowerCase().includes(q)) ||
          (tx.voiceTranscript && tx.voiceTranscript.toLowerCase().includes(q)) ||
          (tx.id && tx.id.toLowerCase().includes(q)) ||
          (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'quantity') {
        comparison = Math.abs(a.quantity) - Math.abs(b.quantity);
      } else if (sortField === 'totalValueGHS') {
        comparison = a.totalValueGHS - b.totalValueGHS;
      } else if (sortField === 'itemName') {
        comparison = a.itemName.localeCompare(b.itemName);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [transactions, filterType, searchQuery, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredAndSortedRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return filteredAndSortedRecords;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  // Handle Sort Change
  const handleSort = (field: 'timestamp' | 'quantity' | 'totalValueGHS' | 'itemName') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Date',
      'Time',
      'Transaction Type',
      'Product Name',
      'Chamber/Bay',
      'Quantity',
      'Unit',
      'Unit Price (GHS)',
      'Total Value (GHS)',
      'Customer or Supplier',
      'Payment Method',
      'Entry Mode',
      'Voice Transcript Note'
    ];

    const rows = filteredAndSortedRecords.map((tx) => {
      const dt = new Date(tx.timestamp);
      const dateStr = dt.toISOString().split('T')[0];
      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const zone = zoneMap.get(tx.itemId) || 'Freezer Storage';
      const entryMode = tx.voiceTranscript ? 'Voice AI Agent' : 'Manual Entry';

      return [
        `"${tx.id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${tx.type.toUpperCase()}"`,
        `"${tx.itemName.replace(/"/g, '""')}"`,
        `"${zone}"`,
        tx.quantity,
        `"${tx.unit}"`,
        tx.unitPrice,
        tx.totalValueGHS,
        `"${(tx.customerOrSupplier || '').replace(/"/g, '""')}"`,
        `"${(tx.paymentMethod || 'Cash').replace(/"/g, '""')}"`,
        `"${entryMode}"`,
        `"${(tx.voiceTranscript || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `realstan_records_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & ACTION BANNER */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                All Records & Transactions Ledger
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
                {transactions.length} Total
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tabular audit trail of all cold store sales, incoming restocks, spoilage write-offs, and stock reconciliations.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              title="Refresh ledger records"
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>

          {onNavigateToManualLog && (
            <button
              onClick={onNavigateToManualLog}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>+ Log Manual Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS (Sold, Restocked, Spoilage, Total) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sold */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Total Sold (Sales)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
              {summaryMetrics.salesCtns.toLocaleString()}{' '}
              <span className="text-xs font-bold text-gray-500">ctns</span>
            </div>
            <div className="text-xs font-bold text-emerald-700 mt-1">
              GH₵ {summaryMetrics.salesValue.toLocaleString()} revenue
            </div>
          </div>
        </div>

        {/* Total Restocked */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Total Restocked
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
              {summaryMetrics.restockCtns.toLocaleString()}{' '}
              <span className="text-xs font-bold text-gray-500">ctns</span>
            </div>
            <div className="text-xs font-bold text-blue-700 mt-1">
              GH₵ {summaryMetrics.restockValue.toLocaleString()} intake
            </div>
          </div>
        </div>

        {/* Spoilage & Condemned */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Spoilage / Losses
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-rose-700 leading-none">
              {summaryMetrics.spoilageCtns.toLocaleString()}{' '}
              <span className="text-xs font-bold text-gray-500">ctns</span>
            </div>
            <div className="text-xs font-bold text-rose-600 mt-1">
              GH₵ {summaryMetrics.spoilageLoss.toLocaleString()} lost
            </div>
          </div>
        </div>

        {/* Total Transactions Audit */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Audited Records
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-indigo-900 leading-none">
              {summaryMetrics.totalRecords}{' '}
              <span className="text-xs font-bold text-gray-500">entries</span>
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-1">
              100% Stamped with Date & Time
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS, SEARCH & FILTER TABS */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Records', count: transactions.length },
              {
                id: 'sale',
                label: 'Sold (Sales)',
                count: transactions.filter((t) => t.type === 'sale').length,
                color: 'text-emerald-700',
              },
              {
                id: 'restock',
                label: 'Restocked',
                count: transactions.filter((t) => t.type === 'restock').length,
                color: 'text-blue-700',
              },
              {
                id: 'spoilage',
                label: 'Spoilage',
                count: transactions.filter((t) => t.type === 'spoilage').length,
                color: 'text-rose-700',
              },
              {
                id: 'adjustment',
                label: 'Adjustments',
                count: transactions.filter((t) => t.type === 'adjustment').length,
                color: 'text-amber-700',
              },
            ].map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilterType(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Page size */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="records-table-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search product, customer, note..."
                className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Page Size selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={-1}>All rows</option>
            </select>
          </div>
        </div>

        {/* 4. MAIN TABULAR VIEW */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-black select-none">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date & Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Activity</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('itemName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Product Item</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Chamber / Bay</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Cartons</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('totalValueGHS')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Value (GH₵)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Customer / Supplier / Reference</th>
                <th className="py-3 px-4 text-center">Entry Channel</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((tx, idx) => {
                  const isSale = tx.type === 'sale';
                  const isRestock = tx.type === 'restock';
                  const isSpoilage = tx.type === 'spoilage';
                  const isAdjustment = tx.type === 'adjustment';

                  const itemZone = zoneMap.get(tx.itemId) || 'Freezer Bays';
                  const rowNumber = pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;

                  const dt = new Date(tx.timestamp);
                  const dateFormatted = dt.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const timeFormatted = dt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedRecord(tx)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Row Index */}
                      <td className="py-3 px-4 text-center text-gray-400 font-mono text-[11px]">
                        {rowNumber}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{dateFormatted}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{timeFormatted}</span>
                        </div>
                      </td>

                      {/* Activity Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSale && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Sale</span>
                          </span>
                        )}
                        {isRestock && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowDownRight className="w-3 h-3" />
                            <span>Restocked</span>
                          </span>
                        )}
                        {isSpoilage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertOctagon className="w-3 h-3" />
                            <span>Spoilage</span>
                          </span>
                        )}
                        {isAdjustment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Sliders className="w-3 h-3" />
                            <span>Audit</span>
                          </span>
                        )}
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4 font-bold text-gray-900 max-w-[200px] truncate">
                        <span className="group-hover:text-blue-700 transition-colors">
                          {tx.itemName}
                        </span>
                      </td>

                      {/* Chamber/Bay */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                          {itemZone}
                        </span>
                      </td>

                      {/* Quantity Cartons (Signed) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                        <span
                          className={`font-black text-sm ${
                            isSale || isSpoilage
                              ? 'text-rose-700'
                              : isRestock
                              ? 'text-emerald-700'
                              : 'text-gray-900'
                          }`}
                        >
                          {tx.quantity > 0 && isRestock ? `+${tx.quantity}` : tx.quantity}{' '}
                          <span className="text-[10px] font-normal text-gray-500">{tx.unit}</span>
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 text-right whitespace-nowrap text-gray-600 font-mono">
                        GH₵ {tx.unitPrice.toLocaleString()}
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-black text-gray-900">
                        <span
                          className={
                            isSale
                              ? 'text-emerald-800'
                              : isSpoilage
                              ? 'text-rose-700'
                              : 'text-gray-900'
                          }
                        >
                          GH₵ {tx.totalValueGHS.toLocaleString()}
                        </span>
                      </td>

                      {/* Customer / Supplier / Note */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="truncate font-semibold text-gray-800">
                          {tx.customerOrSupplier || 'Walk-in buyer'}
                        </div>
                        {tx.voiceTranscript && (
                          <div className="text-[10px] text-gray-400 italic truncate mt-0.5">
                            "{tx.voiceTranscript}"
                          </div>
                        )}
                      </td>

                      {/* Entry Channel */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tx.voiceTranscript ? (
                          <span
                            title="Logged via Voice AI Assistant"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200"
                          >
                            <Mic className="w-2.5 h-2.5 text-blue-600" />
                            <span>Voice AI</span>
                          </span>
                        ) : (
                          <span
                            title="Logged by Boss Manual Entry"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold"
                          >
                            <FileEdit className="w-2.5 h-2.5 text-gray-500" />
                            <span>Manual Entry</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-gray-700 text-sm">No records match your filters</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try clearing your search query or selecting "All Records".
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Table Summary Footer */}
            {filteredAndSortedRecords.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold text-gray-900 text-xs">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                    Filtered Total ({filteredAndSortedRecords.length} records):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm">
                    {filteredAndSortedRecords.reduce((acc, t) => acc + Math.abs(t.quantity), 0).toLocaleString()} ctns
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-indigo-950">
                    GH₵ {filteredAndSortedRecords.reduce((acc, t) => acc + t.totalValueGHS, 0).toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-gray-500 text-[11px]">
                    Net Turnover Recorded
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 5. TABLE PAGINATION CONTROLS */}
        {totalPages > 1 && pageSize !== -1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-white">
            <div>
              Showing{' '}
              <span className="font-bold text-gray-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * pageSize, filteredAndSortedRecords.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-gray-900">
                {filteredAndSortedRecords.length}
              </span>{' '}
              entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-bold"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-gray-900 text-white shadow-xs'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. MODAL: DETAILED RECORD AUDIT INSPECTOR */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-slide-down">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    selectedRecord.type === 'sale'
                      ? 'bg-emerald-50 text-emerald-700'
                      : selectedRecord.type === 'restock'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {selectedRecord.type === 'sale' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : selectedRecord.type === 'restock' ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <AlertOctagon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Record Details: {selectedRecord.itemName}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {selectedRecord.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl">
                <div>
                  <span className="text-gray-500 font-medium">Activity Type:</span>
                  <p className="font-bold text-gray-900 uppercase mt-0.5">{selectedRecord.type}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Quantity Moved:</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedRecord.quantity} {selectedRecord.unit}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Unit Price:</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    GH₵ {selectedRecord.unitPrice.toLocaleString()} / {selectedRecord.unit}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Total Value:</span>
                  <p className="font-bold text-indigo-900 mt-0.5 text-sm">
                    GH₵ {selectedRecord.totalValueGHS.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2">
                <div>
                  <span className="text-gray-500 font-medium">Timestamp Stamped:</span>
                  <p className="font-bold text-gray-900 font-mono">
                    {new Date(selectedRecord.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Customer / Supplier / Reference:</span>
                  <p className="font-semibold text-gray-900">
                    {selectedRecord.customerOrSupplier || 'Not specified'}
                  </p>
                </div>
                {selectedRecord.paymentMethod && (
                  <div>
                    <span className="text-gray-500 font-medium">Payment Method:</span>
                    <p className="font-semibold text-gray-900">{selectedRecord.paymentMethod}</p>
                  </div>
                )}
              </div>

              {selectedRecord.voiceTranscript && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold mb-1">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Agent Transcript</span>
                  </div>
                  <p className="italic text-gray-700">"{selectedRecord.voiceTranscript}"</p>
                  {selectedRecord.aiResponseEn && (
                    <p className="mt-2 pt-2 border-t border-blue-200/60 text-blue-900">
                      <strong>AI Reply:</strong> {selectedRecord.aiResponseEn}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
