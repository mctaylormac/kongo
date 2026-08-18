import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Ticket, Bus, User, Mail, Phone, CreditCard, CheckCircle2, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { KonGOLogo } from '../KonGOLogo';

interface DigitalTicketProps {
  bookingReference: string;
  qrCodeData: string;
  trip: {
    from: string;
    to: string;
    departure: string;
    arrival?: string;
    operator: string;
    operatorLogo?: string;
    duration?: string;
  };
  passenger: {
    name: string;
    phone: string;
    email?: string;
  };
  seats: Array<{
    label: string;
    type?: 'standard' | 'premium';
  }>;
  payment: {
    amount: number;
    method: string;
    reference?: string;
    date: string | Date;
    status?: 'completed' | 'pending' | 'failed';
  };
  className?: string;
}

const DigitalTicket: React.FC<DigitalTicketProps> = ({
  bookingReference,
  qrCodeData,
  trip,
  passenger,
  seats,
  payment,
  className = ""
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', { 
      style: 'currency', 
      currency: 'CDF', 
      maximumFractionDigits: 0 
    }).format(price);
  };

  const getArrivalEstimate = () => {
    if (trip.arrival) return trip.arrival;
    if (!trip.duration) return "--:--";
    
    try {
      const departure = trip.departure || "00:00";
      const duration = trip.duration || "0h";
      const [hours, minutes] = departure.split(':').map((n: string) => parseInt(n) || 0);
      const departureTime = new Date();
      departureTime.setHours(hours, minutes, 0);
      const durationHours = parseInt(duration.replace(/[^0-9]/g, '')) || 0;
      const arrivalTime = new Date(departureTime.getTime() + durationHours * 60 * 60 * 1000);
      return arrivalTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "--:--";
    }
  };

  return (
    <Card className={`border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* ── Top Scanner Strip (Uniformized) ────────────────── */}
        <div className="bg-[#F2F2F7] px-8 py-5 flex items-center justify-between border-b-2 border-dashed border-black/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-kongo-lime" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-kongo-black flex items-center justify-center">
                <Ticket className="w-3 h-3 text-kongo-lime" />
              </div>
              <span className="text-[11px] font-black tracking-[0.2em] text-kongo-black uppercase">Scan d'accès rapide</span>
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Borne & Embarquement Prioritaire</p>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-md border border-black/5 transform hover:scale-105 transition-transform duration-300">
            <QRCodeSVG 
              value={`TICKET-${bookingReference}`} 
              size={52} 
              level="H"
              fgColor="#101820"
            />
          </div>
        </div>

        {/* ── Dark Header (Agency Brand) ────────────────────── */}
        <div className="p-10 bg-kongo-black text-white relative overflow-hidden">
          {/* Subtle patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-kongo-lime/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-kongo-lime/5 blur-[60px] -ml-16 -mb-16 pointer-events-none" />
          
          <div className="flex items-start justify-between mb-12 relative z-10">
            <div className="flex flex-col items-start gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-kongo-lime rounded-2xl flex items-center justify-center shadow-lg shadow-kongo-lime/20">
                  <Bus className="w-6 h-6 text-kongo-black" />
                </div>
                <div className="flex flex-col">
                  <KonGOLogo variant="full" size="sm" />
                  <div className="text-[9px] font-black mt-1 uppercase tracking-[0.2em] text-kongo-lime">
                    {trip.operator}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">Code Réservation</div>
                <div className="text-3xl text-kongo-lime font-black tracking-tighter mt-1">{bookingReference}</div>
              </div>
            </div>
            
            <div className="bg-white p-3.5 rounded-[1.5rem] shadow-2xl border border-white/10 rotate-3 hover:rotate-0 transition-all duration-500 cursor-zoom-in">
              <QRCodeSVG 
                value={qrCodeData} 
                size={96} 
                level="H"
                fgColor="#101820"
                bgColor="#FFFFFF"
              />
            </div>
          </div>

          {/* Route Information */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Origine</p>
              <p className="text-3xl font-black uppercase text-white tracking-tight">{trip.from}</p>
              <p className="font-bold text-kongo-lime text-xs mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-kongo-lime animate-pulse" />
                Départ {trip.departure}
              </p>
            </div>

            <div className="px-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-kongo-lime flex items-center justify-center shadow-lg shadow-kongo-lime/20 border-4 border-kongo-black">
                <ChevronRight className="w-6 h-6 text-kongo-black" />
              </div>
              <div className="h-px bg-white/10 w-24 dashed-line" />
            </div>

            <div className="flex-1 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Destination</p>
              <p className="text-3xl font-black uppercase text-white tracking-tight">{trip.to}</p>
              <p className="font-bold text-kongo-lime text-xs mt-2 uppercase tracking-wide">
                Arrivée {getArrivalEstimate()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Perforated Divider ────────────────────────────── */}
        <div className="relative h-8 bg-white overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 h-px border-t-2 border-dashed border-black/10 -translate-y-1/2" />
          <div className="absolute top-1/2 -left-4 w-8 h-8 bg-[#F2F2F7] rounded-full -translate-y-1/2 shadow-inner border border-black/5" />
          <div className="absolute top-1/2 -right-4 w-8 h-8 bg-[#F2F2F7] rounded-full -translate-y-1/2 shadow-inner border border-black/5" />
        </div>


        {/* Ticket Body */}
        <div className="p-8 bg-white space-y-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-6">
              <label className="text-[10px] text-tertiary font-black uppercase tracking-[0.2em] block">Détenteur du billet</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-tertiary flex items-center justify-center border border-surface-secondary shadow-sm">
                  <User className="w-6 h-6 text-tertiary" />
                </div>
                <div>
                  <p className="font-black text-kongo-black leading-tight uppercase text-base">
                    {passenger.name}
                  </p>
                  <p className="text-[11px] font-bold text-secondary mt-0.5">{passenger.phone}</p>
                </div>
              </div>
            </div>


            <div>
              <label className="text-[10px] text-tertiary font-black uppercase tracking-widest block mb-2">Sièges</label>
              <div className="flex flex-wrap gap-2">
                {seats.map((seat, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <div className="w-8 h-8 bg-kongo-black text-white rounded-lg flex items-center justify-center font-black text-[10px]">
                      {seat.label}
                    </div>
                    {seat.type === 'premium' && (
                      <Star className="w-3 h-3 text-warning fill-warning" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:text-right">
              <label className="text-[10px] text-tertiary font-black uppercase tracking-widest block mb-1">Total Payé</label>
              <p className="text-2xl font-black text-kongo-black tracking-tighter">
                {formatPrice(payment.amount)}
              </p>
              <p className="text-[10px] font-bold text-success uppercase">
                {payment.status === 'pending' ? 'Paiement en attente' : 'Transaction Confirmée'}
              </p>
            </div>
          </div>

          <div className="h-px bg-surface-secondary" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {passenger.email && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-tertiary rounded-2xl flex items-center justify-center border border-surface-secondary">
                    <Mail className="w-6 h-6 text-tertiary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-tertiary uppercase font-black tracking-widest">Email de contact</p>
                    <p className="text-sm font-bold text-kongo-black">{passenger.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-tertiary rounded-2xl flex items-center justify-center border border-surface-secondary">
                  <Phone className="w-6 h-6 text-tertiary" />
                </div>
                <div>
                  <p className="text-[10px] text-tertiary uppercase font-black tracking-widest">Téléphone</p>
                  <p className="text-sm font-bold text-kongo-black">{passenger.phone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:text-right flex flex-col items-end">
              <div className="flex flex-col items-end">
                <p className="text-[10px] text-tertiary uppercase font-black tracking-widest">Méthode de paiement</p>
                <p className="text-sm font-bold text-kongo-black mt-1 uppercase">
                  {payment.method}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] text-tertiary uppercase font-black tracking-widest">Date de réservation</p>
                <p className="text-sm font-bold text-kongo-black mt-1">
                  {new Date(payment.date).toLocaleDateString('fr-CD')} à {new Date(payment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary p-8 rounded-[2rem] flex items-center gap-8 border border-surface-tertiary relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-success/40" />
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center shrink-0 border border-success/20">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-kongo-black uppercase tracking-[0.2em]">Billet Sécurisé & Certifié KonGO</p>
              <p className="text-[10px] text-secondary font-bold leading-relaxed mt-1.5 uppercase opacity-80">
                VALIDEZ L'ACCÈS AU TERMINAL VIA LE QR CODE EN HAUT. BILLET NOMINATIF, SÉCURISÉ ET NON-TRANSFERABLE.
              </p>
            </div>
          </div>


          {/* Perforated edge effect */}
          <div className="absolute -bottom-4 left-0 w-full flex justify-center gap-3 overflow-hidden px-6">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-[#F2F2F7] rounded-full border border-black/5 shrink-0" />
            ))}
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default DigitalTicket;
