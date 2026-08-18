import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, Loader2, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { AddAgencyForm } from './AdminForms';
import { NAVIGATION_PAGES } from '../app/AppConstants';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../ui/button';

export function AgencyManagement({ onPageChange }: any) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [agencies, setAgencies] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAgencies = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('agencies')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setAgencies(data || []);
        } catch (error: any) {
            toast.error("Erreur lors du chargement des agences");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgencies();
        const handleRefresh = () => fetchAgencies();
        window.addEventListener('refresh-agencies', handleRefresh);
        return () => window.removeEventListener('refresh-agencies', handleRefresh);
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette agence ? Cela supprimera également ses bus et voyages.")) return;
        try {
            const { error } = await supabase.from('agencies').delete().eq('id', id);
            if (error) throw error;
            toast.success("Agence supprimée");
            fetchAgencies();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const filteredAgencies = agencies.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agency.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <AddAgencyForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(NAVIGATION_PAGES.ADMIN_DASHBOARD)}
                        className="rounded-full bg-slate-100 hover:bg-slate-200"
                        title="Retour au Dashboard"
                    >
                        <ArrowLeft className="w-6 h-6 text-kongo-black" />
                    </Button>
                    <div>
                        <h1 className="text-display-2 text-kongo-black font-bold">Gestion des Agences</h1>
                        <p className="text-body-small text-tertiary">Gérez vos agences partenaires et leurs coordonnées.</p>
                    </div>
                </div>
                <Button
                    variant="premium"
                    size="premium"
                    onClick={() => setIsFormOpen(true)}
                >
                    <Plus className="w-5 h-5 mr-2" /> Ajouter une Agence
                </Button>
            </div>

            <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary flex items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Rechercher une agence par nom ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-secondary focus:border-kongo-lime outline-none text-body-small"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-12 flex justify-center"><Loader2 className="animate-spin text-kongo-lime" /></div>
                ) : (
                    filteredAgencies.map((agency) => (
                        <div key={agency.id} className="card-elevated p-6 space-y-4 hover:border-kongo-lime border border-transparent transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-surface-kongo-lime-light rounded-xl">
                                    <Building2 className="w-6 h-6 text-kongo-lime-dark" />
                                </div>
                                <div className="flex space-x-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 text-slate-400 hover:text-kongo-black"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDelete(agency.id)} 
                                        className="h-9 w-9 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-h5 font-bold text-kongo-black">{agency.name}</h3>
                                <p className="text-caption text-tertiary">ID: {agency.id.slice(0, 8)}...</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-body-small text-secondary">
                                    <Phone className="w-4 h-4 mr-2" /> {agency.contact_phone || 'Non renseigné'}
                                </div>
                                <div className="flex items-center text-body-small text-secondary">
                                    <Mail className="w-4 h-4 mr-2" /> {agency.contact_email || 'Non renseigné'}
                                </div>
                                <div className="flex items-center text-body-small text-secondary">
                                    <MapPin className="w-4 h-4 mr-2" /> {agency.address || 'Non renseignée'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {!isLoading && filteredAgencies.length === 0 && (
                    <div className="col-span-full py-12 text-center text-tertiary">Aucune agence trouvée.</div>
                )}
            </div>
        </div>
    );
}
