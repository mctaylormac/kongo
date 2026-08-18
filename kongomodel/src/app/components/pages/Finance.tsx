import React, { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, ArrowDownRight, CreditCard, Download,
  Loader2, Percent, Building2
} from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { toast } from "sonner";

interface AgencyRevenueLine {
  agencyId: string;
  agencyName: string;
  commissionRate: number;
  grossRevenue: number;
  commissionAmount: number;
  netRevenue: number;
}

export function Finance() {
  const { userRole, agencyId, isLoading: isAppStateLoading } = useAppState();
  const isAdmin = userRole === "superuser";

  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "7days" | "month" | "total">("7days");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    periodRevenue: 0,
    todayRevenue: 0,
    pendingPayments: 0,
    refunds: 0,
    totalCommission: 0,
    netPlatformRevenue: 0,
    // Agency-specific commission fields
    agencyCommissionRate: 0,
    agencyCommissionAmount: 0,
    agencyNetRevenue: 0,
    transactions: [] as any[],
    chartData: [] as any[],
    revenueBySite: [] as any[],
    revenueByAgency: [] as AgencyRevenueLine[],
  });

  useEffect(() => {
    if (!isAppStateLoading && userRole !== "guest") fetchFinanceData();
  }, [period, userRole, agencyId, isAppStateLoading]);

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      // ─── Base booking query ─────────────────────────────────────
      let query = supabase.from("bookings").select(`
        *,
        trips!inner(
          agency_id,
          agencies(id, name, commission_rate),
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name)
        ),
        profiles!bookings_user_id_profiles_fkey(full_name, site_id, agency_sites(name))
      `);

      if (!isAdmin) {
        if (!agencyId) {
          setIsLoading(false);
          return;
        }
        query = query.eq("trips.agency_id", agencyId);
      }

      // Period filter
      const now = new Date();
      if (period === "today") {
        query = query.gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
      } else if (period === "7days") {
        query = query.gte("created_at", new Date(now.getTime() - 7 * 864e5).toISOString());
      } else if (period === "month") {
        query = query.gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
      }

      const { data: bookings, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      const paidBookings = (bookings || []).filter(
        b => b.payment_status === "paid" || b.payment_status === "completed"
      );

      const periodRevenue = paidBookings.reduce((s, b) => s + (b.total_price || 0), 0);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayRevenue = paidBookings
        .filter(b => new Date(b.created_at).getTime() >= todayStart)
        .reduce((s, b) => s + (b.total_price || 0), 0);
      const pendingPayments = (bookings || []).filter(b => b.payment_status === "pending").length;
      const refunds = (bookings || []).filter(b => b.payment_status === "refunded").length;

      // ─── Chart data ─────────────────────────────────────────────
      let chartDays = 7;
      if (period === "today") chartDays = 1;
      if (period === "month" || period === "total") chartDays = 30;

      const days = [...Array(chartDays)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (chartDays - 1 - i));
        return d.toISOString().split("T")[0];
      });

      const chartData = days.map(date => ({
        date:
          chartDays > 7
            ? new Date(date).toLocaleDateString("fr-CD", { day: "numeric", month: "short" })
            : new Date(date).toLocaleDateString("fr-CD", { weekday: "short" }),
        revenue: paidBookings
          .filter(b => b.created_at.startsWith(date))
          .reduce((s, b) => s + (b.total_price || 0), 0),
        commission: isAdmin
          ? paidBookings
              .filter(b => b.created_at.startsWith(date))
              .reduce((s, b) => {
                const rate = b.trips?.agencies?.commission_rate ?? 5;
                return s + (b.total_price || 0) * (rate / 100);
              }, 0)
          : 0,
      }));

      // ─── Revenue by site ────────────────────────────────────────
      const siteMap: Record<string, number> = {};
      paidBookings.forEach(b => {
        const siteName = b.profiles?.agency_sites?.name || (b.cashier_id ? "Agence" : "En ligne");
        siteMap[siteName] = (siteMap[siteName] || 0) + (b.total_price || 0);
      });
      const revenueBySite = Object.entries(siteMap).map(([name, value]) => ({ name, value }));

      // ─── Commission breakdown per agency (superuser only) ────────
      let totalCommission = 0;
      let revenueByAgency: AgencyRevenueLine[] = [];

      if (isAdmin) {
        const agencyMap: Record<string, AgencyRevenueLine> = {};
        paidBookings.forEach(b => {
          const agency = b.trips?.agencies;
          if (!agency) return;
          const rate = agency.commission_rate ?? 5;
          const gross = b.total_price || 0;
          const comm = gross * (rate / 100);
          if (!agencyMap[agency.id]) {
            agencyMap[agency.id] = {
              agencyId: agency.id,
              agencyName: agency.name,
              commissionRate: rate,
              grossRevenue: 0,
              commissionAmount: 0,
              netRevenue: 0,
            };
          }
          agencyMap[agency.id].grossRevenue += gross;
          agencyMap[agency.id].commissionAmount += comm;
          agencyMap[agency.id].netRevenue += gross - comm;
        });
        revenueByAgency = Object.values(agencyMap).sort((a, b) => b.grossRevenue - a.grossRevenue);
        totalCommission = revenueByAgency.reduce((s, a) => s + a.commissionAmount, 0);
      }

      // ─── All-time total revenue ──────────────────────────────────
      let totalRevenue = periodRevenue;
      if (period !== "total") {
        let baseQuery = supabase.from("bookings").select("total_price").in("payment_status", ["paid", "completed"]);
        if (!isAdmin && agencyId) {
          const { data: agencyTrips } = await supabase.from("trips").select("id").eq("agency_id", agencyId);
          const ids = (agencyTrips || []).map(t => t.id);
          if (ids.length > 0) baseQuery = baseQuery.in("trip_id", ids);
        }
        const { data: allPaid } = await baseQuery;
        totalRevenue = (allPaid || []).reduce((s, b) => s + (b.total_price || 0), 0);
      }

      // ─── Agency commission breakdown ────────────────────────────
      let agencyCommissionRate = 0;
      let agencyCommissionAmount = 0;
      let agencyNetRevenue = 0;

      if (!isAdmin && paidBookings.length > 0) {
        // Récupère le taux depuis la première transaction (il est uniforme par agence)
        const firstRate = paidBookings[0]?.trips?.agencies?.commission_rate ?? 5;
        agencyCommissionRate = firstRate;
        agencyCommissionAmount = paidBookings.reduce((s, b) => {
          const rate = b.trips?.agencies?.commission_rate ?? firstRate;
          return s + (b.total_price || 0) * (rate / 100);
        }, 0);
        agencyNetRevenue = periodRevenue - agencyCommissionAmount;
      }

      setStats({
        totalRevenue,
        periodRevenue,
        todayRevenue,
        pendingPayments,
        refunds,
        totalCommission,
        netPlatformRevenue: totalCommission,
        agencyCommissionRate,
        agencyCommissionAmount,
        agencyNetRevenue,
        transactions: bookings?.slice(0, 10) || [],
        chartData,
        revenueBySite,
        revenueByAgency,
      });
    } catch (err) {
      console.error("Finance error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Préparation de l'export...");
      
      let query = supabase.from("bookings").select(`
        booking_code,
        created_at,
        total_price,
        payment_status,
        trips!inner(
          agency_id,
          agencies(name, commission_rate),
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name)
        ),
        profiles!bookings_user_id_profiles_fkey(full_name)
      `);

      if (!isAdmin) {
        if (!agencyId) {
          toast.error("Identifiant agence manquant");
          return;
        }
        query = query.eq("trips.agency_id", agencyId);
      }

      // Period filter
      const now = new Date();
      if (period === "today") {
        query = query.gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
      } else if (period === "7days") {
        query = query.gte("created_at", new Date(now.getTime() - 7 * 864e5).toISOString());
      } else if (period === "month") {
        query = query.gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.dismiss();
        toast.error("Aucune donnée à exporter");
        return;
      }

      // CSV Header
      let csv = "Code;Date;Client;Agence;Trajet;Montant (CDF);Commission (CDF);Statut\n";
      
      data.forEach((b: any) => {
        const date = new Date(b.created_at).toLocaleDateString("fr-CD");
        const client = b.profiles?.full_name || "Client";
        const agency = b.trips?.agencies?.name || "-";
        const route = `${b.trips?.origin?.name || "???"} -> ${b.trips?.destination?.name || "???"}`;
        const price = b.total_price || 0;
        const rate = b.trips?.agencies?.commission_rate ?? 5;
        const commission = price * (rate / 100);
        
        csv += `${b.booking_code || b.id};${date};${client};${agency};${route};${price};${commission.toFixed(0)};${b.payment_status}\n`;
      });

      const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `export_finance_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success("Export terminé");
    } catch (err) {
      console.error("Export error:", err);
      toast.dismiss();
      toast.error("Erreur lors de l'export");
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-CD", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  const kpis = [
    { title: "Revenu Total", value: fmt(stats.totalRevenue), sub: "Cumulé tous temps", icon: DollarSign, color: "text-[#007AFF]", bg: "bg-[#007AFF]/10" },
    {
      title: `Revenu Période (${period === "7days" ? "7j" : period === "month" ? "Mois" : period === "today" ? "Auj." : "Global"})`,
      value: fmt(stats.periodRevenue), sub: "Billets payés", icon: TrendingUp, color: "text-[#34C759]", bg: "bg-[#34C759]/10"
    },
    { title: "En Attente", value: stats.pendingPayments.toString(), sub: "Paiements", icon: CreditCard, color: "text-[#FF9500]", bg: "bg-[#FF9500]/10" },
    { title: "Remboursements", value: stats.refunds.toString(), sub: "Annulations", icon: ArrowDownRight, color: "text-[#FF3B30]", bg: "bg-[#FF3B30]/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">
            {isAdmin ? "Finance Globale" : "Finance"}
          </h1>
          <p className="text-[15px] text-[#86868B] mt-1">
            {isAdmin ? "Revenus consolidés et commissions KONGO" : "Revenus et transactions de l'agence"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            className="h-11 px-4 bg-white border border-black/10 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
          >
            <option value="today">Aujourd'hui</option>
            <option value="7days">7 Derniers Jours</option>
            <option value="month">Ce Mois</option>
            <option value="total">Global</option>
          </select>
          <button 
            onClick={handleExport}
            className="h-11 px-5 bg-[#1D1D1F] text-white rounded-xl flex items-center gap-2 hover:bg-[#2C2C2E] transition-all shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span className="text-[15px] font-medium">Exporter</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <span className="text-[12px] font-semibold px-2 py-1 rounded-lg bg-black/5 text-[#86868B]">{kpi.sub}</span>
              </div>
              <p className="text-[13px] font-medium text-[#86868B]">{kpi.title}</p>
              <h3 className="text-[24px] font-bold text-[#1D1D1F] mt-1">{kpi.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agency Commission Banner */}
      {!isAdmin && stats.agencyCommissionRate > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-black/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#5856D6]/10 rounded-xl flex items-center justify-center">
                  <Percent className="w-5 h-5 text-[#5856D6]" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">Commission KONGO</p>
                  <p className="text-[13px] text-[#86868B]">Taux appliqué sur vos recettes</p>
                </div>
              </div>
              <p className="text-[36px] font-black text-[#5856D6]">{stats.agencyCommissionRate}%</p>
              <p className="text-[13px] text-[#86868B] mt-1">Déduit automatiquement par la plateforme</p>
            </CardContent>
          </Card>
          <Card className="border-black/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#FF3B30]/10 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-[#FF3B30]" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">Montant Déduit</p>
                  <p className="text-[13px] text-[#86868B]">Commission versée à KONGO (période)</p>
                </div>
              </div>
              <p className="text-[28px] font-black text-[#FF3B30]">{fmt(stats.agencyCommissionAmount)}</p>
              <p className="text-[13px] text-[#86868B] mt-1">Sur {fmt(stats.periodRevenue)} de revenu brut</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#34C759] to-[#30D158] text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">Revenu Net Agence</p>
                  <p className="text-[13px] text-white/60">Après déduction commission</p>
                </div>
              </div>
              <p className="text-[28px] font-black text-white">{fmt(stats.agencyNetRevenue)}</p>
              <p className="text-[13px] text-white/60 mt-1">= {fmt(stats.periodRevenue)} − {fmt(stats.agencyCommissionAmount)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Superuser Commission Banner */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Percent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">Commission KONGO</p>
                  <p className="text-[13px] text-white/60">Revenus plateforme (période)</p>
                </div>
              </div>
              <p className="text-[36px] font-black text-white">{fmt(stats.totalCommission)}</p>
              <p className="text-[13px] text-white/60 mt-1">
                Sur {fmt(stats.periodRevenue)} de revenu brut agences
              </p>
            </CardContent>
          </Card>
          <Card className="border-black/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#34C759]/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#34C759]" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">Agences Actives</p>
                  <p className="text-[13px] text-[#86868B]">Avec transactions sur période</p>
                </div>
              </div>
              <p className="text-[36px] font-black text-[#34C759]">{stats.revenueByAgency.length}</p>
              <p className="text-[13px] text-[#86868B] mt-1">
                Taux moyen :{" "}
                {stats.revenueByAgency.length > 0
                  ? (stats.revenueByAgency.reduce((s, a) => s + a.commissionRate, 0) / stats.revenueByAgency.length).toFixed(1)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aperçu des Revenus</CardTitle>
            <CardDescription>Flux de revenus pour la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#86868B" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#86868B" }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    cursor={{ fill: "#F5F5F7" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    formatter={(val: number, name: string) => [
                      fmt(val),
                      name === "revenue" ? "Revenu brut" : "Commission KONGO",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#007AFF" radius={[4, 4, 0, 0]} barSize={period === "month" || period === "total" ? 12 : 36} />
                  {isAdmin && (
                    <Bar dataKey="commission" fill="#5856D6" radius={[4, 4, 0, 0]} barSize={period === "month" || period === "total" ? 12 : 36} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-black/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#007AFF] inline-block" />
                  <span className="text-[12px] text-[#86868B]">Revenu brut agences</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#5856D6] inline-block" />
                  <span className="text-[12px] text-[#86868B]">Commission KONGO</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAdmin ? "Par Agence" : "Par Site / Canal"}</CardTitle>
            <CardDescription>Répartition des ventes (Période)</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isAdmin ? (
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {stats.revenueByAgency.map(a => (
                  <div key={a.agencyId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[10px] font-bold text-[#007AFF]">
                          {a.agencyName.charAt(0)}
                        </div>
                        <span className="text-[13px] font-medium text-[#1D1D1F] truncate max-w-[100px]">{a.agencyName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-bold text-[#1D1D1F]">{fmt(a.grossRevenue)}</p>
                        <p className="text-[11px] text-[#5856D6] font-semibold">+{fmt(a.commissionAmount)} ({a.commissionRate}%)</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#007AFF] rounded-full"
                        style={{ width: `${stats.periodRevenue > 0 ? (a.grossRevenue / stats.periodRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                {stats.revenueByAgency.length === 0 && (
                  <p className="text-center text-[13px] text-[#86868B] py-8">Aucune donnée</p>
                )}
                <div className="pt-4 border-t border-black/5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#86868B]">Total brut</span>
                    <span className="font-bold">{fmt(stats.periodRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] mt-1">
                    <span className="text-[#5856D6]">Commission KONGO</span>
                    <span className="font-bold text-[#5856D6]">{fmt(stats.totalCommission)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.revenueBySite.map(site => (
                  <div key={site.name} className="space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-[#1D1D1F]">{site.name}</span>
                      <span className="font-bold text-[#1D1D1F]">{fmt(site.value)}</span>
                    </div>
                    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#34C759] rounded-full" style={{ width: `${stats.periodRevenue > 0 ? (site.value / stats.periodRevenue) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                {stats.revenueBySite.length === 0 && <p className="text-center text-[13px] text-[#86868B] py-8">Aucune donnée disponible</p>}
                <div className="pt-4 border-t border-black/5">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#86868B]">Total Période</span>
                    <span className="font-bold">{fmt(stats.periodRevenue)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
          <CardDescription>Dernières réservations encaissées sur la période</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F5F7] border-b border-black/5">
                <tr>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#1D1D1F] uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#1D1D1F] uppercase tracking-wider">Client</th>
                  {isAdmin && <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#1D1D1F] uppercase tracking-wider">Agence</th>}
                  <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#1D1D1F] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#1D1D1F] uppercase tracking-wider">Montant</th>
                  {isAdmin && <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#5856D6] uppercase tracking-wider">Commission</th>}
                  <th className="px-6 py-4 text-left text-[12px] font-semibold text-[#1D1D1F] uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {stats.transactions.map(tx => {
                  const rate = tx.trips?.agencies?.commission_rate ?? 5;
                  const comm = (tx.total_price || 0) * (rate / 100);
                  return (
                    <tr key={tx.id} className="hover:bg-black/[0.02] transition-all">
                      <td className="px-6 py-4 text-[13px] font-mono font-medium text-[#1D1D1F]">
                        {tx.booking_code || tx.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[11px] font-bold">
                            {tx.profiles?.full_name?.charAt(0) || "C"}
                          </div>
                          <span className="text-[14px] text-[#1D1D1F]">{tx.profiles?.full_name || "Inconnu"}</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-[13px] text-[#86868B]">
                          {tx.trips?.agencies?.name || "—"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-[14px] text-[#86868B]">
                        {new Date(tx.created_at).toLocaleDateString("fr-CD")}
                      </td>
                      <td className="px-6 py-4 text-[14px] font-semibold text-[#1D1D1F]">
                        {fmt(tx.total_price)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-[13px] font-semibold text-[#5856D6]">
                          {fmt(comm)}
                          <span className="ml-1 text-[11px] text-[#86868B] font-normal">({rate}%)</span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                          tx.payment_status === "paid" || tx.payment_status === "completed"
                            ? "bg-[#34C759]/10 text-[#34C759]"
                            : "bg-[#FF9500]/10 text-[#FF9500]"
                        }`}>
                          {tx.payment_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {stats.transactions.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="px-6 py-10 text-center text-[#86868B] italic">
                      Aucune transaction sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
