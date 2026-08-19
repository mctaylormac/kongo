// [Superuser] - Mise en Avant des Agences (Agences de Confiance sur Mobile)
import React, { useState, useEffect } from "react";
import { Star, ShieldCheck, Search, Building2 } from "@/lib/icons";
import { Card, CardContent } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  status: "active" | "suspended" | "pending";
  is_trusted: boolean;
  country?: string | null;
  country_code?: string | null;
  created_at: string;
  _count?: {
    buses: number;
    trips: number;
    bookings: number;
  };
}

const COUNTRY_FLAG: Record<string, string> = {
  RDC: "🇨🇩",
  CG: "🇨🇬",
  CM: "🇨🇲",
  CI: "🇨🇮",
  GA: "🇬🇦",
};

export function FeaturedAgencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select(`*, buses:buses(count), trips:trips(count)`)
        .order("is_trusted", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;

      const agenciesData = data || [];
      const bookingsCountByAgency = await Promise.all(
        agenciesData.map(async (agency) => {
          const { count } = await supabase
            .from("bookings")
            .select("id, trips!inner(agency_id)", { count: "exact", head: true })
            .eq("trips.agency_id", agency.id);
          return { agencyId: agency.id, count: count || 0 };
        })
      );
      const bookingsCountMap = new Map(
        bookingsCountByAgency.map((item) => [item.agencyId, item.count])
      );
      const formatted = agenciesData.map((agency) => ({
        ...agency,
        _count: {
          buses: agency.buses?.[0]?.count || 0,
          trips: agency.trips?.[0]?.count || 0,
          bookings: bookingsCountMap.get(agency.id) || 0,
        },
      }));
      setAgencies(formatted);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du chargement des agences");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrustedStatus = async (id: string, currentTrusted: boolean) => {
    const newTrusted = !currentTrusted;
    try {
      const { error } = await supabase
        .from("agencies")
        .update({ is_trusted: newTrusted })
        .eq("id", id);
      if (error) throw error;
      setAgencies((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_trusted: newTrusted } : a))
      );
      toast.success(
        newTrusted
          ? "Agence ajoutée aux Agences de Confiance ⭐ — visible sur l'accueil mobile"
          : "Agence retirée des Agences de Confiance"
      );
    } catch {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const filteredAgencies = agencies.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCountryFilter !== "all") {
      const code = (a.country_code || "RDC").toUpperCase();
      if (code !== selectedCountryFilter) return false;
    }
    return true;
  });

  const featured = filteredAgencies.filter((a) => a.is_trusted);
  const notFeatured = filteredAgencies.filter((a) => !a.is_trusted);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">
          Mise en Avant des Agences ⭐
        </h1>
        <p className="text-[15px] text-[#86868B] mt-1">
          Définissez quelles agences apparaissent dans la section{" "}
          <strong>"Agences de Confiance"</strong> sur l'écran d'accueil de
          l'application mobile KonGO.
        </p>
      </div>

      {/* Bannière d'information */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
        </div>
        <div className="text-[13px] text-amber-900">
          <p className="font-bold text-[14px]">Comment ça marche ?</p>
          <p className="mt-0.5">
            Les agences marquées <strong>⭐ Mise en avant</strong> apparaissent
            en haut de l'accueil mobile dans{" "}
            <strong>"Agences de Confiance"</strong>. Les autres agences restent
            visibles dans l'onglet <em>Agences</em> de l'application.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-amber-300 bg-amber-50/40 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-amber-800">
                Mises en Avant (Mobile)
              </p>
              <h3 className="text-[28px] font-bold text-amber-700 mt-1">
                {agencies.filter((a) => a.is_trusted).length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-black/5 bg-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868B]">
                Total Agences
              </p>
              <h3 className="text-[28px] font-bold text-[#1D1D1F] mt-1">
                {agencies.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1D1D1F]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-black/5 bg-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868B]">
                Non mises en avant
              </p>
              <h3 className="text-[28px] font-bold text-[#1D1D1F] mt-1">
                {agencies.filter((a) => !a.is_trusted).length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#86868B]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 border-b border-black/10 pb-4">
        <select
          value={selectedCountryFilter}
          onChange={(e) => setSelectedCountryFilter(e.target.value)}
          className="h-9 px-3 bg-white border border-black/10 rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer shadow-sm"
        >
          <option value="all">🌐 Tous les pays</option>
          <option value="RDC">🇨🇩 RDC</option>
          <option value="CG">🇨🇬 Congo-Brazzaville</option>
          <option value="CM">🇨🇲 Cameroun</option>
          <option value="CI">🇨🇮 Côte d'Ivoire</option>
          <option value="GA">🇬🇦 Gabon</option>
        </select>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="Chercher agence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-black/10 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Section : Agences de Confiance ── */}
          <div>
            <h2 className="text-[16px] font-bold text-amber-700 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
              Mises en avant — visibles sur mobile ({featured.length})
            </h2>
            {featured.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-amber-300 bg-amber-50/30 text-center text-[14px] text-amber-700 font-medium">
                Aucune agence mise en avant pour ce filtre.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {featured.map((agency) => (
                    <AgencyFeaturedCard
                      key={agency.id}
                      agency={agency}
                      onToggle={() => toggleTrustedStatus(agency.id, agency.is_trusted)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Section : Agences non mises en avant ── */}
          <div>
            <h2 className="text-[16px] font-bold text-[#86868B] mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Non mises en avant ({notFeatured.length})
            </h2>
            {notFeatured.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-black/10 text-center text-[14px] text-[#86868B]">
                Toutes les agences sont déjà mises en avant.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {notFeatured.map((agency) => (
                    <AgencyFeaturedCard
                      key={agency.id}
                      agency={agency}
                      onToggle={() => toggleTrustedStatus(agency.id, agency.is_trusted)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Carte d'agence pour la page Mise en Avant ──
function AgencyFeaturedCard({
  agency,
  onToggle,
}: {
  agency: Agency;
  onToggle: () => void;
}) {
  const flag = COUNTRY_FLAG[agency.country_code || "RDC"] || "🌐";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`border-black/5 bg-white relative overflow-hidden transition-all ${
          agency.is_trusted
            ? "border-amber-300 ring-2 ring-amber-400/20 shadow-md"
            : "hover:border-black/15 hover:shadow-md"
        }`}
      >
        {agency.is_trusted && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-t-[inherit]" />
        )}
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[22px] font-bold text-[#1D1D1F] border border-black/5 overflow-hidden shrink-0">
                {agency.logo_url ? (
                  <img
                    src={agency.logo_url}
                    alt={agency.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  agency.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1D1D1F] leading-tight">
                  {agency.name}
                </h3>
                <span className="text-[11px] text-[#86868B] font-medium">
                  {flag} {agency.country_code || "RDC"} ·{" "}
                  {agency.status === "active" ? (
                    <span className="text-[#34C759]">Active</span>
                  ) : (
                    <span className="text-[#FF3B30]">Suspendue</span>
                  )}
                </span>
              </div>
            </div>
            {agency.is_trusted && (
              <span className="text-[18px]" title="Mise en avant sur mobile">
                ⭐
              </span>
            )}
          </div>

          {/* Stats compactes */}
          <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-black/5">
            {[
              { label: "Bus", value: agency._count?.buses ?? 0 },
              { label: "Voyages", value: agency._count?.trips ?? 0 },
              { label: "Ventes", value: agency._count?.bookings ?? 0 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{s.value}</p>
                <p className="text-[10px] text-[#86868B] uppercase font-semibold">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Bouton toggle */}
          <button
            onClick={onToggle}
            className={`w-full h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
              agency.is_trusted
                ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                : "bg-[#1D1D1F] text-white hover:bg-black/80"
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                agency.is_trusted ? "fill-amber-600 text-amber-600" : "text-white"
              }`}
            />
            {agency.is_trusted ? "Retirer de la mise en avant" : "Mettre en avant ⭐"}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
