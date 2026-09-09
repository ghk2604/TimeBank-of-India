'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  ShieldAlert, Users, Coins, CheckCircle2, XCircle, 
  Clock, AlertTriangle, ArrowRight, TrendingUp, Layers, RefreshCw
} from 'lucide-react';

export default function AdminPortalPage() {
  const { currentUser, refreshUserData } = useApp();
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin');
      const data = await res.json();
      setAdminData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [currentUser?.role]);

  const handleResolveDispute = async (disputeId: string, resolutionAction: 'TRANSFER' | 'REFUND' | 'DISMISS') => {
    try {
      const res = await fetch('/api/disputes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId,
          resolutionAction,
          resolutionNotes: `Admin reviewed session logs and issued: ${resolutionAction}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        loadAdminData();
        refreshUserData();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Restrict access for non-admin users
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Access Restricted
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The Admin Portal is restricted to authorized platform administrators and governance moderators only.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            <span>Return to Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold mb-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Administrator Governance & Compliance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            TimeBank Governance & Analytics 🇮🇳
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor platform health, arbitrate session disputes, audit non-monetary credit flows, and uphold quality standards.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 self-start sm:self-auto"
          title="Refresh metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* PLATFORM METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Users</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {adminData?.stats?.total_users || 5}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {adminData?.stats?.total_teachers} Teachers • {adminData?.stats?.total_learners} Learners
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Sessions</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {adminData?.stats?.completed_sessions || 3}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Out of {adminData?.stats?.total_sessions} scheduled
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credits Circulated</span>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">
            {Number(adminData?.stats?.total_credits_circulated ?? 24.5).toFixed(2)} Cr
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">100% Non-monetary time tokens</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Disputes</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {adminData?.stats?.pending_disputes || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Requires arbitration</span>
        </div>
      </div>

      {/* DISPUTE RESOLUTION TABLE (Section 65) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Pending Disputes Requiring Admin Arbitration
            </h2>
            <p className="text-xs text-slate-500">
              When a dispute is active, credit transfers are locked to protect both parties until decided.
            </p>
          </div>
        </div>

        {adminData?.pendingDisputes?.length > 0 ? (
          <div className="space-y-3">
            {adminData.pendingDisputes.map((d: any) => (
              <div
                key={d.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-rose-300 dark:border-rose-900 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                      Dispute ID: {d.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      Reason: &quot;{d.reason}&quot;
                    </h3>
                  </div>
                  <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                    Locked Amount: {d.credit_amount} Time Credit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px] uppercase">Session Goal Contract:</span>
                    <p className="font-medium mt-0.5">&quot;{d.learning_goal}&quot;</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px] uppercase">Parties:</span>
                    <p className="font-medium mt-0.5">
                      Teacher: <strong>{d.teacher_name}</strong> • Learner: <strong>{d.learner_name}</strong> (Filed by: {d.raised_by_name})
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong>Claim Description:</strong> {d.description || 'No additional notes provided.'}
                </p>

                {/* Admin Arbitrate Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleResolveDispute(d.id, 'REFUND')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold"
                  >
                    Refund Learner (Cancel Transfer)
                  </button>

                  <button
                    onClick={() => handleResolveDispute(d.id, 'TRANSFER')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                  >
                    Release Credits to Teacher
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            No pending disputes. All peer sessions are operating smoothly!
          </div>
        )}
      </div>

      {/* RECENT TRANSACTIONS AUDIT LEDGER */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Platform-Wide Transaction Ledger
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Transaction ID</th>
                  <th className="p-3.5">Teacher</th>
                  <th className="p-3.5">Learner</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Credit Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {adminData?.recentTransactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{tx.transaction_id}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{tx.teacher_name || 'TBI Verification Engine'}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{tx.learner_name || 'N/A'}</td>
                    <td className="p-3.5 text-slate-500">{tx.description}</td>
                    <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                      +{Number(tx?.credit_amount ?? 0).toFixed(2)} Cr
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
