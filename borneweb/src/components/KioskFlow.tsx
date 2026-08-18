import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, ChevronRight, 
  Armchair, Briefcase, CreditCard, Banknote, Printer,
  Loader2, Coffee 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { TicketTemplate } from './ui/TicketTemplate';

interface BookingFlowProps {
  trip: any;
  onComplete: () => void;
}

// [Agent Dev Web] - Action: Convertir un index (0-based) en ID de siège normalisé (ex: 1A, 1B, 2C...)
export const getSeatIdFromIndex = (index: number) => {
  const row = Math.floor(index / 4) + 1;
  const columns = ['A', 'B', 'C', 'D'];
  const col = columns[index % 4];
  return `${row}${col}`;
};

// [Agent Dev Web] - Action: Sépare les sièges par statut pour affichage visuel différencié
interface SeatStatus {
  occupied: string[];   // confirmed + paid + completed = ROUGE
  reserved: string[];   // pending = ORANGE
}

export function KioskFlow({ trip, onComplete }: BookingFlowProps) {
  const [step, setStep] = useState<'SEATS' | 'BAGGAGE' | 'PAYMENT' | 'SUCCESS'>('SEATS');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [baggageWeight, setBaggageWeight] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE' | 'CASH' | null>(null);
  const [bookingCode, setBookingCode] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  // [Agent Dev Web] - Action: Remplacement de takenSeats par seatStatuses pour distinguer occupé/réservé
  const [seatStatuses, setSeatStatuses] = useState<SeatStatus>({ occupied: [], reserved: [] });
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [isHandicap, setIsHandicap] = useState(false);

  const [dbPaymentMethods, setDbPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    const fetchDbPaymentMethods = async () => {
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (data && data.length > 0) {
        setDbPaymentMethods(data);
      }
    };
    fetchDbPaymentMethods();
  }, []);

  useEffect(() => {
    if (trip?.agency_id) {
      setLoadingExtras(true);
      supabase.from('extra_services').select('*').eq('agency_id', trip.agency_id).eq('is_active', true)
        .then(({ data }) => {
           if (data) setExtraServices(data);
           setLoadingExtras(false);
        });
    }
  }, [trip?.agency_id]);

  useEffect(() => {
    // [Agent Dev Web] - Action: Correction du bug critique - utilisation d'une requête en deux étapes
    // pour éviter les problèmes de filtrage sur les tables jointes avec Supabase
    const fetchTakenSeats = async () => {
      try {
        // Étape 1 : Récupérer les booking IDs pour ce voyage, groupés par statut
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, status')
          .eq('trip_id', trip.id)
          .in('status', ['confirmed', 'paid', 'pending', 'success', 'completed', 'cancelled']);

        if (bookingsError) throw bookingsError;
        if (!bookingsData || bookingsData.length === 0) {
          setSeatStatuses({ occupied: [], reserved: [] });
          return;
        }

        // Séparer les IDs par statut
        const confirmedIds = bookingsData
          .filter(b => ['confirmed', 'paid', 'success', 'completed'].includes(b.status))
          .map(b => b.id);
        const pendingIds = bookingsData
          .filter(b => b.status === 'pending')
          .map(b => b.id);

        // Étape 2a : Récupérer les sièges occupés (confirmés/payés) via booking_seats
        let occupiedSeats: string[] = [];
        if (confirmedIds.length > 0) {
          const { data: occupiedData } = await supabase
            .from('booking_seats')
            .select('seat_number')
            .in('booking_id', confirmedIds);
          
          if (occupiedData && occupiedData.length > 0) {
            occupiedSeats = occupiedData.map((s: any) => s.seat_number);
          } else {
            // Fallback legacy : lire depuis le champ JSON `seats` de la table bookings
            const { data: legacyData } = await supabase
              .from('bookings')
              .select('seats')
              .in('id', confirmedIds);
            if (legacyData) {
              occupiedSeats = legacyData.flatMap(b =>
                Array.isArray(b.seats)
                  ? b.seats.map((s: any) => typeof s === 'string' ? s : (s.seat_number || s.id || ''))
                  : []
              ).filter(Boolean);
            }
          }
        }

        // Étape 2b : Récupérer les sièges réservés (en attente) via booking_seats
        let reservedSeats: string[] = [];
        if (pendingIds.length > 0) {
          const { data: reservedData } = await supabase
            .from('booking_seats')
            .select('seat_number')
            .in('booking_id', pendingIds);
          
          if (reservedData && reservedData.length > 0) {
            reservedSeats = reservedData.map((s: any) => s.seat_number);
          } else {
            const { data: legacyData } = await supabase
              .from('bookings')
              .select('seats')
              .in('id', pendingIds);
            if (legacyData) {
              reservedSeats = legacyData.flatMap(b =>
                Array.isArray(b.seats)
                  ? b.seats.map((s: any) => typeof s === 'string' ? s : (s.seat_number || s.id || ''))
                  : []
              ).filter(Boolean);
            }
          }
        }

        // Un siège occupé ne peut pas être aussi réservé
        const finalReserved = reservedSeats.filter(s => !occupiedSeats.includes(s));

        setSeatStatuses({
          occupied: occupiedSeats,
          reserved: finalReserved,
        });
      } catch (err: any) {
        console.error('Erreur fetch sièges Borne:', err);
        toast.error('Erreur de synchronisation des sièges');
      }
    };

    if (trip?.id) {
      fetchTakenSeats();
      
      // [Agent Dev Web] - Action: Temps réel - écoute booking_seats ET bookings pour cohérence max
      const channel = supabase
        .channel(`kiosk_seats_${trip.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'booking_seats' },
          () => fetchTakenSeats()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `trip_id=eq.${trip.id}` },
          () => fetchTakenSeats()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [trip?.id]);

  const handleFinish = async () => {
    if (!paymentMethod) return;
    
    setIsSaving(true);
    const code = `KGO-B${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    try {
      const baggageExcessCost = baggageWeight > 10 ? (baggageWeight - 10) * 1000 : 0;
      const extrasCost = selectedExtras.reduce((sum, s) => sum + Number(s.price), 0);
      const totalPricing = Number(trip.price) * selectedSeats.length + baggageExcessCost + extrasCost;

      const allExtras = [...selectedExtras];
      if (baggageExcessCost > 0) {
        allExtras.push({
           name: `Excédent bagages (${baggageWeight}kg)`,
           price: baggageExcessCost,
           type: 'baggage'
        });
      }

      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert({
          booking_code: code,
          trip_id: trip.id,
          total_price: totalPricing,
          payment_status: paymentMethod === 'CASH' ? 'pending' : 'paid',
          status: 'confirmed',
          currency: 'CDF',
          passenger_count: selectedSeats.length,
          seats: selectedSeats,
          contact_email: 'borne@kongo.cd',
          contact_phone: '000000000',
          baggage_fee: baggageExcessCost,
          baggage_info: allExtras,
          is_handicap: isHandicap,
        })
        .select()
        .single();

      if (error) throw error;

      if (newBooking && selectedSeats.length > 0) {
        const seatPrice = totalPricing / selectedSeats.length;
        const seatRecords = selectedSeats.map((s) => ({
          booking_id: newBooking.id,
          seat_number: s,
          price: seatPrice,
          seat_type: 'standard'
        }));
        
        const { error: seatsError } = await supabase
          .from('booking_seats')
          .insert(seatRecords);
          
        if (seatsError) console.error('Erreur réservation sièges:', seatsError);
      }

      setBookingCode(code);
      setStep('SUCCESS');
      toast.success("Réservation enregistrée !");

      // Decrement handicap seats if PMR booking
      if (isHandicap && (trip.handicap_seats ?? 0) > 0) {
        await supabase
          .from('trips')
          .update({ handicap_seats: Math.max(0, (trip.handicap_seats ?? 0) - selectedSeats.length) })
          .eq('id', trip.id);
      }
    } catch (err: any) {
      toast.error("Erreur d'enregistrement", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // [Agent Dev Web] - Action: Déterminer l'état d'un siège (available, occupied, reserved, selected)
  const getSeatState = (seatId: string): 'available' | 'occupied' | 'reserved' | 'selected' => {
    if (selectedSeats.includes(seatId)) return 'selected';
    if (seatStatuses.occupied.includes(seatId)) return 'occupied';
    if (seatStatuses.reserved.includes(seatId)) return 'reserved';
    return 'available';
  };

  const totalSeats = trip?.total_seats || 45;
  const totalRows = Math.ceil(totalSeats / 4);

  return (
    <div className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 px-20 relative">
        <div className="absolute top-1/2 left-24 right-24 h-1 bg-slate-200 -z-10"></div>
        {[
          { id: 'SEATS', icon: Armchair, label: 'Sièges' },
          { id: 'BAGGAGE', icon: Briefcase, label: 'Bagages' },
          { id: 'PAYMENT', icon: CreditCard, label: 'Paiement' },
          { id: 'SUCCESS', icon: CheckCircle2, label: 'Terminé' }
        ].map((s, i) => (
          <div key={s.id} className="flex flex-col items-center gap-3 bg-slate-50 px-4">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all ${
               step === s.id ? 'bg-green-600 border-green-100 text-white scale-110 shadow-lg' : 
               i < ['SEATS', 'BAGGAGE', 'PAYMENT', 'SUCCESS'].indexOf(step) ? 'bg-green-500 border-green-100 text-white' : 
               'bg-white border-slate-200 text-slate-400'
             }`}>
               <s.icon className="w-8 h-8" />
             </div>
             <span className={`font-bold ${step === s.id ? 'text-green-600' : 'text-slate-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1">
        {step === 'SEATS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center">
               <h2 className="text-4xl font-black mb-2">Choisissez vos places</h2>
               <p className="text-xl text-slate-500">Cliquez sur les sièges disponibles (blancs) pour les sélectionner</p>
             </div>

             {/* PMR Toggle */}
             {(trip?.handicap_seats ?? 0) > 0 && (
               <div
                 onClick={() => setIsHandicap(v => !v)}
                 className={`max-w-3xl mx-auto flex items-center gap-4 p-5 rounded-2xl border-4 cursor-pointer transition-all ${
                   isHandicap ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
                 }`}
               >
                 <span className="text-5xl">♿</span>
                 <div className="flex-1">
                   <p className="text-2xl font-black text-slate-800">Passager PMR</p>
                   <p className="text-lg text-slate-500">{trip.handicap_seats} place{trip.handicap_seats > 1 ? 's' : ''} réservée{trip.handicap_seats > 1 ? 's' : ''} pour personnes à mobilité réduite</p>
                 </div>
                 <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-2xl font-black transition-all ${
                   isHandicap ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white'
                 }`}>
                   {isHandicap ? '✓' : ''}
                 </div>
               </div>
             )}

             <div className="kiosk-card max-w-3xl mx-auto bg-slate-100/50 p-10">
               {/* En-tête chauffeur */}
               <div className="bg-slate-800 text-white text-center py-3 rounded-xl mb-6 font-bold tracking-widest text-sm">
                 🚌 AVANT DU BUS — CHAUFFEUR
               </div>

               {/* Grille des sièges par rangée avec label de rangée */}
               <div className="space-y-3">
                 {/* En-têtes colonnes */}
                 <div className="grid grid-cols-[40px_1fr_1fr_24px_1fr_1fr] gap-2 mb-2">
                   <div></div>
                   <div className="text-center text-sm font-black text-slate-500">A</div>
                   <div className="text-center text-sm font-black text-slate-500">B</div>
                   <div></div>
                   <div className="text-center text-sm font-black text-slate-500">C</div>
                   <div className="text-center text-sm font-black text-slate-500">D</div>
                 </div>

                 {/* Rangées de sièges */}
                 {Array.from({ length: totalRows }).map((_, rowIndex) => {
                   const rowNum = rowIndex + 1;
                   const rowSeats = ['A', 'B', 'C', 'D'].map(col => {
                     const seatId = `${rowNum}${col}`;
                     const globalIndex = rowIndex * 4 + ['A', 'B', 'C', 'D'].indexOf(col);
                     return globalIndex < totalSeats ? seatId : null;
                   });

                   return (
                     <div key={rowNum} className="grid grid-cols-[40px_1fr_1fr_24px_1fr_1fr] gap-2 items-center">
                       {/* Numéro de rangée */}
                       <div className="text-center text-sm font-black text-slate-400">{rowNum}</div>
                       
                       {/* Siège A */}
                       {rowSeats[0] ? (
                         <SeatButton
                           seatId={rowSeats[0]}
                           state={getSeatState(rowSeats[0])}
                           onClick={() => {
                             const state = getSeatState(rowSeats[0]!);
                             if (state === 'available') {
                               setSelectedSeats(prev => [...prev, rowSeats[0]!]);
                             } else if (state === 'selected') {
                               setSelectedSeats(prev => prev.filter(s => s !== rowSeats[0]));
                             }
                           }}
                         />
                       ) : <div />}
                       
                       {/* Siège B */}
                       {rowSeats[1] ? (
                         <SeatButton
                           seatId={rowSeats[1]}
                           state={getSeatState(rowSeats[1])}
                           onClick={() => {
                             const state = getSeatState(rowSeats[1]!);
                             if (state === 'available') {
                               setSelectedSeats(prev => [...prev, rowSeats[1]!]);
                             } else if (state === 'selected') {
                               setSelectedSeats(prev => prev.filter(s => s !== rowSeats[1]));
                             }
                           }}
                         />
                       ) : <div />}

                       {/* Allée centrale */}
                       <div className="text-center text-xs text-slate-300">│</div>

                       {/* Siège C */}
                       {rowSeats[2] ? (
                         <SeatButton
                           seatId={rowSeats[2]}
                           state={getSeatState(rowSeats[2])}
                           onClick={() => {
                             const state = getSeatState(rowSeats[2]!);
                             if (state === 'available') {
                               setSelectedSeats(prev => [...prev, rowSeats[2]!]);
                             } else if (state === 'selected') {
                               setSelectedSeats(prev => prev.filter(s => s !== rowSeats[2]));
                             }
                           }}
                         />
                       ) : <div />}

                       {/* Siège D */}
                       {rowSeats[3] ? (
                         <SeatButton
                           seatId={rowSeats[3]}
                           state={getSeatState(rowSeats[3])}
                           onClick={() => {
                             const state = getSeatState(rowSeats[3]!);
                             if (state === 'available') {
                               setSelectedSeats(prev => [...prev, rowSeats[3]!]);
                             } else if (state === 'selected') {
                               setSelectedSeats(prev => prev.filter(s => s !== rowSeats[3]));
                             }
                           }}
                         />
                       ) : <div />}
                     </div>
                   );
                 })}
               </div>

               {/* Légende */}
               <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <LegendItem color="bg-white border-slate-200" label="Disponible" />
                 <LegendItem color="bg-green-600 border-green-600" label="Votre sélection" textColor="text-white" />
                 <LegendItem color="bg-orange-100 border-orange-400" label="Réservé" />
                 <LegendItem color="bg-red-100 border-red-400" label="Occupé" />
               </div>
             </div>

             <div className="flex justify-between items-center max-w-3xl mx-auto">
                <div className="text-2xl font-bold">{selectedSeats.length} place{selectedSeats.length > 1 ? 's' : ''} sélectionnée{selectedSeats.length > 1 ? 's' : ''}</div>
                <button 
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep('BAGGAGE')}
                  className="kiosk-button-primary disabled:opacity-50 disabled:grayscale"
                >
                  Continuer <ChevronRight />
                </button>
             </div>
          </div>
        )}

        {step === 'BAGGAGE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black text-center">Services Supplémentaires</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Colonne Bagages */}
              <div className="kiosk-card p-12 text-center flex flex-col items-center justify-between">
                <div>
                  <Briefcase className="w-16 h-16 text-green-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-2">Poids des bagages</h3>
                  <p className="text-slate-500 font-medium">Les 10 premiers kilos sont gratuits.</p>
                </div>
                
                <div className="flex items-center justify-center gap-8 py-8 w-full">
                   <button onClick={() => setBaggageWeight(Math.max(0, baggageWeight - 5))} className="w-20 h-20 rounded-full bg-slate-100 text-4xl font-bold flex items-center justify-center hover:bg-slate-200 transition-colors">-</button>
                   <div className="text-6xl font-black tracking-tighter min-w-[120px]">{baggageWeight} <span className="text-2xl text-slate-400">KG</span></div>
                   <button onClick={() => setBaggageWeight(baggageWeight + 5)} className="w-20 h-20 rounded-full bg-slate-100 text-4xl font-bold flex items-center justify-center hover:bg-slate-200 transition-colors">+</button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl w-full">
                  <div className="flex justify-between items-center text-xl">
                    <span className="text-slate-600 font-bold">Prix d'excédent :</span>
                    <span className="font-black text-green-600">
                      {baggageWeight > 10 ? `${((baggageWeight - 10) * 1000).toLocaleString()} FC` : 'Gratuit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Colonne Extras */}
              <div className="kiosk-card p-8 flex flex-col">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                   <Coffee className="w-8 h-8 text-green-600" />
                   Options & Repas
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {loadingExtras ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
                  ) : extraServices.length > 0 ? (
                    extraServices.map(service => {
                      const isSelected = selectedExtras.some(e => e.id === service.id);
                      return (
                        <div 
                          key={service.id} 
                          onClick={() => {
                            if (isSelected) {
                              setSelectedExtras(prev => prev.filter(e => e.id !== service.id));
                            } else {
                              setSelectedExtras(prev => [...prev, service]);
                            }
                          }}
                          className={`flex items-center justify-between p-6 rounded-2xl border-4 cursor-pointer transition-all ${
                            isSelected ? 'border-green-600 bg-green-50' : 'border-slate-100 bg-white hover:border-green-200'
                          }`}
                        >
                          <div>
                            <div className="text-xl font-bold">{service.name}</div>
                            {service.description && <div className="text-slate-500 text-sm mt-1">{service.description}</div>}
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <span className="text-2xl font-black text-green-600">+{service.price.toLocaleString()} FC</span>
                            <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                               {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center p-8 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-2xl">
                      Aucun service supplémentaire disponible
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => setStep('PAYMENT')} className="kiosk-button-primary mx-auto mt-8 w-full max-w-xl">
              Confirmer les options <ChevronRight />
            </button>
          </div>
        )}

        {step === 'PAYMENT' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center">
                <h2 className="text-4xl font-black">Comment voulez-vous payer ?</h2>
             </div>
             <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                <button 
                  onClick={() => setPaymentMethod('MOBILE')}
                  className={`kiosk-card flex flex-col items-center gap-6 border-4 p-12 hover:border-green-500 transition-all ${paymentMethod === 'MOBILE' ? 'border-green-600 bg-green-50' : 'border-slate-100'}`}
                >
                   <div className="p-6 bg-green-100 rounded-full">
                     <CreditCard className="w-16 h-16 text-green-600" />
                   </div>
                   <div className="text-center">
                     <div className="text-3xl font-black">Mobile Money & Cartes</div>
                     <div className="text-slate-500 font-bold uppercase mt-2">
                       {dbPaymentMethods.filter(p => p.code !== 'cash').map(p => p.name).slice(0, 4).join(' / ') || 'M-Pesa / Airtel / Orange / Visa'}
                     </div>
                   </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('CASH')}
                  className={`kiosk-card flex flex-col items-center gap-6 border-4 p-12 hover:border-amber-500 transition-all ${paymentMethod === 'CASH' ? 'border-amber-600 bg-amber-50' : 'border-slate-100'}`}
                >
                   <div className="p-6 bg-amber-100 rounded-full">
                     <Banknote className="w-16 h-16 text-amber-600" />
                   </div>
                   <div className="text-center">
                     <div className="text-3xl font-black">Au guichet</div>
                     <div className="text-slate-500 font-bold uppercase mt-2">Paiement en espèces</div>
                   </div>
                </button>
             </div>
             
             {paymentMethod && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
                 {paymentMethod === 'MOBILE' ? (
                   <div className="kiosk-card text-center space-y-6">
                      <div className="bg-slate-100 w-48 h-48 mx-auto rounded-xl flex items-center justify-center">
                         <div className="text-slate-400 font-bold">QR CODE ICI</div>
                      </div>
                      <p className="text-xl font-medium">Scannez le QR Code avec votre téléphone pour payer.</p>
                      <button 
                        disabled={isSaving}
                        onClick={handleFinish} 
                        className="kiosk-button-primary w-full disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="animate-spin" /> : "J'ai payé"}
                      </button>
                   </div>
                 ) : (
                   <div className="kiosk-card text-center space-y-6">
                      <p className="text-2xl font-bold text-amber-800">Votre place sera réservée pendant 30 minutes. Vous devrez payer au guichet pour finaliser.</p>
                      <button 
                        disabled={isSaving}
                        onClick={handleFinish} 
                        className="bg-amber-600 text-white kiosk-button-primary w-full hover:bg-amber-700 shadow-amber-100 border-none disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="animate-spin" /> : "Confirmer la réservation"}
                      </button>
                   </div>
                 )}
               </motion.div>
             )}
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center space-y-12 animate-in zoom-in-95 duration-500">
            <div className="flex justify-center">
              <TicketTemplate
                bookingCode={bookingCode}
                passengerName="Passager Borne"
                passengerPhone="Non spécifié"
                tripOrigin={trip.origin?.name || ''}
                tripDestination={trip.destination?.name || ''}
                departureTime={`${new Date(trip.departure_time).toLocaleDateString('fr-FR')} à ${new Date(trip.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                seats={selectedSeats}
                extras={[
                  ...selectedExtras.map(e => ({
                    title: e.name,
                    quantity: 1,
                    unit_price: Number(e.price),
                    category: e.type || 'service'
                  })),
                  ...(baggageWeight > 0 ? [{
                    title: `Bagages`,
                    quantity: baggageWeight,
                    unit_price: 1000,
                    category: 'baggage',
                    min_weight: 10
                  }] : [])
                ]}
                totalAmount={Number(trip.price) * selectedSeats.length + (baggageWeight > 10 ? (baggageWeight - 10) * 1000 : 0) + selectedExtras.reduce((sum, s) => sum + Number(s.price), 0)}
                currency="CDF"
                agencyName={trip.agency_name}
                paymentMethod={paymentMethod === 'CASH' ? 'cash' : 'mobile_money'}
              />
            </div>

             <div className="flex flex-col items-center gap-6 no-print">
                <button onClick={handlePrint} className="kiosk-button-primary w-80 h-20 text-2xl">
                  <Printer className="w-8 h-8" /> Imprimer le ticket
                </button>
                <button onClick={onComplete} className="kiosk-btn-secondary w-80 h-20 text-2xl">
                  Terminer
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

// [Agent Dev Web] - Action: Composant bouton de siège réutilisable avec états visuels distincts
function SeatButton({
  seatId,
  state,
  onClick,
}: {
  seatId: string;
  state: 'available' | 'occupied' | 'reserved' | 'selected';
  onClick: () => void;
}) {
  const styleMap = {
    available:  'bg-white border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50 cursor-pointer',
    selected:   'bg-green-600 border-green-600 text-white shadow-inner scale-95 cursor-pointer',
    reserved:   'bg-orange-100 border-orange-400 text-orange-700 cursor-not-allowed opacity-80',
    occupied:   'bg-red-100 border-red-400 text-red-600 cursor-not-allowed opacity-70',
  };

  const labelMap = {
    available: '',
    selected:  '✓',
    reserved:  '⏳',
    occupied:  '✗',
  };

  const isDisabled = state === 'occupied' || state === 'reserved';

  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      title={
        state === 'occupied' ? 'Siège occupé (payé)' :
        state === 'reserved' ? 'Siège réservé (en attente de paiement)' :
        state === 'selected' ? 'Sélectionné' : 'Disponible'
      }
      className={`h-16 rounded-xl border-4 flex flex-col items-center justify-center text-sm font-black transition-all ${styleMap[state]}`}
    >
      <span className="text-xs font-black leading-none">{seatId}</span>
      {labelMap[state] && <span className="text-xs leading-none mt-0.5">{labelMap[state]}</span>}
    </button>
  );
}

// [Agent Dev Web] - Action: Composant légende de la carte des sièges
function LegendItem({ color, label, textColor = 'text-slate-700' }: { color: string; label: string; textColor?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold">
      <div className={`w-8 h-8 rounded-lg border-4 flex items-center justify-center ${color}`}></div>
      <span className={textColor}>{label}</span>
    </div>
  );
}
