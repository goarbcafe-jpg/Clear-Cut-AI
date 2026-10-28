import React, { useState, useEffect } from 'react';
import {
  Crown,
  Calendar,
  X,
  Zap,
  Clock,
  ShieldCheck,
  Receipt,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { PaymentTransaction, User, UserSubscription } from '../types';

interface SubscriptionDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  entitlement: UserSubscription | null;
  onOpenPricing: () => void;
}

export const SubscriptionDashboardModal: React.FC<SubscriptionDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  entitlement,
  onOpenPricing,
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('auracut_auth_token');
        const res = await fetch('/api/subscription/status', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.transactions) {
            setTransactions(data.transactions);
          }
        }
      } catch (e) {
        console.warn('Failed to load transactions:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const isPremium = entitlement?.isPremium && entitlement?.status === 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-y-auto max-h-[92vh] flex flex-col space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              GURUCUT AI — Membership & Subscription Dashboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your plan, check renewal dates, and view payment receipts
            </p>
          </div>
        </div>

        {/* Current Plan Overview Card */}
        <div className={`p-5 rounded-3xl border ${
          isPremium
            ? 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 border-indigo-300 dark:border-indigo-800 shadow-lg shadow-indigo-600/5'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
        } space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Membership
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isPremium
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : entitlement?.status === 'expired'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                }`}>
                  {isPremium ? 'Active Premium' : entitlement?.status === 'expired' ? 'Expired' : 'Free Trial'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {entitlement?.planName || 'Free Trial'}
              </h2>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPremium ? 'Upgrade / Extend Plan' : 'Upgrade to Unlimited'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Standard Removals
              </span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {isPremium ? 'Unlimited' : `${entitlement?.trialRemaining ?? 3} / 3 Free`}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Days Remaining
              </span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block">
                {isPremium ? `${entitlement?.daysRemaining} Days` : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Start Date
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block truncate">
                {entitlement?.startAt ? new Date(entitlement.startAt).toLocaleDateString() : 'Today'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Expiry Date
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block truncate">
                {isPremium && entitlement?.expiresAt
                  ? new Date(entitlement.expiresAt).toLocaleDateString()
                  : 'Expires on usage'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Receipts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-500" />
              Payment History & Receipts
            </span>
            <span className="text-[11px] text-slate-400">
              {transactions.length} record{transactions.length === 1 ? '' : 's'}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No previous payments found. Start your subscription anytime with UPI or Cards.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {tx.planName}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        Verified
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Order: {tx.gatewayOrderId} • {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      ₹{tx.amountInr}
                    </div>
                    <div className="text-[10px] text-slate-400">{tx.paymentMethod || 'UPI / Card'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Cancellation policy */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            ClearCut / GURUCUT AI: No lifetime plan. Access expires automatically at the end of the purchased period.
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 ml-2"
          >
            Pricing Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
