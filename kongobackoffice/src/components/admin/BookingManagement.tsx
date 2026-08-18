import React, { useState, useEffect } from 'react';
import { Ticket, Search, Download, Filter, CheckCircle2, XCircle, Clock, Loader2, Eye, User, MapPin, Bus, CreditCard, ChevronRight, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { BookingDetailModal } from './BookingDetailModal';
import { Button } from '../ui/button';

export function BookingManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [bookings, setBookings] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    profiles!bookings_user_id_profiles_fkey(full_name, email),
                    trips(
                        id,
                        origin:locations!origin_location_id(name),
                        destination:locations!destination_location_id(name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error: any) {
            toast.error("Erreur lors du chargement des réservations");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF' }).format(price);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredBookings = bookings.filter(booking => {
        const name = (booking.profiles?.full_name || '').toLowerCase();
        const ref = (booking.booking_reference || '').toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || ref.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || booking.payment_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-kongo-black font-bold">Ventes & Réservations</h1>
                    <p className="text-body-small text-tertiary">Suivez et gérez tous les billets vendus sur la plateforme.</p>
                </div>
                <Button 
                    variant="outline" 
                    size="premium"
                    className="border-kongo-black hover:bg-kongo-black hover:text-white"
                >
                    <Download className="w-5 h-5 mr-2" /> Exporter Rapport
                </Button>
            </div>

            <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Rechercher par ID client ou référence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-secondary focus:border-kongo-lime outline-none text-body-small"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={statusFilter === 'all' ? 'premium' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                        className={statusFilter === 'all' ? '' : 'text-slate-500'}
                    >
                        Tous
                    </Button>
                    <Button
                        variant={statusFilter === 'completed' ? 'premium' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('completed')}
                        className={statusFilter === 'completed' ? '' : 'text-slate-500'}
                    >
                        Payés
                    </Button>
                    <Button
                        variant={statusFilter === 'pending' ? 'premium' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('pending')}
                        className={statusFilter === 'pending' ? '' : 'text-slate-500'}
                    >
                        En attente
                    </Button>
                </div>
            </div>

            <div className="card-elevated overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-kongo-lime" /></div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-border-primary">
                            <tr>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Réf.</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Client</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Trajet</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Date</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Montant</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Statut</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-body-small font-bold text-kongo-black">{booking.booking_reference}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-body-small font-medium">{booking.profiles?.full_name || 'Anonyme'}</span>
                                            <span className="text-[10px] text-tertiary">{booking.profiles?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-body-small">
                                        {booking.trips?.origin?.name} → {booking.trips?.destination?.name}
                                    </td>
                                    <td className="px-6 py-4 text-body-small text-tertiary">{formatDate(booking.created_at)}</td>
                                    <td className="px-6 py-4 font-bold text-body-small">{formatPrice(booking.total_price)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {booking.payment_status === 'completed' && (
                                                <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Payé
                                                </span>
                                            )}
                                            {booking.payment_status === 'pending' && (
                                                <span className="flex items-center text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded">
                                                    <Clock className="w-3 h-3 mr-1" /> En attente
                                                </span>
                                            )}
                                            {booking.payment_status === 'cancelled' && (
                                                <span className="flex items-center text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">
                                                    <XCircle className="w-3 h-3 mr-1" /> Annulé
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button 
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setSelectedBooking(booking);
                                            setIsDetailOpen(true);
                                          }}
                                          className="text-slate-400 hover:text-kongo-black"
                                        >
                                          <Eye className="w-5 h-5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!isLoading && filteredBookings.length === 0 && (
                    <div className="p-12 text-center text-tertiary">Aucune réservation trouvée.</div>
                )}
            </div>

            <BookingDetailModal 
                booking={selectedBooking} 
                isOpen={isDetailOpen} 
                onClose={() => setIsDetailOpen(false)} 
            />
        </div>
    );
}
