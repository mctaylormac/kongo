import React, { useState, useEffect } from "react";
import { Users, Search, Wallet, TrendingUp, ArrowRight, Loader2, Calendar } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";

export function CashManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAgentsPerformance();
  }, []);

  const fetchAgentsPerformance = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single();
      const agencyId = profile?.agency_id;
      const isAdmin = profile?.role === 'superuser';

      // Fetch all cashiers for this agency
      let agentsQuery = supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, site_id, agency_sites(name)')
        .eq('role', 'cashier');
      
      if (!isAdmin && agencyId) {
        agentsQuery = agentsQuery.eq('agency_id', agencyId);
      }

      const { data: profiles, error: profileError } = await agentsQuery;
      if (profileError) throw profileError;

      // Fetch bookings to calculate performance
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('total_price, cashier_id, payment_status, created_at')
        .not('cashier_id', 'is', null);
      
      if (bookingError) throw bookingError;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const performanceData = (profiles || []).map(p => {
        const agentBookings = bookings?.filter(b => b.cashier_id === p.id) || [];
        const todayBookings = agentBookings.filter(b => new Date(b.created_at).getTime() >= todayStart);
        
        const totalSales = agentBookings
          .filter(b => b.payment_status === 'paid' || b.payment_status === 'completed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);
          
        const todaySales = todayBookings
          .filter(b => b.payment_status === 'paid' || b.payment_status === 'completed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);

        return {
          ...p,
          totalSales,
          todaySales,
          ticketCount: agentBookings.length,
          todayTickets: todayBookings.length,
        };
      });

      setAgents(performanceData.sort((a, b) => b.todaySales - a.todaySales));

    } catch (error) {
      console.error("Error fetching agent performance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.agency_sites?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'USD' }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Gestion de Caisse</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Supervisez les performances et les encaissements des agents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="Rechercher un agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 pr-4 bg-white border border-black/10 rounded-xl text-[14px] w-[250px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
          </div>
          <button 
            onClick={fetchAgentsPerformance}
            className="h-11 px-5 bg-[#1D1D1F] text-white rounded-xl flex items-center gap-2 hover:bg-[#2C2C2E] transition-all"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[15px] font-medium">Actualiser</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Résumé du Jour</CardTitle>
            <CardDescription>Ventes totales par les agents aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-[#34C759]/10 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-[#34C759]" />
              </div>
              <h2 className="text-[32px] font-bold text-[#1D1D1F]">
                {formatPrice(agents.reduce((sum, a) => sum + a.todaySales, 0))}
              </h2>
              <p className="text-[15px] text-[#86868B] mt-1">
                {agents.reduce((sum, a) => sum + a.todayTickets, 0)} tickets vendus aujourd'hui
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agents de Caisse</CardTitle>
            <CardDescription>Liste des agents actifs et leurs performances</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-black/5">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="p-6 hover:bg-black/5 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center text-[16px] font-bold text-[#1D1D1F]">
                      {agent.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-[17px] font-semibold text-[#1D1D1F]">{agent.full_name}</h4>
                      <p className="text-[13px] text-[#86868B]">{agent.agency_sites?.name || "Point de vente"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-right">
                    <div className="hidden sm:block">
                      <p className="text-[11px] text-[#86868B] uppercase font-bold tracking-wider">Aujourd'hui</p>
                      <p className="text-[15px] font-bold text-[#34C759]">{formatPrice(agent.todaySales)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#86868B] uppercase font-bold tracking-wider">Total</p>
                      <p className="text-[15px] font-bold text-[#1D1D1F]">{formatPrice(agent.totalSales)}</p>
                    </div>
                    <button className="p-2 hover:bg-black/10 rounded-lg transition-all">
                      <ArrowRight className="w-5 h-5 text-[#86868B]" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredAgents.length === 0 && (
                <div className="p-12 text-center text-[#86868B]">
                  Aucun agent trouvé
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analyse de Performance</CardTitle>
          <CardDescription>Classement des agents par volume de vente</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {agents.slice(0, 5).map((agent, index) => (
              <div key={agent.id} className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#86868B] w-4">{index + 1}.</span>
                    <span className="font-medium text-[#1D1D1F]">{agent.full_name}</span>
                  </div>
                  <span className="font-bold text-[#1D1D1F]">{formatPrice(agent.totalSales)}</span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#007AFF] rounded-full" 
                    style={{ width: `${(agent.totalSales / (agents[0]?.totalSales || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
