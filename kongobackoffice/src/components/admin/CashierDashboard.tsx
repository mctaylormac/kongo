import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, UserPlus, Ticket, ChevronRight, 
  MapPin, Clock, CreditCard, ChevronLeft, CheckCircle2,
  Printer, User as UserIcon, Plus, Trash2, Calendar,
  Bus, Wallet, Info, AlertCircle, Loader2, X, Star, Share2, Download, Smartphone, QrCode,
  RefreshCw, Eye, LogOut, BarChart3, PieChart, TrendingUp, ArrowUpRight, Filter, ClipboardList,
  Scale, ArrowRight, ArrowLeft, Package, ChevronDown, History, LayoutGrid
} from 'lucide-react';
import { KonGOLogo } from '../KonGOLogo';
import DigitalTicket from '../ui/DigitalTicket';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { SeatSelection } from '../SeatSelection';
import { BaggageWeightCalculator } from '../BaggageWeightCalculator';

type Step = 'client' | 'trip' | 'seats' | 'passengers' | 'baggage' | 'summary' | 'confirmation';

interface Client {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  address?: string;
}

interface Passenger {
  id: string;
  name: string;
  age_category: string;
  age_category_id?: string;
  seat_id?: string;
  seat_label?: string;
  price: number;
}

export function CashierDashboard() {
  const [currentStep, setCurrentStep] = useState<Step>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [ageCategories, setAgeCategories] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' });
  
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [baggageData, setBaggageData] = useState<{ items: any[], totalCost: number }>({ items: [], totalCost: 0 });
  const [bookingData, setBookingData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'bank_transfer'>('cash');
  const [paymentReceiver, setPaymentReceiver] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [cashierId, setCashierId] = useState<string | null>(null);
  const getTabFromHash = () => {
    if (typeof window === 'undefined') return 'overview';
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['overview', 'new', 'history'];
    return validTabs.includes(hash) ? hash as 'overview' | 'new' | 'history' : 'overview';
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'new' | 'history'>(getTabFromHash);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'today' | '7days' | 'month' | 'total'>('today');
  const [modifyingBooking, setModifyingBooking] = useState<any>(null);

  const isModifiable = (createdAt: string) => {
    if (!createdAt) return false;
    const hoursDifference = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return hoursDifference < 75;
  };

  const stats = React.useMemo(() => {
    if (!historyBookings.length) return { revenue: 0, tickets: 0, trips: 0 };
    
    const now = new Date();
    const filtered = historyBookings.filter(b => {
      const date = new Date(b.created_at);
      if (statsPeriod === 'today') return date.toDateString() === now.toDateString();
      if (statsPeriod === '7days') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      }
      if (statsPeriod === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const tripsCount = new Set(filtered.map(b => b.trip_id)).size;
    
    return {
      revenue: filtered.reduce((sum, b) => sum + (b.total_price || 0), 0),
      tickets: filtered.reduce((sum, b) => sum + (b.passenger_count || 1), 0),
      trips: tripsCount
    };
  }, [historyBookings, statsPeriod]);

  useEffect(() => {
    const handleHash = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const getAgency = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCashierId(user.id);
        const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single();
        if (profile?.agency_id) setAgencyId(profile.agency_id);
      }
    };
    getAgency();
    fetchClients();
    fetchAgeCategories();
  }, []);

  useEffect(() => {
    if ((activeTab === 'history' || activeTab === 'overview') && cashierId) {
      fetchHistory();
    }
  }, [activeTab, cashierId]);

  useEffect(() => {
    if (currentStep === 'trip' && agencyId) {
      fetchTrips();
    }
  }, [currentStep, agencyId]);

  useEffect(() => {
    setClientPage(1);
  }, [searchQuery]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips(
            origin:locations!origin_location_id(name),
            destination:locations!destination_location_id(name),
            departure_time
          ),
          profiles!bookings_user_id_profiles_fkey(full_name, phone_number)
        `)
        .eq('cashier_id', cashierId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistoryBookings(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchAgeCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('age_categories')
        .select('*');
      if (error) throw error;
      setAgeCategories(data || []);
    } catch (err) {
      console.error('Error fetching age categories:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['client', 'user'])
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchTrips = async () => {
    setIsLoadingTrips(true);
    try {
      // Get trips for the next 7 days
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      
      let query = supabase
        .from('trips')
        .select(`
          *,
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name),
          agencies(name)
        `)
        .eq('status', 'scheduled')
        .gte('departure_time', today)
        .lte('departure_time', nextMonth.toISOString());

      if (agencyId) {
        query = query.eq('agency_id', agencyId);
      }

      const { data, error } = await query.order('departure_time', { ascending: true });

      if (error) throw error;
      
      // Calculate seats available (mock or real if joined with bookings)
      const tripsWithSeats = data.map(t => ({
        ...t,
        from: t.origin?.name || 'Inconnu',
        to: t.destination?.name || 'Inconnu',
        departure: new Date(t.departure_time).toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit'
        }),
        departureTime: new Date(t.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        arrivalTime: new Date(t.arrival_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duration: t.duration || 'Environ 6h', 
        seatsAvailable: t.seats_available || t.total_seats, 
        price: t.price
      }));
      
      setAvailableTrips(tripsWithSeats);
    } catch (err) {
      console.error('Error fetching trips:', err);
      toast.error('Erreur lors de la récupération des voyages');
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ 
          id: crypto.randomUUID(),
          full_name: newClient.full_name,
          phone_number: newClient.phone,
          email: newClient.email,
          role: 'client' 
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating client:', error);
        throw error;
      }
      
      if (data) {
        setClients(prev => [{
          ...data,
          phone_number: data.phone_number // ensure alignment
        }, ...prev]);
        setSelectedClient(data);
        setIsAddingClient(false);
        setNewClient({ full_name: '', phone: '', email: '' }); // Reset form
        toast.success('Client enregistré avec succès');
        nextStep();
      }
    } catch (err: any) {
      console.error('Full error object:', err);
      toast.error(`Erreur lors de la création du client: ${err.message || 'Erreur inconnue'}`);
    }
  };

  const handleTripSelect = (trip: any) => {
    setSelectedTrip(trip);
    // Initialize default passenger (the selected client)
    setPassengers([{
      id: '1',
      name: selectedClient?.full_name || '',
      age_category: 'Adulte',
      price: trip.price
    }]);
    nextStep();
  };

  const handleSeatsSelected = (seats: any[]) => {
    // Synchronize passengers with selected seats
    const newPassengers = seats.map((seat, idx) => {
      // Keep existing passenger data if available, otherwise create new
      const existing = passengers[idx];
      return {
        id: existing?.id || (idx + 1).toString(),
        name: existing?.name || (idx === 0 ? selectedClient?.full_name : '') || '',
        age_category: existing?.age_category || 'Adulte',
        seat_id: seat.id,
        seat_label: seat.id,
        price: seat.price
      };
    });
    
    setPassengers(newPassengers);
    setCurrentStep('passengers');
  };

  const addPassenger = () => {
    const newId = (passengers.length + 1).toString();
    setPassengers([...passengers, {
      id: newId,
      name: '',
      age_category: 'Adulte',
      price: selectedTrip?.price || 0
    }]);
  };

  const removePassenger = (id: string) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter(p => p.id !== id));
    }
  };

  const updatePassenger = (id: string, field: keyof Passenger, value: any) => {
    setPassengers(passengers.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const nextStep = () => {
    if (currentStep === 'client') setCurrentStep('trip');
    else if (currentStep === 'trip') setCurrentStep('seats');
    else if (currentStep === 'seats') setCurrentStep('passengers');
    else if (currentStep === 'passengers') setCurrentStep('baggage');
    else if (currentStep === 'baggage') setCurrentStep('summary');
    else if (currentStep === 'summary') handleFinalizeBooking();
  };

  const resetProcess = () => {
    setModifyingBooking(null);
    setCurrentStep('client');
    setSelectedClient(null);
    setSelectedTrip(null);
    setPassengers([]);
    setBaggageData({ items: [], totalCost: 0 });
    setBookingData(null);
    setPaymentMethod('cash');
    setPaymentReceiver('');
    setPaymentReference('');
  };

  const handleModifyBooking = (booking: any) => {
    setModifyingBooking(booking);
    
    // Create a mock profile object if full_name is available from passenger details
    setSelectedClient(booking.profiles || { full_name: booking.passenger_details?.[0]?.name || 'Passager' });
    
    // Preserve passenger names & IDs but clear old seat info so they are forced to pick fresh
    if (booking.passenger_details && Array.isArray(booking.passenger_details)) {
       setPassengers(booking.passenger_details.map((p: any) => ({
         ...p,
         seat_id: undefined,
         seat_label: undefined,
         price: p.price
       })));
    } else {
       setPassengers([]);
    }
    
    setActiveTab('new');
    setCurrentStep('trip');
  };

  const prevStep = () => {
    if (currentStep === 'confirmation') return;
    if (currentStep === 'summary') setCurrentStep('baggage');
    else if (currentStep === 'baggage') setCurrentStep('passengers');
    else if (currentStep === 'passengers') setCurrentStep('seats');
    else if (currentStep === 'seats') setCurrentStep('trip');
    else if (currentStep === 'trip') setCurrentStep('client');
  };

  const handleFinalizeBooking = async () => {
    setIsProcessing(true);
    try {
      if (modifyingBooking) {
        // UPDATE existing booking
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .update({
             trip_id: selectedTrip.id,
             seats: passengers.map(p => p.seat_id),
             passenger_details: passengers,
          })
          .eq('id', modifyingBooking.id)
          .select()
          .single();
        
        if (bookingError) throw bookingError;

        // Sync booking_seats for modification
        await supabase.from('booking_seats').delete().eq('booking_id', modifyingBooking.id);
        
        if (passengers && passengers.length > 0) {
          const seatRecords = passengers.map(p => ({
            trip_id: selectedTrip.id,
            booking_id: modifyingBooking.id,
            seat_number: p.seat_id,
            seat_id: p.seat_id
          }));
          await supabase.from('booking_seats').insert(seatRecords);
        }

        setBookingData(booking);
        setCurrentStep('confirmation');
        toast.success('Voyage modifié avec succès ! Nouveau ticket généré.');
      } else {
        // 1. Create the primary booking record
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert([{
            user_id: selectedClient?.id,
            cashier_id: cashierId,
            trip_id: selectedTrip.id,
            status: 'confirmed',
            booking_code: `KG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            total_price: passengers.reduce((sum, p) => sum + p.price, 0) + baggageData.totalCost,
            seats: passengers.map(p => p.seat_id),
            baggage_info: baggageData.items,
            baggage_fee: baggageData.totalCost,
            passenger_details: passengers,
            payment_status: 'paid',
            payment_method: paymentMethod,
            payment_receiver_account: paymentMethod !== 'cash' ? paymentReceiver : null,
            payment_reference: paymentMethod !== 'cash' ? paymentReference : null,
            passenger_count: passengers.length
          }])
          .select()
          .single();
        
        if (bookingError) throw bookingError;

        // 2. Register these seats in the dedicated vacancy table
        if (passengers && passengers.length > 0) {
          const seatRecords = passengers.map(p => ({
            trip_id: selectedTrip.id,
            booking_id: booking.id,
            seat_number: p.seat_id,
            seat_id: p.seat_id
          }));
          await supabase.from('booking_seats').insert(seatRecords);
        }

        setBookingData(booking);
        setCurrentStep('confirmation');
        toast.success('Réservation terminée ! Ticket généré.');
      }
    } catch (err) {
      console.error('Error finalizing booking:', err);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone_number?.includes(searchQuery)
  );

  const paginatedClients = filteredClients.slice((clientPage - 1) * 10, clientPage * 10);
  const totalClientPages = Math.ceil(filteredClients.length / 10);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* HEADER CORPORATE - REFONTE ALIGNEMENT */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          
          {/* Brand & Status Group */}
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/20 shrink-0">
              <KonGOLogo className="w-8 h-8 text-kongo-lime" />
            </div>
            
            <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />
            
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-tight">Terminal Caisse</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">En Ligne</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Terminal v4.2</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Refonte Contraste */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shadow-inner">
            {[
              { id: 'overview', label: 'Dashboard', icon: BarChart3 },
              { id: 'new', label: 'Nouvelle Vente', icon: Plus },
              { id: 'history', label: 'Historique', icon: ClipboardList, count: historyBookings.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  window.location.hash = tab.id;
                }}
                className={`flex items-center justify-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative min-w-[160px] ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'text-kongo-lime scale-110' : 'text-slate-400 opacity-50'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                   <span className={`ml-2 px-2 py-0.5 rounded-lg text-[9px] transition-all duration-300 ${
                     activeTab === tab.id ? 'bg-kongo-lime text-slate-900 font-black' : 'bg-slate-200 text-slate-500'
                   }`}>
                     {tab.count}
                   </span>
                )}
              </button>
            ))}
            <div className="w-[1px] h-6 bg-slate-200 mx-2" />
            <Button
               variant="ghost"
               size="icon"
               onClick={fetchHistory}
               disabled={isLoadingHistory}
               className="w-11 h-11 rounded-xl hover:bg-white hover:text-slate-900 transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 space-y-8">

        {/* Stepper Moved Here for scrollable content */}
        {activeTab === 'new' && currentStep !== 'confirmation' && (
          <div className="mb-12 flex items-center justify-between max-w-4xl mx-auto relative px-10 py-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900" />
            
            {/* Connecting lines - Background */}
            <div className="absolute top-[52px] left-32 right-32 h-[1px] bg-slate-100 -z-0" />
            
            {[
              { label: 'Client', key: 'client', icon: UserIcon },
              { label: 'Voyage', key: 'trip', icon: Bus },
              { label: 'Sièges', key: 'seats', icon: LayoutGrid },
              { label: 'Validation', key: 'summary', icon: CheckCircle2 }
            ].map((step, idx) => {
              const stages: Step[] = ['client', 'trip', 'seats', 'summary'];
              const currentS = currentStep === 'passengers' || currentStep === 'baggage' ? 'seats' : currentStep as Step;
              const stepIndex = stages.indexOf(currentS);
              const isActive = stepIndex >= idx;
              const isCurrent = stages[idx] === currentS;
              
               return (
                <div key={step.label} className="flex flex-col items-center gap-3 relative z-10 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                    isCurrent ? 'bg-slate-900 text-kongo-lime border-slate-900 shadow-xl shadow-slate-900/20 scale-110' :
                    isActive ? 'bg-slate-100 text-slate-900 border-slate-200' :
                    'bg-white border-slate-100 text-slate-200'
                  }`}>
                    <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                  </div>
                  <span className={`text-[9px] uppercase font-black tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}


        <AnimatePresence mode="wait">
          {/* OVERVIEW (TABLEAU DE BORD ANALYTIQUE) */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                       <BarChart3 className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 leading-none uppercase tracking-tight">Performance Caisse</h2>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Vue globale des ventes réalisées</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm gap-1">
                    {[
                      { id: 'today', label: "Aujourd'hui" },
                      { id: '7days', label: '7 Jours' },
                      { id: 'month', label: 'Ce Mois' },
                      { id: 'total', label: 'Global' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setStatsPeriod(p.id as any)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          statsPeriod === p.id 
                            ? 'bg-slate-900 text-white shadow-lg' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
              </div>

              {/* KPI CARDS COMPACTES (Style Agency) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-slate-900 transition-all flex flex-col justify-center min-h-[100px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Revenus</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                    {stats.revenue.toLocaleString('fr-CD')} <span className="text-[10px] text-slate-400 ml-1">CDF</span>
                  </p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-2">Ventes cumulées</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-slate-900 transition-all flex flex-col justify-center min-h-[100px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <Ticket className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Billets</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 tabular-nums leading-none tracking-tight">{stats.tickets}</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-2">Unités vendues</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-slate-900 transition-all flex flex-col justify-center min-h-[100px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                      <Bus className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Voyages</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 tabular-nums leading-none tracking-tight">{stats.trips}</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-2">Destinations uniques</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-slate-900 transition-all flex flex-col justify-center min-h-[100px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Panier Moyen</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                    {(stats.tickets > 0 ? Math.round(stats.revenue / stats.tickets) : 0).toLocaleString('fr-CD')} <span className="text-[10px] text-slate-400 ml-1">CDF</span>
                  </p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-2">Par billet émis</p>
                </div>
              </div>

              {/* ACTION QUICK BAR */}
              <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-kongo-lime/10 blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-3 italic">Prêt pour un nouveau départ ?</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-80">Générez un ticket en moins de 30 secondes.</p>
                </div>
                <Button
                   variant="default"
                   size="premium"
                   onClick={() => setActiveTab('new')}
                   className="relative z-10 h-14 px-8 bg-kongo-lime text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition-all rounded-2xl shadow-2xl flex items-center gap-3"
                >
                   <Plus className="w-6 h-6" />
                   <span className="font-black text-[13px] uppercase tracking-wider">Nouvelle Réservation</span>
                </Button>
              </div>
            </motion.div>
          )}



          {/* HISTORY VIEW (Premium Table/Grid) */}
          {activeTab === 'history' && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                    <History className="w-5 h-5 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-none uppercase tracking-tight">Journal des Ventes</h2>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 px-1">Transactions validées via ce terminal</p>
                  </div>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="py-24 flex justify-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex flex-col items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                        <RefreshCw className="w-6 h-6 text-slate-900 animate-spin" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronisation...</p>
                   </div>
                </div>
              ) : historyBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {historyBookings.map(booking => (
                    <div key={booking.id} className="group bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:border-slate-900/10 transition-all overflow-hidden flex flex-col h-full">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                           <span className="text-[9px] font-black text-slate-900 tracking-widest uppercase">{booking.booking_code}</span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">
                          {new Date(booking.created_at).toLocaleString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                             <UserIcon className="w-4.5 h-4.5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-900 uppercase truncate leading-none mb-1">
                              {booking.profiles?.full_name}
                            </p>
                            <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">{booking.profiles?.phone_number}</p>
                          </div>
                        </div>

                        <div className="relative py-2">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-slate-900 uppercase">{booking.trips?.origin?.name || '---'}</span>
                              <ChevronRight className="w-3 h-3 text-slate-300" />
                              <span className="text-[10px] font-black text-slate-900 uppercase">{booking.trips?.destination?.name || '---'}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                 <Clock className="w-2.5 h-2.5 text-slate-400" />
                                 <span className="text-[8px] font-black text-slate-500 uppercase">
                                    {new Date(booking.trips?.departure_time).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                 <Users className="w-2.5 h-2.5 text-slate-400" />
                                 <span className="text-[8px] font-black text-slate-500 uppercase">{booking.passenger_count || 1} PERSONNE</span>
                              </div>
                           </div>
                        </div>

                        <div className="bg-slate-900/5 p-4 rounded-xl flex items-center justify-between border border-slate-200/50 mt-auto">
                           <div>
                             <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest mb-0.5 leading-none">Net à payer</p>
                             <p className="text-base font-black text-slate-900 tabular-nums">
                               {booking.total_price?.toLocaleString('fr-CD')} <span className="text-[9px] font-bold opacity-60">CDF</span>
                             </p>
                           </div>
                           <Badge className={`uppercase text-[7px] font-black px-1.5 py-0.5 rounded-md tracking-wider border shadow-sm ${
                             booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                           }`}>
                             {booking.status}
                           </Badge>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50/30 border-t border-slate-100 flex items-center gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="compact"
                          className="flex-1 h-9 rounded-lg border-slate-200 hover:border-slate-900 hover:bg-white text-[10px] font-black uppercase tracking-widest shadow-sm"
                          onClick={() => {
                            setBookingData(booking);
                            setSelectedTrip(booking.trips);
                            setSelectedClient(booking.profiles);
                            setPassengers(booking.passenger_details);
                            setCurrentStep('confirmation');
                            setActiveTab('new');
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-2 opacity-50" />
                          Imprimer
                        </Button>

                        {isModifiable(booking.created_at) && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="w-9 h-9 border-slate-200 hover:border-slate-900 hover:bg-white rounded-lg shadow-sm"
                            onClick={() => handleModifyBooking(booking)}
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              ) : (
                <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 max-w-lg mx-auto shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ClipboardList className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Aucun billet vendu</h3>
                  <p className="text-slate-500 mt-2 px-12 text-sm">Vous n'avez pas encore effectué de ventes.</p>
                  <Button 
                    className="mt-8 h-12 px-8 rounded-xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-900/20" 
                    onClick={() => setActiveTab('new')}
                  >
                    Effectuer ma première vente
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: CLIENT SELECTION */}
          {activeTab === 'new' && currentStep === 'client' && (
            <motion.div 
              key="client-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-[1400px] mx-auto space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT: Search existing clients */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Trouver un client</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Recherche par nom ou téléphone</p>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="relative group mb-8">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                      <Input
                        placeholder="RECHERCHER UN CLIENT (EX: JEAN DUPONT...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                        className="pl-14 h-16 rounded-2xl border-slate-200 bg-slate-50/50 focus:border-slate-900 focus:bg-white text-sm font-bold placeholder:text-slate-300 uppercase transition-all"
                      />
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Résultats ({filteredClients.length})</span>
                        <div className="h-px flex-1 bg-slate-100 mx-4" />
                      </div>

                      {paginatedClients.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {paginatedClients.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => {
                                setSelectedClient(client);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`group p-5 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                                selectedClient?.id === client.id 
                                ? 'bg-slate-900 border-slate-900 shadow-xl' 
                                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                                selectedClient?.id === client.id 
                                ? 'bg-white/10 border-white/20' 
                                : 'bg-slate-50 border-slate-100'
                              }`}>
                                <UserIcon className={`w-6 h-6 ${selectedClient?.id === client.id ? 'text-kongo-lime' : 'text-slate-400'}`} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[11px] font-black uppercase truncate mb-0.5 ${selectedClient?.id === client.id ? 'text-white' : 'text-slate-900'}`}>{client.full_name}</p>
                                <p className="text-[9px] font-bold tracking-widest text-slate-400">{client.phone_number}</p>
                              </div>
                              {selectedClient?.id === client.id && (
                                <CheckCircle2 className="w-5 h-5 text-kongo-lime ml-auto shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-40">
                           <Users className="w-16 h-16 text-slate-200 mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucun client trouvé</p>
                        </div>
                      )}
                    </div>

                    {totalClientPages > 1 && (
                      <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          onClick={() => setClientPage(prev => Math.max(1, prev - 1))}
                          disabled={clientPage === 1}
                          className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" /> Précédent
                        </Button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {clientPage} / {totalClientPages}</span>
                        <Button
                          variant="ghost"
                          onClick={() => setClientPage(prev => Math.min(totalClientPages, prev + 1))}
                          disabled={clientPage === totalClientPages}
                          className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
                        >
                          Suivant <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: New client form */}
                <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl flex flex-col">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-kongo-lime/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                  <div className="relative z-10 space-y-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-kongo-lime" />
                       </div>
                       <div>
                          <h3 className="text-xl font-black uppercase tracking-tight italic">Nouveau Client</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Créez un profil en quelques secondes</p>
                       </div>
                    </div>

                    <form onSubmit={handleCreateClient} className="space-y-5 flex-1 flex flex-col">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nom Complet *</label>
                        <Input
                          placeholder="EX: MOKOBO PATRICK"
                          value={newClient.full_name}
                          onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value.toUpperCase() })}
                          className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 font-bold focus:border-kongo-lime transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Téléphone *</label>
                        <Input
                          placeholder="+243..."
                          value={newClient.phone}
                          onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                          className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 font-bold focus:border-kongo-lime transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email (Facultatif)</label>
                        <Input
                          placeholder="client@domaine.com"
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                          className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 font-bold focus:border-kongo-lime transition-all"
                        />
                      </div>
                      <div className="flex-1" />
                      <Button
                        type="submit"
                        className="w-full h-16 bg-kongo-lime text-slate-900 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl shadow-kongo-lime/10 flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-wider"
                      >
                        <Plus className="w-5 h-5" />
                        Créer & Sélectionner
                      </Button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  size="premium"
                  disabled={!selectedClient}
                  onClick={nextStep}
                  className="h-16 px-12 bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-2xl disabled:opacity-30 group flex items-center gap-4 transition-all"
                >
                  Suivant: Choix du voyage <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TRIP SELECTION */}
          {currentStep === 'trip' && (
            <motion.div 
              key="trip-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-[1400px] mx-auto space-y-8"
            >

              <div className="flex items-center justify-between p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <Button 
                  variant="ghost" 
                  onClick={prevStep}
                  className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour au client
                </Button>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client sélectionné</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{selectedClient?.full_name}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserIcon className="w-6 h-6 text-kongo-lime" />
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-slate-900 transition-colors" />
                    <Input 
                      className="h-20 pl-16 rounded-[2rem] border-slate-200 bg-white shadow-xl focus:border-slate-900 focus:ring-0 text-lg font-bold placeholder:text-slate-300 uppercase transition-all" 
                      placeholder="DESTINATION, VILLE OU TRAJET..." 
                    />
                  </div>

                  
                  {isLoadingTrips ? (
                    <div className="py-24 text-center bg-white border border-slate-200 rounded-[3rem] shadow-sm">
                       <Loader2 className="w-16 h-16 animate-spin mx-auto text-slate-900 opacity-20" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">Optimisation des trajets en cours...</p>
                    </div>
                  ) : availableTrips.length > 0 ? (

                    <div className="space-y-4">
                      {availableTrips.map(trip => (
                        <button 
                          key={trip.id} 
                          className={`w-full group relative transition-all text-left ${
                            selectedTrip?.id === trip.id 
                            ? 'scale-[1.01] z-10' 
                            : 'hover:scale-[1.005]'
                          }`}
                          onClick={() => setSelectedTrip(trip)}
                        >
                          <div className={`p-8 rounded-[2.5rem] border-2 transition-all overflow-hidden ${
                            selectedTrip?.id === trip.id 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                            : 'border-slate-100 bg-white hover:border-slate-300 shadow-sm hover:shadow-xl'
                          }`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                              <div className="flex items-center gap-10 flex-1">
                                <div className="text-center min-w-[80px]">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">DÉPART</p>
                                  <p className="text-3xl font-black italic tracking-tighter">{trip.departureTime}</p>
                                  <p className={`text-[10px] font-bold uppercase mt-1 ${selectedTrip?.id === trip.id ? 'text-kongo-lime' : 'text-slate-500'}`}>{trip.from}</p>
                                </div>

                                <div className="flex-1 flex flex-col items-center gap-3 relative">
                                  <div className={`h-px w-full ${selectedTrip?.id === trip.id ? 'bg-white/10' : 'bg-slate-100'}`} />
                                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                    selectedTrip?.id === trip.id 
                                    ? 'bg-white text-slate-900 border-white' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200 shadow-sm'
                                  }`}>
                                    <Bus className="w-3 h-3" /> DIRECT
                                  </div>
                                </div>

                                <div className="text-center min-w-[80px]">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">ARRIVÉE</p>
                                  <p className="text-3xl font-black italic tracking-tighter">{trip.arrivalTime}</p>
                                  <p className={`text-[10px] font-bold uppercase mt-1 ${selectedTrip?.id === trip.id ? 'text-kongo-lime' : 'text-slate-500'}`}>{trip.to}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-8 pl-8 border-l border-white/10 h-16">
                                <div className="text-right">
                                  <p className={`text-[10px] font-black uppercase mb-1 ${selectedTrip?.id === trip.id ? 'text-slate-400' : 'text-slate-400'}`}>TARIF PAR PERS.</p>
                                  <p className={`text-2xl font-black tracking-tighter ${selectedTrip?.id === trip.id ? 'text-kongo-lime' : 'text-slate-900'}`}>
                                    {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(trip.price)}
                                  </p>
                                </div>
                                {selectedTrip?.id === trip.id && (
                                   <div className="w-10 h-10 bg-kongo-lime rounded-xl flex items-center justify-center shadow-lg shadow-kongo-lime/20">
                                      <CheckCircle2 className="w-6 h-6 text-slate-900" />
                                   </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                  ) : (
                    <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Aucun départ trouvé</h3>
                      <p className="text-slate-500 mt-2 text-sm">Veuillez vérifier les horaires ou essayer avec une autre date.</p>
                    </div>
                  )}
                </div>

                {/* Summary side bar */}
                <div className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl h-fit sticky top-24">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-kongo-lime/10 blur-[100px] -mr-32 -mt-32" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center">
                          <Ticket className="w-6 h-6 text-kongo-lime" />
                       </div>
                       <div>
                          <h3 className="text-xl font-black uppercase tracking-tight">Récapitulatif</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Étape 2 sur 4</p>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passager</span>
                         <span className="text-xs font-bold uppercase">{selectedClient?.full_name}</span>
                      </div>
                      
                      {selectedTrip && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-kongo-lime/10 border border-kongo-lime/20 space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-kongo-lime uppercase tracking-widest">Voyage</span>
                              <span className="text-xs font-black uppercase text-white">{selectedTrip.from} → {selectedTrip.to}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-kongo-lime uppercase tracking-widest">Heure</span>
                              <span className="text-xs font-bold text-white">{selectedTrip.departureTime}</span>
                           </div>
                        </motion.div>
                      )}
                    </div>

                    <Button
                      size="premium"
                      disabled={!selectedTrip}
                      onClick={nextStep}
                      className="w-full h-16 bg-kongo-lime text-slate-900 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl shadow-kongo-lime/10 flex items-center justify-center gap-3"
                    >
                      <span className="font-black text-[11px] uppercase tracking-wider">Sélectionner les places</span>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SEATS & MULTIPASSENGER */}
          {currentStep === 'seats' && (
            <motion.div 
              key="seats-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-[1400px] mx-auto space-y-8"
            >

              <div className="flex items-center justify-between p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <Button 
                   variant="ghost" 
                   onClick={prevStep}
                   className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour aux trajets
                </Button>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Trajet sélectionné</p>
                      <p className="font-black text-slate-900 uppercase text-sm italic tracking-tighter">
                        {selectedTrip?.from} <span className="text-slate-300 mx-2 shadow-sm">→</span> {selectedTrip?.to}
                      </p>
                   </div>
                   <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-kongo-lime font-black text-xl shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-kongo-lime/10 blur-xl group-hover:bg-kongo-lime/20 transition-all" />
                      <span className="relative z-10">{passengers.length}</span>
                   </div>
                </div>
              </div>


              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* SeatSelection Component Integration */}
                <div className="lg:col-span-7 bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-12">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                        <Bus className="w-5 h-5 text-slate-400" />
                      </div>
                      Plan de cabine
                    </h3>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-100" />
                          <span className="text-[9px] font-black uppercase text-slate-400">Libre</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-900" />
                          <span className="text-[9px] font-black uppercase text-slate-400">Sélectionné</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="w-full max-w-md">
                    <SeatSelection 
                      trip={selectedTrip} 
                      passengers={passengers.length} 
                      onContinue={handleSeatsSelected}
                      onBack={prevStep}
                      preferences={{}}
                    />
                  </div>
                </div>

                {/* Passenger Management (For groups) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Détails Passagers</h3>
                    <Button 
                      variant="ghost" 
                      onClick={addPassenger}
                      className="text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 rounded-xl px-4 py-2 flex items-center gap-2 transition-all border border-slate-100 bg-white"
                    >
                      <Plus className="w-4 h-4" /> Ajouter un passager
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {passengers.map((p, idx) => (
                      <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative"
                      >
                        <Card className={`transition-all border-2 rounded-[2rem] overflow-hidden ${
                          p.seat_label 
                          ? 'border-slate-900 bg-white shadow-xl' 
                          : 'border-slate-100 bg-slate-50/50 grayscale opacity-60'
                        }`}>
                          <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                               <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                    p.seat_label ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <Badge className={`font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${
                                    p.seat_label 
                                    ? 'bg-kongo-lime/10 text-slate-900 border-kongo-lime/20' 
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}>
                                    {p.seat_label ? `SIÈGE ${p.seat_label}` : 'SANS SIÈGE'}
                                  </Badge>
                               </div>
                               {idx > 0 && (
                                  <Button 
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => removePassenger(p.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                               )}
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identité Complète</label>
                                <Input 
                                  placeholder="NOM ET PRÉNOM..." 
                                  value={p.name}
                                  onChange={(e) => updatePassenger(p.id, 'name', e.target.value)}
                                  className="h-14 bg-slate-50 border-slate-100 text-slate-900 font-bold rounded-2xl focus:bg-white focus:border-slate-900 transition-all uppercase placeholder:text-slate-300"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type de tarif</label>
                                  <select 
                                    className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-[11px] font-black text-slate-900 focus:bg-white focus:border-slate-900 outline-none transition-all cursor-pointer uppercase appearance-none"
                                    value={p.age_category}
                                    onChange={(e) => {
                                      const catName = e.target.value;
                                      const cat = ageCategories.find(c => c.name === catName);
                                      const basePrice = selectedTrip?.price || 0;
                                      const discount = cat?.discount_percentage || 0;
                                      const finalPrice = basePrice * (1 - discount / 100);
                                      
                                      setPassengers(passengers.map(item => item.id === p.id ? { 
                                        ...item, 
                                        age_category: catName,
                                        age_category_id: cat?.id,
                                        price: finalPrice 
                                      } : item));
                                    }}
                                  >
                                    {ageCategories.map(cat => (
                                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-right block">Prix final</label>
                                  <div className="h-12 flex items-center justify-end font-black text-lg text-slate-900 tracking-tighter">
                                    {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(p.price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-kongo-lime/10 blur-[80px] -mr-24 -mt-24 group-hover:bg-kongo-lime/20 transition-all" />
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-center text-slate-500">
                        <span className="text-[11px] font-black uppercase tracking-widest">Total Partiel</span>
                        <span className="font-bold text-sm line-through opacity-50">
                           {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(passengers.length * (selectedTrip?.price || 0))}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                           <span className="text-[11px] font-black uppercase tracking-[0.2em] text-kongo-lime">Total à facturer</span>
                           <p className="text-[9px] font-bold text-slate-500 uppercase">{passengers.length} Billet(s) sécurisé(s)</p>
                        </div>
                        <span className="text-4xl font-black text-white italic tracking-tighter">
                          {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0))}
                        </span>
                      </div>

                      <Button
                        size="premium"
                        disabled={passengers.some(p => !p.seat_label)}
                        onClick={handleSeatsSelected}
                        className="w-full h-16 bg-kongo-lime text-slate-900 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all rounded-[1.5rem] shadow-xl shadow-kongo-lime/10 flex items-center justify-center gap-3 mt-4"
                      >
                        <span className="font-black text-[11px] uppercase tracking-wider">Finaliser la configuration</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PASSENGERS DETAILS */}
          {currentStep === 'passengers' && (
            <motion.div 
              key="passengers-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <Button 
                   variant="ghost" 
                   onClick={prevStep}
                   className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour
                </Button>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Passagers à bord</p>
                      <p className="font-black text-slate-900 uppercase text-sm italic tracking-tighter">
                        {passengers.length} Voyageur{passengers.length > 1 ? 's' : ''}
                      </p>
                   </div>
                   <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-kongo-lime shadow-lg">
                      <Users className="w-6 h-6" />
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                {passengers.map((p, idx) => (
                  <Card key={p.id} className="border-2 border-slate-100 bg-white shadow-sm rounded-[2.5rem] overflow-hidden hover:border-slate-200 transition-all">
                    <div className="p-8 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm italic">
                          0{idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tighter text-sm">
                            Emplacement <span className="text-kongo-lime bg-slate-900 px-3 py-1 rounded-lg ml-2">{p.seat_label}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Tarif Passager</p>
                        <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
                         {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF' }).format(p.price)}
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase px-1 flex items-center gap-2">
                             <UserIcon className="w-3.5 h-3.5" /> Identité du passager
                          </label>
                          <div className="relative group">
                             <Input 
                              value={p.name}
                              onChange={(e) => {
                                const updated = [...passengers];
                                updated[idx].name = e.target.value.toUpperCase();
                                setPassengers(updated);
                              }}
                              className="h-16 pl-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-slate-900 transition-all text-base font-black text-slate-900 uppercase placeholder:text-slate-300 rounded-2xl"
                              placeholder="SAISISSEZ LE NOM COMPLET..."
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase px-1 flex items-center gap-2">
                             <CreditCard className="w-3.5 h-3.5" /> Titre de transport
                          </label>
                          <div className="relative group">
                             <select 
                               value={p.age_category_id || ''}
                               onChange={(e) => {
                                 const catId = e.target.value;
                                 const cat = ageCategories.find(c => c.id === catId);
                                 const basePrice = selectedTrip?.price || 0;
                                 const discount = cat?.discount_percentage || 0;
                                 const finalPrice = basePrice * (1 - discount / 100);
                                 
                                 const updated = [...passengers];
                                 updated[idx].age_category_id = catId;
                                 updated[idx].age_category = cat?.name || 'Adulte';
                                 updated[idx].price = finalPrice;
                                 setPassengers(updated);
                               }}
                               className="w-full h-16 pl-6 pr-12 bg-slate-50 border-slate-100 text-slate-900 font-bold rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all uppercase appearance-none cursor-pointer"
                             >
                               <option value="">CHOISIR UNE CATÉGORIE...</option>
                               {ageCategories.map(cat => (
                                 <option key={cat.id} value={cat.id}>
                                   {cat.name} {cat.discount_percentage > 0 ? `(-${cat.discount_percentage}%)` : '(STANDARD)'}
                                 </option>
                               ))}
                             </select>
                             <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-slate-900 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-kongo-lime/10 blur-[100px] -mr-32 -mt-32 group-hover:bg-kongo-lime/20 transition-all" />
                
                <div className="relative z-10 flex items-center gap-8">
                   <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
                      <CreditCard className="w-10 h-10 text-kongo-lime" />
                   </div>
                   <div>
                      <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-2">Total à facturer</p>
                      <p className="text-5xl font-black text-white tracking-tighter italic">
                        {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0))}
                      </p>
                   </div>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                  <Button 
                    variant="premium"
                    size="premium"
                    disabled={passengers.some(p => !p.name)} 
                    onClick={nextStep}
                    className="w-full md:w-72 h-20 bg-kongo-lime text-slate-900 hover:bg-white hover:scale-[1.05] active:scale-[0.95] transition-all rounded-2xl shadow-xl shadow-kongo-lime/20 flex items-center justify-center gap-4 group"
                  >
                    <span className="font-black text-sm uppercase tracking-widest">Enregistrer Bagages</span>
                    <Package className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: BAGGAGE REGISTRATION */}
          {currentStep === 'baggage' && (
            <motion.div 
              key="baggage-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
               <div className="flex items-center justify-between p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <Button 
                   variant="ghost" 
                   onClick={prevStep}
                   className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour Details
                </Button>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Logistique & Bagages</p>
                      <p className="font-black text-slate-900 uppercase text-sm italic tracking-tighter">
                        {passengers.length} Voyageur{passengers.length > 1 ? 's' : ''} enregistré{passengers.length > 1 ? 's' : ''}
                      </p>
                   </div>
                   <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-kongo-lime shadow-lg">
                      <Package className="w-6 h-6" />
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                <Card className="border-2 border-slate-100 bg-white shadow-xl rounded-[3rem] overflow-hidden">
                  <div className="bg-slate-900 p-10 flex items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-kongo-lime/5 blur-[100px] -mr-32 -mt-32" />
                    <div className="w-20 h-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center text-kongo-lime shadow-2xl relative z-10">
                       <Scale className="w-10 h-10" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Poids & Encombrements</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Calcul des frais de soute en temps réel</p>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="p-12">
                      <BaggageWeightCalculator 
                        variant="compact"
                        passengers={passengers.length}
                        agencyId={agencyId || undefined}
                        onBaggageUpdate={(items, totalCost) => setBaggageData({ items, totalCost })}
                      />
                    </div>
                    <div className="p-12 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10">
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest px-1">Supplément logistique</p>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter italic">
                          {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(baggageData.totalCost)}
                        </p>
                      </div>
                      <Button 
                        variant="premium"
                        size="premium"
                        className="h-20 w-full md:w-80 bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.05] active:scale-[0.95] transition-all rounded-2xl shadow-2xl shadow-slate-900/20 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-4"
                        onClick={nextStep}
                      >
                        Valider & Payer
                        <ArrowRight className="w-6 h-6" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}


          {/* STEP 6: SUMMARY & PAYMENT VALIDATION */}
          {currentStep === 'summary' && (
            <motion.div 
              key="summary-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              {/* Step Header */}
              <div className="flex items-center justify-between p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <Button 
                   variant="ghost" 
                   onClick={prevStep}
                   className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                   disabled={isProcessing}
                >
                  <ArrowLeft className="w-4 h-4" /> Retour Bagages
                </Button>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Récapitulatif & Paiement</p>
                      <p className="font-black text-slate-900 uppercase text-sm italic tracking-tighter">
                        {passengers.length} Billet{passengers.length > 1 ? 's' : ''} · {selectedTrip?.from} → {selectedTrip?.to}
                      </p>
                   </div>
                   <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-kongo-lime shadow-lg">
                      <Wallet className="w-6 h-6" />
                   </div>
                </div>
              </div>

              {/* Main Content: Ledger + Payment */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* Transaction Ledger */}
                <div className="lg:col-span-6 bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
                  <div className="p-10 border-b border-white/5">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Reçu de Transaction</p>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client</span>
                        <span className="text-sm font-black text-white uppercase">{selectedClient?.full_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Itinéraire</span>
                        <span className="text-sm font-black text-white">{selectedTrip?.from} <span className="text-slate-600">→</span> {selectedTrip?.to}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Départ</span>
                        <span className="text-sm font-bold text-slate-300">{selectedTrip?.departure}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 border-b border-white/5 space-y-4">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Détail des Places ({passengers.length})</p>
                    {passengers.map((p, idx) => (
                      <div key={p.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-slate-400 italic">0{idx + 1}</div>
                          <span className="text-xs font-bold text-slate-300 uppercase">{p.name || selectedClient?.full_name} <span className="text-slate-500 text-[9px] ml-1">·  {p.age_category}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-white/5 border-white/10 text-kongo-lime font-black text-[9px] uppercase px-2">Siège {p.seat_label}</Badge>
                          <span className="text-xs font-black text-white">{new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(p.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-10 space-y-5">
                    {baggageData.totalCost > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supplément Bagages</span>
                        <span className="text-sm font-black text-slate-300">+ {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(baggageData.totalCost)}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-kongo-lime uppercase tracking-[0.2em]">NET À PERCEVOIR</span>
                      <span className="text-4xl font-black text-white italic tracking-tighter">
                        {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0) + baggageData.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Panel */}
                <div className="lg:col-span-6 space-y-8">
                  {/* Payment Method Selection */}
                  <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-xl space-y-8">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Mode de Règlement</p>
                      <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Choisissez le canal</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'cash', icon: Wallet, label: 'Espèces' },
                        { id: 'mobile_money', icon: Smartphone, label: 'Mobile' },
                        { id: 'bank_transfer', icon: CreditCard, label: 'Banque' },
                      ].map(({ id, icon: Icon, label }) => (
                        <button
                          key={id}
                          onClick={() => setPaymentMethod(id as 'cash' | 'mobile_money' | 'bank_transfer')}
                          className={`py-7 rounded-2xl flex flex-col items-center justify-center gap-4 font-black transition-all border-2 group ${
                            paymentMethod === id 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-105' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-7 h-7 transition-transform group-hover:scale-110 ${ paymentMethod === id ? 'text-kongo-lime' : ''}`} />
                          <span className="text-[9px] uppercase tracking-widest">{label}</span>
                        </button>
                      ))}
                    </div>

                    {paymentMethod !== 'cash' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-6 pt-6 border-t border-slate-100"
                      >
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            {paymentMethod === 'mobile_money' ? '📱 Numéro de réception' : '🏦 Numéro de compte'}
                          </label>
                          <Input 
                            placeholder={paymentMethod === 'mobile_money' ? '+243 99...' : 'ACC-00123...'} 
                            value={paymentReceiver}
                            onChange={(e) => setPaymentReceiver(e.target.value)}
                            className="h-16 bg-slate-50 border-slate-100 focus:border-slate-900 text-slate-900 font-black rounded-2xl text-lg tracking-wider transition-all focus:bg-white uppercase"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">🔖 Référence de transaction</label>
                          <Input 
                            placeholder="REF-987654..." 
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            className="h-16 bg-slate-50 border-slate-100 focus:border-slate-900 text-slate-900 font-black rounded-2xl text-lg tracking-wider transition-all focus:bg-white uppercase"
                          />
                          <p className="text-[10px] text-slate-400 font-bold px-1">Obligatoire pour valider le paiement électronique.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={nextStep}
                    disabled={isProcessing || (paymentMethod !== 'cash' && (!paymentReceiver || !paymentReference))}
                    className="w-full h-24 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-900/40 flex items-center justify-center gap-6 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-kongo-lime/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isProcessing 
                      ? <><Loader2 className="w-8 h-8 animate-spin" /> <span className="animate-pulse">Validation...</span></>
                      : <><Printer className="w-8 h-8 text-kongo-lime group-hover:rotate-12 transition-transform" /> Confirmer & Émettre le Titre</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 7: FINAL CONFIRMATION */}
          {currentStep === 'confirmation' && (
            <motion.div 
              key="confirmation-step"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto space-y-10 pb-20"
            >
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Paiement Reçu !</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Dossier de réservation # {bookingData?.booking_code}</p>
                 </div>
              </div>

              {/* DIGITAL TICKET */}
              <DigitalTicket
                bookingReference={bookingData?.booking_code || "---"}
                qrCodeData={`TICKET-${bookingData?.booking_code}`}
                trip={{
                  from: selectedTrip?.from || "---",
                  to: selectedTrip?.to || "---",
                  departure: selectedTrip?.departure || "---",
                  operator: selectedTrip?.agencies?.name || "KonGO Express",
                  duration: selectedTrip?.duration
                }}
                passenger={{
                  name: selectedClient?.full_name || "Client",
                  phone: selectedClient?.phone_number || "---",
                  email: selectedClient?.email
                }}
                seats={passengers.map(p => ({
                  label: p.seat_label || "---",
                  type: 'standard' // Could be updated if we have seat type
                }))}
                payment={{
                  amount: bookingData?.total_price || 0,
                  method: bookingData?.payment_method === 'mobile_money' ? 'Mobile' : bookingData?.payment_method === 'bank_transfer' ? 'Banque' : 'Espèces',
                  reference: bookingData?.payment_reference,
                  date: bookingData?.created_at || new Date(),
                  status: 'completed'
                }}
              />

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                 <Button 
                   variant="premium"
                   size="premium"
                   onClick={() => window.print()}
                 >
                    <Printer className="w-5 h-5 mr-3 opacity-50" /> Imprimer Ticket
                 </Button>
                 <Button 
                    variant="default" 
                    size="premium"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-widest text-[11px]"
                    onClick={() => window.location.reload()}
                  >
                     Nouvelle session
                  </Button>
              </div>

              <div className="flex items-center gap-4 justify-center py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest no-print">
                 <Smartphone className="w-4 h-4" />
                 <span>Format Numérique & Papier Certifié</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* CORPORATE FLOATING NAVIGATION BAR */}
      {(currentStep === 'trip' || currentStep === 'seats' || currentStep === 'passengers' || currentStep === 'baggage') && (
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-3xl border-t border-slate-200 p-6 shadow-2xl z-50">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="hidden lg:flex items-center gap-8">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Progression</span>
                    <div className="flex gap-1.5 mt-2">
                       {['trip', 'seats', 'passengers', 'baggage', 'summary'].map((s, idx) => (
                         <div key={s} className={`h-1.5 w-8 rounded-full ${currentStep === s ? 'bg-slate-900' : 'bg-slate-100'}`} />
                       ))}
                    </div>
                 </div>
                 <div className="h-10 w-px bg-slate-100" />
                 <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sélection actuelle</p>
                    <p className="text-sm font-black text-slate-900 uppercase">
                      {currentStep === 'trip' && "Choix du voyage"}
                      {currentStep === 'seats' && `${selectedTrip.from} → ${selectedTrip.to}`}
                      {currentStep === 'passengers' && `${passengers.length} passager(s)`}
                      {currentStep === 'baggage' && `Poids en cours`}
                    </p>
                 </div>
              </div>
              
              <div className="flex items-center gap-10">
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Partiel</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                      {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0) + (baggageData?.totalCost || 0))}
                    </p>
                 </div>
                 <Button 
                    variant="premium"
                    size="premium"
                    onClick={nextStep}
                    disabled={currentStep === 'passengers' && passengers.some(p => !p.name)}
                 >
                    {currentStep === 'baggage' ? 'Terminer & Payer' : 'Continuer'}
                    <ChevronRight className="ml-2 w-5 h-5 opacity-50" />
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function Loader(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
