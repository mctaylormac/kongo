// [Agent Dev Web] - Action: Création DriverDashboard - Scanner ticket + historique des scans
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ScanLine, CheckCircle, XCircle, AlertCircle, Clock,
  Loader2, History, QrCode, RefreshCw, User, Bus, LogOut,
  Shield, Ticket, MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../ui/button';

interface ScanResult {
  result: 'valid' | 'invalid' | 'already_used' | 'not_found';
  booking?: {
    booking_code: string;
    status: string;
    passenger_count: number;
    seats: any;
    trip?: {
      origin?: { name: string };
      destination?: { name: string };
      departure_time: string;
    };
    profile?: { full_name: string };
  };
  message: string;
}

interface ScanHistoryItem {
  id: string;
  booking_code: string;
  result: string;
  scanned_at: string;
  notes: string | null;
}

export function DriverDashboard() {
  const [bookingCode, setBookingCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('Chauffeur');
  const [assignedBus, setAssignedBus] = useState<{ name: string; plate_number: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDriverInfo = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile) setDriverName(profile.full_name || 'Chauffeur');

      const { data: driver } = await supabase
        .from('drivers')
        .select('*, buses(name, plate_number)')
        .eq('user_id', user.id)
        .single();

      if (driver) {
        setDriverId(user.id);
        setAssignedBus(driver.buses || null);

        // Load scan history
        const { data: history } = await supabase
          .from('ticket_scans')
          .select('*')
          .eq('driver_id', driver.id)
          .order('scanned_at', { ascending: false })
          .limit(20);
        setScanHistory(history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDriverInfo();
  }, [loadDriverInfo]);

  const handleScan = async () => {
    if (!bookingCode.trim()) {
      toast.error('Entrez un code de réservation');
      return;
    }
    setIsScanning(true);
    setScanResult(null);

    try {
      // 1. Chercher la réservation
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips(departure_time, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name)),
          profiles!bookings_user_id_profiles_fkey(full_name)
        `)
        .eq('booking_code', bookingCode.trim().toUpperCase())
        .single();

      let result: ScanResult['result'] = 'not_found';
      let message = 'Code introuvable dans le système.';
      let bookingData: ScanResult['booking'] = undefined;

      if (error || !booking) {
        result = 'not_found';
        message = 'Aucune réservation trouvée avec ce code.';
      } else {
        bookingData = {
          booking_code: booking.booking_code,
          status: booking.status,
          passenger_count: booking.passenger_count,
          seats: booking.seats,
          trip: booking.trips,
          profile: booking.profiles,
        };

        if (booking.status === 'completed') {
          result = 'already_used';
          message = 'Ce billet a déjà été scanné et utilisé.';
        } else if (booking.status === 'cancelled') {
          result = 'invalid';
          message = 'Réservation annulée. Billet non valide.';
        } else if (booking.status === 'confirmed' || booking.status === 'pending') {
          result = 'valid';
          message = 'Billet valide ! Passager autorisé.';

          // Marquer comme utilisé
          await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id);
        } else {
          result = 'invalid';
          message = `Statut inattendu: ${booking.status}`;
        }
      }

      const scanResultData: ScanResult = { result, message, booking: bookingData };
      setScanResult(scanResultData);

      // 2. Enregistrer le scan dans l'historique
      const scanEntry = {
        booking_code: bookingCode.trim().toUpperCase(),
        booking_id: booking?.id || null,
        driver_id: driverId,
        result,
        notes: message,
      };
      const { data: newScan } = await supabase.from('ticket_scans').insert([scanEntry]).select().single();
      if (newScan) {
        setScanHistory(prev => [newScan, ...prev.slice(0, 19)]);
      }

      // Feedback visuel + sonore
      if (result === 'valid') {
        toast.success('✅ ' + message);
      } else if (result === 'already_used') {
        toast.warning('⚠️ ' + message);
      } else {
        toast.error('❌ ' + message);
      }
    } catch (e: any) {
      toast.error('Erreur système: ' + e.message);
    } finally {
      setIsScanning(false);
      setBookingCode('');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const getResultConfig = (result: string) => {
    switch (result) {
      case 'valid': return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 border-green-200', label: 'Valide', badge: 'bg-green-100 text-green-700' };
      case 'already_used': return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', label: 'Déjà utilisé', badge: 'bg-orange-100 text-orange-700' };
      case 'invalid': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Invalide', badge: 'bg-red-100 text-red-700' };
      case 'not_found': return { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'Introuvable', badge: 'bg-gray-100 text-gray-700' };
      default: return { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: result, badge: 'bg-gray-100 text-gray-700' };
    }
  };

  const getTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'À l\'instant';
    if (m < 60) return `Il y a ${m} min`;
    const h = Math.floor(m / 60);
    return h < 24 ? `Il y a ${h}h` : new Date(d).toLocaleDateString('fr-CD');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-kongo-lime mx-auto" />
          <p className="text-body text-tertiary">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-20">
      {/* Header Chauffeur - Premium look */}
      <div className="relative overflow-hidden p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-kongo-lime/10 blur-3xl -mr-16 -mt-16 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="w-20 h-20 rounded-[2rem] bg-kongo-lime flex items-center justify-center text-kongo-black font-black text-2xl shadow-xl shadow-kongo-lime/20 rotate-3"
          >
            {driverName.slice(0, 2).toUpperCase()}
          </motion.div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-2">
                <Shield className="w-3.5 h-3.5 text-kongo-lime" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Compte Chauffeur</span>
            </div>
            <h1 className="text-display-3 font-black text-white tracking-tighter">{driverName}</h1>
            {assignedBus ? (
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Bus className="w-5 h-5 text-kongo-lime" />
                <span className="text-body font-bold text-slate-300">{assignedBus.name} — <span className="text-kongo-lime">{assignedBus.plate_number}</span></span>
              </div>
            ) : (
              <p className="text-body text-orange-400 mt-2 flex items-center justify-center md:justify-start gap-2 bg-orange-400/10 px-4 py-1 rounded-xl w-fit mx-auto md:mx-0">
                <AlertCircle className="w-4 h-4" /> Non affecté à un bus
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadDriverInfo} 
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 shadow-xl"
          >
              <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Scanner - Dynamic Centerpiece */}
      <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-kongo-lime/5 blur-3xl -ml-16 -mb-16 rounded-full" />
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-kongo-lime rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-kongo-lime/20">
                <QrCode className="w-7 h-7 text-kongo-black" />
              </div>
              <div>
                <h2 className="text-h3 font-black text-white tracking-tight uppercase">Vérification Billet</h2>
                <p className="text-body text-slate-400">Scanner ou saisir le code de réservation</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative group">
                  <input
                    ref={inputRef}
                    type="text"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="Ex: KG-ABCD-1234"
                    className="w-full px-6 py-6 bg-slate-950 border-2 border-white/5 rounded-3xl text-2xl font-black font-mono text-kongo-lime placeholder:text-slate-800 focus:outline-none focus:border-kongo-lime/50 focus:bg-black transition-all shadow-inner"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-kongo-lime/10 rounded-xl border border-kongo-lime/20">
                      <Ticket className="w-6 h-6 text-kongo-lime opacity-50" />
                  </div>
              </div>
              <Button
                variant="premium"
                size="premium"
                onClick={handleScan}
                disabled={isScanning || !bookingCode.trim()}
                className="w-full h-20 text-xl font-black"
              >
                {isScanning ? <Loader2 className="w-8 h-8 animate-spin" /> : <ScanLine className="w-8 h-8 mr-2" />}
                {isScanning ? 'VÉRIFICATION EN COURS...' : 'VALIDER LE BILLET'}
              </Button>
            </div>
        </div>
      </div>

      {/* Résultat du scan - Immersive Overlay Style */}
      <AnimatePresence mode="wait">
        {scanResult && (() => {
          const conf = getResultConfig(scanResult.result);
          const Icon = conf.icon;
          const isSuccess = scanResult.result === 'valid';
          
          return (
            <motion.div
              key={scanResult.result + Date.now()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className={`p-8 rounded-[2.5rem] border-2 shadow-2xl overflow-hidden relative ${
                isSuccess ? 'bg-emerald-950/20 border-emerald-500/30' : 
                scanResult.result === 'already_used' ? 'bg-amber-950/20 border-amber-500/30' :
                'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-16 -mt-16 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 ${
                    isSuccess ? 'bg-emerald-500 shadow-emerald-500/20' : 
                    scanResult.result === 'already_used' ? 'bg-amber-500 shadow-amber-500/20' :
                    'bg-rose-500 shadow-rose-500/20'
                }`}>
                    <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className={`text-display-3 font-black tracking-tighter ${
                    isSuccess ? 'text-emerald-400' : 
                    scanResult.result === 'already_used' ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>{conf.label.toUpperCase()}</h3>
                  <p className="text-lg font-bold text-white mt-1">{scanResult.message}</p>
                </div>
              </div>

              {scanResult.booking && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative z-10">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                    <div className="w-12 h-12 rounded-2xl bg-kongo-lime/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-kongo-lime" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Passager</p>
                        <p className="text-xl font-black text-white">{scanResult.booking.profile?.full_name || 'Anonyme'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scanResult.booking.trip && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-kongo-lime" /> Trajet
                          </p>
                          <p className="text-body font-bold text-white leading-tight">
                            {scanResult.booking.trip.origin?.name} → {scanResult.booking.trip.destination?.name}
                          </p>
                          <p className="text-xs text-slate-400 font-medium italic">
                            {new Date(scanResult.booking.trip.departure_time).toLocaleString('fr-CD', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                              <Ticket className="w-3 h-3 text-kongo-lime" /> Détails Billet
                          </p>
                          <p className="text-body font-black text-kongo-lime font-mono">{scanResult.booking.booking_code}</p>
                          <p className="text-xs text-slate-300 font-bold">{scanResult.booking.passenger_count} Place(s) réservée(s)</p>
                      </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Historique des scans - Premium List */}
      <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    <History className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Derniers Scans</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Activité récente</p>
                </div>
            </div>
            <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-black text-slate-400">{scanHistory.length} TOTAUX</span>
        </div>

        <div className="space-y-3">
          {scanHistory.length === 0 ? (
            <div className="text-center py-12 bg-black/20 rounded-3xl border border-white/5 border-dashed">
              <ScanLine className="w-16 h-16 text-slate-800 mx-auto mb-4" />
              <p className="text-body text-slate-500 font-medium">Aucune activité enregistrée sur cette session.</p>
            </div>
          ) : scanHistory.map((item, idx) => {
            const conf = getResultConfig(item.result);
            const Icon = conf.icon;
            const isVal = item.result === 'valid';
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                      isVal ? 'bg-emerald-500/20 text-emerald-400' : 
                      item.result === 'already_used' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black font-mono text-white tracking-tight group-hover:text-kongo-lime transition-colors">{item.booking_code}</p>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {getTimeAgo(item.scanned_at)}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    isVal ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                    item.result === 'already_used' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                    {conf.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
