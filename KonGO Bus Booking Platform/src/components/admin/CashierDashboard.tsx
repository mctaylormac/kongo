import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, UserPlus, Ticket, ChevronRight, 
  MapPin, Clock, CreditCard, ChevronLeft, CheckCircle2,
  Printer, User as UserIcon, Plus, Trash2, Calendar,
  Bus, Wallet, Info, AlertCircle, Loader2, X, Star, Share2, Download, Smartphone, QrCode,
  RefreshCw, Eye, LogOut, BarChart3, LayoutDashboard
} from 'lucide-react';
import { KonGOLogo } from '../KonGOLogo';
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
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' });
  
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [baggageData, setBaggageData] = useState<{ items: any[], totalCost: number }>({ items: [], totalCost: 0 });
  const [bookingData, setBookingData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [cashierId, setCashierId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'booking' | 'history'>('booking');
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [upcomingTripsCount, setUpcomingTripsCount] = useState(0);

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
  }, [agencyId]);

  useEffect(() => {
    if (agencyId) {
      const fetchUpcomingCount = async () => {
        const { count } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .eq('status', 'scheduled')
          .gt('departure_time', new Date().toISOString());
        setUpcomingTripsCount(count || 0);
      };
      fetchUpcomingCount();
    }
  }, [agencyId]);

  useEffect(() => {
    if (activeTab === 'history' && cashierId) {
      fetchHistory();
    }
  }, [activeTab, cashierId]);

  useEffect(() => {
    if (currentStep === 'trip' && agencyId) {
      fetchTrips();
    }
  }, [currentStep, agencyId]);

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
    setCurrentStep('client');
    setSelectedClient(null);
    setSelectedTrip(null);
    setPassengers([]);
    setBaggageData({ items: [], totalCost: 0 });
    setBookingData(null);
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
          payment_method: 'cash',
          passenger_count: passengers.length
        }])
        .select()
        .single();
      
      if (bookingError) throw bookingError;

      // 2. Add passenger details if there's a table for it (assuming generic support for now)
      // Log for the archivist
      console.log('Ticket generated for:', passengers);

      setBookingData(booking);
      setCurrentStep('confirmation');
      toast.success('Réservation terminée ! Ticket généré.');
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

  return (
    <div className="min-h-screen bg-surface-secondary pb-20">
      {/* Header Panel Optimized */}
      <div className="bg-kongo-black text-on-black py-4 sticky top-0 z-40 border-b border-border-primary/10 backdrop-blur-md bg-opacity-95 shadow-lg">
        <div className="container-professional">
          <div className="flex items-center justify-between gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveTab('booking')}
            >
              <div className="w-10 h-10 bg-kongo-lime rounded-xl flex items-center justify-center shadow-lg shadow-kongo-lime/20 rotate-3 shrink-0">
                <KonGOLogo variant="symbol" size="sm" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-body-large font-black tracking-tight leading-none uppercase">
                  KonGO <span className="text-kongo-lime">Express</span>
                </h1>
                <p className="text-[10px] text-secondary mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-kongo-lime" />
                  <span>Terminal d'Enregistrement</span>
                </p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Navigation Tabs */}
              <div className="bg-white/5 p-1 rounded-xl flex items-center gap-1 mr-2 sm:mr-4">
                <button 
                  onClick={() => setActiveTab('booking')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'booking' ? 'bg-kongo-lime text-kongo-black shadow-lg' : 'text-secondary hover:text-white'}`}
                >
                  <Plus className="w-3 h-3" /> Enregistrer
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-kongo-lime text-kongo-black shadow-lg' : 'text-secondary hover:text-white'}`}
                >
                  <BarChart3 className="w-3 h-3" /> Tableau de bord
                </button>
              </div>

              <div className="text-right hidden md:block">
                <p className="text-[10px] text-secondary opacity-50 uppercase font-black">Agent Connecté</p>
                <p className="font-bold text-on-black text-xs uppercase tracking-widest truncate max-w-[150px]">CAISSIER PRINCIPAL</p>
              </div>
              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <Button size="sm" variant="ghost" className="btn-dark-outline h-10 px-3 text-error hover:text-error" onClick={resetProcess}>
                  <X className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Annuler</span>
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="btn-dark-outline rounded-lg h-10 w-10 px-0" 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    localStorage.removeItem('kongo-app-state');
                    window.location.href = '/admin';
                  }}
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4 text-error" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`container-professional ${activeTab === 'booking' ? 'mt-6' : 'mt-12'}`}>
        {/* Stepper Moved Here for scrollable content */}
        {activeTab === 'booking' && currentStep !== 'confirmation' && (
          <div className="mb-10 flex items-center justify-between max-w-2xl mx-auto relative px-4">
            {/* Connecting lines - Background */}
            <div className="absolute top-5 left-0 w-full h-[1px] bg-kongo-black/5 -z-0" />
            
            {['Client', 'Voyage', 'Places', 'Validation'].map((label, idx) => {
              const stages: Step[] = ['client', 'trip', 'seats', 'summary'];
              const stepIndex = stages.indexOf(currentStep === 'passengers' || currentStep === 'baggage' ? 'seats' : currentStep as Step);
              const isActive = stepIndex >= idx;
              const isCurrent = stages[idx] === (currentStep === 'passengers' || currentStep === 'baggage' ? 'seats' : currentStep as Step);
              
              return (
                <div key={label} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    isCurrent ? 'bg-kongo-lime border-kongo-lime text-kongo-black shadow-lg rotate-3' :
                    isActive ? 'bg-kongo-lime/20 border-kongo-lime/30 text-kongo-lime-dark' :
                    'bg-white border-kongo-black/5 text-secondary/30'
                  }`}>
                    <span className="font-bold text-xs">{idx + 1}</span>
                  </div>
                  <span className={`text-[9px] uppercase font-black tracking-widest ${isActive ? 'text-kongo-black' : 'text-secondary/20'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* DASHBOARD VIEW */}
          {activeTab === 'history' && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              {(() => {
                const now = new Date();
                const filteredBookings = historyBookings.filter(booking => {
                  const bookingDate = new Date(booking.created_at);
                  if (timeFilter === 'today') {
                     return bookingDate.toDateString() === now.toDateString();
                  } else if (timeFilter === 'week') {
                     const weekAgo = new Date();
                     weekAgo.setDate(now.getDate() - 7);
                     return bookingDate >= weekAgo;
                  } else if (timeFilter === 'month') {
                     return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
                  }
                  return true;
                });

                const totalCa = filteredBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
                const totalTickets = filteredBookings.reduce((sum, b) => sum + (b.passenger_count || 1), 0);

                return (
                  <>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-h2 font-black text-kongo-black">Tableau de Bord</h2>
                        <p className="text-secondary">Aperçu de vos performances et liste de vos ventes.</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                        <div className="bg-surface-secondary rounded-xl p-1 flex shadow-inner">
                          {['today', 'week', 'month', 'all'].map(t => (
                            <button 
                              key={t}
                              onClick={() => setTimeFilter(t as any)}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${timeFilter === t ? 'bg-white text-kongo-black shadow-sm ring-1 ring-border-primary/20' : 'text-secondary hover:text-kongo-black'}`}
                            >
                               {t === 'today' ? 'Aujourd\'hui' : t === 'week' ? '7 Jours' : t === 'month' ? 'Ce Mois' : 'Total'}
                            </button>
                          ))}
                        </div>
                        <Button variant="outline" className="btn-outline rounded-xl" onClick={fetchHistory} disabled={isLoadingHistory}>
                          <RefreshCw className={`w-4 h-4 sm:mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Actualiser</span>
                        </Button>
                      </div>
                    </div>

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Card className="bg-kongo-black text-on-black border-none shadow-xl-strong overflow-hidden relative group">
                         <div className="absolute -right-4 -top-4 w-32 h-32 bg-kongo-lime/10 rounded-full blur-2xl group-hover:bg-kongo-lime/20 transition-all duration-500"></div>
                         <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="text-[10px] text-secondary opacity-70 uppercase font-black tracking-widest">Chiffre d'Affaires</p>
                                  <h3 className="text-h2 font-black text-kongo-lime mt-1">
                                     {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(totalCa)}
                                  </h3>
                               </div>
                               <div className="w-12 h-12 rounded-2xl bg-kongo-lime/20 flex items-center justify-center shrink-0">
                                  <Wallet className="w-6 h-6 text-kongo-lime" />
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                      
                      <Card className="bg-white border-2 border-border-primary/10 shadow-lg overflow-hidden relative group">
                         <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="text-[10px] text-secondary uppercase font-black tracking-widest">Billets Vendus</p>
                                  <h3 className="text-h2 font-black text-kongo-black mt-1">
                                     {totalTickets}
                                  </h3>
                               </div>
                               <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center shrink-0">
                                  <Ticket className="w-6 h-6 text-secondary group-hover:rotate-12 transition-transform" />
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                      
                      <Card className="bg-surface-primary border border-border-primary/20 shadow-lg overflow-hidden relative group">
                         <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="text-[10px] text-secondary uppercase font-black tracking-widest">Voyages à venir</p>
                                  <h3 className="text-h2 font-black text-kongo-black mt-1">
                                     {upcomingTripsCount}
                                  </h3>
                               </div>
                               <div className="w-12 h-12 rounded-2xl bg-surface-tertiary flex items-center justify-center shrink-0">
                                  <Bus className="w-6 h-6 text-secondary group-hover:-translate-y-1 transition-transform" />
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                    </div>

                    <Separator className="bg-border-primary/20" />
                    <h3 className="text-h4 font-black flex items-center gap-2">
                       <Clock className="w-5 h-5 text-kongo-lime" /> Liste des Réservations
                    </h3>

                    {isLoadingHistory ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="w-12 h-12 text-kongo-lime animate-spin" />
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBookings.map(booking => (
                    <Card key={booking.id} className="card-elevated border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-all">
                      <div className="bg-kongo-black p-4 text-on-black flex justify-between items-center">
                        <Badge className="bg-kongo-lime text-kongo-black font-black border-none uppercase text-[10px]">
                          {booking.booking_code}
                        </Badge>
                        <span className="text-[10px] text-secondary opacity-50 font-bold uppercase">
                          {new Date(booking.created_at).toLocaleDateString('fr-CD')}
                        </span>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <p className="text-body-small font-black text-kongo-black uppercase truncate max-w-[180px]">
                              {booking.profiles?.full_name}
                            </p>
                            <p className="text-[10px] text-secondary font-bold">{booking.profiles?.phone_number}</p>
                          </div>
                        </div>

                        <Separator className="bg-border-primary/5" />

                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-xs font-black text-kongo-black uppercase">{booking.trips?.origin?.name}</p>
                            <p className="text-[9px] text-secondary opacity-50 uppercase tracking-widest">Origine</p>
                          </div>
                          <Bus className="w-4 h-4 text-kongo-lime/40" />
                          <div className="text-right">
                            <p className="text-xs font-black text-kongo-black uppercase">{booking.trips?.destination?.name}</p>
                            <p className="text-[9px] text-secondary opacity-50 uppercase tracking-widest">Destination</p>
                          </div>
                        </div>

                        <div className="bg-surface-secondary/50 p-3 rounded-xl flex items-center justify-between border border-border-primary/5">
                          <div>
                            <p className="text-[9px] text-secondary uppercase font-black">Total</p>
                            <p className="text-body-small font-black text-kongo-black">
                              {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(booking.total_price)}
                            </p>
                          </div>
                          <Badge variant="outline" className={`${booking.status === 'confirmed' ? 'bg-lime-50 text-lime-600 border-lime-100' : 'bg-orange-50 text-orange-600 border-orange-100'} uppercase text-[9px] font-black h-6`}>
                            {booking.status}
                          </Badge>
                        </div>

                        <Button 
                          variant="ghost" 
                          className="w-full text-caption font-black uppercase text-secondary hover:text-kongo-black hover:bg-surface-secondary group-hover:bg-kongo-lime group-hover:text-kongo-black transition-all"
                          onClick={() => {
                            setBookingData(booking);
                            setSelectedTrip(booking.trips);
                            setSelectedClient(booking.profiles);
                            setPassengers(booking.passenger_details);
                            setCurrentStep('confirmation');
                            setActiveTab('booking');
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" /> Voir / Réimprimer
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-border-primary max-w-md mx-auto">
                  <Ticket className="w-16 h-16 text-tertiary mx-auto opacity-20 mb-4" />
                  <h3 className="text-h4 font-bold text-kongo-black">Aucune vente détectée</h3>
                  <p className="text-secondary mt-2 px-8">Vous n'avez pas encore enregistré de réservations lors de cette session.</p>
                  <Button className="mt-8 btn-primary" onClick={() => setActiveTab('booking')}>
                    Commencer une vente
                  </Button>
                </div>
              )}
            </>
          );
        })()}
            </motion.div>
          )}

          {/* STEP 1: CLIENT SELECTION */}
          {activeTab === 'booking' && currentStep === 'client' && (
            <motion.div 
              key="client-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Search existing */}
                <Card className="card-elevated border-none shadow-2xl-strong bg-surface-primary/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-h4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-kongo-lime/10 rounded-xl flex items-center justify-center">
                        <Search className="w-5 h-5 text-kongo-lime" />
                      </div>
                      Trouver un client
                    </CardTitle>
                    <CardDescription>Rechercher par nom ou numéro de téléphone</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5 group-focus-within:text-kongo-lime transition-colors" />
                      <Input 
                        placeholder="Ex: Jean Dupont ou 081..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-kongo h-14 pl-12 bg-surface-secondary/50 border-white/5 focus:border-kongo-lime/50"
                      />
                    </div>
                    <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {filteredClients.length > 0 ? filteredClients.map(client => (
                        <motion.div 
                          whileHover={{ x: 5 }}
                          key={client.id}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            selectedClient?.id === client.id 
                            ? 'bg-kongo-lime/10 border-kongo-lime shadow-lg shadow-kongo-lime/5' 
                            : 'bg-surface-secondary/30 border-white/5 hover:border-kongo-lime/30'
                          }`}
                          onClick={() => setSelectedClient(client)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedClient?.id === client.id ? 'bg-kongo-lime text-kongo-black' : 'bg-surface-tertiary text-secondary'}`}>
                                {(client.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className={`font-bold ${selectedClient?.id === client.id ? 'text-kongo-black' : 'text-on-black'}`}>{client.full_name || 'Utilisateur Anonyme'}</p>
                                <p className="text-caption text-secondary/60">{client.phone_number}</p>
                              </div>
                            </div>
                            {selectedClient?.id === client.id && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <CheckCircle2 className="w-6 h-6 text-kongo-lime" />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-12 text-secondary/50 flex flex-col items-center gap-3">
                          <Users className="w-10 h-10 opacity-20" />
                          <p className="italic text-body-small">Aucun client trouvé pour "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Add new */}
                <Card className="card-elevated border-dashed border-2 border-kongo-lime/20 bg-transparent hover:border-kongo-lime/50 transition-all group">
                  <CardHeader>
                    <CardTitle className="text-h4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-kongo-lime text-kongo-black rounded-xl flex items-center justify-center shadow-lg shadow-kongo-lime/20">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      Nouveau client
                    </CardTitle>
                    <CardDescription>Enregistrer rapidement un nouveau passager</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateClient} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-caption font-bold text-secondary uppercase px-1">Identité</label>
                        <Input 
                          placeholder="Nom complet du passager" 
                          required 
                          value={newClient.full_name}
                          onChange={(e) => setNewClient({...newClient, full_name: e.target.value})}
                          className="h-12 bg-surface-secondary/50 border-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-caption font-bold text-secondary uppercase px-1">Contact</label>
                        <Input 
                          placeholder="N° de téléphone (WhatsApp préféré)" 
                          required 
                          value={newClient.phone}
                          onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                          className="h-12 bg-surface-secondary/50 border-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-caption font-bold text-secondary uppercase px-1">Email <span className="text-[10px] opacity-40">(Optionnel)</span></label>
                        <Input 
                          placeholder="client@exemple.com" 
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          className="h-12 bg-surface-secondary/50 border-white/5"
                        />
                      </div>
                      <Button className="w-full h-14 btn-primary shadow-xl shadow-kongo-lime/10" type="submit">
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" /> Créer et Continuer
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 flex justify-end">
                <Button 
                  disabled={!selectedClient} 
                  className="btn-primary px-10"
                  onClick={nextStep}
                >
                  Continuer vers le voyage <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TRIP SELECTION */}
          {currentStep === 'trip' && (
            <motion.div 
              key="trip-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={prevStep} className="btn-outline">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Retour au client
                </Button>
                <div className="flex items-center gap-2 text-label">
                  <span className="text-secondary">Client sélectionné:</span>
                  <span className="text-kongo-black font-bold uppercase">{selectedClient?.full_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                    <Input className="pl-10 h-12 rounded-xl" placeholder="Filtrer par destination..." />
                  </div>
                  
                  {isLoadingTrips ? (
                    <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-kongo-lime" /></div>
                  ) : availableTrips.length > 0 ? (
                    availableTrips.map(trip => (
                      <Card 
                        key={trip.id} 
                        className={`card-elevated transition-all cursor-pointer hover:border-kongo-lime/50 ${selectedTrip?.id === trip.id ? 'border-kongo-lime ring-2 ring-kongo-lime/20' : ''}`}
                        onClick={() => setSelectedTrip(trip)}
                      >
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="p-6 flex-1 flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <div className="bg-kongo-lime/10 px-3 py-1 rounded-full mb-2">
                                     <p className="text-caption font-bold text-kongo-lime-dark">{trip.departure}</p>
                                  </div>
                                  <p className="text-h4 font-bold text-kongo-black">
                                    {trip.departureTime}
                                  </p>
                                  <p className="text-caption text-secondary">{trip.from}</p>
                                </div>
                                <div className="flex flex-col items-center gap-1 opacity-50 px-4">
                                  <div className="w-10 h-0.5 bg-border-primary" />
                                  <Bus className="w-4 h-4" />
                                  <div className="w-10 h-0.5 bg-border-primary" />
                                </div>
                                <div className="text-center">
                                  <div className="h-4 mb-2" /> {/* alignment spacer */}
                                  <p className="text-h4 font-bold text-kongo-black">
                                    {trip.arrivalTime}
                                  </p>
                                  <p className="text-caption text-secondary">{trip.to}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-h4 font-bold text-kongo-lime-dark">{new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(trip.price)}</p>
                                <Badge className="status-success">{trip.seatsAvailable} places</Badge>
                              </div>
                            </div>
                            <div className="bg-surface-tertiary/30 md:w-48 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border-primary">
                              <Button className="w-full btn-primary" onClick={() => handleTripSelect(trip)}>
                                Séléctionner
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-surface-primary rounded-2xl border-2 border-dashed border-border-primary">
                      <Calendar className="w-12 h-12 text-tertiary mx-auto mb-4" />
                      <p className="text-secondary">Aucun voyage actif trouvé pour les 30 prochains jours</p>
                    </div>
                  )}
                </div>

                {/* Summary side bar */}
                <div className="space-y-4">
                  <Card className="card-elevated bg-kongo-black text-on-black overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Ticket className="w-24 h-24 rotate-12" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-label text-kongo-lime uppercase tracking-widest">En cours</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-secondary text-caption">CLIENT</p>
                        <p className="text-h4 font-bold">{selectedClient?.full_name}</p>
                        <p className="text-body-small opacity-70">{selectedClient?.phone_number}</p>
                      </div>
                      
                      <Separator className="bg-border-primary/20" />
                      
                      <div className="flex items-center gap-3 text-secondary italic">
                        <Info className="w-4 h-4" />
                        <p className="text-caption">Sélectionnez d'abord un voyage pour continuer</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SEATS & MULTIPASSENGER */}
          {currentStep === 'seats' && (
            <motion.div 
              key="seats-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={prevStep} className="btn-outline">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Retour aux trajets
                </Button>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-caption text-secondary">Trajet sélectionné</p>
                      <p className="font-bold text-kongo-black">{selectedTrip.from} → {selectedTrip.to}</p>
                   </div>
                   <div className="w-10 h-10 bg-kongo-lime rounded-full flex items-center justify-center text-on-lime font-bold">
                      {passengers.length}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* SeatSelection Component Integration */}
                <div className="bg-surface-primary rounded-3xl p-6 shadow-xl border border-border-primary">
                  <h3 className="text-h4 font-bold mb-6 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-kongo-lime" />
                    Séléction des places
                  </h3>
                  <SeatSelection 
                    trip={selectedTrip} 
                    passengers={passengers.length} 
                    onContinue={handleSeatsSelected}
                    onBack={prevStep}
                    preferences={{}}
                  />
                </div>

                {/* Passenger Management (For groups) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-h4 font-bold">Liste des passagers</h3>
                    <Button className="btn-secondary" onClick={addPassenger}>
                      <Plus className="w-4 h-4 mr-2" /> Ajouter un passager
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {passengers.map((p, idx) => (
                      <Card key={p.id} className="card-elevated border-l-4 border-kongo-lime">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-caption text-secondary font-semibold uppercase">Nom du passager</label>
                                <Input 
                                  placeholder="Entrer le nom..." 
                                  value={p.name}
                                  onChange={(e) => updatePassenger(p.id, 'name', e.target.value)}
                                  className="input-kongo"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-caption text-secondary font-semibold uppercase">Catégorie</label>
                                <select 
                                  className="w-full h-10 rounded-xl bg-surface-secondary border border-border-primary px-3 text-body-small focus:ring-2 focus:ring-kongo-lime outline-none transition-all"
                                  value={p.age_category}
                                  onChange={(e) => updatePassenger(p.id, 'age_category', e.target.value)}
                                >
                                  <option>Adulte</option>
                                  <option>Enfant (-12 ans)</option>
                                  <option>Étudiant</option>
                                  <option>Sénior</option>
                                </select>
                              </div>
                            </div>
                            {idx > 0 && (
                              <Button variant="ghost" size="icon" className="text-error mt-6" onClick={() => removePassenger(p.id)}>
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            )}
                          </div>
                          
                          {p.seat_label && (
                            <div className="mt-4 flex items-center gap-2">
                              <Badge className="bg-kongo-lime/20 text-kongo-lime border-kongo-lime">Siège: {p.seat_label}</Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="p-6 bg-kongo-black rounded-3xl text-on-black space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Nombre de passagers</span>
                      <span className="font-bold">{passengers.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-h4">
                      <span className="text-kongo-lime">Total à payer</span>
                      <span className="font-bold text-kongo-lime">
                        {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0))}
                      </span>
                    </div>
                    <div className="pt-4 text-center italic text-body-xs opacity-60">
                      Veuillez vous assurer que chaque passager a un siège assigné sur la carte.
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-h3 font-black flex items-center gap-3">
                  <div className="w-12 h-12 bg-kongo-lime/10 rounded-2xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-kongo-lime" />
                  </div>
                  Détails des Passagers
                </h2>
                <div className="bg-surface-secondary/50 px-4 py-2 rounded-xl text-caption font-bold text-secondary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-kongo-lime" />
                  {passengers.length} Passager{passengers.length > 1 ? 's' : ''} enregistré{passengers.length > 1 ? 's' : ''}
                </div>
              </div>

              <div className="space-y-4">
                {passengers.map((p, idx) => (
                  <Card key={p.id} className="card-elevated border-l-4 border-l-kongo-lime overflow-hidden bg-surface-primary/50 backdrop-blur-sm">
                    <div className="p-6 bg-surface-secondary/20 flex items-center justify-between border-b border-border-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-kongo-lime text-kongo-black flex items-center justify-center font-black text-body-small">
                          {idx + 1}
                        </div>
                        <p className="font-bold text-kongo-black uppercase tracking-widest text-body-small">
                          Siège <span className="text-kongo-black">{p.seat_label}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-caption text-secondary/60 uppercase font-bold">Tarif individuel</p>
                        <p className="text-h5 font-black text-kongo-black">
                         {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF' }).format(p.price)}
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-caption font-black text-secondary tracking-widest uppercase">Nom du Passager</label>
                        <div className="relative group">
                           <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-kongo-lime transition-colors" />
                           <Input 
                            value={p.name}
                            onChange={(e) => {
                              const updated = [...passengers];
                              updated[idx].name = e.target.value;
                              setPassengers(updated);
                            }}
                            className="h-14 pl-12 bg-white/5 border-white/5 focus:border-kongo-lime/50 transition-all text-body font-medium"
                            placeholder="Entrez le nom complet"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-caption font-black text-secondary tracking-widest uppercase">Catégorie d'âge</label>
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
                          className="w-full h-14 rounded-xl bg-white/5 border border-white/5 px-4 outline-none focus:border-kongo-lime/50 transition-all text-body font-medium cursor-pointer"
                        >
                          <option value="">Sélectionnez la catégorie</option>
                          {ageCategories.length > 0 ? (
                            ageCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} {cat.discount_percentage > 0 ? `(-${cat.discount_percentage}%)` : '(Full)'}
                              </option>
                            ))
                          ) : (
                            <option value="adult">Adulte (Tarif standard)</option>
                          )}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center bg-kongo-black p-8 rounded-3xl mt-12 border border-border-primary/20 shadow-2xl">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-surface-tertiary/20 flex items-center justify-center">
                      <CreditCard className="w-7 h-7 text-kongo-lime" />
                   </div>
                   <div>
                      <p className="text-caption text-secondary font-black uppercase tracking-widest">Récapitulatif (Places)</p>
                      <p className="text-h3 font-black text-kongo-lime">
                        {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0))}
                      </p>
                   </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" className="h-14 px-8 btn-dark-outline" onClick={prevStep}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Retour
                  </Button>
                  <Button 
                    disabled={passengers.some(p => !p.name)} 
                    className="h-14 px-12 btn-primary shadow-xl shadow-kongo-lime/30" 
                    onClick={nextStep}
                  >
                    Suivant : Bagages <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: BAGGAGE REGISTRATION */}
          {currentStep === 'baggage' && (
            <motion.div 
              key="baggage-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-8">
                <Button variant="outline" onClick={prevStep} className="btn-outline">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Retour aux places
                </Button>
                <div className="text-right">
                  <p className="text-caption text-secondary">Passagers</p>
                  <p className="font-bold text-kongo-black">{passengers.length} Personne(s)</p>
                </div>
              </div>

              <div className="max-w-4xl mx-auto">
                <Card className="card-elevated border-2 border-kongo-lime/20 overflow-hidden">
                  <div className="bg-kongo-lime/10 p-6 border-b border-border-primary flex items-center gap-4">
                    <div className="w-12 h-12 bg-kongo-lime rounded-xl flex items-center justify-center">
                       <Plus className="w-6 h-6 text-kongo-black" />
                    </div>
                    <div>
                      <h3 className="text-h4 font-bold text-kongo-black">Enregistrement des Bagages</h3>
                      <p className="text-body-small text-secondary">Ajoutez les bagages en soute ou cabine pour le groupe</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <BaggageWeightCalculator 
                      variant="compact"
                      passengers={passengers.length}
                      onBaggageUpdate={(items, totalCost) => setBaggageData({ items, totalCost })}
                    />
                    <div className="p-8 bg-surface-secondary border-t border-border-primary flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-caption text-secondary">TOTAL FRAIS BAGAGES</p>
                        <p className="text-h3 font-black text-kongo-lime-dark">
                          {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(baggageData.totalCost)}
                        </p>
                      </div>
                      <Button className="btn-primary h-14 px-10 rounded-2xl" onClick={nextStep}>
                        Continuer vers le paiement
                        <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SUMMARY & CONFIRMATION */}
          {currentStep === 'summary' && (
            <motion.div 
              key="summary-step"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="card-elevated overflow-hidden border-2 border-kongo-lime/50">
                <div className="bg-kongo-lime h-2 w-full" />
                <CardHeader className="text-center py-10">
                  <div className="w-16 h-16 bg-kongo-lime/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-kongo-lime-dark" />
                  </div>
                  <CardTitle className="text-h3">Validation du paiement</CardTitle>
                  <CardDescription>Confirmez la réception des fonds et émettez le ticket</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-surface-secondary rounded-2xl p-6 space-y-4 border border-border-primary">
                    <div className="flex justify-between text-body-small">
                      <span className="text-secondary">Client Principal</span>
                      <span className="font-bold text-kongo-black uppercase">{selectedClient?.full_name}</span>
                    </div>
                    <div className="flex justify-between text-body-small">
                      <span className="text-secondary">Voyage</span>
                      <span className="font-bold">{selectedTrip.from} → {selectedTrip.to}</span>
                    </div>
                    <div className="flex justify-between text-body-small">
                      <span className="text-secondary">Date / Heure</span>
                      <span className="font-bold text-kongo-black">{selectedTrip.departure}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                       <p className="text-caption text-secondary">PASSAGERS ({passengers.length})</p>
                       {passengers.map(p => (
                         <div key={p.id} className="flex justify-between items-center text-body-small">
                            <span>{p.name || selectedClient?.full_name} ({p.age_category})</span>
                            <span className="font-medium">Siège {p.seat_label}</span>
                         </div>
                       ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-body-small italic">
                      <span className="text-secondary">Frais Bagages</span>
                      <span className="font-medium text-kongo-black">
                        +{new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(baggageData.totalCost)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-h3 pt-2">
                      <span className="font-bold">Total Encaissé</span>
                      <span className="font-black text-kongo-lime-dark">
                        {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0) + baggageData.totalCost)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-14 rounded-xl btn-outline"
                      onClick={prevStep}
                      disabled={isProcessing}
                    >
                      Modifier la commande
                    </Button>
                    <Button 
                      className="h-14 rounded-xl btn-primary" 
                      onClick={nextStep}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5 mr-4" />}
                      Valider et Imprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 5: FINAL CONFIRMATION */}
          {currentStep === 'confirmation' && (
            <motion.div 
              key="confirmation-step"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-kongo-lime/20 rounded-full flex items-center justify-center mx-auto border-4 border-kongo-lime">
                    <CheckCircle2 className="w-10 h-10 text-kongo-lime-dark" />
                 </div>
                 <h2 className="text-h2 font-black text-kongo-black">Paiement Reçu !</h2>
                 <p className="text-secondary max-w-sm mx-auto">La réservation a été validée. Voici le ticket numérique pour le client.</p>
              </div>

              {/* TICKET UI (Mobile Style) */}
              <Card className="card-elevated overflow-hidden border-none shadow-2xl-strong">
                <CardContent className="p-0">
                  {/* Ticket Header (Agency Brand) */}
                  <div className="p-6 bg-kongo-black text-on-black relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Ticket className="w-24 h-24 rotate-12" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex flex-col items-start">
                        <KonGOLogo variant="full" size="md" />
                        <div className="text-[9px] font-bold mt-1 uppercase tracking-tighter text-kongo-lime/70 border-l border-kongo-lime/30 pl-2 leading-none">
                          Opéré par {selectedTrip?.agencies?.name || 'KonGO Express'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-secondary/60 uppercase font-black">Référence</div>
                        <div className="text-h5 text-kongo-lime font-black tracking-tighter">{bookingData?.booking_code}</div>
                      </div>
                    </div>

                    {/* Route Section */}
                    <div className="flex items-center justify-between relative z-10 px-2 pb-2">
                       <div className="text-center">
                          <p className="text-h4 font-black uppercase text-on-black">{selectedTrip?.from}</p>
                          <p className="text-[10px] text-secondary opacity-70 uppercase tracking-widest mt-1">Départ</p>
                          <p className="font-bold text-kongo-lime text-body-small italic">{selectedTrip?.departure}</p>
                       </div>

                       <div className="flex-1 px-8 relative">
                          <div className="h-[2px] bg-kongo-lime/30 w-full dashed-line"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-kongo-lime rounded-full flex items-center justify-center shadow-lg shadow-kongo-lime/20">
                             <Bus className="w-4 h-4 text-kongo-black" />
                          </div>
                          <div className="text-[9px] text-secondary font-bold text-center mt-3 uppercase tracking-widest">{selectedTrip?.duration || '16h'}</div>
                       </div>

                       <div className="text-center">
                          <p className="text-h4 font-black uppercase text-on-black">{selectedTrip?.to}</p>
                          <p className="text-[10px] text-secondary opacity-70 uppercase tracking-widest mt-1">Destination</p>
                          <p className="font-bold text-kongo-lime text-body-small italic">Terminal</p>
                       </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 bg-white space-y-8 relative">
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <label className="text-caption text-secondary/60 font-black uppercase tracking-widest block mb-2">Voyageur Terminal</label>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                                 <UserIcon className="w-5 h-5 text-secondary" />
                              </div>
                              <div>
                                 <p className="font-bold text-kongo-black leading-tight uppercase">{selectedClient?.full_name}</p>
                                 <p className="text-body-small text-secondary">{selectedClient?.phone_number}</p>
                              </div>
                           </div>
                        </div>

                        <div className="text-right">
                           <label className="text-caption text-secondary/60 font-black uppercase tracking-widest block mb-2">Sièges Assignés</label>
                           <div className="flex justify-end flex-wrap gap-2">
                             {passengers.map((p, idx) => (
                               <Badge key={idx} className="bg-kongo-lime text-kongo-black border-none font-black text-body-small h-8 w-8 flex items-center justify-center p-0 rounded-lg">
                                 {p.seat_label}
                               </Badge>
                             ))}
                           </div>
                        </div>
                     </div>

                     <Separator className="bg-border-primary/5" />

                     <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-surface-secondary/50 rounded-2xl flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-secondary" />
                           </div>
                           <div>
                              <p className="text-caption text-secondary/60 uppercase font-black tracking-widest">Montant Payé</p>
                              <p className="text-h4 font-black text-kongo-black">
                                {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF' }).format(bookingData?.total_price || 0)}
                              </p>
                           </div>
                        </div>

                        <div className="text-right flex flex-col justify-center">
                           <p className="text-caption text-secondary/60 uppercase font-black tracking-widest">Date Émission</p>
                           <p className="text-body-small font-bold text-kongo-black italic">{new Date(bookingData?.created_at).toLocaleDateString('fr-CD')} à {new Date(bookingData?.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                     </div>

                     <div className="bg-kongo-lime/5 p-6 rounded-3xl flex items-center gap-6 border border-kongo-lime/10">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-border-primary/5">
                           <QRCodeSVG 
                             value={`TICKET-${bookingData?.booking_code}`} 
                             size={80} 
                             fgColor="#000000"
                           />
                        </div>
                        <div className="flex-1">
                           <p className="text-body-small font-black text-kongo-black uppercase tracking-tight">QR CODE ACCÈS</p>
                           <p className="text-[10px] text-secondary/60 leading-relaxed mt-1">
                             Présentez ce code à l'entrée du bus. Ce ticket est unique et nominatif.
                           </p>
                        </div>
                     </div>

                     {/* Perforated edge effect */}
                     <div className="absolute -bottom-3 left-0 w-full flex justify-center gap-2 overflow-hidden px-4">
                        {[...Array(15)].map((_, i) => (
                           <div key={i} className="w-6 h-6 bg-surface-secondary rounded-full border border-border-primary shrink-0" />
                        ))}
                     </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                 <Button className="h-16 btn-primary shadow-xl shadow-kongo-lime/20 uppercase tracking-widest font-black" onClick={() => window.print()}>
                    <Printer className="w-5 h-5 mr-3" /> Imprimer le ticket
                 </Button>
                 <Button variant="outline" className="h-16 rounded-2xl uppercase tracking-widest font-black btn-outline" onClick={() => window.location.reload()}>
                    Nouvelle session
                 </Button>
              </div>

              <div className="flex items-center gap-4 justify-center py-4 text-caption text-secondary/50 no-print">
                 <Smartphone className="w-4 h-4" />
                 <span>Version imprimable optimisée en format A4-ticket</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating total for seats step */}
      {currentStep === 'seats' && (
        <div className="fixed bottom-0 left-0 w-full bg-surface-elevated border-t border-border-primary p-4 shadow-2xl-strong z-50">
           <div className="container-professional flex items-center justify-between">
              <div className="hidden md:block">
                 <p className="text-caption text-secondary uppercase font-bold">Sélection en cours</p>
                 <p className="text-body-small font-bold">{selectedTrip.from} → {selectedTrip.to} | {selectedTrip.departure}</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-caption text-secondary">Total (HT)</p>
                    <p className="text-h4 font-black">{new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(passengers.reduce((sum, p) => sum + p.price, 0))}</p>
                 </div>
                 <Button className="btn-primary h-12 px-10" onClick={nextStep}>
                    Réserver & Payer <ChevronRight className="ml-2 w-4 h-4" />
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
