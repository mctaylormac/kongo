import React, { useState, useEffect } from "react";
import {
  TriangleAlert, Plus, X, Loader2, CheckCircle2, Clock,
  AlertCircle, Bus, Map, Search, Filter, ChevronDown,
  FileWarning, Wrench, Package, Users, MessageSquare, Flame
} from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Incident {
  id: string;
  agency_id: string;
  reported_by: string | null;
  trip_id: string | null;
  bus_id: string | null;
  title: string;
  description: string | null;
  category: "panne" | "accident" | "retard" | "bagages" | "client" | "autre";
  severity: "faible" | "moyen" | "critique";
  status: "ouvert" | "en_cours" | "resolu" | "clos";
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  reporter?: { full_name: string } | null;
  trip?: { origin: { name: string }; destination: { name: string } } | null;
  bus?: { name: string; plate_number: string } | null;
}

// Signalements soumis depuis l'app mobile chauffeur (table driver_reports)
interface DriverReport {
  id: string;
  driver_id: string;
  agency_id: string;
  category: string;   // 'breakdown' | 'accident' | 'passenger' | 'road' | 'delay' | 'theft' | 'fuel' | 'other'
  severity: string;   // 'low' | 'medium' | 'high' | 'critical'
  location: string | null;
  description: string;
  status: string;     // 'pending' | 'in_progress' | 'resolved'
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  driver?: { full_name: string } | null;
}

// Mapping catégorie mobile → label web
const DRIVER_CATEGORY_LABEL: Record<string, string> = {
  breakdown: "Panne mécanique",
  accident:  "Accident",
  passenger: "Incident passager",
  road:      "Route barrée",
  delay:     "Retard important",
  theft:     "Vol / Sécurité",
  fuel:      "Carburant insuffisant",
  other:     "Autre",
};

// Mapping sévérité mobile → style web
const DRIVER_SEVERITY_META: Record<string, { label: string; bg: string; text: string }> = {
  low:      { label: "Faible",   bg: "bg-[#34C759]/10", text: "text-[#34C759]" },
  medium:   { label: "Moyen",   bg: "bg-[#FF9500]/10", text: "text-[#FF9500]" },
  high:     { label: "Élevé",   bg: "bg-[#FF6B00]/10", text: "text-[#FF6B00]" },
  critical: { label: "Critique",bg: "bg-[#FF3B30]/10", text: "text-[#FF3B30]" },
};

// Mapping statut driver_reports → style web
const DRIVER_STATUS_META: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending:     { label: "En attente", bg: "bg-[#FF3B30]/10", text: "text-[#FF3B30]",  icon: AlertCircle },
  in_progress: { label: "En cours",  bg: "bg-[#FF9500]/10", text: "text-[#FF9500]",  icon: Clock },
  resolved:    { label: "Résolu",    bg: "bg-[#34C759]/10", text: "text-[#34C759]",  icon: CheckCircle2 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  panne:    { label: "Panne mécanique", icon: Wrench,       color: "#FF9500" },
  accident: { label: "Accident",        icon: Flame,        color: "#FF3B30" },
  retard:   { label: "Retard",          icon: Clock,        color: "#007AFF" },
  bagages:  { label: "Bagages",         icon: Package,      color: "#5856D6" },
  client:   { label: "Incident client", icon: Users,        color: "#FF6B6B" },
  autre:    { label: "Autre",           icon: MessageSquare,color: "#86868B" },
};

const SEVERITY_META = {
  faible:   { label: "Faible",   bg: "bg-[#34C759]/10",  text: "text-[#34C759]" },
  moyen:    { label: "Moyen",    bg: "bg-[#FF9500]/10",  text: "text-[#FF9500]" },
  critique: { label: "Critique", bg: "bg-[#FF3B30]/10",  text: "text-[#FF3B30]" },
};

const STATUS_META = {
  ouvert:   { label: "Ouvert",    bg: "bg-[#FF3B30]/10", text: "text-[#FF3B30]",  icon: AlertCircle },
  en_cours: { label: "En cours",  bg: "bg-[#FF9500]/10", text: "text-[#FF9500]",  icon: Clock },
  resolu:   { label: "Résolu",    bg: "bg-[#34C759]/10", text: "text-[#34C759]",  icon: CheckCircle2 },
  clos:     { label: "Clos",      bg: "bg-black/5",       text: "text-[#86868B]", icon: CheckCircle2 },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "autre" as Incident["category"],
  severity: "moyen" as Incident["severity"],
  bus_id: "",
  trip_id: "",
  notes: "",
};

// ─── Component ───────────────────────────────────────────────────────────────
export function Incidents() {
  const { userRole, agencyId } = useAppState();
  const canReportIncident = userRole === "driver";

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [driverReports, setDriverReports] = useState<DriverReport[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => { fetchAll(); }, [agencyId, userRole]);

  const fetchAll = async () => {
    if (!agencyId && userRole !== "superuser") return;
    setIsLoading(true);
    try {
      // Fetch incidents
      let q = supabase.from("incidents").select(`
        *,
        reporter:profiles!incidents_reported_by_fkey(full_name),
        trip:trips(
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name)
        ),
        bus:buses(name, plate_number)
      `).order("created_at", { ascending: false });

      if (userRole !== "superuser") q = q.eq("agency_id", agencyId!);

      const { data, error } = await q;
      if (error) throw error;
      setIncidents(data || []);

      // Fetch driver_reports from mobile app
      let drQuery = supabase
        .from("driver_reports")
        .select(`*, driver:profiles!driver_reports_driver_id_fkey(full_name)`)
        .order("created_at", { ascending: false });
      if (userRole !== "superuser") drQuery = drQuery.eq("agency_id", agencyId!);
      const { data: drData, error: drError } = await drQuery;
      if (drError) console.warn("driver_reports fetch error:", drError);
      setDriverReports(drData || []);

      // Fetch buses for form
      let bQuery = supabase.from("buses").select("id, name, plate_number");
      if (userRole !== "superuser") bQuery = bQuery.eq("agency_id", agencyId!);
      const { data: busData } = await bQuery;
      setBuses(busData || []);

      // Fetch trips for form
      let tQuery = supabase.from("trips").select(`
        id,
        origin:locations!origin_location_id(name),
        destination:locations!destination_location_id(name)
      `).eq("status", "scheduled");
      if (userRole !== "superuser") tQuery = tQuery.eq("agency_id", agencyId!);
      const { data: tripData } = await tQuery;
      setTrips(tripData || []);
    } catch (err) {
      console.error("Incidents fetch error:", err);
      toast.error("Erreur lors du chargement des incidents");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    if (!canReportIncident) {
      toast.error("Seuls les chauffeurs peuvent signaler un incident.");
      return;
    }
    setEditingIncident(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (incident: Incident) => {
    setEditingIncident(incident);
    setForm({
      title: incident.title,
      description: incident.description || "",
      category: incident.category,
      severity: incident.severity,
      bus_id: incident.bus_id || "",
      trip_id: incident.trip_id || "",
      notes: incident.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingIncident && !canReportIncident) {
      toast.error("Seuls les chauffeurs peuvent signaler un incident.");
      return;
    }
    if (!form.title.trim()) { toast.error("Le titre est obligatoire"); return; }
    if (!agencyId && userRole !== "superuser") { toast.error("Agence non identifiée"); return; }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        agency_id: agencyId!,
        reported_by: user?.id || null,
        title: form.title.trim(),
        description: form.description || null,
        category: form.category,
        severity: form.severity,
        bus_id: form.bus_id || null,
        trip_id: form.trip_id || null,
        notes: form.notes || null,
      };

      if (editingIncident) {
        const { error } = await supabase.from("incidents").update(payload).eq("id", editingIncident.id);
        if (error) throw error;
        toast.success("Incident mis à jour");
      } else {
        const { error } = await supabase.from("incidents").insert({ ...payload, status: "ouvert" });
        if (error) throw error;
        toast.success("Incident signalé avec succès");
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (incident: Incident, newStatus: Incident["status"]) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "resolu" || newStatus === "clos") updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("incidents").update(updates).eq("id", incident.id);
      if (error) throw error;
      toast.success(`Statut mis à jour : ${STATUS_META[newStatus].label}`);
      fetchAll();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const updateDriverReportStatus = async (report: DriverReport, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = { status: newStatus };
      if (newStatus === "resolved") {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id || null;
      }
      const { error } = await supabase.from("driver_reports").update(updates).eq("id", report.id);
      if (error) throw error;
      toast.success(`Signalement mis à jour : ${DRIVER_STATUS_META[newStatus]?.label ?? newStatus}`);
      fetchAll();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  // ─── Filtres ───────────────────────────────────────────────────────────────
  const filtered = incidents.filter(inc => {
    const matchSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || inc.status === statusFilter;
    const matchCategory = categoryFilter === "all" || inc.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const filteredDriverReports = driverReports.filter(dr => {
    const matchSearch = dr.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dr.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (DRIVER_CATEGORY_LABEL[dr.category] || dr.category).toLowerCase().includes(searchQuery.toLowerCase());
    // Map driver_report statuses to incident filter options where possible
    const statusMap: Record<string, string> = { pending: "ouvert", in_progress: "en_cours", resolved: "resolu" };
    const matchStatus = statusFilter === "all" || statusMap[dr.status] === statusFilter;
    return matchSearch && matchStatus;
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: incidents.length + driverReports.length,
    ouverts: incidents.filter(i => i.status === "ouvert").length + driverReports.filter(d => d.status === "pending").length,
    en_cours: incidents.filter(i => i.status === "en_cours").length + driverReports.filter(d => d.status === "in_progress").length,
    critiques: incidents.filter(i => i.severity === "critique" && i.status !== "clos").length +
               driverReports.filter(d => d.severity === "critical" && d.status !== "resolved").length,
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Signalements</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Gestion des incidents et alertes opérationnelles</p>
        </div>        {canReportIncident && (
          <button
            onClick={openCreate}
            className="h-11 px-5 bg-[#1D1D1F] text-white rounded-xl flex items-center gap-2 hover:bg-[#2C2C2E] transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[15px] font-medium">Signaler un incident</span>
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total,    color: "text-[#007AFF]",  bg: "bg-[#007AFF]/10",  icon: FileWarning },
          { label: "Ouverts",  value: stats.ouverts, color: "text-[#FF3B30]",  bg: "bg-[#FF3B30]/10",  icon: AlertCircle },
          { label: "En cours", value: stats.en_cours,color: "text-[#FF9500]",  bg: "bg-[#FF9500]/10",  icon: Clock },
          { label: "Critiques",value: stats.critiques,color:"text-[#FF3B30]",  bg: "bg-[#FF3B30]/5",   icon: Flame },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-[12px] font-medium text-[#86868B]">{kpi.label}</p>
              <p className={`text-[28px] font-black ${kpi.color} mt-0.5`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="Rechercher un incident..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-11 px-4 bg-white border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
        >
          <option value="all">Tous les statuts</option>
          <option value="ouvert">Ouverts</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolus</option>
          <option value="clos">Clos</option>
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-11 px-4 bg-white border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
        >
          <option value="all">Toutes catégories</option>
          {Object.entries(CATEGORY_META).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* ─── Signalements Chauffeurs (driver_reports table) ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Signalements Chauffeurs ({filteredDriverReports.length})</CardTitle>
              <CardDescription>Signalements soumis depuis l'application mobile KonGO Chauffeur</CardDescription>
            </div>
            {driverReports.filter(d => d.status === "pending").length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3B30]/10 text-[#FF3B30] rounded-xl text-[12px] font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                {driverReports.filter(d => d.status === "pending").length} en attente
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDriverReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#86868B]">
              <CheckCircle2 className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-[14px] font-medium">Aucun signalement chauffeur</p>
              <p className="text-[12px] mt-1 opacity-70">Les signalements de l'app mobile apparaîtront ici</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filteredDriverReports.map(report => {
                const sevMeta = DRIVER_SEVERITY_META[report.severity] ?? DRIVER_SEVERITY_META.medium;
                const staMeta = DRIVER_STATUS_META[report.status] ?? DRIVER_STATUS_META.pending;
                const StaIcon = staMeta.icon;
                const catLabel = DRIVER_CATEGORY_LABEL[report.category] ?? report.category;
                return (
                  <div key={report.id} className="px-6 py-5 hover:bg-black/[0.02] transition-all">
                    <div className="flex items-start gap-4">
                      {/* Badge Mobile */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#5856D6]/10">
                        <span className="text-[18px]">📱</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-[15px] font-semibold text-[#1D1D1F]">{catLabel}</p>
                            <p className="text-[13px] text-[#86868B] mt-0.5 line-clamp-2">{report.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${sevMeta.bg} ${sevMeta.text}`}>
                              {sevMeta.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${staMeta.bg} ${staMeta.text}`}>
                              <StaIcon className="w-3 h-3" />
                              {staMeta.label}
                            </span>
                          </div>
                        </div>

                        {/* Métadonnées */}
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
                          <span className="text-[12px] text-[#86868B]">
                            {new Date(report.created_at).toLocaleDateString("fr-CD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {report.driver?.full_name && (
                            <span className="text-[12px] text-[#86868B] flex items-center gap-1">
                              <Users className="w-3 h-3" /> {report.driver.full_name}
                            </span>
                          )}
                          {report.location && (
                            <span className="text-[12px] text-[#86868B] flex items-center gap-1">
                              <Map className="w-3 h-3" /> {report.location}
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#5856D6]/10 text-[#5856D6] font-medium">
                            App Mobile
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {report.status === "pending" && (
                            <button
                              onClick={() => updateDriverReportStatus(report, "in_progress")}
                              className="h-8 px-3 text-[12px] font-medium bg-[#FF9500]/10 text-[#FF9500] hover:bg-[#FF9500]/20 rounded-lg transition-all"
                            >
                              Prendre en charge
                            </button>
                          )}
                          {report.status === "in_progress" && (
                            <button
                              onClick={() => updateDriverReportStatus(report, "resolved")}
                              className="h-8 px-3 text-[12px] font-medium bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/20 rounded-lg transition-all"
                            >
                              Marquer résolu
                            </button>
                          )}
                          {report.status === "resolved" && (
                            <span className="text-[12px] text-[#34C759] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Résolu
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Création / Édition */}
      {showModal && (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-black/5 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-[18px] font-bold text-[#1D1D1F]">
                  {editingIncident ? "Modifier l'incident" : "Signaler un incident"}
                </h2>
                <p className="text-[13px] text-[#86868B] mt-0.5">
                  {editingIncident ? "Mettez à jour les informations" : "Renseignez les détails de l'incident"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 flex items-center justify-center hover:bg-black/5 rounded-xl transition-all">
                <X className="w-5 h-5 text-[#86868B]" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Titre */}
              <div>
                <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">Titre de l'incident *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex : Panne moteur bus N°12 à Matadi..."
                  className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>

              {/* Catégorie + Sévérité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  >
                    {Object.entries(CATEGORY_META).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">Sévérité *</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value as any }))}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  >
                    <option value="faible">🟢 Faible</option>
                    <option value="moyen">🟡 Moyen</option>
                    <option value="critique">🔴 Critique</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez l'incident en détail..."
                  rows={3}
                  className="w-full px-4 py-3 border border-black/10 rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>

              {/* Bus + Trajet */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">Bus concerné</label>
                  <select
                    value={form.bus_id}
                    onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  >
                    <option value="">Aucun</option>
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.plate_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">Trajet concerné</label>
                  <select
                    value={form.trip_id}
                    onChange={e => setForm(f => ({ ...f, trip_id: e.target.value }))}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  >
                    <option value="">Aucun</option>
                    {trips.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.origin?.name} → {t.destination?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes internes */}
              <div>
                <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">Notes internes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes de suivi, actions prises..."
                  rows={2}
                  className="w-full px-4 py-3 border border-black/10 rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 border border-black/10 rounded-xl text-[15px] font-medium text-[#86868B] hover:bg-black/5 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-12 bg-[#1D1D1F] text-white rounded-xl text-[15px] font-semibold hover:bg-[#2C2C2E] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <TriangleAlert className="w-4 h-4" />}
                  {editingIncident ? "Mettre à jour" : "Signaler"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



