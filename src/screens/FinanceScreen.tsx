import React, { useState, useMemo, useRef } from 'react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { Plus, Minus, Hash, Tag, FileText, Calendar, Trash2, ArrowUpRight, ArrowDownRight, Wallet, ArrowLeft, MoreVertical, Download, AlertTriangle, ChevronDown, PieChart as PieChartIcon, Activity, Upload, Search, X, Target, Edit2 } from 'lucide-react';
import { Transaction } from '../types';
import { generateId } from '../utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const expenseCategoriesList = ['Food', 'Transport', 'Bills', 'Investment', 'Health', 'Education', 'Entertainment', 'Pocket Money', 'Savings', 'Other'];
const incomeCategoriesList = ['Salary', 'Freelance', 'Investment', 'Gift', 'Savings', 'Other'];

export const translateCategory = (cat: string, lang: 'id' | 'en') => {
  if (lang === 'en') return cat;
  const map: Record<string, string> = {
    'Food': 'Makan',
    'Transport': 'Transportasi',
    'Bills': 'Tagihan',
    'Investment': 'Investasi',
    'Health': 'Kesehatan',
    'Education': 'Pendidikan',
    'Entertainment': 'Hiburan',
    'Pocket Money': 'Uang Jajan',
    'Salary': 'Gaji',
    'Freelance': 'Sambilan',
    'Gift': 'Hadiah',
    'Savings': 'Tabungan',
    'Other': 'Lainnya'
  };
  return map[cat] || cat;
};

export default function FinanceScreen({ appTheme, onBack }: { appTheme: string; onBack: () => void }) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, clearAllTransactions, lang, savingsTarget, setSavingsTarget, savingsTargetTitle, setSavingsTargetTitle, savingsBalance, setSavingsBalance } = useAppStore();
  const t = useTranslation(lang);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showClearTargetConfirm, setShowClearTargetConfirm] = useState(false);
  const [showSavingsDepositModal, setShowSavingsDepositModal] = useState(false);
  const [showSavingsWithdrawModal, setShowSavingsWithdrawModal] = useState(false);
  const [savingsDepositAmount, setSavingsDepositAmount] = useState('');
  const [savingsWithdrawAmount, setSavingsWithdrawAmount] = useState('');
  const [targetInputAmount, setTargetInputAmount] = useState('');
  const [targetInputTitle, setTargetInputTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Time filtering state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().substring(0, 7);
  });
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [category, setCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [date, setDate] = useState(() => {
    return new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  const [chartType, setChartType] = useState<'income' | 'expense'>('expense');
  const [error, setError] = useState('');

  // Generate available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      months.add(t.date.substring(0, 7)); // YYYY-MM
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);
  
  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const sorted = [...monthlyTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [monthlyTransactions]);
  
  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase();
    return transactions.filter(t => {
      const matchName = (t.description || '').toLowerCase().includes(query);
      const matchCategory = translateCategory(t.category, lang).toLowerCase().includes(query);
      const matchAmount = t.amount.toString().includes(query);
      const matchDate = t.date.includes(query);
      
      return matchName || matchCategory || matchAmount || matchDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, lang]);

  const groupedSearchResults = useMemo(() => {
    if (!searchResults) return null;
    const groups: Record<string, Transaction[]> = {};
    searchResults.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [searchResults]);
  
  const isSearching = searchQuery.trim().length > 0;
  const groupsToRender = isSearching ? groupedSearchResults! : groupedTransactions;
  const sortedDateKeys = Object.keys(groupsToRender).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  
  const displayData = useMemo(() => {
    if (isSearching || showAllTransactions) {
      return { keys: sortedDateKeys, groups: groupsToRender, hasMore: false };
    }
    
    let count = 0;
    const limitedGroups: Record<string, Transaction[]> = {};
    const limitedKeys: string[] = [];
    let hasMore = false;
    
    for (const key of sortedDateKeys) {
      if (count >= 5) {
        hasMore = true;
        break;
      }
      
      const txs = groupsToRender[key];
      const remaining = 5 - count;
      
      if (txs.length > remaining) {
        limitedGroups[key] = txs.slice(0, remaining);
        limitedKeys.push(key);
        count += remaining;
        hasMore = true;
        break;
      } else {
        limitedGroups[key] = txs;
        limitedKeys.push(key);
        count += txs.length;
      }
    }
    
    // Also check if there are keys left we didn't process
    if (!hasMore && count >= 5 && sortedDateKeys.length > limitedKeys.length) {
      hasMore = true;
    }
    
    return { keys: limitedKeys, groups: limitedGroups, hasMore };
  }, [groupsToRender, sortedDateKeys, isSearching, showAllTransactions]);
  
  
    
  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.currency === 'IDR' ? (t.amount / 1000).toString() : t.amount.toString());
    setCategory(t.category);
    
    // Check if it's a custom category
    const list = t.type === 'expense' ? expenseCategoriesList : incomeCategoriesList;
    if (!list.includes(t.category)) {
      setShowCustomCategory(true);
    } else {
      setShowCustomCategory(false);
    }

    setDate(t.date);
    setDescription(t.description || '');
    setCurrency(t.currency || 'IDR');
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) {
      setError(t('emptyAmount') as string);
      return;
    }
    
    let finalAmount = Number(amount);
    if (currency === 'IDR') {
      finalAmount *= 1000;
    }

    if (editingId) {
      updateTransaction(editingId, {
        type,
        amount: finalAmount,
        category: category || (type === 'income' ? 'Salary' : 'Other'),
        date,
        description,
        currency
      });
    } else {
      const newTransaction: Transaction = {
        id: generateId(),
        type,
        amount: finalAmount,
        category: category || (type === 'income' ? 'Salary' : 'Other'),
        date,
        description,
        currency
      };
      addTransaction(newTransaction);
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setType('expense');
    setAmount('');
    setCategory('');
    setDescription('');
    setCurrency('IDR');
    setError('');
  };

  // Calculate totals based on monthly transactions
  const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // Calculate overall all-time balance for savings limit checking and total cash display
  const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const allTimeExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const allTimeBalance = allTimeIncome - allTimeExpense;

  // Calculate category breakdown based on selected chart type
  const chartCategories = useMemo(() => {
    const records = monthlyTransactions.filter(t => t.type === chartType);
    const categories: Record<string, number> = {};
    records.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    const totalAmount = chartType === 'expense' ? totalExpense : totalIncome;
    return Object.entries(categories)
      .map(([name, amount]) => ({ name: translateCategory(name, lang), amount, perc: totalAmount ? (amount / totalAmount) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions, totalExpense, totalIncome, lang, chartType]);

  return (
    <div className={`flex-1 h-full flex flex-col relative overflow-hidden`}>
      <div className={`px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4 border-b z-10 relative flex justify-between items-center border-slate-800`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors text-indigo-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-indigo-400 tracking-tight">
            {t('financeMenu') as string}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="hidden sm:block bg-slate-900 py-2 px-3 rounded-xl border border-slate-800 text-sm font-bold outline-none text-slate-50 shadow-sm focus:border-indigo-500/50 transition-colors"
          />
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              setEditingId(null);
              setType('expense');
              setAmount('');
              setCategory('');
              setShowCustomCategory(false);
              setDescription('');
              setCurrency('IDR');
              const offset = new Date().getTimezoneOffset() * 60000;
              setDate(new Date(new Date().getTime() - offset).toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="w-full max-w-5xl mx-auto">
        <div className="mb-4 sm:hidden">
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-800 text-sm font-bold outline-none text-slate-50 shadow-sm focus:border-indigo-500/50 transition-colors uppercase tracking-wider"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="col-span-2 md:col-span-1 p-3 sm:p-4 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-indigo-400" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{lang === 'id' ? 'Total Uang Kamu' : 'Total Cash'}</span>
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-50 truncate w-full">
              {allTimeBalance < 0 ? '-' : ''}Rp {Math.abs(allTimeBalance).toLocaleString('id-ID')}
            </span>
            <div className="mt-3 pt-3 border-t border-slate-800/50 flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="text-slate-400 font-medium">{lang === 'id' ? 'Tersedia' : 'Available'}</span>
                <span className="text-slate-50 font-bold truncate max-w-[100px] sm:max-w-[120px]">Rp {(allTimeBalance - savingsBalance).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-slate-400 font-medium">{lang === 'id' ? 'Ditabung' : 'Saved'}</span>
                <span className="text-amber-500 font-bold truncate max-w-[100px] sm:max-w-[120px]">Rp {savingsBalance.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          <div 
            role="button"
            onClick={() => {
              setChartType('income');
              document.getElementById('finance-chart')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full p-3 sm:p-4 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex flex-col justify-center text-left hover:-translate-y-1 hover:shadow-lg transition-all hover:border-emerald-500/50 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-2 relative z-10 pointer-events-none">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <ArrowDownRight className="w-3 h-3 text-emerald-500" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{t('income') as string}</span>
            </div>
            <span className="text-sm sm:text-lg lg:text-xl font-black tracking-tight text-emerald-500 truncate w-full relative z-10 pointer-events-none">
              Rp {totalIncome.toLocaleString('id-ID')}
            </span>
          </div>
          <div 
            role="button"
            onClick={() => {
              setChartType('expense');
              document.getElementById('finance-chart')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full p-3 sm:p-4 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm flex flex-col justify-center text-left hover:-translate-y-1 hover:shadow-lg transition-all hover:border-rose-500/50 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-2 relative z-10 pointer-events-none">
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                <ArrowUpRight className="w-3 h-3 text-rose-500" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{t('expense') as string}</span>
            </div>
            <span className="text-sm sm:text-lg lg:text-xl font-black tracking-tight text-rose-500 truncate w-full relative z-10 pointer-events-none">
              Rp {totalExpense.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className={`text-base font-bold text-slate-50 shrink-0`}>{isSearching ? (t('searchResults') as string) : (t('recentTransactions') as string)}</h3>
              
              <div className="relative w-full sm:flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder') as string || 'Search transactions...'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-8 text-sm outline-none text-slate-50 focus:border-indigo-500/50 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {displayData.keys.length === 0 ? (
               <div className={`flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed rounded-3xl border-slate-800`}>
                  <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                     {isSearching ? <Search className="w-8 h-8 opacity-50" /> : <Wallet className="w-8 h-8 opacity-50" />}
                  </div>
                  <h3 className={`text-base font-bold mb-2 text-slate-50`}>{isSearching ? (lang === 'en' ? 'No results found' : 'Tidak ditemukan') : (t('noTransactions') as string)}</h3>
               </div>
            ) : (
              <div className="space-y-6">
                {displayData.keys.map(dateKey => {
                  const d = new Date(dateKey);
                  // format display string nice: e.g. "Today", "Yesterday", or "12 Apr 2024"
                  const now = new Date();
                  let dateLabel = d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                  if (d.toDateString() === now.toDateString()) {
                    dateLabel = t('today') || 'Today';
                  } else {
                    const yesterday = new Date(now);
                    yesterday.setDate(now.getDate() - 1);
                    if (d.toDateString() === yesterday.toDateString()) {
                      dateLabel = t('yesterday') || 'Yesterday';
                    }
                  }

                  return (
                    <div key={dateKey} className="space-y-3">
                      <h4 className={`text-xs font-bold ml-2 mb-1 text-slate-400 uppercase tracking-wider`}>{dateLabel}</h4>
                      {displayData.groups[dateKey].map(t => (
                        <div key={t.id} className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg bg-slate-900 border-slate-800 shadow-sm hover:shadow-black/50 gap-2`}>
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500 shadow-inner shadow-emerald-500/20' : 'bg-rose-500/10 text-rose-500 shadow-inner shadow-rose-500/20'}`}>
                              {t.type === 'income' ? <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`font-bold text-sm sm:text-base text-slate-50 leading-tight truncate`}>{translateCategory(t.category, lang)}</h4>
                              {t.description && <p className={`text-[11px] sm:text-xs mt-1 text-slate-400 truncate`}>{t.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <div className="text-right">
                              <span className={`font-black text-sm sm:text-base block truncate ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-50'}`}>
                                {t.type === 'income' ? '+' : '-'} {t.currency === 'USD' ? '$' : 'Rp'} {t.amount.toLocaleString(t.currency === 'USD' ? 'en-US' : 'id-ID')}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <button 
                                onClick={() => handleEditClick(t)}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(t.id)}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                
                {displayData.hasMore && (
                  <button 
                    onClick={() => setShowAllTransactions(true)}
                    className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold border-2 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-700 transition-colors"
                  >
                    {t('seeMore') as string}
                  </button>
                )}
                {!displayData.hasMore && showAllTransactions && !isSearching && displayData.keys.length > 0 && (
                  <button 
                    onClick={() => setShowAllTransactions(false)}
                    className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold border-2 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-700 transition-colors"
                  >
                    {t('seeLess') as string}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Savings Goal Card */}
            <div className="p-4 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm transition-all hover:bg-slate-800/80">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                     <Target className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-50 truncate">
                      {savingsTargetTitle || (lang === 'id' ? 'Target Tabungan' : 'Savings Goal')}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {savingsTarget ? (lang === 'id' ? `Target: Rp ${savingsTarget.toLocaleString('id-ID')}` : `Goal: Rp ${savingsTarget.toLocaleString('id-ID')}`) : (lang === 'id' ? 'Belum ada target' : 'No target set')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {savingsTarget ? (
                    <>
                      <button 
                        onClick={() => {
                          setSavingsDepositAmount('');
                          setShowSavingsDepositModal(true);
                        }}
                        className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                        title={lang === 'id' ? 'Tambah Tabungan' : 'Add to Savings'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSavingsWithdrawAmount('');
                          setShowSavingsWithdrawModal(true);
                        }}
                        className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-colors"
                        title={lang === 'id' ? 'Tarik Tabungan' : 'Withdraw from Savings'}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setTargetInputAmount(savingsTarget ? savingsTarget.toString() : '');
                          setTargetInputTitle(savingsTargetTitle || '');
                          setShowTargetModal(true);
                        }}
                        className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-indigo-400 transition-colors"
                        title={lang === 'id' ? 'Edit Target' : 'Edit Goal'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowClearTargetConfirm(true)}
                        className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-rose-500 transition-colors"
                        title={lang === 'id' ? 'Hapus Target' : 'Delete Goal'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              
              {savingsTarget ? (
                <div className="space-y-3 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xl font-black tracking-tight text-slate-50">
                      Rp {Math.max(0, savingsBalance).toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {Math.min(100, Math.max(0, (savingsBalance / savingsTarget) * 100)).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden relative border border-slate-800">
                    <div 
                      className={`h-full absolute left-0 top-0 transition-all duration-1000 ${savingsBalance >= savingsTarget ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, (savingsBalance / savingsTarget) * 100))}%` }}
                    />
                  </div>
                  {savingsBalance >= savingsTarget && (
                    <p className="text-xs font-bold text-amber-500 text-center animate-pulse pt-2">
                      {lang === 'id' ? 'Selamat! Target tabungan tercapai 🎉' : 'Congratulations! Savings target reached 🎉'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl mt-4">
                  <p className="text-[11px] font-semibold text-slate-400 mb-3 text-balance">
                    {lang === 'id' ? 'Buat target menabung untuk impianmu bulan ini.' : 'Set a savings goal for your dream this month.'}
                  </p>
                  <button 
                    onClick={() => {
                      setTargetInputAmount('');
                      setTargetInputTitle('');
                      setShowTargetModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                  >
                    <Target className="w-3.5 h-3.5" />
                    {lang === 'id' ? '+ Buat Target' : '+ Create Goal'}
                  </button>
                </div>
              )}
            </div>

            <div id="finance-chart" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-bold text-slate-50 flex items-center gap-2`}>
                  <PieChartIcon className="w-5 h-5 text-indigo-500" />
                  {t('categoryBreakdown') as string}
                </h3>
                <div className="flex bg-slate-800 rounded-lg p-0.5">
                  <button 
                    onClick={() => setChartType('expense')}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors ${chartType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {t('expense') as string}
                  </button>
                  <button 
                    onClick={() => setChartType('income')}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors ${chartType === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {t('income') as string}
                  </button>
                </div>
              </div>
              <div className={`p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm`}>
                {chartCategories.length === 0 ? (
                  <div className={`text-center py-6 text-slate-400`}>
                    <p className="font-medium text-sm">{t('noCategoryData') as string}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-full h-40 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="amount"
                          >
                            {chartCategories.map((entry, index) => {
                               // Generate some colors based on index
                               const colors = chartType === 'income' 
                                 ? ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'] 
                                 : ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6'];
                               return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => {
                              const perc = props.payload.perc.toFixed(1);
                              return [`Rp ${value.toLocaleString('id-ID')} (${perc}%)`, name];
                            }}
                            contentStyle={{ 
                              backgroundColor: '#0f172a',
                              borderColor: '#1e293b',
                              borderRadius: '0.75rem',
                              color: '#f8fafc'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-3">
                      {chartCategories.map((c, i) => {
                        const colors = chartType === 'income' 
                                 ? ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'] 
                                 : ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6'];
                        return (
                          <div key={c.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
                              <span className="text-slate-50">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-slate-400`}>Rp {c.amount.toLocaleString('id-ID')}</span>
                              <span className="text-xs text-slate-400 w-10 text-right">{c.perc.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>



          </div>
        </div>
        </div>
      </div>

      {showAddModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
           
           <div className={`relative w-full max-w-sm p-4 rounded-2xl border shadow-2xl animate-in fade-in zoom-in duration-200 bg-slate-900 border-slate-800`}>
              <h3 className={`text-base font-bold mb-4 text-slate-50`}>{editingId ? (t('editTransaction') as string) : (t('addTransaction') as string)}</h3>
              
              <div className="space-y-3 mb-5">
                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`}>{t('transactionType') as string}</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => { setType('expense'); setCategory(''); }}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 border-2 transition-colors ${type === 'expense' ? 'border-rose-500 bg-rose-500/10 text-rose-500' : `border-transparent bg-slate-800 text-slate-400`}`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> {t('expense') as string}
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setType('income'); setCategory(''); }}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 border-2 transition-colors ${type === 'income' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : `border-transparent bg-slate-800 text-slate-400`}`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" /> {t('income') as string}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`} htmlFor="txAmountInput">{t('amount') as string}</label>
                  <label htmlFor="txAmountInput" className={`flex items-center px-3 py-2.5 rounded-xl border ${'border-slate-800'} focus-within:border-indigo-500/50 cursor-text`}>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value as 'IDR' | 'USD')}
                      className="bg-transparent font-bold text-slate-400 outline-none mr-2 appearance-none cursor-pointer text-sm"
                    >
                      <option value="IDR">Rp</option>
                      <option value="USD">$</option>
                    </select>
                    <div className="flex-1 flex items-center pr-3 cursor-text">
                      <input 
                        id="txAmountInput"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none text-slate-50 font-semibold flex-1 cursor-text"
                        placeholder="0"
                      />
                      {currency === 'IDR' && <span className="text-sm font-semibold text-slate-400 ml-0.5 shrink-0">.000</span>}
                    </div>
                  </label>
                  {error && <p className="text-rose-500 text-[10px] mt-1">{error}</p>}
                </div>

                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`}>{t('category') as string}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(type === 'expense' ? expenseCategoriesList : incomeCategoriesList).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setShowCustomCategory(false);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition-all border-2 ${category === cat && !showCustomCategory ? (type === 'income' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500' : 'bg-rose-500/10 text-rose-500 border-rose-500') : `border-transparent bg-slate-800 text-slate-400 hover:bg-slate-700`}`}
                      >
                        {translateCategory(cat, lang)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCategory(true);
                        setCategory('');
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-all border-2 flex items-center justify-center ${showCustomCategory ? (type === 'income' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500' : 'bg-rose-500/10 text-rose-500 border-rose-500') : `border-transparent bg-slate-800 text-slate-400 hover:bg-slate-700`}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {showCustomCategory && (
                    <div className="mt-2 text-left">
                      <input 
                        type="text" 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder={t('customCategoryPlaceholder') as string || 'Kategori Kustom...'}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-colors border-slate-800 bg-slate-950 text-slate-50 focus:border-indigo-500/50`}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`}>{t('date') as string}</label>
                    <div className={`flex items-center px-3 py-2.5 rounded-xl border ${'border-slate-800'} focus-within:border-indigo-500/50`}>
                      <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold outline-none text-current"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`}>{t('description') as string}</label>
                    <div className={`flex px-3 py-2.5 rounded-xl border ${'border-slate-800'} focus-within:border-indigo-500/50`}>
                      <FileText className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0 mt-0.5" />
                      <input 
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-transparent text-xs outline-none text-current"
                        placeholder="..."
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex gap-2.5 mt-4">
                 <button 
                  onClick={() => setShowAddModal(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors ${'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                   {t('cancel') as string}
                 </button>
                 <button 
                  onClick={handleSave}
                  className="flex-[2] py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-600/20"
                 >
                   {t('saveTransaction') as string}
                 </button>
              </div>

           </div>
        </div>
      )}

      {showClearTargetConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowClearTargetConfirm(false)}></div>
           
           <div className={`relative w-full max-w-sm p-4 md:p-4 rounded-3xl border shadow-2xl animate-in fade-in zoom-in duration-200 bg-slate-900 border-slate-800`}>
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 mx-auto">
                 <AlertTriangle size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-center mb-2 text-slate-50">
                {lang === 'id' ? 'Hapus Target?' : 'Delete Target?'}
              </h3>
              
              <p className="text-slate-400 text-sm font-medium text-center text-balance">
                {lang === 'id' ? 'Apakah kamu yakin ingin menghapus target tabungan ini? Saldo tabungan yang tersimpan akan dikembalikan ke dompet utama.' : 'Are you sure you want to delete this savings goal? The saved balance will be returned to your main wallet.'}
              </p>

              <div className="flex gap-3 mt-4">
                 <button 
                  onClick={() => setShowClearTargetConfirm(false)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors bg-slate-800 text-slate-400 hover:bg-slate-700`}
                 >
                   {t('cancel') as string}
                 </button>
                 <button 
                  onClick={() => {
                    setSavingsTarget(null);
                    setSavingsTargetTitle('');
                    setSavingsBalance(0);
                    setShowClearTargetConfirm(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                 >
                   {lang === 'id' ? 'Hapus Target' : 'Delete Target'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showTargetModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowTargetModal(false)}></div>
           
           <div className={`relative w-full max-w-sm p-4 rounded-2xl border shadow-2xl animate-in fade-in zoom-in duration-200 bg-slate-900 border-slate-800`}>
              <h3 className={`text-base font-bold mb-4 text-slate-50 flex items-center gap-2`}>
                <Target className="w-5 h-5 text-amber-500" />
                {t('setSavingsTarget') as string}
              </h3>
              
              <div className="space-y-4 mb-5">
                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`}>{lang === 'id' ? 'Nama Target (Opsional)' : 'Target Name (Optional)'}</label>
                  <div className={`flex items-center px-3 py-2.5 rounded-xl border border-slate-800 focus-within:border-indigo-500/50`}>
                    <input 
                      type="text"
                      value={targetInputTitle}
                      onChange={e => setTargetInputTitle(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-50 font-semibold"
                      placeholder={lang === 'id' ? 'Contoh: Beli Laptop' : 'e.g., Buy a Laptop'}
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`} htmlFor="txTargetAmount">{t('targetAmount') as string}</label>
                  <label htmlFor="txTargetAmount" className={`flex items-center px-3 py-2.5 rounded-xl border border-slate-800 focus-within:border-indigo-500/50 cursor-text`}>
                    <span className="font-bold text-slate-400 mr-2 text-sm">Rp</span>
                    <input 
                      id="txTargetAmount"
                      type="number"
                      value={targetInputAmount}
                      onChange={e => setTargetInputAmount(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-50 font-semibold cursor-text"
                      placeholder="0"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowTargetModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-colors bg-slate-800 text-slate-400 hover:bg-slate-700`}
                >
                  {t('cancel') as string}
                </button>
                <button 
                  onClick={() => {
                    const val = Number(targetInputAmount);
                    if (!isNaN(val) && val > 0) {
                      setSavingsTarget(val);
                      setSavingsTargetTitle(targetInputTitle);
                    } else {
                      setSavingsTarget(null);
                      setSavingsTargetTitle('');
                    }
                    setShowTargetModal(false);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-colors bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20`}
                >
                  {lang === 'id' ? 'Simpan' : 'Save'}
                </button>
              </div>
           </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)}></div>
           
           <div className={`relative w-full max-w-sm p-4 md:p-4 rounded-3xl border shadow-2xl animate-in fade-in zoom-in duration-200 bg-slate-900 border-slate-800`}>
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 text-center text-slate-50`}>{t('clearTransactions') as string}</h3>
              <p className={`text-center text-sm mb-6 text-slate-400`}>{t('confirmClearTransactions') as string}</p>
              
              <div className="flex gap-3 mt-4">
                 <button 
                  onClick={() => setShowClearConfirm(false)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors ${'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                   {t('cancel') as string}
                 </button>
                 <button 
                  onClick={() => {
                    clearAllTransactions();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                 >
                   {t('clearTransactions') as string}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}></div>
           <div className={`relative w-full max-w-sm p-4 md:p-4 rounded-3xl border shadow-2xl animate-in fade-in zoom-in duration-200 bg-slate-900 border-slate-800`}>
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 text-center text-slate-50`}>{t('deleteTransaction') as string}</h3>
              <p className={`text-center text-sm mb-6 text-slate-400`}>{t('confirmDeleteTransaction') as string}</p>
              <div className="flex gap-3 mt-4">
                 <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors ${'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                   {t('cancel') as string}
                 </button>
                 <button 
                  onClick={() => {
                    deleteTransaction(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                 >
                   {t('deleteTransaction') as string}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showSavingsDepositModal && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowSavingsDepositModal(false)}></div>
           
           <div className={`relative w-full max-w-sm p-4 rounded-2xl border shadow-2xl animate-in fade-in zoom-in duration-200 bg-slate-900 border-slate-800`}>
              <h3 className={`text-base font-bold mb-4 text-slate-50 flex items-center gap-2`}>
                <Target className="w-5 h-5 text-emerald-500" />
                {lang === 'id' ? 'Tambah ke Tabungan' : 'Add to Savings'}
              </h3>
              
              <div className="space-y-4 mb-5">
                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`} htmlFor="depInput">{lang === 'id' ? 'Jumlah (Rp)' : 'Amount (Rp)'}</label>
                  <label htmlFor="depInput" className={`flex items-center px-3 py-2.5 rounded-xl border border-slate-800 focus-within:border-emerald-500/50 cursor-text`}>
                    <span className="font-bold text-slate-400 mr-2 text-sm">Rp</span>
                    <input 
                      id="depInput"
                      type="number"
                      value={savingsDepositAmount}
                      onChange={e => setSavingsDepositAmount(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-50 font-semibold cursor-text"
                      placeholder="0"
                      autoFocus
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSavingsDepositModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-colors bg-slate-800 text-slate-400 hover:bg-slate-700`}
                >
                  {t('cancel') as string}
                </button>
                <button 
                  onClick={() => {
                    const val = Number(savingsDepositAmount);
                    if (!isNaN(val) && val > 0) {
                      addTransaction({
                        id: generateId(),
                        type: 'income',
                        amount: val,
                        category: 'Savings',
                        date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
                        description: lang === 'id' ? 'Setoran Tabungan' : 'Savings Deposit',
                        currency: 'IDR'
                      });
                    }
                    setShowSavingsDepositModal(false);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-colors bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20`}
                >
                  {lang === 'id' ? 'Tambah' : 'Add'}
                </button>
              </div>
           </div>
        </div>
      )}

      {showSavingsWithdrawModal && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowSavingsWithdrawModal(false)}></div>
           
           <div className={`relative w-full max-w-sm p-4 rounded-2xl border shadow-2xl animate-in fade-in zoom-in duration-200 bg-slate-900 border-slate-800`}>
              <h3 className={`text-base font-bold mb-4 text-slate-50 flex items-center gap-2`}>
                <Minus className="w-5 h-5 text-rose-500" />
                {lang === 'id' ? 'Tarik dari Tabungan' : 'Withdraw from Savings'}
              </h3>
              
              <div className="space-y-4 mb-5">
                <div>
                  <label className={`block text-[10px] font-bold mb-1.5 uppercase tracking-wider text-slate-400`} htmlFor="wdInput">{lang === 'id' ? 'Jumlah (Rp)' : 'Amount (Rp)'}</label>
                  <label htmlFor="wdInput" className={`flex items-center px-3 py-2.5 rounded-xl border border-slate-800 focus-within:border-rose-500/50 cursor-text`}>
                    <span className="font-bold text-slate-400 mr-2 text-sm">Rp</span>
                    <input 
                      id="wdInput"
                      type="number"
                      value={savingsWithdrawAmount}
                      onChange={e => setSavingsWithdrawAmount(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-50 font-semibold cursor-text"
                      placeholder="0"
                      autoFocus
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSavingsWithdrawModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-colors bg-slate-800 text-slate-400 hover:bg-slate-700`}
                >
                  {t('cancel') as string}
                </button>
                <button 
                  onClick={() => {
                    const val = Number(savingsWithdrawAmount);
                    if (!isNaN(val) && val > 0) {
                      addTransaction({
                        id: generateId(),
                        type: 'expense',
                        amount: val,
                        category: 'Savings',
                        date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
                        description: lang === 'id' ? 'Penarikan Tabungan' : 'Savings Withdrawal',
                        currency: 'IDR'
                      });
                    }
                    setShowSavingsWithdrawModal(false);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-colors bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20`}
                >
                  {lang === 'id' ? 'Tarik' : 'Withdraw'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
