'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  CreditCard,
  Building2,
  Download,
  MapPin,
  Sparkles,
  ArrowRight,
  QrCode,
  Check,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    price: number;
    start_time?: string;
    city: string;
    address?: string;
    venue_name?: string;
    image_url?: string;
  };
  userName?: string;
  userEmail?: string;
  onPaymentSuccess: (booking: {
    bookingId: string;
    amount: number;
    paymentMethod: string;
    timestamp: string;
  }) => void;
}

type PaymentTab = 'upi' | 'card' | 'netbanking';

const POPULAR_UPI_HANDLES = ['@okhdfcbank', '@okaxis', '@ybl', '@paytm', '@ibl'];

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
  { id: 'axis', name: 'Axis Bank', code: 'UTIB' },
  { id: 'kotak', name: 'Kotak Mahindra', code: 'KKBK' },
];

export function PaymentModal({
  isOpen,
  onClose,
  event,
  userName = 'Event Explorer',
  userEmail = 'attendee@eventradar.local',
  onPaymentSuccess,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');

  // Attendee Contact State (controlled inputs with fallback to prop values)
  const [attendeeNameInput, setAttendeeNameInput] = useState<string | null>(null);
  const [attendeeEmailInput, setAttendeeEmailInput] = useState<string | null>(null);

  const attendeeName =
    attendeeNameInput !== null
      ? attendeeNameInput
      : userName && userName !== 'Event Explorer'
      ? userName
      : '';
  const attendeeEmail =
    attendeeEmailInput !== null
      ? attendeeEmailInput
      : userEmail && userEmail !== 'attendee@eventradar.local'
      ? userEmail
      : '';
  
  // UPI Form State
  const [upiId, setUpiId] = useState('');
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(userName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0].id);

  // Flow status: 'form' | 'processing' | 'success'
  const [status, setStatus] = useState<'form' | 'processing' | 'success'>('form');
  const [processingStep, setProcessingStep] = useState(1);
  const [bookingId, setBookingId] = useState('');

  const handleModalClose = () => {
    setStatus('form');
    setProcessingStep(1);
    setBookingId('');
    setAttendeeNameInput(null);
    setAttendeeEmailInput(null);
    onClose();
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Execute payment flow
  const handlePay = () => {
    // Contact Info Validation
    const effectiveName = attendeeName.trim() || userName;
    const effectiveEmail = attendeeEmail.trim() || userEmail;

    if (!effectiveName) {
      toast.error('Please enter the Attendee Name');
      return;
    }
    if (!effectiveEmail || !effectiveEmail.includes('@') || !effectiveEmail.includes('.')) {
      toast.error('Please enter a valid Attendee Email address');
      return;
    }

    // Payment Method Validation
    if (activeTab === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
        return;
      }
    } else if (activeTab === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        toast.error('Please enter expiry in MM/YY format');
        return;
      }
      if (cardCvv.length < 3) {
        toast.error('Please enter 3-digit CVV');
        return;
      }
    }

    setStatus('processing');
    setProcessingStep(1);

    // Multi-stage realistic processing simulation
    setTimeout(() => {
      setProcessingStep(2);
    }, 800);

    setTimeout(() => {
      setProcessingStep(3);
    }, 1500);

    setTimeout(() => {
      const generatedId = `RADAR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setBookingId(generatedId);
      setStatus('success');

      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f59e0b', '#10b981', '#3b82f6'],
        });
      } catch {}

      onPaymentSuccess({
        bookingId: generatedId,
        amount: event.price,
        paymentMethod: activeTab.toUpperCase(),
        timestamp: new Date().toISOString(),
      });
      toast.success('Payment authorized & ticket secured!');
    }, 2400);
  };

  // Download digital ticket
  const handleDownloadTicket = () => {
    const finalName = attendeeName.trim() || userName;
    const finalEmail = attendeeEmail.trim() || userEmail;

    const ticketSummary = `
========================================
EVENTRADAR OFFICIAL DIGITAL PASS
========================================
Event: ${event.title}
Booking ID: ${bookingId}
Attendee: ${finalName}
Email: ${finalEmail}
Amount Paid: ₹${event.price} (Verified)
Status: CONFIRMED & PAID
Location: ${event.address || ''}, ${event.city}
========================================
Present this digital pass or QR at the gate.
Powered by EventRadar Hyperlocal Discovery
========================================
    `.trim();

    const blob = new Blob([ticketSummary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket_${bookingId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Digital pass saved to downloads!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl apple-glass-card border border-border/80 shadow-2xl">
        {/* Processing State */}
        {status === 'processing' && (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-rose-500/20 border-t-rose-600 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-rose-500 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Securing Your Tickets...
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {processingStep === 1 && 'Connecting to secure bank gateway...'}
                {processingStep === 2 && 'Verifying transaction authorization...'}
                {processingStep === 3 && 'Issuing official EventRadar pass & locking spot...'}
              </p>
            </div>

            <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-700"
                style={{
                  width:
                    processingStep === 1 ? '35%' : processingStep === 2 ? '75%' : '98%',
                }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-emerald-500" />
              <span>256-bit SSL encrypted. Do not refresh or close.</span>
            </p>
          </div>
        )}

        {/* Success / Confirmed Ticket State */}
        {status === 'success' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">
                ✓ Booking Confirmed & Paid
              </Badge>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                You’re Going!
              </h2>
              <p className="text-xs text-muted-foreground">
                Your admission pass for <span className="font-semibold text-foreground">{event.title}</span> is ready.
              </p>
            </div>

            {/* Visual Digital Ticket Pass */}
            <div className="rounded-2xl border-2 border-dashed border-rose-500/30 bg-muted/40 p-5 space-y-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">
                    Official Admission Pass
                  </span>
                  <h4 className="text-base font-extrabold text-foreground leading-tight">
                    {event.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                    <span>{event.address || event.city}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">Booking ID</span>
                  <p className="text-base font-mono font-extrabold text-rose-600 dark:text-rose-400">
                    {bookingId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Attendee</span>
                  <span className="font-semibold text-foreground truncate block">{attendeeName || userName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Amount Paid</span>
                  <span className="font-bold text-emerald-600">₹{event.price} (PAID)</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Gate Entry</span>
                  <span className="font-semibold text-foreground">Standard Pass</span>
                </div>
              </div>

              {/* QR Code Graphic Representation */}
              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white border shadow-xs">
                    <QrCode className="h-10 w-10 text-neutral-900" />
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <p className="font-semibold text-foreground">Scan at Venue Gate</p>
                    <p>Instant verification • {attendeeEmail || userEmail}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTicket}
                  className="rounded-xl text-xs font-semibold gap-1.5 h-9"
                >
                  <Download className="h-3.5 w-3.5 text-rose-500" />
                  <span>Download Pass</span>
                </Button>
              </div>
            </div>

            {/* Done Action */}
            <Button
              onClick={handleModalClose}
              className="w-full h-11 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-[0.98]"
            >
              Done & View Event
            </Button>
          </div>
        )}

        {/* Form State */}
        {status === 'form' && (
          <div>
            <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold tracking-tight">
                      Confirm Ticket & Checkout
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Instant pass confirmation • 100% moneyback on cancellation
                    </DialogDescription>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono font-bold border-rose-500/30 text-rose-600">
                  ₹{event.price}
                </Badge>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-5">
              {/* Attendee Contact Information */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-rose-500" />
                    Ticket Attendee Details
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Pass issued to</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="pay-attendee-name" className="text-[11px] font-medium text-muted-foreground">
                      Attendee Full Name
                    </Label>
                    <Input
                      id="pay-attendee-name"
                      placeholder="e.g. Rahul Sharma"
                      value={attendeeName}
                      onChange={(e) => {
                        setAttendeeNameInput(e.target.value);
                        setCardHolder(e.target.value);
                      }}
                      className="h-9 text-xs rounded-xl apple-glass-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pay-attendee-email" className="text-[11px] font-medium text-muted-foreground">
                      Ticket Delivery Email
                    </Label>
                    <Input
                      id="pay-attendee-email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmailInput(e.target.value)}
                      className="h-9 text-xs rounded-xl apple-glass-input"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2.5">
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <h5 className="font-bold text-foreground line-clamp-1">{event.title}</h5>
                    <p className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      <span>{event.city}</span>
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">₹{event.price}</span>
                </div>

                <div className="border-t border-border/50 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>1x Standard Pass</span>
                    <span>₹{event.price}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 text-[11px] font-medium">
                    <span>Convenience Fee (Community Special)</span>
                    <span>₹0 (FREE)</span>
                  </div>
                  <div className="flex justify-between text-foreground font-bold text-sm pt-1 border-t border-border/50">
                    <span>Total Amount</span>
                    <span className="text-rose-600 dark:text-rose-400">₹{event.price}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div className="space-y-4">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upi')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      activeTab === 'upi'
                        ? 'bg-background shadow-xs text-rose-600'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>UPI (Instant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('card')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      activeTab === 'card'
                        ? 'bg-background shadow-xs text-rose-600'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('netbanking')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      activeTab === 'netbanking'
                        ? 'bg-background shadow-xs text-rose-600'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Netbanking</span>
                  </button>
                </div>

                {/* Tab 1: UPI */}
                {activeTab === 'upi' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label htmlFor="upi-id" className="text-xs font-semibold">
                        Virtual Payment Address / UPI ID
                      </Label>
                      <Input
                        id="upi-id"
                        placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="h-10 text-xs rounded-xl apple-glass-input"
                      />
                    </div>

                    {/* Quick Handle Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-muted-foreground">Quick suffixes:</span>
                      {POPULAR_UPI_HANDLES.map((suffix) => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => {
                            const prefix = upiId.split('@')[0] || 'user';
                            setUpiId(`${prefix}${suffix}`);
                          }}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono border border-border/80 hover:bg-muted text-muted-foreground cursor-pointer active:scale-95"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Compatible with Google Pay, PhonePe, Paytm, BHIM, and all UPI applications.
                    </p>
                  </div>
                )}

                {/* Tab 2: Credit / Debit Card */}
                {activeTab === 'card' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="card-number" className="text-xs font-semibold">
                        Card Number (RuPay, Visa, Mastercard)
                      </Label>
                      <Input
                        id="card-number"
                        placeholder="4532 •••• •••• 8910"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="h-10 text-xs font-mono rounded-xl apple-glass-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="card-expiry" className="text-xs font-semibold">
                          Valid Thru
                        </Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="h-10 text-xs font-mono rounded-xl apple-glass-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="card-cvv" className="text-xs font-semibold">
                          CVV
                        </Label>
                        <Input
                          id="card-cvv"
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="h-10 text-xs font-mono rounded-xl apple-glass-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="card-name" className="text-xs font-semibold">
                        Cardholder Name
                      </Label>
                      <Input
                        id="card-name"
                        placeholder="Name as printed on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="h-10 text-xs rounded-xl apple-glass-input"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Netbanking */}
                {activeTab === 'netbanking' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <Label className="text-xs font-semibold">Select Your Bank</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.id)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                            selectedBank === b.id
                              ? 'border-rose-500 bg-rose-500/10 text-rose-600 shadow-xs'
                              : 'border-border/80 hover:bg-muted text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 opacity-70" />
                            <span>{b.name}</span>
                          </div>
                          {selectedBank === b.id && <Check className="h-4 w-4 text-rose-500" />}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      You will be securely redirected to your bank portal to authorize payment.
                    </p>
                  </div>
                )}
              </div>

              {/* Pay Button */}
              <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
                <Button
                  onClick={handlePay}
                  className="w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Pay ₹{event.price} & Secure Ticket</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>

                <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span>Safe & secure 256-bit encryption. Powered by EventRadar.</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
