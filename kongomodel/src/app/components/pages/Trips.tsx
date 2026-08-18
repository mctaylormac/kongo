import React, { useState, useEffect } from "react";
import { Plus, Calendar, MapPin, Clock, Users, DollarSign, Loader2, Search, ArrowRight, Trash2, Edit2, AlertCircle, Bus, Printer, Flag, OctagonX, AlertTriangle } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AddTripForm } from "../forms/AddTripForm";


interface TripData {
  id: string;
  bus_id: string;
  driver_id: string;
  departure_time: string;
  status: string;
  price: number;
  origin_location_id?: string;
  destination_location_id?: string;
  arrival_time?: string;
  vehicle_type?: string;
  bus_type?: string;
  train_class?: string;
  amenities?: string[];
  departure_address?: string;
  arrival_address?: string;
  stops_ids?: string[];
  departure_stop_id?: string;
  arrival_stop_id?: string;
  origin?: { name: string };
  dest?: { name: string };
  buses?: { plate_number: string; capacity: number };
  profiles?: { full_name: string };
  bookings_count?: number;
  agencies?: { name: string };
  handicap_seats?: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled:   { label: "Programmé",  color: "bg-[#007AFF]/10 text-[#007AFF]" },
  in_progress: { label: "En Cours",   color: "bg-[#FF9500]/10 text-[#FF9500]" },
  full:        { label: "Complet",    color: "bg-[#34C759]/10 text-[#34C759]" },
  departed:    { label: "En Route",   color: "bg-[#FF9500]/10 text-[#FF9500]" },
  completed:   { label: "Terminé",    color: "bg-gray-100 text-gray-500" },
  cancelled:   { label: "Annulé",     color: "bg-[#FF3B30]/10 text-[#FF3B30]" },
  delayed:     { label: "Retardé",    color: "bg-yellow-100 text-yellow-600" },
};

export function Trips() {
  const { userRole, agencyId, isLoading: isAppStateLoading } = useAppState();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null);
  const [endTripModal, setEndTripModal] = useState<{ open: boolean; trip: TripData | null }>({ open: false, trip: null });
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          origin:locations!origin_location_id(name),
          dest:locations!destination_location_id(name),
          buses(plate_number, capacity),
          profiles!driver_id(full_name),
          agencies(name)
        `)
        .order('departure_time', { ascending: true });

      if (userRole !== 'superuser') {
        if (!agencyId) {
          setTrips([]);
          setIsLoading(false);
          return;
        }
        query = query.eq('agency_id', agencyId); 
      }

      const { data, error } = await query;
      if (error) throw error;

      // Simulation du comptage des réservations pour chaque voyage
      const tripsWithBookings = await Promise.all((data || []).map(async (trip) => {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', trip.id)
          .not('status', 'eq', 'cancelled');
        return { ...trip, bookings_count: count || 0 };
      }));

      setTrips(tripsWithBookings as any[]);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Échec du chargement des voyages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce voyage ?")) return;
    try {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      toast.success("Voyage supprimé");
      fetchTrips();
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    }
  };

  const handleEndTrip = async () => {
    if (!endTripModal.trip) return;
    setIsEndingTrip(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'completed' })
        .eq('id', endTripModal.trip.id);
      if (error) throw error;
      toast.success('🏁 Voyage terminé !', {
        description: `${endTripModal.trip.origin?.name ?? ''} → ${endTripModal.trip.dest?.name ?? ''} a été clôturé avec succès.`,
      });
      setEndTripModal({ open: false, trip: null });
      fetchTrips();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setIsEndingTrip(false);
    }
  };

  const handlePrintManifest = async (trip: TripData) => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          seats,
          passenger_details,
          contact_phone
        `)
        .eq('trip_id', trip.id)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;

      if (!bookings || bookings.length === 0) {
        toast.error("Aucun passager pour ce voyage.");
        return;
      }

      // Flatten bookings into individual seats
      const flattenedBookings: { seat: string; name: string; phone: string }[] = [];
      bookings.forEach((booking: any) => {
        const seatsArray = booking.seats || [];
        const details = booking.passenger_details || {};
        const name = details.full_name || "Inconnu";
        const phone = details.phone || booking.contact_phone || "Inconnu";
        
        seatsArray.forEach((seat: string) => {
          flattenedBookings.push({ seat, name, phone });
        });
      });

      // Sort by seat number numerically if possible
      const sortedBookings = flattenedBookings.sort((a, b) => {
        const numA = parseInt(a.seat) || 0;
        const numB = parseInt(b.seat) || 0;
        if (numA !== numB) return numA - numB;
        return a.seat.localeCompare(b.seat);
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Veuillez autoriser les pop-ups pour imprimer.");
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Manifeste - Voyage ${trip.id.substring(0, 8)}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #000; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 18px; color: #555; margin-bottom: 20px; font-weight: normal; }
            .info-section { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .info-section p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            @media print {
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>Manifeste des Passagers</h1>
          <h2>${trip.origin?.name || "Origine"} - ${trip.dest?.name || "Destination"}</h2>
          
          <div class="info-section">
            <p><strong>Date de départ :</strong> ${format(new Date(trip.departure_time), "dd/MM/yyyy à HH:mm")}</p>
            <p><strong>Bus :</strong> ${trip.buses?.plate_number || "Non assigné"}</p>
            <p><strong>Chauffeur :</strong> ${trip.profiles?.full_name || "Non assigné"}</p>
            <p><strong>Total places réservées :</strong> ${sortedBookings.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%">Place</th>
                <th style="width: 50%">Nom Complet</th>
                <th style="width: 35%">Numéro de Téléphone</th>
              </tr>
            </thead>
            <tbody>
              ${sortedBookings.map(b => `
                <tr>
                  <td>${b.seat || '-'}</td>
                  <td>${b.name || '-'}</td>
                  <td>${b.phone || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.setTimeout(function(){ window.close(); }, 500); }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

    } catch (error: any) {
      console.error("Error printing manifest:", error);
      toast.error("Erreur lors de l'impression: " + error.message);
    }
  };

  useEffect(() => {
    if (!isAppStateLoading && userRole !== 'guest') {
      fetchTrips();
    }
  }, [userRole, agencyId, isAppStateLoading]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Gestion des Voyages</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Programmez et gérez les départs de vos bus</p>
        </div>
        {(userRole === 'agency' || userRole === 'chef') && (
          <button
            onClick={() => { setEditingTrip(null); setShowCreateModal(true); }}
            className="h-11 px-6 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3A3A3C] transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[15px] font-medium">Créer un Voyage</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
              📅
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Voyages Prévus</p>
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none mt-1">{trips.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-xl">
              🎟️
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Réservations</p>
              <p className="text-[24px] font-bold text-[#34C759] leading-none mt-1">
                {trips.reduce((acc, trip) => acc + (trip.bookings_count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
              💰
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Estimation CA</p>
              <p className="text-[24px] font-bold text-[#FF9500] leading-none mt-1">
                {(trips.reduce((acc, trip) => acc + ((trip.bookings_count || 0) * trip.price), 0) / 2500).toFixed(1)}k$
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-xl">
              📈
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Taux Occ.</p>
              <p className="text-[24px] font-bold text-[#AF52DE] leading-none mt-1">
                {trips.length > 0 
                  ? Math.round((trips.reduce((acc, t) => acc + (t.bookings_count || 0), 0) / trips.reduce((acc, t) => acc + (t.buses?.capacity || 0), 0)) * 100) 
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips List */}
      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardHeader className="bg-black/[0.01] border-b border-black/5 px-6 py-4">
          <CardTitle className="text-[17px] font-bold">Voyages à venir</CardTitle>
          <CardDescription>Départs prévus pour les 7 prochains jours</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-black/5">
            {isLoading ? (
              <div className="p-20 text-center flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#1D1D1F]/20" />
                <p className="text-[14px] text-[#86868B] font-medium">Chargement des voyages...</p>
              </div>
            ) : trips.length > 0 ? (
              trips.map((trip) => {
                const canEnd = ['scheduled', 'in_progress', 'departed'].includes(trip.status);
                return (
                <div key={trip.id} className={`p-6 transition-all group border-l-4 ${
                  trip.status === 'in_progress' ? 'border-l-[#FF9500] hover:bg-orange-50/30' :
                  trip.status === 'departed'    ? 'border-l-[#007AFF] hover:bg-blue-50/30' :
                  trip.status === 'completed'   ? 'border-l-gray-200 opacity-60' :
                  'border-l-transparent hover:bg-black/[0.01]'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/5 flex items-center justify-center shadow-inner">
                          <MapPin className="w-6 h-6 text-[#007AFF]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[19px] font-bold text-[#1D1D1F] tracking-tight">
                              {trip.origin?.name || "Origine Inconnue"} <ArrowRight className="inline-block w-4 h-4 mx-1 text-[#86868B]" /> {trip.dest?.name || "Destination Inconnue"}
                            </h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${(statusConfig[trip.status] || { color: "bg-gray-100 text-gray-500" }).color}`}>
                              {(statusConfig[trip.status] || { label: trip.status || "Inconnu" }).label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] text-[#86868B] font-medium mt-0.5">Réf: {trip.id.substring(0, 8)}</p>
                            {userRole === 'superuser' && trip.agencies?.name && (
                              <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-100/50">
                                {trip.agencies.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Départ</p>
                          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1D1D1F]">
                            <Calendar className="w-3.5 h-3.5 text-[#007AFF]" />
                            {format(new Date(trip.departure_time), "dd MMM yyyy", { locale: fr })}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-[#86868B]">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(trip.departure_time), "HH:mm")}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Flotte &amp; Staff</p>
                          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1D1D1F]">
                            <Bus className="w-3.5 h-3.5 text-[#34C759]" />
                            {trip.buses?.plate_number}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-[#86868B]">
                            <Users className="w-3.5 h-3.5" />
                            {trip.profiles?.full_name || "En attente"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Prix Billet</p>
                          <div className="flex items-center gap-2 text-[16px] font-bold text-[#1D1D1F]">
                            {trip.price.toLocaleString()} <span className="text-[12px] font-medium text-[#86868B]">CDF</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider text-right">Remplissage</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  (trip.bookings_count || 0) / (trip.buses?.capacity || 1) > 0.9 ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'
                                }`}
                                style={{ width: `${((trip.bookings_count || 0) / (trip.buses?.capacity || 1)) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-[13px] font-bold text-[#1D1D1F]">
                              {trip.bookings_count}/{trip.buses?.capacity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Handicap Seats Badge */}
                      {(trip.handicap_seats ?? 0) > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-[12px] font-bold px-3 py-1 rounded-full">
                          <span>♿</span>
                          <span>{trip.handicap_seats} place{(trip.handicap_seats ?? 0) > 1 ? 's' : ''} PMR disponible{(trip.handicap_seats ?? 0) > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {userRole !== 'superuser' && (
                      <div className="flex lg:flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        {/* Bouton Terminer le voyage */}
                        {canEnd && (
                          <button
                            onClick={() => setEndTripModal({ open: true, trip })}
                            title="Terminer ce voyage"
                            className="flex-1 lg:flex-none h-10 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-[13px] hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                          >
                            <Flag className="w-4 h-4" /> Terminer
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrintManifest(trip)}
                          className="flex-1 lg:flex-none h-10 px-4 bg-blue-50 text-blue-600 rounded-xl font-bold text-[13px] hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                          title="Imprimer le manifeste"
                        >
                          <Printer className="w-4 h-4" /> Manifeste
                        </button>
                        {userRole !== 'cashier' && (
                          <>
                            <button 
                              onClick={() => { setEditingTrip(trip); setShowCreateModal(true); }}
                              className="flex-1 lg:flex-none h-10 px-4 bg-black/5 rounded-xl font-bold text-[13px] hover:bg-black/10 transition-all flex items-center justify-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Modifier
                            </button>
                            <button 
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                );
              })
            ) : (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-[#86868B]" />
                </div>
                <p className="text-[16px] text-[#86868B] font-medium italic">Aucun voyage programmé pour le moment.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-2xl shadow-2xl">
            <CardHeader>
              <CardTitle>{editingTrip ? "Modifier le Voyage" : "Nouveau Voyage"}</CardTitle>
              <CardDescription>
                {editingTrip ? "Modifiez les informations du départ prévu." : "Programmez un nouveau départ sur l'une de vos routes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddTripForm 
                onSuccess={() => {
                  setShowCreateModal(false);
                  setEditingTrip(null);
                  fetchTrips();
                }}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingTrip(null);
                }}
                initialData={editingTrip} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Modale Terminer le Voyage ── */}
      {endTripModal.open && endTripModal.trip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* En-tête */}
            <div className="bg-gradient-to-br from-red-600 to-rose-700 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.07]">
                <Flag className="w-56 h-56 text-white absolute -right-10 -bottom-10 rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                  <Flag className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-[22px] font-black text-white tracking-tight">Terminer le Voyage</h2>
                <p className="text-[12px] text-white/60 mt-1 font-semibold uppercase tracking-widest">Suivi Bus • Action irréversible</p>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-4">
              {/* Récap voyage */}
              <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <div>
                    <p className="font-black text-[#1D1D1F] text-[15px]">
                      {endTripModal.trip.origin?.name ?? '—'} → {endTripModal.trip.dest?.name ?? '—'}
                    </p>
                    <p className="text-[12px] text-[#86868B]">
                      {format(new Date(endTripModal.trip.departure_time), "dd MMMM yyyy \u00e0 HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-black/5">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    (statusConfig[endTripModal.trip.status] || { color: 'bg-gray-100 text-gray-500' }).color
                  }`}>
                    {(statusConfig[endTripModal.trip.status] || { label: endTripModal.trip.status }).label}
                  </span>
                  <span className="text-[12px] text-[#86868B]">
                    Réf: {endTripModal.trip.id.substring(0, 8)}
                  </span>
                  {endTripModal.trip.buses?.plate_number && (
                    <span className="text-[12px] font-bold text-[#1D1D1F] flex items-center gap-1">
                      <Bus className="w-3 h-3 text-[#34C759]" />
                      {endTripModal.trip.buses.plate_number}
                    </span>
                  )}
                </div>
              </div>

              {/* Avertissement */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-black text-amber-900">Cette action est définitive</p>
                  <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
                    Le statut passera à <strong>« Terminé »</strong>. Le voyage n'acceptera plus de nouvelles réservations et le chauffeur sera libéré.
                  </p>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEndTripModal({ open: false, trip: null })}
                  disabled={isEndingTrip}
                  className="flex-1 h-12 rounded-xl border border-black/10 font-bold text-[14px] text-[#1D1D1F] hover:bg-black/5 transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEndTrip}
                  disabled={isEndingTrip}
                  className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[14px] transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isEndingTrip ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                  ) : (
                    <><Flag className="w-4 h-4" /> Confirmer la fin</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
