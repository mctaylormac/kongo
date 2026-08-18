import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, MapPin, Loader2, Shield, Eye, Ticket, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export function ClientManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isLoadingPaidTickets, setIsLoadingPaidTickets] = useState(false);
    const [paidTickets, setPaidTickets] = useState<any[]>([]);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error: any) {
            toast.error("Erreur lors du chargement des clients");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchPaidTicketsForClient = async (clientId: string) => {
        setIsLoadingPaidTickets(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    booking_code,
                    total_price,
                    currency,
                    payment_status,
                    payment_method,
                    created_at,
                    trips(
                        id,
                        origin:locations!origin_location_id(name),
                        destination:locations!destination_location_id(name)
                    )
                `)
                .eq('user_id', clientId)
                .eq('payment_status', 'paid')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPaidTickets(data || []);
        } catch (error: any) {
            toast.error("Impossible de charger les tickets payés de cet utilisateur");
            setPaidTickets([]);
        } finally {
            setIsLoadingPaidTickets(false);
        }
    };

    const filteredClients = clients.filter(client =>
        (client.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-kongo-black font-bold">Gestion des Clients</h1>
                    <p className="text-body-small text-tertiary">Visualisez et gérez les utilisateurs inscrits sur KonGO.</p>
                </div>
            </div>

            <div className="bg-surface-elevated p-4 rounded-xl border border-border-primary flex items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email ou téléphone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-secondary focus:border-kongo-lime outline-none text-body-small"
                    />
                </div>
            </div>

            <div className="card-elevated overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-kongo-lime" /></div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-border-primary">
                            <tr>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Nom & Prénom</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Contact</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Ville</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Rôle</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black">Inscription</th>
                                <th className="px-6 py-4 text-label font-bold text-kongo-black text-right">Détail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-kongo-black flex items-center justify-center text-on-black text-xs font-bold">
                                                {client.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-body-small font-bold text-kongo-black">{client.full_name}</span>
                                                <div className="flex items-center text-[10px] text-tertiary">
                                                    <Mail className="w-2.5 h-2.5 mr-1" /> {client.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-body-small text-secondary">
                                            <Phone className="w-3.5 h-3.5 mr-2" /> {client.phone_number || '---'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-body-small text-secondary">
                                            <MapPin className="w-3.5 h-3.5 mr-2" /> {client.city || '---'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${client.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-secondary'
                                            }`}>
                                            {client.role === 'admin' ? 'Administrateur' : 'Client'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-body-small text-tertiary">
                                        {new Date(client.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedClient(client);
                                                setIsDetailOpen(true);
                                                void fetchPaidTicketsForClient(client.id);
                                            }}
                                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-secondary"
                                            aria-label="Voir le détail utilisateur"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!isLoading && filteredClients.length === 0 && (
                    <div className="p-12 text-center text-tertiary">Aucun utilisateur trouvé.</div>
                )}
            </div>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
                    <div className="flex flex-col h-full">
                        <DialogHeader className="p-6 border-b border-border-primary bg-surface-secondary">
                            <DialogTitle className="text-h4 font-bold text-kongo-black">
                                Détail Utilisateur
                            </DialogTitle>
                        </DialogHeader>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {selectedClient && (
                                <section className="card-elevated p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-kongo-black flex items-center justify-center text-on-black text-xs font-bold">
                                                {selectedClient.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??'}
                                            </div>
                                            <div>
                                                <h3 className="text-body-large font-bold text-kongo-black">{selectedClient.full_name || 'Utilisateur'}</h3>
                                                <p className="text-body-small text-tertiary">{selectedClient.email || 'Email non renseigné'}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-secondary">
                                            {selectedClient.role || 'user'}
                                        </span>
                                    </div>
                                    <div className="mt-4 grid sm:grid-cols-3 gap-3 text-body-small">
                                        <div className="flex items-center text-secondary"><Phone className="w-3.5 h-3.5 mr-2" /> {selectedClient.phone_number || '---'}</div>
                                        <div className="flex items-center text-secondary"><MapPin className="w-3.5 h-3.5 mr-2" /> {selectedClient.city || '---'}</div>
                                        <div className="flex items-center text-secondary"><Calendar className="w-3.5 h-3.5 mr-2" /> Inscrit le {new Date(selectedClient.created_at).toLocaleDateString()}</div>
                                    </div>
                                </section>
                            )}

                            <section className="card-elevated overflow-hidden">
                                <div className="px-5 py-4 border-b border-border-primary flex items-center justify-between">
                                    <h4 className="text-label font-bold text-kongo-black flex items-center">
                                        <Ticket className="w-4 h-4 mr-2" />
                                        Tickets payés par cet utilisateur
                                    </h4>
                                    <span className="text-[11px] text-tertiary">
                                        Total: {paidTickets.length}
                                    </span>
                                </div>

                                {isLoadingPaidTickets ? (
                                    <div className="p-10 flex justify-center">
                                        <Loader2 className="animate-spin text-kongo-lime" />
                                    </div>
                                ) : paidTickets.length === 0 ? (
                                    <div className="p-8 text-center text-tertiary text-body-small">
                                        Aucun ticket payé trouvé pour cet utilisateur.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-border-primary">
                                                <tr>
                                                    <th className="px-5 py-3 text-label font-bold text-kongo-black">Référence</th>
                                                    <th className="px-5 py-3 text-label font-bold text-kongo-black">Trajet</th>
                                                    <th className="px-5 py-3 text-label font-bold text-kongo-black">Date</th>
                                                    <th className="px-5 py-3 text-label font-bold text-kongo-black">Paiement</th>
                                                    <th className="px-5 py-3 text-label font-bold text-kongo-black text-right">Montant</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-primary">
                                                {paidTickets.map((ticket) => (
                                                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-5 py-3 font-mono text-body-small font-bold text-kongo-black">
                                                            {ticket.booking_code || '---'}
                                                        </td>
                                                        <td className="px-5 py-3 text-body-small text-secondary">
                                                            {ticket.trips?.origin?.name || '---'} → {ticket.trips?.destination?.name || '---'}
                                                        </td>
                                                        <td className="px-5 py-3 text-body-small text-tertiary">
                                                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td className="px-5 py-3 text-body-small text-secondary">
                                                            <span className="inline-flex items-center">
                                                                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                                                                {ticket.payment_method || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-body-small font-bold text-kongo-black text-right">
                                                            {new Intl.NumberFormat('fr-CD', {
                                                                style: 'currency',
                                                                currency: ticket.currency || 'CDF',
                                                                maximumFractionDigits: 0
                                                            }).format(ticket.total_price || 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
