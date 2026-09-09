'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  Coins, ArrowDownLeft, ArrowUpRight, ShieldCheck, Clock, 
  AlertTriangle, CheckCircle2, TrendingUp, HelpCircle, ArrowRight
} from 'lucide-react';

export default function WalletPage() {
  const { currentUser, t } = useApp();
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recovery, setRecovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wallet?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        setWalletData(data.wallet);
        setTransactions(data.transactions || []);
        setRecovery(data.recovery);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Non-Expiration Seal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Time Credits Never Expire • Guaranteed Protection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Time Credit Wallet 🪙
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your official time and knowledge ledger. 1 Hour of Teaching = 1 Time Credit.
          </p>
        </div>

        <Link
          href="/marketplace"
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>Find Skills to Learn</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* UNIQUE FEATURE: CREDIT RECOVERY RECOMMENDATION (Section 13) */}
      {recovery?.needsRecovery && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-orange-500/15 border-2 border-rose-300 dark:border-rose-900 shadow-md space-y-4">
          <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-extrabold text-base">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
            <span>Credit Recovery Engine Active (Deficit: {Number(currentUser?.balance ?? 0).toFixed(2)} Credits)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Your current balance is negative ({Number(currentUser?.balance ?? 0).toFixed(2)} Credits). TimeBank of India never locks you out; instead, we recommend teaching verified skills to recover your balance:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {recovery.recommendations?.map((rec: any) => (
              <div
                key={rec.skillId}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 uppercase">
                    {rec.category}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{rec.skillName}</h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    Potential Earnings: {rec.potentialCreditGain}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{rec.recoveryGoal}</p>
                </div>
                <Link
                  href="/marketplace"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Teach
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WALLET BALANCE METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Balance</span>
          <div className="my-3">
            <div className={`text-3xl font-black ${Number(currentUser?.balance ?? 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {Number(currentUser?.balance ?? 0) > 0 ? `+${Number(currentUser?.balance ?? 0).toFixed(2)}` : Number(currentUser?.balance ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Time Credits</p>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active & Usable</span>
          </div>
        </div>

        {/* Borrowing Limit */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Borrowing Limit</span>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {Number(walletData?.borrowing_limit ?? -2.0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max negative allowed</p>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Tier: <strong>{Number(currentUser?.borrowingLimit ?? -1.0) <= -3 ? 'Trusted User' : 'Verified User'}</strong>
          </div>
        </div>

        {/* Total Earned */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credits Earned</span>
          <div className="my-3">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              +{Number(walletData?.total_earned ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Through teaching peers</p>
          </div>
          <div className="text-[11px] text-slate-500">
            Equivalent to {Number(walletData?.total_earned ?? 0).toFixed(1)} teaching hours
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credits Invested</span>
          <div className="my-3">
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
              -{Number(walletData?.total_spent ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Invested in personal learning</p>
          </div>
          <div className="text-[11px] text-slate-500">
            Across verified 1-on-1 sessions
          </div>
        </div>
      </div>

      {/* CONTROLLED BORROWING RULES EXPLAINER (Sections 11 & 12) */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-orange-500" /> Controlled Borrowing Policy
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          To ensure new learners are never blocked from education, every user can start learning even with zero balance by borrowing credits:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white block">New User</span>
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">-1.0 Credit Limit</span>
            <p className="text-[11px] text-slate-500 mt-1">Start learning 1 hour immediately.</p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white block">Verified Active User</span>
            <span className="text-orange-600 dark:text-orange-400 font-extrabold">-2.0 Credits Limit</span>
            <p className="text-[11px] text-slate-500 mt-1">Unlocked after first completed session.</p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white block">Trusted Member</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">-3.0 Credits Limit</span>
            <p className="text-[11px] text-slate-500 mt-1">Reputation score &gt; 80 and active teaching.</p>
          </div>
        </div>
      </div>

      {/* TRANSACTION AUDIT LEDGER (Section 15) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Transaction Audit History
            </h3>
            <p className="text-xs text-slate-500">
              Complete, transparent record of all Time Credit transfers, atomic settlements, and verified rewards.
            </p>
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Transaction ID</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Activity & Description</th>
                    <th className="py-3.5 px-4">Counterparty</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {transactions.map((tx) => {
                    const isEarned = tx.teacher_id === currentUser.id || tx.transaction_type === 'LEARNING_REWARD';
                    const counterparty = isEarned ? tx.learner_name : tx.teacher_name;

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {tx.transaction_id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {tx.description}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {tx.transaction_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {counterparty || 'TBI Verification Engine'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black">
                          <span
                            className={
                              isEarned
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {isEarned ? `+${Number(tx?.credit_amount ?? 0).toFixed(2)}` : `-${Number(tx?.credit_amount ?? 0).toFixed(2)}`} Cr
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            No transactions found yet. Complete your first session to earn or spend Time Credits!
          </div>
        )}
      </div>
    </div>
  );
}
