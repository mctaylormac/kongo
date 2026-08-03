import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Plus, Trash2, Edit2, Loader2, Star, StarOff, Check, X, ArrowLeft } from 'lucide-react';
import { AddTripForm } from './AdminForms';
import { NAVIGATION_PAGES } from '../app/AppConstants';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function TripManagement({ onPageChange }: any) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [trips, setTrips] = useState<any[]>([]);
    const [searchOrigin, setSearchOrigin] = useState('');
    const [searchDest, setSearchDest] = useState('');
    const [updatingPopular, setUpdatingPopular] = useState<string | null>(null);

    const fetchTrips = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('trips')
                .select(`
                    *,
                    origin:locations!origin_location_id(name),
                    destination:locations!destination_location_id(name),
                    agencies(name)
                `)
                .order('departure_time', { ascending: true });

            if (error) throw error;
            setTrips(data || []);
        } catch (error: any) {
            toast.error("Erreur lors du chargement des voyages");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
        const handleRefresh = () => fetchTrips();
        window.addEventListener('refresh-trips', handleRefresh);
        return () => window.removeEventListener('refresh-trips', handleRefresh);
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce voyage ? Cela peut affecter les réservations existantes.")) return;
        try {
            const { error } = await supabase.from('trips').delete().eq('id', id);
            if (error) throw error;
            toast.success("Voyage supprimé");
            fetchTrips();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    // [Admin Agent] - Action: Toggle is_popular flag for a trip
    const handleTogglePopular = async (trip: any) => {
        setUpdatingPopular(trip.id);
        const newValue = !trip.is_popular;
        try {
            const { error } = await supabase
                .from('trips')
                .update({ is_popular: newValue })
                .eq('id', trip.id);
            if (error) throw error;
            toast.success(newValue ? "⭐ Voyage marqué comme Populaire" : "Voyage retiré des Populaires");
            setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, is_popular: newValue } : t));
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setUpdatingPopular(null);
        }
    };

    const handleChangeStatus = async (trip: any, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('trips')
                .update({ status: newStatus })
                .eq('id', trip.id);
            if (error) throw error;
            toast.success(`Statut mis à jour : ${newStatus}`);
            setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: newStatus } : t));
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF' }).format(price);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredTrips = trips.filter(trip => {
        const matchesOrigin = !searchOrigin || trip.origin?.name?.toLowerCase().includes(searchOrigin.toLowerCase());
        const matchesDest = !searchDest || trip.destination?.name?.toLowerCase().includes(searchDest.toLowerCase());
        return matchesOrigin && matchesDest;
    });

    const statusConfig: Record<string, { label: string; classes: string }> = {
        scheduled: { label: 'Planifié', classes: 'bg-kongo-lime/20 text-kongo-lime-dark' },
        delayed: { label: 'Retardé', classes: 'bg-yellow-100 text-yellow-700' },
        cancelled: { label: 'Annulé', classes: 'bg-red-50 text-error' },
        completed: { label: 'Terminé', classes: 'bg-gray-100 text-secondary' },
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <AddTripForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => onPageChange(NAVIGATION_PAGES.ADMIN_DASHBOARD)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        title="Retour au Dashboard"
                    >
                        <ArrowLeft className="w-6 h-6 text-kongo-black" />
                    </button>
                    <div>
                        <h1 className="text-display-2 text-kongo-black font-bold">Planification des Voyages</h1>
                        <p className="text-body-small text-tertiary">Gérez les itinéraires, les horaires, les tarifs et la popularité.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="btn-primary flex items-center px-6 py-2 rounded-lg"
                >
                    <Plus className="w-5 h-5 mr-2" /> Créer un Voyage
                </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="card-elevated p-4 flex flex-col justify-center border-l-4 border-l-kongo-lime">
                    <span className="text-caption text-tertiary uppercase font-bold">Total Voyages</span>
                    <span className="text-h4 font-bold">{trips.length}</span>
                </div>
                <div className="card-elevated p-4 flex flex-col justify-center border-l-4 border-l-blue-500">
                    <span className="text-caption text-tertiary uppercase font-bold">Actifs</span>
                    <span className="text-h4 font-bold">{trips.filter(t => t.status === 'scheduled').length}</span>
                </div>
                <div className="card-elevated p-4 flex flex-col justify-center border-l-4 border-l-amber-500">
                    <span className="text-caption text-tertiary uppercase font-bold">⭐ Populaires</span>
                    <span className="text-h4 font-bold">{trips.filter(t => t.is_popular).length}</span>
                </div>
                <div className="card-elevated p-4 flex flex-col justify-center border-l-4 border-l-green-500">
                    <span className="text-caption text-tertiary uppercase font-bold">Terminés</span>
                    <span className="text-h4 font-bold">{trips.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="card-elevated p-4 flex flex-col justify-center border-l-4 border-l-orange-500">
                    <span className="text-caption text-tertiary uppercase font-bold">Annulés</span>
                    <span className="text-h4 font-bold">{trips.filter(t => t.status === 'cancelled').length}</span>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary flex items-center space-x-4">
                <div className="flex-1 flex space-x-4">
                    <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                        <input
                            type="text"
                            placeholder="Origine..."
                            value={searchOrigin}
                            onChange={(e) => setSearchOrigin(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-secondary text-body-small"
                        />
                    </div>
                    <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                        <input
                            type="text"
                            placeholder="Destination..."
                            value={searchDest}
                            onChange={(e) => setSearchDest(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-secondary text-body-small"
                        />
                    </div>
                </div>
            </div>

            {/* Liste des voyages */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-kongo-lime" /></div>
                ) : (
                    filteredTrips.map((trip) => (
                        <div key={trip.id} className={`card-interactive p-6 bg-white border hover:border-kongo-lime flex flex-wrap items-center justify-between gap-6 transition-all ${trip.is_popular ? 'border-amber-400 bg-amber-50/30' : 'border-border-primary'}`}>
                            <div className="flex items-center space-x-6 min-w-[280px]">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-h5 font-bold text-kongo-black">{trip.origin?.name} → {trip.destination?.name}</p>
                                        {trip.is_popular && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Populaire
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-tertiary uppercase font-bold mb-2">{trip.agencies?.name}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <div className="flex items-center text-body-small text-secondary">
                                            <Calendar className="w-4 h-4 mr-1 text-kongo-lime-dark" /> {formatDate(trip.departure_time)}
                                        </div>
                                        <div className="flex items-center text-body-small text-secondary">
                                            <Clock className="w-4 h-4 mr-1 text-kongo-lime-dark" /> {formatTime(trip.departure_time)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 justify-around items-center min-w-[200px]">
                                <div className="text-center">
                                    <p className="text-caption text-tertiary uppercase font-bold">Prix</p>
                                    <p className="text-body font-bold text-kongo-black">{formatPrice(trip.price)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-caption text-tertiary uppercase font-bold">Disponibilité</p>
                                    <p className="text-body font-bold text-kongo-black">{trip.seats_available}/{trip.total_seats}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 flex-wrap gap-2">
                                {/* Badge statut */}
                                <select
                                    value={trip.status}
                                    onChange={(e) => handleChangeStatus(trip, e.target.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer ${statusConfig[trip.status]?.classes || 'bg-gray-100 text-secondary'}`}
                                >
                                    {Object.entries(statusConfig).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </select>

                                {/* Toggle Populaire */}
                                <button
                                    onClick={() => handleTogglePopular(trip)}
                                    disabled={updatingPopular === trip.id}
                                    title={trip.is_popular ? "Retirer des populaires" : "Marquer comme populaire"}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        trip.is_popular
                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                                            : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600 border border-gray-200'
                                    }`}
                                >
                                    {updatingPopular === trip.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : trip.is_popular ? (
                                        <><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Populaire</>
                                    ) : (
                                        <><StarOff className="w-3.5 h-3.5" /> Populaire</>
                                    )}
                                </button>

                                {/* Actions */}
                                <div className="flex space-x-1">
                                    <button className="p-2 hover:bg-gray-100 rounded-full text-secondary">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(trip.id)}
                                        className="p-2 hover:bg-red-50 rounded-full text-error"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {!isLoading && filteredTrips.length === 0 && (
                    <div className="p-12 text-center text-tertiary">Aucun voyage trouvé.</div>
                )}
            </div>
        </div>
    );
}
