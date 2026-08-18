import React, { useState, useEffect } from 'react';
import { Bus, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { AddBusForm } from './AdminForms';
import { NAVIGATION_PAGES } from '../app/AppConstants';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function BusManagement({ onPageChange }: any) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [buses, setBuses] = useState<any[]>([]);
    const [agencies, setAgencies] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAgency, setSelectedAgency] = useState('all');

    const fetchBuses = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('buses')
                .select(`
                    *,
                    agencies (name)
                `);

            if (error) throw error;
            setBuses(data || []);
        } catch (error: any) {
            toast.error("Erreur lors du chargement des bus");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAgencies = async () => {
        const { data } = await supabase.from('agencies').select('id, name');
        if (data) setAgencies(data);
    };

    useEffect(() => {
        fetchBuses();
        fetchAgencies();

        const handleRefresh = () => fetchBuses();
        window.addEventListener('refresh-buses', handleRefresh);
        return () => window.removeEventListener('refresh-buses', handleRefresh);
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce bus ?")) return;

        try {
            const { error } = await supabase.from('buses').delete().eq('id', id);
            if (error) throw error;
            toast.success("Bus supprimé");
            fetchBuses();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const filteredBuses = buses.filter(bus => {
        const matchesSearch =
            bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bus.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bus.agencies?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAgency = selectedAgency === 'all' || bus.agency_id === selectedAgency;

        return matchesSearch && matchesAgency;
    });

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <AddBusForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="secondary"
                        size="icon"
                        onClick={() => onPageChange(NAVIGATION_PAGES.ADMIN_DASHBOARD)}
                        className="rounded-full bg-slate-100 hover:bg-slate-200"
                        title="Retour au Dashboard"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-900" />
                    </Button>
                    <div>
                        <h1 className="text-display-2 text-kongo-black font-bold">Gestion des Bus</h1>
                        <p className="text-body-small text-tertiary">Gérez votre flotte et vos agences partenaires.</p>
                    </div>
                </div>
                <Button
                    variant="premium"
                    size="premium"
                    onClick={() => setIsFormOpen(true)}
                    className="gap-3 shadow-xl hover:-translate-y-0.5 active:scale-95"
                >
                    <Plus className="w-5 h-5 text-kongo-lime" /> Ajouter un Bus
                </Button>
            </div>

            <div className="flex space-x-4 items-center bg-surface-elevated p-4 rounded-xl border border-border-primary">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Rechercher un bus par nom, plaque ou agence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-secondary focus:border-kongo-lime outline-none"
                    />
                </div>
                <select
                    className="px-4 py-2 rounded-lg border border-border-secondary bg-white"
                    value={selectedAgency}
                    onChange={(e) => setSelectedAgency(e.target.value)}
                >
                    <option value="all">Toutes les agences</option>
                    {agencies.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
            </div>

            <div className="card-elevated overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-kongo-lime" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-border-primary">
                            <tr>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Bus / Véhicule</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Type</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Immatriculation</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Agence</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Capacité</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary">
                            {filteredBuses.map((bus) => (
                                <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-surface-kongo-lime-light rounded-lg">
                                                <Bus className="w-5 h-5 text-kongo-lime-dark" />
                                            </div>
                                            <span className="text-body font-medium text-kongo-black">{bus.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-body-small text-secondary capitalize">{bus.type}</td>
                                    <td className="px-6 py-4 font-mono text-body-small italic">{bus.plate_number}</td>
                                    <td className="px-6 py-4 text-body-small font-medium">{bus.agencies?.name}</td>
                                    <td className="px-6 py-4 text-body-small">{bus.capacity} places</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-slate-100">
                                                <Edit2 className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(bus.id)}
                                                className="size-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBuses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-tertiary">
                                        Aucun bus trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
