import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { 
  Ticket, Search, MapPin, User, Phone, CheckCircle2, ChevronRight, 
  Bus as BusIcon, Loader2, Clock, ChevronLeft, Printer, RefreshCw, 
  Users, CreditCard, Banknote, Plus, Minus, Zap, Package, 
  Utensils, Luggage, Trash2, Info, X, CATEGORY_ICONS 
} from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { TicketTemplate } from "../ui/TicketTemplate";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface ExtraService {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  min_weight?: number;
  max_weight?: number;
  is_active: boolean;
}

interface SelectedExtra {
  service: ExtraService;
  quantity: number;
}

type Step = "trip" | "seats" | "extras" | "info" | "confirm";
type PaymentMethod = "cash" | "mobile_money";

const STEPS: { key: Step; label: string }[] = [
  { key: "trip", label: "Voyage" },
  { key: "seats", label: "Sièges" },
  { key: "extras", label: "Extras" },
  { key: "info", label: "Passager" },
  { key: "confirm", label: "Fin" },
];


function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KG-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function NewBooking() {
  const { agencyId, userRole } = useAppState();
  const location = useLocation();
  const modifyBooking = location.state?.modifyBooking;
  const [currentStep, setCurrentStep] = useState<Step>("trip");
  const [isLoading, setIsLoading] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState({ fullName: "", phone: "" });
  const [customerSearch, setCustomerSearch] = useState("");
  const [matchingCustomers, setMatchingCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [isHandicap, setIsHandicap] = useState(false);

  // Extra services state
  const [availableServices, setAvailableServices] = useState<ExtraService[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const extrasTotal = selectedExtras.reduce((sum, e) => {
    if (e.service.category === 'Baggage') {
      const chargeableWeight = Math.max(0, e.quantity - (e.service.min_weight || 0));
      return sum + chargeableWeight * e.service.price;
    }
    return sum + e.service.price * e.quantity;
  }, 0);

  useEffect(() => {
    if (modifyBooking) {
      if (modifyBooking.profiles) {
        setPassengerInfo({ fullName: modifyBooking.profiles.full_name, phone: modifyBooking.profiles.phone_number });
        setSelectedCustomer(modifyBooking.profiles);
      } else if (modifyBooking.passenger_details) {
        setPassengerInfo({ fullName: modifyBooking.passenger_details.full_name, phone: modifyBooking.passenger_details.phone });
      }
      if (modifyBooking.seats) {
        setSelectedSeats(modifyBooking.seats);
      }
      if (modifyBooking.payment_method) {
        setPaymentMethod(modifyBooking.payment_method as PaymentMethod);
      }
    }
  }, [modifyBooking]);

  useEffect(() => {
    if (modifyBooking && trips.length > 0 && !selectedTrip) {
      const trip = trips.find(t => t.id === modifyBooking.trip_id);
      if (trip) {
        setSelectedTrip(trip);
      }
    }
  }, [modifyBooking, trips, selectedTrip]);

  useEffect(() => {
    if (modifyBooking && modifyBooking.extra_services && availableServices.length > 0 && selectedExtras.length === 0) {
      const parsedExtras = modifyBooking.extra_services.map((e: any) => {
        const service = availableServices.find(s => s.id === e.id);
        if (service) {
          return { service, quantity: e.quantity };
        }
        return null;
      }).filter(Boolean) as SelectedExtra[];
      setSelectedExtras(parsedExtras);
    }
  }, [modifyBooking, availableServices, selectedExtras.length]);

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("trips")
        .select(`
          id, departure_time, arrival_time, price, currency, seats_available,
          total_seats, status, duration, vehicle_type, handicap_seats,
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name),
          buses(id, name, capacity, plate_number)
        `)
        .eq("status", "scheduled")
        .gt("seats_available", 0)
        .order("departure_time", { ascending: true });

      // Cashiers only see their agency's trips
      if (agencyId && userRole !== "superuser") {
        query = query.eq("agency_id", agencyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTrips(data || []);
    } catch (e: any) {
      toast.error("Erreur chargement voyages: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, userRole]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const fetchOccupiedSeats = useCallback(async (tripId: string) => {
    setIsLoadingSeats(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, seats")
        .eq("trip_id", tripId)
        .in("status", ["confirmed", "pending", "completed"]);
      if (error) throw error;
      const allSeats: string[] = [];
      (data || []).forEach((b: any) => {
        if (modifyBooking && b.id === modifyBooking.id) return;
        if (Array.isArray(b.seats)) b.seats.forEach((s: string) => allSeats.push(s));
      });
      setOccupiedSeats(allSeats);
    } catch (e: any) {
      console.error("Erreur chargement sièges occupés:", e.message);
    } finally {
      setIsLoadingSeats(false);
    }
  }, [modifyBooking]);

  const fetchExtraServices = useCallback(async (currentAgencyId: string | null) => {
    if (!currentAgencyId) return;
    setIsLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from("extra_services")
        .select("id, title, description, category, price, is_active, min_weight, max_weight")
        .eq("agency_id", currentAgencyId)
        .eq("is_active", true)
        .order("category");
      if (error) throw error;
      setAvailableServices(data || []);
    } catch (e: any) {
      console.error("Erreur chargement services extra:", e.message);
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setMatchingCustomers([]);
      return;
    }
    setIsSearchingCustomers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`full_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .limit(5);
      if (error) throw error;
      setMatchingCustomers(data || []);
    } catch (e: any) {
      console.error("Erreur recherche clients:", e.message);
    } finally {
      setIsSearchingCustomers(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch) searchCustomers(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomers]);

  const handleBooking = async () => {
    if (!selectedTrip || !passengerInfo.fullName || !passengerInfo.phone) {
      toast.error("Veuillez remplir toutes les informations.");
      return;
    }
    if (userRole === 'superuser') {
      toast.error("Mode Audit : Les super-administrateurs ne peuvent pas émettre de billets.");
      return;
    }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      let finalUserId = selectedCustomer?.id;

      // If no customer selected, try to find by phone or create new
      if (!finalUserId) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone_number", passengerInfo.phone)
          .maybeSingle();
        
        if (existing) {
          finalUserId = existing.id;
        } else {
          // Create new profile for this customer
          const { data: newProfile, error: profileError } = await supabase
            .from("profiles")
            .insert({
              full_name: passengerInfo.fullName,
              phone_number: passengerInfo.phone,
              role: "client"
            })
            .select()
            .single();
          
          if (profileError) throw profileError;
          finalUserId = newProfile.id;
        }
      }

      const bookingCode = generateBookingCode();
      const seatPrice = selectedSeats.length * Number(selectedTrip.price);
      const totalPrice = seatPrice + extrasTotal;

      const payload: any = {
        trip_id: selectedTrip.id,
        user_id: finalUserId,
        cashier_id: user.id,
        status: "confirmed",
        payment_status: "paid",
        payment_method: paymentMethod,
        total_price: totalPrice,
        currency: selectedTrip.currency || "CDF",
        passenger_count: selectedSeats.length,
        contact_phone: passengerInfo.phone,
        contact_email: null,
        passenger_details: { full_name: passengerInfo.fullName, phone: passengerInfo.phone },
        seats: selectedSeats.map(s => String(s)),
        is_handicap: isHandicap,
        extra_services: selectedExtras.length > 0 ? selectedExtras.map(e => {
          const isBaggage = e.service.category === 'Baggage';
          const chargeableWeight = isBaggage ? Math.max(0, e.quantity - (e.service.min_weight || 0)) : e.quantity;
          const subtotal = chargeableWeight * e.service.price;
          return {
            id: e.service.id, 
            title: e.service.title, 
            quantity: e.quantity, 
            unit_price: e.service.price, 
            subtotal: subtotal
          };
        }) : null,
      };

      let bookingResponse;

      if (modifyBooking) {
        const { data: booking, error } = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", modifyBooking.id)
          .select()
          .single();
          
        if (error) throw error;
        bookingResponse = booking;

        if (modifyBooking.trip_id === selectedTrip.id) {
          const originalCount = modifyBooking.seats ? modifyBooking.seats.length : 0;
          const diff = selectedSeats.length - originalCount;
          if (diff !== 0) {
            await supabase
              .from("trips")
              .update({ seats_available: selectedTrip.seats_available - diff })
              .eq("id", selectedTrip.id);
          }
        } else {
          const oldTrip = trips.find(t => t.id === modifyBooking.trip_id);
          if (oldTrip) {
            await supabase
              .from("trips")
              .update({ seats_available: oldTrip.seats_available + (modifyBooking.seats?.length || 0) })
              .eq("id", oldTrip.id);
          }
          await supabase
            .from("trips")
            .update({ seats_available: selectedTrip.seats_available - selectedSeats.length })
            .eq("id", selectedTrip.id);
        }
      } else {
        payload.booking_code = bookingCode;
        const { data: booking, error } = await supabase
          .from("bookings")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        bookingResponse = booking;

        await supabase
          .from("trips")
          .update({ seats_available: selectedTrip.seats_available - selectedSeats.length })
          .eq("id", selectedTrip.id);

        // Decrement handicap seats if this is a PMR booking
        if (isHandicap && (selectedTrip.handicap_seats ?? 0) > 0) {
          await supabase
            .from("trips")
            .update({ handicap_seats: Math.max(0, (selectedTrip.handicap_seats ?? 0) - selectedSeats.length) })
            .eq("id", selectedTrip.id);
        }
      }

      setCreatedBooking({ ...bookingResponse, passengerInfo, selectedTrip, selectedSeats, totalPrice, selectedExtras });
      toast.success(modifyBooking ? "✅ Réservation modifiée !" : "✅ Billet émis avec succès !");
      setCurrentStep("confirm");
    } catch (e: any) {
      toast.error("Échec: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // If modifying, resetting should probably go back to bookings or clear the modification state
    // Let's clear the state and just do a new booking
    setCurrentStep("trip");
    setSelectedTrip(null);
    setSelectedSeats([]);
    setOccupiedSeats([]);
    setPassengerInfo({ fullName: "", phone: "" });
    setCustomerSearch("");
    setMatchingCustomers([]);
    setSelectedCustomer(null);
    setPaymentMethod("cash");
    setCreatedBooking(null);
    setSelectedExtras([]);
    setAvailableServices([]);
    fetchTrips();
    // Also change URL state so reloading doesn't put us back in edit mode
    window.history.replaceState({}, document.title);
  };

  // Bus seat label helpers
  const COLS = ["A", "B", "C", "D"];
  const getSeatLabel = (idx: number) => `${Math.floor(idx / 4) + 1}${COLS[idx % 4]}`;
  const getTotalSeats = (trip: any) => trip?.buses?.capacity || trip?.total_seats || 40;
  
  const sortSeats = (seats: string[]) => {
    return [...seats].sort((a, b) => {
      const rowA = parseInt(a);
      const rowB = parseInt(b);
      if (rowA !== rowB) return rowA - rowB;
      return a.localeCompare(b);
    });
  };

  const filteredTrips = trips.filter(
    (t) =>
      t.origin?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">{modifyBooking ? "Modifier la Réservation" : "Vendre un Billet"}</h1>
        <p className="text-[15px] text-[#86868B] mt-1">{modifyBooking ? "Modification d'un ticket existant" : "Émission rapide de tickets pour les passagers"}</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, idx) => {
          const stepIdx = STEPS.findIndex(s => s.key === currentStep);
          const isActive = step.key === currentStep;
          const isDone = idx < stepIdx;
          return (
            <React.Fragment key={step.key}>
              <div className={`flex flex-col items-center gap-1.5 ${isActive ? "text-[#007AFF]" : isDone ? "text-[#34C759]" : "text-[#86868B]"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold border-2 transition-all
                  ${isActive ? "border-[#007AFF] bg-[#007AFF]/10" : isDone ? "border-[#34C759] bg-[#34C759]/10" : "border-black/10 bg-white"}`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-[11px] font-semibold">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-[2px] w-10 mb-5 transition-colors ${idx < stepIdx ? "bg-[#34C759]" : "bg-black/10"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Select Trip ── */}
        {currentStep === "trip" && (
          <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
            <div className="flex gap-3">
              <div className="flex items-center flex-1 gap-3 bg-white px-4 rounded-2xl border border-black/5 shadow-sm">
                <Search className="w-5 h-5 text-[#86868B] shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher départ ou arrivée..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-12 bg-transparent outline-none text-[15px]"
                />
              </div>
              <button
                onClick={fetchTrips}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-black/5 shadow-sm hover:bg-black/5 transition-colors"
                title="Rafraîchir"
              >
                <RefreshCw className="w-5 h-5 text-[#86868B]" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-20 text-[#86868B]">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-[14px] font-medium">Chargement des voyages...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-20 text-[#86868B]">
                <BusIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucun voyage disponible</p>
                <p className="text-[13px] mt-1">Essayez un autre mot-clé ou vérifiez plus tard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTrips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => { setSelectedTrip(trip); setSelectedSeats([]); setOccupiedSeats([]); }}
                    className={`text-left rounded-2xl border-2 p-5 transition-all hover:scale-[1.01] active:scale-[0.99]
                      ${selectedTrip?.id === trip.id
                        ? "border-[#007AFF] bg-[#007AFF]/5 shadow-lg shadow-[#007AFF]/10"
                        : "border-black/5 bg-white hover:border-[#007AFF]/30 shadow-sm"}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[#007AFF]" />
                        </div>
                        <div>
                          <p className="text-[16px] font-bold text-[#1D1D1F]">
                            {trip.origin?.name} → {trip.destination?.name}
                          </p>
                          <p className="text-[12px] text-[#86868B] mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(trip.departure_time).toLocaleString("fr-FR", {
                              weekday: "short", day: "2-digit", month: "short",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[17px] font-black text-[#1D1D1F]">
                        {Number(trip.price).toLocaleString()} {trip.currency || "FC"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-[#86868B] border-t border-black/5 pt-3">
                      <span className="flex items-center gap-1.5">
                        <BusIcon className="w-3.5 h-3.5" />
                        {trip.buses?.name || "Bus standard"} {trip.buses?.plate_number ? `· ${trip.buses.plate_number}` : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {trip.seats_available} places libres
                      </span>
                      {(trip.handicap_seats ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-blue-600 font-bold">
                          ♿ {trip.handicap_seats} PMR
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                disabled={!selectedTrip}
                onClick={() => { fetchOccupiedSeats(selectedTrip!.id); setCurrentStep("seats"); }}
                className="px-8 h-12 bg-[#1D1D1F] text-white rounded-xl font-semibold hover:bg-[#2C2C2E] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continuer <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Select Seats ── */}
        {currentStep === "seats" && selectedTrip && (
          <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Sélection des Places</CardTitle>
                <CardDescription>
                  {selectedTrip.origin?.name} → {selectedTrip.destination?.name} ·{" "}
                  <span className="font-semibold text-[#1D1D1F]">{Number(selectedTrip.price).toLocaleString()} {selectedTrip.currency || "FC"} / place</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* PMR Toggle */}
                {(selectedTrip.handicap_seats ?? 0) > 0 && (
                  <div
                    onClick={() => setIsHandicap(v => !v)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isHandicap ? 'border-blue-500 bg-blue-50' : 'border-black/10 bg-white'
                    }`}
                  >
                    <span className="text-2xl">♿</span>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-[#1D1D1F]">Passager PMR (mobilité réduite)</p>
                      <p className="text-[12px] text-[#86868B]">{selectedTrip.handicap_seats} place{selectedTrip.handicap_seats > 1 ? 's' : ''} PMR disponible{selectedTrip.handicap_seats > 1 ? 's' : ''} sur ce voyage</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isHandicap ? 'border-blue-500 bg-blue-500' : 'border-black/20'
                    }`}>
                      {isHandicap && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                  </div>
                )}
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-[12px] font-medium text-[#86868B]">
                  <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-[#007AFF] inline-block" />Sélectionné</span>
                  <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-[#FF3B30]/20 border border-[#FF3B30]/30 inline-block" />Occupé</span>
                  <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-black/5 inline-block" />Libre</span>
                </div>

                {/* Bus Seat Grid */}
                {isLoadingSeats ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-[#86868B]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[14px] font-medium">Chargement des places...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[260px] max-w-xs mx-auto">
                      {/* Column headers */}
                      <div className="grid grid-cols-[32px_1fr_1fr_16px_1fr_1fr] gap-1.5 mb-2">
                        <div />
                        {["A", "B", "", "C", "D"].map((col, i) => (
                          <div key={i} className={`text-center text-[12px] font-bold text-[#86868B] ${col === "" ? "w-4" : ""}`}>{col}</div>
                        ))}
                      </div>
                      {/* Rows */}
                      {Array.from({ length: Math.ceil(getTotalSeats(selectedTrip) / 4) }).map((_, rowIdx) => {
                        const row = rowIdx + 1;
                        return (
                          <div key={row} className="grid grid-cols-[32px_1fr_1fr_16px_1fr_1fr] gap-1.5 mb-1.5">
                            {/* Row number */}
                            <div className="flex items-center justify-center text-[12px] font-bold text-[#86868B]">{row}</div>
                            {["A", "B", null, "C", "D"].map((col, colIdx) => {
                              if (col === null) return <div key="aisle" />;
                              const seatLabel = `${row}${col}`;
                              const seatIndex = rowIdx * 4 + ["A","B","C","D"].indexOf(col);
                              if (seatIndex >= getTotalSeats(selectedTrip)) {
                                return <div key={col} />;
                              }
                              const isOccupied = occupiedSeats.includes(seatLabel);
                              const isSelected = selectedSeats.includes(seatLabel);
                              return (
                                <button
                                  key={col}
                                  disabled={isOccupied}
                                  onClick={() =>
                                    setSelectedSeats((prev) =>
                                      prev.includes(seatLabel)
                                        ? prev.filter((s) => s !== seatLabel)
                                        : [...prev, seatLabel]
                                    )
                                  }
                                  title={isOccupied ? `${seatLabel} — Occupé` : seatLabel}
                                  className={`h-10 rounded-lg text-[12px] font-bold transition-all
                                    ${isOccupied
                                      ? "bg-[#FF3B30]/15 text-[#FF3B30]/60 border border-[#FF3B30]/20 cursor-not-allowed"
                                      : isSelected
                                      ? "bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30 scale-105"
                                      : "bg-black/5 text-[#86868B] hover:bg-[#007AFF]/10 hover:text-[#007AFF]"}`}
                                >
                                  {seatLabel}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-black/5 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wide">Sièges</p>
                    <p className="text-[17px] font-bold text-[#1D1D1F] mt-0.5">
                      {selectedSeats.length > 0 ? sortSeats(selectedSeats).join(", ") : "Aucun"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wide">Total</p>
                    <p className="text-[22px] font-black text-[#007AFF]">
                      {(selectedSeats.length * Number(selectedTrip.price)).toLocaleString()} {selectedTrip.currency || "FC"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setCurrentStep("trip")} className="h-12 px-6 rounded-xl border border-black/10 font-semibold text-[#1D1D1F] hover:bg-black/5 flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    disabled={selectedSeats.length === 0}
                    onClick={() => { fetchExtraServices(agencyId); setCurrentStep("extras"); }}
                    className="flex-1 h-12 bg-[#1D1D1F] text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-[#2C2C2E] transition-all"
                  >
                    Continuer vers les extras
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 2.5: Extra Services ── */}
        {currentStep === "extras" && selectedTrip && (
          <motion.div key="step-extras" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="max-w-2xl mx-auto space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Services Supplémentaires</CardTitle>
                <CardDescription>Ajoutez des bagages, repas ou autres options pour ce voyage (optionnel).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingServices ? (
                  <div className="flex items-center justify-center py-10 gap-3 text-[#86868B]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[14px] font-medium">Chargement des services...</span>
                  </div>
                ) : availableServices.length === 0 ? (
                  <div className="text-center py-10 text-[#86868B]">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="font-medium text-[14px]">Aucun service disponible pour cette agence.</p>
                    <p className="text-[12px] mt-1">Vous pouvez passer directement à l'étape suivante.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableServices.map((service) => {
                      const Icon = CATEGORY_ICONS[service.category] || Package;
                      const existing = selectedExtras.find(e => e.service.id === service.id);
                      const qty = existing?.quantity || 0;
                      return (
                        <div key={service.id} className={`p-4 rounded-2xl border-2 transition-all ${
                          qty > 0 ? "border-[#007AFF] bg-[#007AFF]/5" : "border-black/5 bg-white"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-[#1D1D1F]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-[#1D1D1F] truncate">{service.title}</p>
                              <p className="text-[12px] text-[#86868B] truncate">{service.description}</p>
                              {service.category === 'Baggage' ? (
                                <p className="text-[13px] font-black text-[#007AFF] mt-1">
                                  {service.price.toLocaleString()} {selectedTrip.currency || "FC"} / kg
                                  {service.min_weight ? ` (Franchise: ${service.min_weight}kg)` : ""}
                                </p>
                              ) : (
                                <p className="text-[13px] font-black text-[#007AFF] mt-1">{service.price.toLocaleString()} {selectedTrip.currency || "FC"}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                            {service.category === 'Baggage' ? (
                               <div className="flex items-center gap-2 w-full">
                                  <input 
                                    type="number"
                                    min="0"
                                    placeholder="Poids total (kg)"
                                    value={qty || ""}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setSelectedExtras(prev => {
                                        const filtered = prev.filter(ex => ex.service.id !== service.id);
                                        if (val > 0) {
                                          return [...filtered, { service, quantity: val }];
                                        }
                                        return filtered;
                                      });
                                    }}
                                    className="w-full h-10 px-3 bg-black/5 border border-black/10 rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#007AFF]/20"
                                  />
                                  <span className="text-[13px] font-bold text-[#86868B] shrink-0">kg</span>
                               </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setSelectedExtras(prev => {
                                    const idx = prev.findIndex(e => e.service.id === service.id);
                                    if (idx >= 0 && prev[idx].quantity <= 1) return prev.filter(e => e.service.id !== service.id);
                                    if (idx >= 0) return prev.map((e, i) => i === idx ? { ...e, quantity: e.quantity - 1 } : e);
                                    return prev;
                                  })}
                                  disabled={qty === 0}
                                  className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 disabled:opacity-30 transition-all"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[16px] font-black text-[#1D1D1F] w-8 text-center">{qty}</span>
                                <button
                                  onClick={() => setSelectedExtras(prev => {
                                    const idx = prev.findIndex(e => e.service.id === service.id);
                                    if (idx >= 0) return prev.map((e, i) => i === idx ? { ...e, quantity: e.quantity + 1 } : e);
                                    return [...prev, { service, quantity: 1 }];
                                  })}
                                  className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center hover:bg-[#007AFF]/20 text-[#007AFF] transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedExtras.length > 0 && (
                  <div className="bg-black/5 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wide">Services sélectionnés</p>
                      <p className="text-[14px] font-bold text-[#1D1D1F] mt-0.5">
                        {selectedExtras.map(e => `${e.service.title} ${e.service.category === 'Baggage' ? `${e.quantity}kg` : `x${e.quantity}`}`).join(" · ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wide">Sous-total</p>
                      <p className="text-[20px] font-black text-[#007AFF]">{extrasTotal.toLocaleString()} {selectedTrip.currency || "FC"}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setCurrentStep("seats")} className="h-12 px-6 rounded-xl border border-black/10 font-semibold text-[#1D1D1F] hover:bg-black/5 flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={() => setCurrentStep("info")}
                    className="flex-1 h-12 bg-[#1D1D1F] text-white rounded-xl font-semibold hover:bg-[#2C2C2E] transition-all"
                  >
                    {selectedExtras.length > 0 ? `Continuer (+ ${extrasTotal.toLocaleString()} ${selectedTrip.currency || "FC"})` : "Passer (sans extras)"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 3: Passenger Info ── */}
        {currentStep === "info" && (
          <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client & Passager</CardTitle>
                  <CardDescription>Rechercher ou créer un profil client</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search bar */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou téléphone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-black/5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-[15px]"
                      />
                      {isSearchingCustomers && (
                        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#86868B]" />
                      )}
                    </div>

                    {/* Search Results */}
                    <AnimatePresence>
                      {matchingCustomers.length > 0 && !selectedCustomer && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white border border-black/5 rounded-2xl shadow-xl overflow-hidden overflow-y-auto max-h-[200px] z-10"
                        >
                          {matchingCustomers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setPassengerInfo({ fullName: c.full_name, phone: c.phone_number });
                                setCustomerSearch("");
                                setMatchingCustomers([]);
                              }}
                              className="w-full p-4 text-left hover:bg-[#007AFF]/5 flex items-center justify-between border-b border-black/5 last:border-0 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center font-bold text-[#007AFF]">
                                  {c.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[15px] font-bold text-[#1D1D1F]">{c.full_name}</p>
                                  <p className="text-[13px] text-[#86868B]">{c.phone_number}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#86868B]" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/5" /></div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-black"><span className="bg-white px-3 text-[#86868B]">Détails du voyageur</span></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full name */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide">Nom complet</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                        <input
                          type="text"
                          placeholder="Jean Dupont"
                          value={passengerInfo.fullName}
                          onChange={(e) => {
                            setPassengerInfo({ ...passengerInfo, fullName: e.target.value });
                            if (selectedCustomer) setSelectedCustomer(null);
                          }}
                          className="w-full h-11 pl-10 pr-4 bg-black/5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-[15px]"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide">Téléphone</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                        <input
                          type="tel"
                          placeholder="+243 8X XXX XXXX"
                          value={passengerInfo.phone}
                          onChange={(e) => {
                            setPassengerInfo({ ...passengerInfo, phone: e.target.value });
                            if (selectedCustomer) setSelectedCustomer(null);
                          }}
                          className="w-full h-11 pl-10 pr-4 bg-black/5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-[15px]"
                        />
                      </div>
                    </div>
                  </div>

                  {selectedCustomer && (
                    <div className="flex items-center gap-2 p-3 bg-[#34C759]/10 rounded-xl border border-[#34C759]/20">
                      <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                      <span className="text-[13px] font-semibold text-[#34C759]">Profil client lié : {selectedCustomer.full_name}</span>
                      <button onClick={() => setSelectedCustomer(null)} className="ml-auto text-[11px] font-bold text-[#34C759] hover:underline uppercase tracking-wider">Détacher</button>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide">Mode de paiement</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { id: "cash", label: "Espèces", Icon: Banknote },
                        { id: "mobile_money", label: "Mobile Money", Icon: CreditCard },
                      ] as { id: PaymentMethod; label: string; Icon: any }[]).map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPaymentMethod(id)}
                          className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all
                            ${paymentMethod === id
                              ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF]"
                              : "border-black/5 bg-white text-[#86868B] hover:border-black/10"}`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[12px] font-bold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <button onClick={() => setCurrentStep("extras")} className="h-12 px-6 rounded-xl border border-black/10 font-semibold text-[#1D1D1F] hover:bg-black/5 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <button
                  disabled={isLoading || !passengerInfo.fullName || !passengerInfo.phone || userRole === 'superuser'}
                  onClick={handleBooking}
                  className="flex-1 h-12 bg-[#007AFF] text-white rounded-xl font-bold disabled:opacity-40 hover:bg-[#0071E3] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/25"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Ticket className="w-5 h-5" /> {userRole === 'superuser' ? "Audit (Lecture seule)" : "Confirmer & Émettre"}</>}
                </button>
              </div>
            </div>

            {/* Sidebar Recap */}
            <div className="md:col-span-2 space-y-4">
              <Card className="bg-[#1D1D1F] text-white border-0 overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-4">
                  <CardTitle className="text-white text-[17px]">Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Voyage</p>
                      <p className="text-[15px] font-bold">{selectedTrip?.origin?.name} → {selectedTrip?.destination?.name}</p>
                      <p className="text-[12px] text-white/60">
                        {new Date(selectedTrip?.departure_time).toLocaleString("fr-FR", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Sièges ({selectedSeats.length})</p>
                      <p className="text-[15px] font-bold">{sortSeats(selectedSeats).join(", ")}</p>
                    </div>
                    {selectedExtras.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Extras</p>
                        {selectedExtras.map(e => {
                          const isBaggage = e.service.category === 'Baggage';
                          const chargeableWeight = isBaggage ? Math.max(0, e.quantity - (e.service.min_weight || 0)) : e.quantity;
                          const subtotal = chargeableWeight * e.service.price;
                          return (
                            <p key={e.service.id} className="text-[13px] font-medium flex justify-between">
                              <span>{e.service.title} {isBaggage ? `${e.quantity}kg` : `x${e.quantity}`}</span>
                              <span className="text-white/60">{subtotal.toLocaleString()}</span>
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="p-5 bg-white/5 border-t border-white/10">
                    <div className="flex justify-between items-end">
                      <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Total à payer</p>
                      <div className="text-right">
                        <p className="text-[24px] font-black text-[#007AFF]">
                          {(selectedSeats.length * Number(selectedTrip?.price) + extrasTotal).toLocaleString()}
                        </p>
                        <p className="text-[11px] font-bold text-white/40">{selectedTrip?.currency || "FC"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Note pour le caissier
                </p>
                Assurez-vous que l'identité du client correspond à sa pièce d'identité avant de finaliser la vente.
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: Confirmation ── */}
        {currentStep === "confirm" && createdBooking && (
          <motion.div key="step4" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto space-y-6">
            {/* Success badge */}
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-[#34C759] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-[#34C759]/25">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-[26px] font-bold text-[#1D1D1F] mt-4">{modifyBooking ? "Billet Modifié !" : "Billet Émis !"}</h2>
              <p className="text-[#86868B] mt-1">{modifyBooking ? "La réservation a été mise à jour avec succès." : "Le ticket a été enregistré avec succès."}</p>
            </div>

            {/* Ticket card */}
            <TicketTemplate
              bookingCode={createdBooking.booking_code}
              passengerName={createdBooking.passengerInfo.fullName}
              passengerPhone={createdBooking.passengerInfo.phone}
              tripOrigin={createdBooking.selectedTrip.origin?.name}
              tripDestination={createdBooking.selectedTrip.destination?.name}
              departureTime={new Date(createdBooking.selectedTrip.departure_time).toLocaleString("fr-FR", {
                weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
              })}
              seats={sortSeats(createdBooking.selectedSeats)}
              extras={createdBooking.selectedExtras?.length > 0 ? createdBooking.selectedExtras.map((e: SelectedExtra) => ({
                title: e.service.title,
                quantity: e.quantity,
                unit_price: e.service.price,
                category: e.service.category?.toLowerCase(),
                min_weight: e.service.min_weight
              })) : []}
              totalAmount={createdBooking.totalPrice}
              currency={createdBooking.selectedTrip.currency || "FC"}
              agencyName={createdBooking.selectedTrip.agencies?.name}
              paymentMethod={createdBooking.payment_method}
            />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.print()}
                className="h-12 bg-[#007AFF] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0071E3] transition-all"
              >
                <Printer className="w-5 h-5" /> Imprimer le Billet
              </button>
              <button
                onClick={handleReset}
                className="h-12 bg-white border border-black/10 text-[#1D1D1F] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black/5 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Nouvelle Vente
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
