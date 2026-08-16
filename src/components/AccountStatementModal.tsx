import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar, 
  X, 
  RefreshCw,
  Wallet,
  TrendingUp,
  Search,
  Printer
} from 'lucide-react';
import { User, Deposit, Withdrawal } from '../types';

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
}

export type TransactionType = 'all' | 'deposit' | 'withdrawal';

interface UnifiedTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  addressOrHash?: string;
}

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({
  isOpen,
  onClose,
  user,
  deposits,
  withdrawals
}) => {
  const [filterType, setFilterType] = useState<TransactionType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Combine and sort deposits and withdrawals chronologically
  const unifiedTransactions = useMemo(() => {
    const list: UnifiedTransaction[] = [];

    deposits.forEach(d => {
      list.push({
        id: `dep_${d.id}`,
        type: 'deposit',
        amount: Number(d.amount) || 0,
        currency: d.currency || 'USDT',
        status: d.status,
        createdAt: d.createdAt,
        addressOrHash: d.txHash || 'إيداع رصيد'
      });
    });

    withdrawals.forEach(w => {
      list.push({
        id: `with_${w.id}`,
        type: 'withdrawal',
        amount: Number(w.amount) || 0,
        currency: w.currency || 'USDT (Polygon)',
        status: w.status,
        createdAt: w.createdAt,
        addressOrHash: w.walletAddress || 'سحب أرباح'
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [deposits, withdrawals]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return unifiedTransactions.filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesAmount = item.amount.toString().includes(q);
        const matchesHash = (item.addressOrHash || '').toLowerCase().includes(q);
        if (!matchesId && !matchesAmount && !matchesHash) return false;
      }
      return true;
    });
  }, [unifiedTransactions, filterType, searchTerm]);

  // Financial Totals
  const totalApprovedDeposits = useMemo(() => {
    return deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [deposits]);

  const totalApprovedWithdrawals = useMemo(() => {
    return withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  }, [withdrawals]);

  if (!isOpen) return null;

  // Print or Download Statement as Clean Styled PDF / HTML Report
  const handlePrintStatement = () => {
    setIsExporting(true);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة كشف الحساب.');
      setIsExporting(false);
      return;
    }

    const reportDate = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' });
    const statementNo = `STMT-${Date.now().toString().slice(-8)}`;

    const rowsHtml = filteredList.map((tx, idx) => {
      const typeLabel = tx.type === 'deposit' ? 'إيداع رصيد (Deposit)' : 'سحب أرباح (Withdrawal)';
      const typeColor = tx.type === 'deposit' ? '#059669' : '#dc2626';
      const statusLabel = tx.status === 'approved' ? 'مكتمل بنجاح' : tx.status === 'pending' ? 'قيد المراجعة' : 'مرفوض';
      const statusBg = tx.status === 'approved' ? '#dcfce7' : tx.status === 'pending' ? '#fef3c7' : '#fee2e2';
      const statusColor = tx.status === 'approved' ? '#166534' : tx.status === 'pending' ? '#92400e' : '#991b1b';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 10px 8px; font-weight: bold; color: ${typeColor};">${typeLabel}</td>
          <td style="padding: 10px 8px; font-family: monospace; font-weight: bold; color: #0f172a; direction: ltr; text-align: right;">${tx.amount.toFixed(2)} USDT</td>
          <td style="padding: 10px 8px; font-size: 10px; color: #475569;">${tx.currency}</td>
          <td style="padding: 10px 8px; text-align: center;">
            <span style="background: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 10px;">
              ${statusLabel}
            </span>
          </td>
          <td style="padding: 10px 8px; font-size: 10px; color: #64748b; direction: ltr; text-align: right;">${new Date(tx.createdAt).toLocaleString('ar-EG')}</td>
          <td style="padding: 10px 8px; font-family: monospace; font-size: 9px; color: #94a3b8; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr;">${tx.addressOrHash || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>كشف حساب مالي - OXLO Official Statement</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .title-box h1 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; }
          .title-box p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
          .meta-box { text-align: left; font-size: 11px; color: #334155; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
          .summary-card .label { font-size: 10px; color: #64748b; font-weight: bold; margin-bottom: 4px; }
          .summary-card .val { font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #0f172a; color: #fff; font-size: 11px; font-weight: bold; padding: 10px 8px; text-align: right; }
          .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-box">
            <h1>OXLO DIGITAL PLATFORM</h1>
            <p>كشف الحساب المالي الرسمي والمعاملات المالية</p>
          </div>
          <div class="meta-box" dir="ltr">
            <div><strong>Statement Ref:</strong> ${statementNo}</div>
            <div><strong>Issue Date:</strong> ${reportDate}</div>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 11px; display: flex; justify-content: space-between;">
          <div><strong>اسم العضو:</strong> ${user.username || 'عضو مميز'}</div>
          <div><strong>رقم الهاتف:</strong> <span dir="ltr">${user.phone}</span></div>
          <div><strong>الباقة الحالية:</strong> ${user.vipTier || 'عادية'}</div>
          <div><strong>رمز الدعوة:</strong> ${user.inviteCode}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">الرصيد والأرباح الحالية</div>
            <div class="val" style="color: #2563eb;">${(user.earnings || 0).toFixed(2)} USDT</div>
          </div>
          <div class="summary-card">
            <div class="label">إجمالي الإيداعات المعتمدة</div>
            <div class="val" style="color: #059669;">${totalApprovedDeposits.toFixed(2)} USDT</div>
          </div>
          <div class="summary-card">
            <div class="label">إجمالي السحوبات المستلمة</div>
            <div class="val" style="color: #dc2626;">${totalApprovedWithdrawals.toFixed(2)} USDT</div>
          </div>
          <div class="summary-card">
            <div class="label">عدد العمليات المسجلة</div>
            <div class="val">${filteredList.length} عملية</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 35px;">#</th>
              <th>نوع المعاملة</th>
              <th>المبلغ</th>
              <th>الشبكة / العملة</th>
              <th style="text-align: center;">الحالة</th>
              <th>التاريخ والوقت</th>
              <th>الهاش / العنوان</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#94a3b8;">لا توجد معاملات مسجلة</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          هذا كشف حساب رسمي تم استخراجه إلكترونياً من منصة OXLO الرقمية ولا يتطلب توقيعاً يدوياً.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExporting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] border border-slate-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-blue-400 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">سجل المعاملات وكشف الحساب</h3>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 font-black px-2 py-0.5 rounded-full border border-blue-500/30">
                    رسمي
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  كشف مالي تفصيلي لجميع عمليات الإيداع والسحب الخاصة بك
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Balance Summary Bar */}
          <div className="bg-slate-50 border-b border-slate-200/80 p-4 grid grid-cols-3 gap-2 text-center shrink-0">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[9px] font-bold text-slate-400 block mb-0.5">الرصيد المتاح</span>
              <span className="text-xs sm:text-sm font-black text-blue-600 font-mono">
                {(user.earnings || 0).toFixed(2)} USDT
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[9px] font-bold text-slate-400 block mb-0.5">إجمالي الإيداعات</span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                +{totalApprovedDeposits.toFixed(2)} USDT
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[9px] font-bold text-slate-400 block mb-0.5">إجمالي السحوبات</span>
              <span className="text-xs sm:text-sm font-black text-rose-600 font-mono">
                -{totalApprovedWithdrawals.toFixed(2)} USDT
              </span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
              {[
                { id: 'all', label: `الكل (${unifiedTransactions.length})` },
                { id: 'deposit', label: `📥 الإيداعات (${deposits.length})` },
                { id: 'withdrawal', label: `📤 السحوبات (${withdrawals.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as TransactionType)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Print / Download Button */}
            <button
              type="button"
              onClick={handlePrintStatement}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>تنزيل / طباعة كشف الحساب (PDF)</span>
            </button>
          </div>

          {/* Transactions List */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
            {filteredList.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-100">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-black text-slate-400">لا توجد عمليات تطابق هذا الفلتر حالياً</p>
              </div>
            ) : (
              filteredList.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                return (
                  <div
                    key={tx.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                  >
                    {/* Left: Icon & Description */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isDeposit
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}
                      >
                        {isDeposit ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {isDeposit ? 'إيداع وشحن رصيد' : 'طلب سحب أرباح'}
                          </span>
                          <span
                            className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                              tx.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : tx.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {tx.status === 'approved' ? 'مكتمل' : tx.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                          <span>{new Date(tx.createdAt).toLocaleString('ar-EG')}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px] font-mono" dir="ltr">
                            {tx.addressOrHash}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-left shrink-0">
                      <span
                        className={`text-sm font-black font-mono block ${
                          isDeposit ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isDeposit ? '+' : '-'}{tx.amount.toFixed(2)} USDT
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                        {tx.currency}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="text-[10px] font-bold">
              إجمالي السجلات المعروضة: <strong className="text-slate-900">{filteredList.length}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
