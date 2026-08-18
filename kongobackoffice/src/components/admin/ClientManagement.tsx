import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, MapPin, Loader2, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function ClientManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!isLoading && filteredClients.length === 0 && (
                    <div className="p-12 text-center text-tertiary">Aucun utilisateur trouvé.</div>
                )}
            </div>
        </div>
    );
}
