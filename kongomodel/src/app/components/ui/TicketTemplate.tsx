import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Bus, MapPin, User, CreditCard, CheckCircle2, QrCode, Phone, Calendar as CalendarIcon, Clock, ChevronRight, ShieldCheck } from '../../../lib/icons';

interface ExtraService {
  title: string;
  quantity: number;
  unit_price: number;
  category?: string;
  min_weight?: number;
}

interface TicketTemplateProps {
  bookingCode: string;
  passengerName: string;
  passengerPhone: string;
  tripOrigin: string;
  tripDestination: string;
  departureTime: string;
  seats: string[];
  extras: string[] | ExtraService[];
  totalAmount: number;
  currency: string;
  agencyName?: string;
  paymentMethod?: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement Bancaire',
};

export function TicketTemplate({
  bookingCode,
  passengerName,
  passengerPhone,
  tripOrigin,
  tripDestination,
  departureTime,
  seats,
  extras,
  totalAmount,
  currency,
  agencyName,
  paymentMethod,
}: TicketTemplateProps) {
  const qrData = `TICKET-${bookingCode}`;

  const renderExtras = () => {
    if (!extras || extras.length === 0) return null;

    return (
      <div className="p-5 rounded-[1.5rem] bg-[#F8F8FA] border border-black/5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#86868B] flex items-center gap-2">
          <Bus className="w-3 h-3" /> Services & Bagages
        </p>
        <div className="space-y-2">
          {extras.map((e, idx) => {
            if (typeof e === 'string') {
              return (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-black/[0.03] last:border-0">
                  <span className="text-[13px] font-bold text-[#1D1D1F]">{e}</span>
                </div>
              );
            }
            
            const isBaggage = e.category === 'baggage' || e.title.toLowerCase().includes('bagage');
            const freeAllowance = e.min_weight || 0;
            const totalWeight = e.quantity;
            const chargeableWeight = Math.max(0, totalWeight - freeAllowance);

            return (
              <div key={idx} className="flex flex-col gap-1 py-2 border-b border-black/[0.03] last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold text-[#1D1D1F]">{e.title}</span>
                  <span className="text-[12px] font-black text-[#9EBA15]">
                    {isBaggage ? `${totalWeight}kg` : `x${e.quantity}`}
                  </span>
                </div>
                {isBaggage && freeAllowance > 0 && (
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[#86868B]">Franchise gratuite: {freeAllowance}kg</span>
                    <span className="text-[#1D1D1F]">Facturé: {chargeableWeight}kg</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          body > *:not(.ticket-print-root) { display: none !important; }
          .ticket-print-root { 
            display: block !important; 
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .no-print { display: none !important; }
          @page { margin: 0; size: A5 portrait; }
        }
        .ticket-perforation {
          background-image: radial-gradient(circle at 10px 10px, transparent 10px, white 10px);
          background-size: 100% 20px;
        }
      `}</style>

      <div className="ticket-print-root bg-white rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] w-full max-w-[420px] mx-auto border border-black/5">
        
        {/* ── Top Scanner Strip (Uniformized) ────────────────── */}
        <div className="bg-[#F2F2F7] px-8 py-5 flex items-center justify-between border-b-2 border-dashed border-black/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#9EBA15]" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-[#1D1D1F] flex items-center justify-center">
                <QrCode className="w-3 h-3 text-[#9EBA15]" />
              </div>
              <span className="text-[11px] font-black tracking-[0.2em] text-[#1D1D1F] uppercase">Scan d'accès rapide</span>
            </div>
            <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Borne & Embarquement Prioritaire</p>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-md border border-black/5 transform hover:scale-105 transition-transform duration-300">
            <QRCodeSVG value={qrData} size={52} level="H" fgColor="#1D1D1F" />
          </div>
        </div>

        {/* ── Dark Header ─────────────────────────────────────── */}
        <div className="bg-[#0A0A0F] p-10 text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9EBA15]/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#9EBA15]/5 blur-[60px] -ml-16 -mb-16 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#9EBA15] rounded-2xl flex items-center justify-center shadow-lg shadow-[#9EBA15]/20">
                  <Bus className="w-6 h-6 text-[#0A0A0F]" />
                </div>
                <div>
                  <h2 className="text-[20px] font-black uppercase tracking-tighter text-white leading-none">KonGO</h2>
                  {agencyName && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9EBA15] mt-1">{agencyName}</p>}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Code Réservation</p>
                <p className="text-[32px] font-black tracking-tighter text-[#9EBA15] leading-none mt-1">{bookingCode}</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-[1.5rem] shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
              <QRCodeSVG value={qrData} size={96} level="H" fgColor="#1D1D1F" />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Origine</p>
              <h3 className="text-[28px] font-black uppercase text-white truncate pr-4 tracking-tight">{tripOrigin}</h3>
            </div>
            
            <div className="flex flex-col items-center gap-2 px-6">
              <div className="w-12 h-12 bg-[#9EBA15] rounded-full flex items-center justify-center z-10 shadow-lg shadow-[#9EBA15]/40 border-4 border-[#0A0A0F]">
                <ChevronRight className="w-6 h-6 text-[#0A0A0F]" />
              </div>
            </div>

            <div className="flex-1 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Destination</p>
              <h3 className="text-[28px] font-black uppercase text-white truncate pl-4 tracking-tight">{tripDestination}</h3>
            </div>
          </div>
        </div>

        {/* ── Perforated Divider ──────────────────────────────── */}
        <div className="relative h-8 bg-white overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 h-px border-t-2 border-dashed border-black/10 -translate-y-1/2" />
          <div className="absolute top-1/2 -left-4 w-8 h-8 bg-[#F2F2F7] rounded-full -translate-y-1/2 shadow-inner border border-black/5" />
          <div className="absolute top-1/2 -right-4 w-8 h-8 bg-[#F2F2F7] rounded-full -translate-y-1/2 shadow-inner border border-black/5" />
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="p-8 space-y-8">
          
          {/* Passenger Info Card */}
          <div className="flex items-center justify-between p-5 rounded-[2rem] bg-[#F8F8FA] border border-black/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
                <User className="w-6 h-6 text-[#1D1D1F]" />
              </div>
              <div>
                <p className="text-[15px] font-black uppercase text-[#1D1D1F] leading-tight">{passengerName}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#86868B] font-bold mt-0.5">
                  <Phone className="w-3 h-3" /> {passengerPhone}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#86868B] mb-1.5">Places</p>
              <div className="flex gap-1.5 justify-end">
                {seats.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-[#1D1D1F] text-white text-[11px] font-black rounded-lg">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-10 px-2">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868B] flex items-center gap-1.5">
                  <CalendarIcon className="w-3 h-3" /> Date
                </p>
                <p className="text-[14px] font-black text-[#1D1D1F]">{departureTime.split('à')[0]}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868B] flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Heure
                </p>
                <p className="text-[14px] font-black text-[#1D1D1F]">{departureTime.split('à')[1] || '--:--'}</p>
              </div>
            </div>
            <div className="space-y-5 text-right">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868B]">Paiement</p>
                <p className="text-[14px] font-black text-[#1D1D1F] uppercase">{PAYMENT_LABELS[paymentMethod || ''] || 'Espèces'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868B]">Statut</p>
                <div className="flex items-center justify-end gap-1.5 text-[#34C759]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[12px] font-black uppercase">Confirmé</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extras Section */}
          {renderExtras()}

          {/* Price & Final Status */}
          <div className="pt-6 border-t border-black/5 flex items-end justify-between">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#86868B]">Montant Total</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-black text-[#1D1D1F] tracking-tighter">
                  {totalAmount.toLocaleString('fr-CD')}
                </span>
                <span className="text-[14px] font-black text-[#86868B] uppercase">{currency}</span>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="bg-[#F8F8FA] p-6 rounded-[2rem] flex items-center gap-6 border border-black/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#9EBA15]/40" />
            <div className="w-12 h-12 bg-[#9EBA15]/10 rounded-full flex items-center justify-center shrink-0 border border-[#9EBA15]/20">
              <ShieldCheck className="w-6 h-6 text-[#9EBA15]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-[0.2em]">Billet Sécurisé & Certifié KonGO</p>
              <p className="text-[10px] text-[#86868B] font-bold leading-relaxed mt-1.5 uppercase opacity-80">
                VALIDEZ L'ACCÈS AU TERMINAL VIA LE QR CODE EN HAUT. BILLET NOMINATIF, SÉCURISÉ ET NON-TRANSFERABLE.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[9px] text-[#86868B] font-bold leading-relaxed max-w-[280px] mx-auto uppercase tracking-wider opacity-60">
              Présentez ce billet lors de l'embarquement. <br/>
              Billet nominatif • Non transférable • Non remboursable
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

