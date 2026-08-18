import React, { useState, useEffect } from "react";
import { Users as UsersIcon, Search, Filter, Loader2, Mail, Phone, Ticket } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

export function Users() {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // On récupère les profils qui ne sont pas du personnel (role null ou 'user')
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          bookings!bookings_user_id_profiles_fkey(count)
        `)
        .or('role.is.null,role.eq.user,role.eq.client')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur chargement passagers");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Gestion Passagers</h1>
        <p className="text-[15px] text-[#86868B] mt-1">Consultez l'historique et les comptes clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-black/5 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#007AFF]">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-black text-[#86868B] uppercase tracking-[0.1em]">Total Passagers</p>
              <p className="text-[28px] font-black text-[#1D1D1F] mt-1 leading-none">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-black/5 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-black text-[#86868B] uppercase tracking-[0.1em]">Réservations App</p>
              <p className="text-[28px] font-black text-teal-600 mt-1 leading-none">
                {users.reduce((acc, u) => acc + (u.bookings?.[0]?.count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-black/5 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-black text-[#86868B] uppercase tracking-[0.1em]">Nouveaux (7j)</p>
              <p className="text-[28px] font-black text-amber-600 mt-1 leading-none">
                {users.filter(u => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return new Date(u.created_at) > sevenDaysAgo;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-black/5 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-black/5 border-0 rounded-xl text-[15px] focus:ring-2 focus:ring-black/5 outline-none transition-all"
            />
          </div>
          <button className="h-11 px-4 bg-black/5 hover:bg-black/10 rounded-xl flex items-center gap-2 transition-all">
            <Filter className="w-4 h-4 text-[#86868B]" />
            <span className="text-[15px] font-semibold">Trier</span>
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/[0.02] border-y border-black/5">
                  <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Voyages</th>
                  <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Membre depuis</th>
                  <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-black/10 mx-auto" /></td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-black/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-black/5">
                          {user.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-[15px] font-semibold text-[#1D1D1F]">{user.full_name || 'Utilisateur Anonyme'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[13px] text-[#86868B]"><Phone className="w-3 h-3" /> {user.phone_number || 'N/A'}</div>
                        <div className="flex items-center gap-2 text-[13px] text-[#86868B]"><Mail className="w-3 h-3" /> {user.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-[#007AFF]/10 text-[#007AFF] rounded-lg text-[13px] font-black">
                        {user.bookings?.[0]?.count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#86868B]">
                      {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[13px] font-bold text-[#007AFF] hover:underline">Profil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
