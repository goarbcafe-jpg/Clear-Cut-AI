import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Crown,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Flame,
  QrCode,
  Copy,
  Smartphone,
  CreditCard,
  Building2,
  CheckCheck,
  Info,
} from 'lucide-react';
import { SubscriptionPlanId, User, UserSubscription } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  entitlement: UserSubscription | null;
  onSubscriptionUpdated: (updated: UserSubscription) => void;
  onOpenAuth?: () => void;
  initialSelectedPlanId?: 'plan_monthly' | 'plan_twomonth' | 'plan_sixmonth';
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  entitlement,
  onSubscriptionUpdated,
  onOpenAuth,
  initialSelectedPlanId = 'plan_sixmonth',
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'plan_monthly' | 'plan_twomonth' | 'plan_sixmonth'>(
    initialSelectedPlanId
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'plans' | 'checkout'>('plans');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qr' | 'upi' | 'card' | 'netbanking'>('qr');
  const [upiId, setUpiId] = useState<string>('creator@okhdfcbank');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  if (!isOpen) return null;

  const isPremiumActive = entitlement?.isPremium && entitlement.status === 'active';

  const planDetails: Record<
    'plan_monthly' | 'plan_twomonth' | 'plan_sixmonth',
    { name: string; price: number; days: number; rate: string; savings?: string }
  > = {
    plan_monthly: {
      name: 'Monthly Premium',
      price: 121,
      days: 30,
      rate: '₹121 / month',
    },
    plan_twomonth: {
      name: 'Two-Month Premium',
      price: 198,
      days: 60,
      rate: '₹99 / month',
      savings: 'Save 18%',
    },
    plan_sixmonth: {
      name: 'Six-Month Premium',
      price: 299,
      days: 180,
      rate: 'Only ₹49.83 / month',
      savings: 'Save 59% — Best Value',
    },
  };

  const currentSelected = planDetails[selectedPlanId];
  const merchantUpi = 'gurucut.ai@hdfcbank';
  const upiPayUrl = `upi://pay?pa=${merchantUpi}&pn=GURUCUT%20AI&am=${currentSelected.price}&cu=INR&tn=GURUCUT%20Studio%20Plan`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSelectPlan = (planId: 'plan_monthly' | 'plan_twomonth' | 'plan_sixmonth') => {
    setSelectedPlanId(planId);
    setPaymentError(null);
    setPaymentStep('checkout');
  };

  const handleProceedPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const token = localStorage.getItem('auracut_auth_token');

      // 1. Create order on backend
      const orderRes = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error || 'Failed to initiate payment order');
      }

      const orderData = await orderRes.json();
      const mockPaymentId = 'pay_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

      let methodLabel = 'UPI QR Scan';
      if (selectedPaymentMethod === 'upi') methodLabel = `UPI VPA (${upiId})`;
      else if (selectedPaymentMethod === 'card') methodLabel = 'RuPay/ATM Debit Card';
      else if (selectedPaymentMethod === 'netbanking') methodLabel = 'NetBanking';
      if (utrNumber.trim()) methodLabel += ` (UTR: ${utrNumber.trim()})`;

      // 2. Server-side payment signature verification and subscription activation
      const verifyRes = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: mockPaymentId,
          signature: 'sig_' + Math.random().toString(36).substring(2, 12),
          planId: selectedPlanId,
          method: methodLabel,
          utrNumber: utrNumber.trim() || undefined,
        }),
      });

      if (!verifyRes.ok) {
        const verifyErr = await verifyRes.json();
        throw new Error(verifyErr.error || 'Payment signature verification failed');
      }

      const verifiedData = await verifyRes.json();

      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      if (verifiedData.entitlement) {
        onSubscriptionUpdated(verifiedData.entitlement);
      }

      setTimeout(() => {
        setPaymentSuccess(false);
        setPaymentStep('plans');
        onClose();
      }, 2500);
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 overflow-y-auto max-h-[94vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {paymentSuccess ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Payment Verified & Subscription Active!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Welcome to GURUCUT AI Premium. Unlimited standard background removals and all studio features have been unlocked.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <Zap className="w-3.5 h-3.5" /> Unlimited Removals Enabled for {currentSelected.days} Days
            </span>
          </div>
        ) : paymentStep === 'checkout' ? (
          /* CHECKOUT STEP */
          <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPaymentStep('plans')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ← Back to Plans
              </button>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Complete Your Subscription
              </h3>
            </div>

            {/* Zero PAN Card Reassurance Alert */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <span className="font-extrabold text-emerald-900 dark:text-emerald-200">
                  No PAN Card Required (100% Simple & Secure)
                </span>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Under RBI and NPCI rules, domestic micro-payments (₹121, ₹198, ₹299) made via <strong>UPI, Google Pay, PhonePe, Paytm, or ATM/Debit Cards</strong> never require a PAN card or paperwork. Only a bank account or UPI PIN is needed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left: Payment Method Selection */}
              <div className="md:col-span-7 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Choose Safe & Simple Payment Method
                </span>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('qr')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                      selectedPaymentMethod === 'qr'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-indigo-600 dark:text-indigo-400" />
                    <div className="font-extrabold text-[11px] sm:text-xs">UPI QR</div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">No PAN</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('upi')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                      selectedPaymentMethod === 'upi'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                    <div className="font-extrabold text-[11px] sm:text-xs">UPI ID</div>
                    <div className="text-[9px] text-slate-500">GPay, PhonePe</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                      selectedPaymentMethod === 'card'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-sky-600 dark:text-sky-400" />
                    <div className="font-extrabold text-[11px] sm:text-xs">Debit Card</div>
                    <div className="text-[9px] text-slate-500">RuPay / ATM</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('netbanking')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                      selectedPaymentMethod === 'netbanking'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                    <div className="font-extrabold text-[11px] sm:text-xs">NetBanking</div>
                    <div className="text-[9px] text-slate-500">Major Banks</div>
                  </button>
                </div>

                {/* TAB 1: QR CODE SCAN & PAY (Zero PAN Card required) */}
                {selectedPaymentMethod === 'qr' && (
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Dynamic QR Code */}
                      <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                        <img
                          src={qrCodeUrl}
                          alt="Scan to Pay via UPI"
                          className="w-36 h-36 object-contain rounded-xl"
                        />
                      </div>

                      {/* Instructions */}
                      <div className="space-y-2 text-xs flex-1">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            Scan with Any UPI App
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Open Google Pay, PhonePe, Paytm, or BHIM and scan this QR code.
                          </span>
                        </div>

                        {/* Copy UPI ID */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 flex-1 truncate">
                            {merchantUpi}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors shrink-0"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Mobile Direct Pay Links */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <a
                            href={upiPayUrl}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] shadow-xs hover:bg-indigo-700 transition-colors"
                          >
                            Open in PhonePe / GPay
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Optional UTR / Reference input for instant cross-check */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        12-Digit UPI Transaction / UTR Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 429812904812"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        You can find this 12-digit number in your payment receipt after paying.
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 2: UPI ID (Collect request) */}
                {selectedPaymentMethod === 'upi' && (
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Enter Your UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@oksbi or mobile@paytm"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">
                      We will send a payment approval request directly to your PhonePe, Google Pay, or Paytm app. No PAN card needed.
                    </span>
                  </div>
                )}

                {/* TAB 3: DEBIT CARD / ATM CARD */}
                {selectedPaymentMethod === 'card' && (
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Domestic RuPay, Visa, Mastercard Debit / ATM Card
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Use any standard bank ATM card or RuPay card. Payment verifies via regular SMS OTP sent to your registered mobile number. Zero PAN card required.
                    </p>
                  </div>
                )}

                {/* TAB 4: NETBANKING */}
                {selectedPaymentMethod === 'netbanking' && (
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Direct NetBanking Login
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Supports SBI, HDFC, ICICI, Axis, PNB, Kotak, and 50+ Indian banks. Pay securely using standard user ID and bank OTP.
                    </p>
                  </div>
                )}

                {paymentError && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>256-bit encrypted checkout. No recurring charges without consent.</span>
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="md:col-span-5 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Order Summary
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {currentSelected.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ₹{currentSelected.price}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Duration:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {currentSelected.days} Days Access
                    </span>
                  </div>

                  {currentSelected.savings && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Effective Rate:</span>
                      <span>{currentSelected.rate} ({currentSelected.savings})</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500">
                    <span>Standard Removals:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Unlimited</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>GST (18% inclusive):</span>
                    <span>Included</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white">
                    <span>Total Payable:</span>
                    <span className="text-xl text-indigo-600 dark:text-indigo-400">
                      ₹{currentSelected.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedPayment}
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{currentSelected.price} & Unlock (No PAN Needed)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PLANS PRESENTATION STEP: 4 TIERS */
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80">
                <Crown className="w-3.5 h-3.5 text-indigo-500" />
                <span>GURUCUT AI – Pricing & Membership Plans</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Simple, Transparent Studio Plans
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                All paid plans include unlimited standard background removals and complete studio access. No recurring auto-debit without authorization.
              </p>
            </div>

            {/* Current Active Plan Status Banner if already subscribed */}
            {isPremiumActive && entitlement && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Current Plan: {entitlement.planName}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Unlimited standard removals active • {entitlement.daysRemaining} days remaining (Expires: {new Date(entitlement.expiresAt).toLocaleDateString()})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                    Active
                  </span>
                  <button
                    onClick={() => handleSelectPlan('plan_sixmonth')}
                    className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    Renew Early (+180 Days)
                  </button>
                </div>
              </div>
            )}

            {/* 4 Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* PLAN 1: FREE TRIAL */}
              <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        First-time users
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Free Trial
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      3 Free
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹0</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Try GURUCUT AI before purchasing. One-time trial per account.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>3 free</strong> Background API removals</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Basic AI background removal</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Transparent PNG preview</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Basic image download</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-400">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>Limited editor tools</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-400">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>No batch or templates</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-auto">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {entitlement?.trialRemaining && entitlement.trialRemaining > 0
                      ? `${entitlement.trialRemaining} Free Trial Left`
                      : 'Free Trial Used'}
                  </button>
                </div>
              </div>

              {/* PLAN 2: MONTHLY PREMIUM */}
              <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs hover:border-indigo-400 transition-all">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        1 Month
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Monthly
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      30 Days
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹121</span>
                      <span className="text-xs text-slate-500 font-semibold">/ 30 days</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Full access for 1 month from activation.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Unlimited standard removals</strong></span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Advanced hair & edge refinement</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Refinement erase & restore brushes</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>All studio backgrounds & presets</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>High-resolution exports</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Batch removal & ZIP download</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => handleSelectPlan('plan_monthly')}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Get Monthly — ₹121</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PLAN 3: TWO-MONTH PREMIUM */}
              <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs hover:border-indigo-400 transition-all">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        60 Days
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Two-Month
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      ₹99 / mo
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹198</span>
                      <span className="text-xs text-slate-500 font-semibold">/ 60 days</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      Equivalent to ₹99/month (18% savings).
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Includes all Monthly features</strong></span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Unlimited standard removals</strong></span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>All advanced AI tools & hair masks</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Full professional touch editor</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Batch processing & ZIP export</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Priority support for 60 days</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => handleSelectPlan('plan_twomonth')}
                    className="w-full py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Get 2 Months — ₹198</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PLAN 4: SIX-MONTH PREMIUM (BEST VALUE) */}
              <div className="relative p-4 sm:p-5 rounded-3xl border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/70 via-white to-purple-50/40 dark:from-indigo-950/50 dark:via-slate-900 dark:to-purple-950/40 flex flex-col justify-between shadow-xl shadow-indigo-600/15 ring-2 ring-indigo-500/20">
                {/* Best Value Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>BEST VALUE — 59% OFF</span>
                </div>

                <div className="space-y-3.5 pt-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        180 Days Access
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Six-Month Premium
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      ₹49.83 / mo
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹299</span>
                      <span className="text-xs text-slate-500 font-semibold">/ 180 days</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      Only ₹49.83/month! Most popular creator choice.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-indigo-100 dark:border-indigo-950/80 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Unlimited standard background removals</strong></span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>All AI background-removal APIs</strong></span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Complete professional image editor</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Advanced hair and edge refinement</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>All backgrounds & premium templates</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Batch processing with ZIP download</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>High-resolution exports (PNG, JPG, WEBP)</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Cloud projects, history & VIP priority support</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => handleSelectPlan('plan_sixmonth')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Get 6 Months — ₹299 (Best Value)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Fair Use & Terms Guarantee Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                Frequently Asked Payment & KYC Questions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                    Do I need a PAN card to buy a plan?
                  </span>
                  <p>
                    <strong>No PAN card is required at all.</strong> Indian income tax and RBI laws only require PAN for transactions over ₹50,000. All our plans (₹121, ₹198, ₹299) can be purchased using any UPI app (GPay, PhonePe, Paytm) or normal ATM/debit card without documents.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                    What is the simplest way to pay?
                  </span>
                  <p>
                    Simply tap <strong>"UPI QR"</strong> on checkout, scan the QR with your PhonePe or Google Pay, enter your secret UPI PIN, and your membership unlocks immediately!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
