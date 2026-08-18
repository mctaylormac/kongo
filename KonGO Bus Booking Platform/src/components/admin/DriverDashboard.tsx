// [Agent Dev Web] - Action: Création DriverDashboard - Scanner ticket + historique des scans
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ScanLine, CheckCircle, XCircle, AlertCircle, Clock,
  Loader2, History, QrCode, RefreshCw, User, Bus, LogOut
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

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
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('Chauffeur');
  const [assignedBus, setAssignedBus] = useState<{ name: string; plate_number: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDriverInfo = useCallback(async () => {
    setIsLoading(true);
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
        setDriverId(user.id); // Profiles ID (matches auth.uid())
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
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header Chauffeur */}
      <div className="card-elevated p-6 bg-kongo-black text-white rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-kongo-lime flex items-center justify-center text-kongo-black font-black text-xl">
            {driverName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/60 font-bold uppercase tracking-widest">Compte Chauffeur</p>
            <h1 className="text-h3 font-bold">{driverName}</h1>
            {assignedBus ? (
              <div className="flex items-center gap-2 mt-1">
                <Bus className="w-4 h-4 text-kongo-lime" />
                <span className="text-body-small text-kongo-lime font-bold">{assignedBus.name} — {assignedBus.plate_number}</span>
              </div>
            ) : (
              <p className="text-body-small text-orange-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Non affecté à un bus
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={loadDriverInfo} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.removeItem('kongo-app-state');
                window.location.href = '/admin';
              }}
              className="w-10 h-10 rounded-xl bg-red-500/20 text-red-100 flex items-center justify-center hover:bg-red-500/40 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="card-elevated p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-kongo-lime rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-kongo-black" />
          </div>
          <div>
            <h2 className="text-h4 font-bold text-kongo-black">Vérification Billet</h2>
            <p className="text-xs text-tertiary">Entrez le code de réservation du passager</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="Ex: KG-2025-ABCD"
            className="flex-1 px-4 py-3 border-2 border-border-primary rounded-xl text-body font-mono font-bold text-kongo-black placeholder:font-normal placeholder:text-tertiary focus:outline-none focus:border-kongo-lime transition-colors"
            autoFocus
          />
          <button
            onClick={handleScan}
            disabled={isScanning || !bookingCode.trim()}
            className="btn-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-kongo-lime disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
            {isScanning ? 'Scan...' : 'Scanner'}
          </button>
        </div>
      </div>

      {/* Résultat du scan */}
      <AnimatePresence mode="wait">
        {scanResult && (() => {
          const conf = getResultConfig(scanResult.result);
          const Icon = conf.icon;
          return (
            <motion.div
              key={scanResult.result + Date.now()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-6 rounded-2xl border-2 ${conf.bg}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <Icon className={`w-12 h-12 ${conf.color}`} />
                <div>
                  <h3 className={`text-h3 font-black ${conf.color}`}>{conf.label.toUpperCase()}</h3>
                  <p className="text-body text-secondary">{scanResult.message}</p>
                </div>
              </div>
              {scanResult.booking && (
                <div className="bg-white/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-tertiary" />
                    <p className="text-body font-semibold">{scanResult.booking.profile?.full_name || 'Anonyme'}</p>
                  </div>
                  {scanResult.booking.trip && (
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-tertiary" />
                      <p className="text-body-small text-secondary">
                        {scanResult.booking.trip.origin?.name} → {scanResult.booking.trip.destination?.name}
                        {' • '}{new Date(scanResult.booking.trip.departure_time).toLocaleString('fr-CD', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-tertiary font-mono font-bold">{scanResult.booking.booking_code} • {scanResult.booking.passenger_count} passager(s)</p>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Historique des scans */}
      <div className="card-elevated p-6 rounded-2xl">
        <h2 className="text-h4 font-bold text-kongo-black flex items-center gap-2 mb-5">
          <History className="w-5 h-5 text-secondary" /> Historique des Scans
          <span className="text-xs bg-gray-100 text-secondary px-2 py-0.5 rounded-full ml-1">{scanHistory.length}</span>
        </h2>
        <div className="space-y-2">
          {scanHistory.length === 0 ? (
            <div className="text-center py-8">
              <ScanLine className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-body-small text-tertiary">Aucun scan effectué aujourd'hui.</p>
            </div>
          ) : scanHistory.map((item) => {
            const conf = getResultConfig(item.result);
            const Icon = conf.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${conf.color} shrink-0`} />
                  <div>
                    <p className="text-body-small font-bold font-mono text-kongo-black">{item.booking_code}</p>
                    <p className="text-xs text-tertiary flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeAgo(item.scanned_at)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${conf.badge}`}>{conf.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
