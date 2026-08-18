import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Calendar, MapPin, User, DollarSign, Filter, Search, Loader2, Eye, Printer, X, Ticket } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { TicketTemplate } from "../ui/TicketTemplate";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmé", color: "bg-[#34C759]/10 text-[#34C759]" },
  pending: { label: "En attente", color: "bg-[#FF9500]/10 text-[#FF9500]" },
  cancelled: { label: "Annulé", color: "bg-[#FF3B30]/10 text-[#FF3B30]" },
};

export function Bookings() {
  const { userRole, agencyId, isLoading: isAppStateLoading } = useAppState();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const isModifiable = (createdAt: string) => {
    if (!createdAt) return false;
    const hoursDifference = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return hoursDifference < 48;
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_profiles_fkey(full_name, phone_number),
          trips!inner(
            *,
            origin:locations!origin_location_id(name),
            dest:locations!destination_location_id(name),
            buses(plate_number),
            agencies(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (userRole !== 'superuser') {
        if (!agencyId) {
          setBookings([]);
          setIsLoading(false);
          return;
        }
        query = query.eq('trips.agency_id', agencyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Échec du chargement des réservations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAppStateLoading && userRole !== 'guest') {
      fetchBookings();
    }
  }, [userRole, agencyId, isAppStateLoading]);

  const filteredBookings = bookings.filter((b) => 
    b.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.booking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Gestion des Réservations</h1>
        <p className="text-[15px] text-[#86868B] mt-1">Visualisez et gérez toutes les réservations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Total Réservations</p>
                <p className="text-[24px] font-semibold text-[#1D1D1F] mt-1">{bookings.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-[#007AFF]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Confirmées</p>
                <p className="text-[24px] font-semibold text-[#34C759] mt-1">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#34C759]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">En attente</p>
                <p className="text-[24px] font-semibold text-[#FF9500] mt-1">
                  {bookings.filter((b) => b.status === "pending").length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#FF9500]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Revenus</p>
                <p className="text-[24px] font-semibold text-[#1D1D1F] mt-1">
                  {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#34C759]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <input
                type="text"
                placeholder="Rechercher des réservations (ID, Code, Nom)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 transition-all"
              />
            </div>
            <button className="h-10 px-4 bg-black/5 hover:bg-black/10 rounded-lg flex items-center gap-2 transition-all">
              <Filter className="w-4 h-4 text-[#86868B]" />
              <span className="text-[15px] text-[#1D1D1F] font-medium">Filtres</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les Réservations</CardTitle>
          <CardDescription>Historique récent des réservations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 border-b border-black/5">
                <tr>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Référence</th>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Passager</th>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Trajet</th>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Date & Heure</th>
                  {userRole === 'superuser' && (
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Agence</th>
                  )}
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Total</th>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Statut</th>
                  <th className="px-6 py-4 text-right text-[13px] font-semibold text-[#1D1D1F]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1D1D1F]/20" />
                        <p className="text-[14px] text-[#86868B] font-medium">Chargement des réservations...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-black/5 transition-colors">
                      <td className="px-6 py-4 text-[14px] font-medium text-[#1D1D1F]">{booking.booking_code || booking.id.substring(0,8)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#34C759] flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] text-[#1D1D1F]">{booking.profiles?.full_name || 'Client Inconnu'}</span>
                            <span className="text-[12px] text-[#86868B]">{booking.profiles?.phone_number || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#86868B]" />
                          <span className="text-[14px] text-[#1D1D1F]">
                            {booking.trips?.origin?.name} → {booking.trips?.dest?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#86868B]">
                        {new Date(booking.created_at).toLocaleDateString()} à {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      {userRole === 'superuser' && (
                        <td className="px-6 py-4 text-[14px] font-medium text-[#007AFF]">
                          {booking.trips?.agencies?.name || "Kongo Global"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-[15px] font-semibold text-[#34C759]">
                        {(booking.total_price || 0).toLocaleString()} {booking.currency || 'CDF'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-semibold ${(statusConfig[booking.status] || statusConfig.pending).color}`}>
                          {(statusConfig[booking.status] || statusConfig.pending).label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTicket(booking)}
                            title="Afficher/Imprimer le billet"
                            className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                          >
                            <Eye className="w-4 h-4 text-[#1D1D1F]" />
                          </button>
                          {isModifiable(booking.created_at) && booking.status !== "cancelled" && (
                            <button
                              onClick={() => navigate("/new-booking", { state: { modifyBooking: booking } })}
                              title="Modifier la réservation (< 48h)"
                              className="w-8 h-8 rounded-lg bg-[#007AFF]/10 hover:bg-[#007AFF]/20 flex items-center justify-center transition-colors"
                            >
                              <Calendar className="w-4 h-4 text-[#007AFF]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-[#86868B] italic font-medium">
                      Aucune réservation trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="no-print absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors z-20"
            >
              <X className="w-5 h-5 text-[#1D1D1F]" />
            </button>

            {/* Ticket — wrapped in printable container */}
            <div id="ticket-print-zone">
              <TicketTemplate
                bookingCode={selectedTicket.booking_code || selectedTicket.id.substring(0,8)}
                passengerName={selectedTicket.profiles?.full_name || 'Inconnu'}
                passengerPhone={selectedTicket.profiles?.phone_number || '---'}
                tripOrigin={selectedTicket.trips?.origin?.name}
                tripDestination={selectedTicket.trips?.dest?.name}
                departureTime={selectedTicket.trips?.departure_time ? new Date(selectedTicket.trips.departure_time).toLocaleString("fr-FR", {
                  weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
                }) : '---'}
                seats={Array.isArray(selectedTicket.seats) ? selectedTicket.seats.sort() : []}
                extras={selectedTicket.extra_services?.length > 0 ? selectedTicket.extra_services.map((e: any) => `${e.title} x${e.quantity}`) : []}
                totalAmount={selectedTicket.total_price || 0}
                currency={selectedTicket.currency || "CDF"}
                agencyName={selectedTicket.trips?.agencies?.name}
                paymentMethod={selectedTicket.payment_method}
              />
            </div>

            {/* Actions */}
            <div className="no-print p-5 bg-[#F2F2F7] border-t border-black/5 flex gap-3">
              <button
                onClick={() => {
                  const zone = document.getElementById('ticket-print-zone');
                  if (!zone) return;
                  const win = window.open('', '_blank', 'width=600,height=800');
                  if (!win) { window.print(); return; }
                  win.document.write(`<html><head><title>Billet KonGO</title><style>body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#F2F2F7;}@media print{body{background:#fff;padding:0;}}</style></head><body>${zone.innerHTML}</body></html>`);
                  win.document.close();
                  win.focus();
                  setTimeout(() => { win.print(); win.close(); }, 300);
                }}
                className="flex-1 h-12 bg-[#1D1D1F] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
              >
                <Printer className="w-5 h-5" /> Imprimer
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="h-12 px-5 bg-white border border-black/10 text-[#1D1D1F] rounded-xl font-semibold hover:bg-black/5 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
