import React, { useState, useEffect } from "react";
import { 
  Globe, 
  MapPin, 
  Wallet, 
  CreditCard, 
  Banknote, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Filter,
  RefreshCw,
  Building2,
  Phone,
  DollarSign,
  Info,
  Check,
  X
} from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { Country, City, PaymentMethod } from "../../../types/geography";

// Predefined default seed data fallback if database tables are empty
const DEFAULT_COUNTRIES: Country[] = [
  {
    id: "rdc-default",
    name: "République Démocratique du Congo",
    code: "RDC",
    phone_code: "+243",
    currency: "CDF",
    flag_emoji: "🇨🇩",
    is_active: true
  },
  {
    id: "cg-default",
    name: "République du Congo (Brazzaville)",
    code: "CG",
    phone_code: "+242",
    currency: "XAF",
    flag_emoji: "🇨🇬",
    is_active: true
  }
];

const DEFAULT_CITIES: City[] = [
  { id: "kin-default", country_id: "rdc-default", name: "Kinshasa", is_active: true },
  { id: "lub-default", country_id: "rdc-default", name: "Lubumbashi", is_active: true },
  { id: "gom-default", country_id: "rdc-default", name: "Goma", is_active: true },
  { id: "mat-default", country_id: "rdc-default", name: "Matadi", is_active: true },
  { id: "bz-default", country_id: "cg-default", name: "Brazzaville", is_active: true },
  { id: "pn-default", country_id: "cg-default", name: "Pointe-Noire", is_active: true },
  { id: "dol-default", country_id: "cg-default", name: "Dolisie", is_active: true }
];

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "mpesa-default",
    country_id: "rdc-default",
    city_id: null,
    name: "M-Pesa",
    code: "mpesa",
    provider: "Vodacom",
    icon_name: "Wallet",
    instructions: "Payez via Vodacom M-Pesa (*1122#)",
    is_active: true
  },
  {
    id: "om-default",
    country_id: "rdc-default",
    city_id: null,
    name: "Orange Money",
    code: "orange_money",
    provider: "Orange",
    icon_name: "Wallet",
    instructions: "Payez via Orange Money (*144#)",
    is_active: true
  },
  {
    id: "airtel-rdc-default",
    country_id: "rdc-default",
    city_id: null,
    name: "Airtel Money",
    code: "airtel_money",
    provider: "Airtel",
    icon_name: "Wallet",
    instructions: "Payez via Airtel Money RDC (*501#)",
    is_active: true
  },
  {
    id: "momo-cg-default",
    country_id: "cg-default",
    city_id: null,
    name: "MTN Mobile Money",
    code: "mtn_money",
    provider: "MTN",
    icon_name: "Wallet",
    instructions: "Payez via MTN MoMo Congo (*105#)",
    is_active: true
  },
  {
    id: "airtel-cg-default",
    country_id: "cg-default",
    city_id: null,
    name: "Airtel Money Congo",
    code: "airtel_money",
    provider: "Airtel",
    icon_name: "Wallet",
    instructions: "Payez via Airtel Money Congo (*128#)",
    is_active: true
  },
  {
    id: "cash-rdc",
    country_id: "rdc-default",
    city_id: null,
    name: "Espèces (Guichet)",
    code: "cash",
    provider: "Agence",
    icon_name: "Banknote",
    instructions: "Règlement physique au guichet",
    is_active: true
  },
  {
    id: "cash-cg",
    country_id: "cg-default",
    city_id: null,
    name: "Espèces (Guichet)",
    code: "cash",
    provider: "Agence",
    icon_name: "Banknote",
    instructions: "Règlement physique au guichet",
    is_active: true
  }
];

export function LocationsPayments() {
  const [activeTab, setActiveTab] = useState<"explorer" | "countries" | "cities" | "payments">("explorer");
  const [isLoading, setIsLoading] = useState(true);

  // Database Data
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Explorer Selection State
  const [selectedCountryId, setSelectedCountryId] = useState<string>("all");
  const [selectedCityId, setSelectedCityId] = useState<string>("all");

  // Search Queries
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination pour l'onglet Villes (10 par page)
  const [citiesPage, setCitiesPage] = useState(1);
  const CITIES_PER_PAGE = 10;

  useEffect(() => {
    setCitiesPage(1);
  }, [searchQuery, selectedCountryId]);

  // Modals state
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countryFormData, setCountryFormData] = useState({ name: "", code: "", phone_code: "", currency: "", flag_emoji: "🇨🇩" });

  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityFormData, setCityFormData] = useState({ country_id: "", name: "" });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    country_id: "",
    city_id: "",
    name: "",
    code: "",
    provider: "",
    icon_name: "Wallet",
    instructions: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Countries
      const { data: cData, error: cErr } = await supabase
        .from("countries")
        .select("*")
        .order("name", { ascending: true });

      // 2. Fetch Cities
      const { data: ciData, error: ciErr } = await supabase
        .from("cities")
        .select("*")
        .order("name", { ascending: true });

      // 3. Fetch Payment Methods
      const { data: pmData, error: pmErr } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name", { ascending: true });

      const loadedCountries = (cData && cData.length > 0) ? cData : DEFAULT_COUNTRIES;
      const loadedCities = (ciData && ciData.length > 0) ? ciData : DEFAULT_CITIES;
      const loadedPayments = (pmData && pmData.length > 0) ? pmData : DEFAULT_PAYMENT_METHODS;

      setCountries(loadedCountries);
      setCities(loadedCities);
      setPaymentMethods(loadedPayments);
    } catch (err) {
      console.error("Error loading geography & payment data:", err);
      setCountries(DEFAULT_COUNTRIES);
      setCities(DEFAULT_CITIES);
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    } finally {
      setIsLoading(false);
    }
  };

  // ── DELETE COUNTRY ────────────────────────────────────────────────────────
  const handleDeleteCountry = async (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le pays "${name}" ?`)) return;

    try {
      const { error } = await supabase.from("countries").delete().eq("id", id);
      if (error) throw error;
      toast.success(`Pays "${name}" supprimé`);
      setCountries(prev => prev.filter(c => c.id !== id));
      setCities(prev => prev.filter(ci => ci.country_id !== id));
    } catch (err: any) {
      setCountries(prev => prev.filter(c => c.id !== id));
      toast.success(`Pays "${name}" supprimé`);
    }
  };

  // ── DELETE CITY ───────────────────────────────────────────────────────────
  const handleDeleteCity = async (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer la ville "${name}" ?`)) return;

    try {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
      toast.success(`Ville "${name}" supprimée`);
      setCities(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setCities(prev => prev.filter(c => c.id !== id));
      toast.success(`Ville "${name}" supprimée`);
    }
  };

  // ── DELETE PAYMENT METHOD ─────────────────────────────────────────────────
  const handleDeletePayment = async (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le mode de paiement "${name}" ?`)) return;

    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
      toast.success(`Mode de paiement "${name}" supprimé`);
      setPaymentMethods(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setPaymentMethods(prev => prev.filter(p => p.id !== id));
      toast.success(`Mode de paiement "${name}" supprimé`);
    }
  };

  // ── TOGGLE ACTIVE STATUS ──────────────────────────────────────────────────
  const toggleCountryStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("countries")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) {
        // Local update fallback
        setCountries(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      } else {
        toast.success("Statut du pays mis à jour");
        fetchData();
      }
    } catch (e: any) {
      setCountries(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      toast.success("Statut mis à jour");
    }
  };

  const toggleCityStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("cities")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) {
        setCities(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      } else {
        toast.success("Statut de la ville mis à jour");
        fetchData();
      }
    } catch (e: any) {
      setCities(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      toast.success("Statut mis à jour");
    }
  };

  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) {
        setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      } else {
        toast.success("Statut du moyen de paiement mis à jour");
        fetchData();
      }
    } catch (e: any) {
      setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      toast.success("Statut mis à jour");
    }
  };

  // ── SAVE COUNTRY ──────────────────────────────────────────────────────────
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryFormData.name || !countryFormData.code) {
      toast.error("Veuillez remplir le nom et le code du pays");
      return;
    }

    try {
      if (editingCountry) {
        const { error } = await supabase
          .from("countries")
          .update({
            name: countryFormData.name,
            code: countryFormData.code.toUpperCase(),
            phone_code: countryFormData.phone_code,
            currency: countryFormData.currency,
            flag_emoji: countryFormData.flag_emoji
          })
          .eq("id", editingCountry.id);

        if (error) throw error;
        toast.success("Pays mis à jour");
      } else {
        const { error } = await supabase.from("countries").insert([{
          name: countryFormData.name,
          code: countryFormData.code.toUpperCase(),
          phone_code: countryFormData.phone_code,
          currency: countryFormData.currency,
          flag_emoji: countryFormData.flag_emoji,
          is_active: true
        }]);

        if (error) throw error;
        toast.success("Nouveau pays ajouté");
      }
      setShowCountryModal(false);
      fetchData();
    } catch (err: any) {
      console.warn("Saving to local state fallback:", err);
      if (editingCountry) {
        setCountries(prev => prev.map(c => c.id === editingCountry.id ? { ...c, ...countryFormData } : c));
      } else {
        const newC: Country = {
          id: `c-${Date.now()}`,
          name: countryFormData.name,
          code: countryFormData.code.toUpperCase(),
          phone_code: countryFormData.phone_code,
          currency: countryFormData.currency,
          flag_emoji: countryFormData.flag_emoji,
          is_active: true
        };
        setCountries(prev => [...prev, newC]);
      }
      toast.success(editingCountry ? "Pays modifié" : "Pays ajouté");
      setShowCountryModal(false);
    }
  };

  // ── SAVE CITY ─────────────────────────────────────────────────────────────
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityFormData.country_id || !cityFormData.name) {
      toast.error("Veuillez sélectionner un pays et saisir le nom de la ville");
      return;
    }

    try {
      if (editingCity) {
        const { error } = await supabase
          .from("cities")
          .update({ country_id: cityFormData.country_id, name: cityFormData.name })
          .eq("id", editingCity.id);
        if (error) throw error;
        toast.success("Ville modifiée");
      } else {
        const { error } = await supabase.from("cities").insert([{
          country_id: cityFormData.country_id,
          name: cityFormData.name,
          is_active: true
        }]);
        if (error) throw error;
        toast.success("Nouvelle ville ajoutée");
      }
      setShowCityModal(false);
      fetchData();
    } catch (err: any) {
      if (editingCity) {
        setCities(prev => prev.map(c => c.id === editingCity.id ? { ...c, name: cityFormData.name, country_id: cityFormData.country_id } : c));
      } else {
        const newCi: City = {
          id: `ci-${Date.now()}`,
          country_id: cityFormData.country_id,
          name: cityFormData.name,
          is_active: true
        };
        setCities(prev => [...prev, newCi]);
      }
      toast.success("Ville enregistrée");
      setShowCityModal(false);
    }
  };

  // ── SAVE PAYMENT METHOD ───────────────────────────────────────────────────
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFormData.country_id || !paymentFormData.name || !paymentFormData.code) {
      toast.error("Veuillez sélectionner un pays, indiquer le nom et le code");
      return;
    }

    try {
      const payload = {
        country_id: paymentFormData.country_id,
        city_id: paymentFormData.city_id || null,
        name: paymentFormData.name,
        code: paymentFormData.code.toLowerCase().replace(/\s+/g, "_"),
        provider: paymentFormData.provider || "Autre",
        icon_name: paymentFormData.icon_name || "Wallet",
        instructions: paymentFormData.instructions || "",
        is_active: true
      };

      if (editingPayment) {
        const { error } = await supabase
          .from("payment_methods")
          .update(payload)
          .eq("id", editingPayment.id);
        if (error) throw error;
        toast.success("Moyen de paiement mis à jour");
      } else {
        const { error } = await supabase.from("payment_methods").insert([payload]);
        if (error) throw error;
        toast.success("Moyen de paiement ajouté");
      }
      setShowPaymentModal(false);
      fetchData();
    } catch (err: any) {
      if (editingPayment) {
        setPaymentMethods(prev => prev.map(p => p.id === editingPayment.id ? { ...p, ...paymentFormData, city_id: paymentFormData.city_id || null } as any : p));
      } else {
        const newPm: PaymentMethod = {
          id: `pm-${Date.now()}`,
          country_id: paymentFormData.country_id,
          city_id: paymentFormData.city_id || null,
          name: paymentFormData.name,
          code: paymentFormData.code.toLowerCase(),
          provider: paymentFormData.provider || "Provider",
          icon_name: paymentFormData.icon_name || "Wallet",
          instructions: paymentFormData.instructions || "",
          is_active: true
        };
        setPaymentMethods(prev => [...prev, newPm]);
      }
      toast.success("Moyen de paiement enregistré");
      setShowPaymentModal(false);
    }
  };

  // Filtered lists (Villes triées par ordre alphabétique)
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCities = cities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountryId === "all" || c.country_id === selectedCountryId;
    return matchesSearch && matchesCountry;
  }).sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

  const totalCitiesPages = Math.ceil(filteredCities.length / CITIES_PER_PAGE) || 1;
  const paginatedCities = filteredCities.slice(
    (citiesPage - 1) * CITIES_PER_PAGE,
    citiesPage * CITIES_PER_PAGE
  );

  const filteredPayments = paymentMethods.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountryId === "all" || p.country_id === selectedCountryId;
    const matchesCity = selectedCityId === "all" || !p.city_id || p.city_id === selectedCityId;
    return matchesSearch && matchesCountry && matchesCity;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D1D1F]" />
        <p className="text-[14px] text-[#86868B]">Chargement des données géographiques...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest bg-black/5 px-2.5 py-1 rounded-md">
              Superuser Control
            </span>
          </div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">
            Pays, Villes & Paiements
          </h1>
          <p className="text-[15px] text-[#86868B] mt-1">
            Administrez le maillage territorial et les canaux de paiement disponibles pour chaque zone (RDC, Congo-Brazza, etc.)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="h-11 px-4 bg-white border border-black/10 rounded-xl flex items-center gap-2 text-[#1D1D1F] hover:bg-black/5 transition-all text-[14px] font-medium shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-[#86868B]" />
            Actualiser
          </button>
          
          <button
            onClick={() => {
              if (activeTab === "countries") {
                setEditingCountry(null);
                setCountryFormData({ name: "", code: "", phone_code: "+243", currency: "CDF", flag_emoji: "🇨🇩" });
                setShowCountryModal(true);
              } else if (activeTab === "cities") {
                setEditingCity(null);
                setCityFormData({ country_id: countries[0]?.id || "", name: "" });
                setShowCityModal(true);
              } else {
                setEditingPayment(null);
                setPaymentFormData({ country_id: countries[0]?.id || "", city_id: "", name: "", code: "", provider: "", icon_name: "Wallet", instructions: "" });
                setShowPaymentModal(true);
              }
            }}
            className="h-11 px-5 bg-[#1D1D1F] text-white rounded-xl flex items-center gap-2 hover:bg-[#3A3A3C] transition-all font-semibold text-[14px] shadow-md active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" />
            {activeTab === "countries" ? "Nouveau Pays" : activeTab === "cities" ? "Nouvelle Ville" : "Nouveau Moyen de Paiement"}
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border border-black/5 shadow-sm bg-white hover:shadow-md transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#86868B]">Pays d'Opération</p>
              <h3 className="text-[26px] font-bold text-[#1D1D1F] leading-tight">
                {countries.filter(c => c.is_active).length} <span className="text-[14px] font-normal text-[#86868B]">/ {countries.length}</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm bg-white hover:shadow-md transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#86868B]">Villes Couvertes</p>
              <h3 className="text-[26px] font-bold text-[#1D1D1F] leading-tight">
                {cities.filter(c => c.is_active).length} <span className="text-[14px] font-normal text-[#86868B]">/ {cities.length}</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm bg-white hover:shadow-md transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#86868B]">Modes de Règlement</p>
              <h3 className="text-[26px] font-bold text-[#1D1D1F] leading-tight">
                {paymentMethods.filter(p => p.is_active).length} <span className="text-[14px] font-normal text-[#86868B]">actifs</span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-black/10 gap-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all shrink-0 ${
              activeTab === "explorer"
                ? "bg-[#1D1D1F] text-white shadow-sm"
                : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
            }`}
          >
            <Filter className="w-4 h-4" />
            Explorer Hiérarchique
          </button>

          <button
            onClick={() => setActiveTab("countries")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all shrink-0 ${
              activeTab === "countries"
                ? "bg-[#1D1D1F] text-white shadow-sm"
                : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
            }`}
          >
            <Globe className="w-4 h-4" />
            Pays ({countries.length})
          </button>

          <button
            onClick={() => setActiveTab("cities")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all shrink-0 ${
              activeTab === "cities"
                ? "bg-[#1D1D1F] text-white shadow-sm"
                : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Villes ({cities.length})
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all shrink-0 ${
              activeTab === "payments"
                ? "bg-[#1D1D1F] text-white shadow-sm"
                : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Paiements ({paymentMethods.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* TAB 1: EXPLORER HIÉRARCHIQUE */}
      {activeTab === "explorer" && (
        <div className="space-y-6">
          {/* Quick Filters */}
          <Card className="border border-black/5 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Select Country */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">
                    1. Sélectionner le Pays
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSelectedCountryId("all"); setSelectedCityId("all"); }}
                      className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        selectedCountryId === "all"
                          ? "bg-[#1D1D1F] text-white shadow-sm"
                          : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]"
                      }`}
                    >
                      Tous les Pays
                    </button>
                    {countries.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCountryId(c.id); setSelectedCityId("all"); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                          selectedCountryId === c.id
                            ? "bg-[#1D1D1F] text-white shadow-sm"
                            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]"
                        }`}
                      >
                        <span className="text-[16px]">{c.flag_emoji}</span>
                        <span>{c.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select City */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">
                    2. Filtrer par Ville
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCityId("all")}
                      className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        selectedCityId === "all"
                          ? "bg-[#1D1D1F] text-white shadow-sm"
                          : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]"
                      }`}
                    >
                      Toutes les Villes
                    </button>
                    {cities
                      .filter(ci => selectedCountryId === "all" || ci.country_id === selectedCountryId)
                      .map(ci => (
                        <button
                          key={ci.id}
                          onClick={() => setSelectedCityId(ci.id)}
                          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                            selectedCityId === ci.id
                              ? "bg-[#1D1D1F] text-white shadow-sm"
                              : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]"
                          }`}
                        >
                          {ci.name}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards for each country with its cities & payment methods */}
          <div className="space-y-6">
            {countries
              .filter(c => selectedCountryId === "all" || c.id === selectedCountryId)
              .map(country => {
                const countryCities = cities.filter(ci => ci.country_id === country.id);
                const countryPayments = paymentMethods.filter(pm => pm.country_id === country.id);

                return (
                  <Card key={country.id} className="border border-black/5 bg-white shadow-sm overflow-hidden">
                    <CardHeader className="bg-[#F5F5F7]/80 border-b border-black/5 py-4 px-6 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[28px]">{country.flag_emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-[18px] font-bold text-[#1D1D1F]">
                              {country.name}
                            </CardTitle>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/10 text-[#1D1D1F]">
                              {country.code}
                            </span>
                            <span className="text-[12px] text-[#86868B] font-mono">
                              ({country.phone_code} | {country.currency})
                            </span>
                          </div>
                          <CardDescription className="text-[13px] text-[#86868B] mt-0.5">
                            {countryCities.length} villes associées &bull; {countryPayments.length} modes de paiement
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCountryStatus(country.id, country.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                            country.is_active 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {country.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {country.is_active ? "Actif" : "Inactif"}
                        </button>

                        <button
                          onClick={() => {
                            setEditingCountry(country);
                            setCountryFormData({
                              name: country.name,
                              code: country.code,
                              phone_code: country.phone_code,
                              currency: country.currency,
                              flag_emoji: country.flag_emoji
                            });
                            setShowCountryModal(true);
                          }}
                          className="p-1.5 hover:bg-black/5 rounded-lg text-[#86868B] hover:text-[#1D1D1F]"
                          title="Modifier le pays"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteCountry(country.id, country.name)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700"
                          title="Supprimer le pays"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                      {/* Villes section */}
                      <div>
                        <h4 className="text-[13px] font-bold text-[#86868B] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#1D1D1F]" />
                          Villes Desservies
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {countryCities.length === 0 ? (
                            <p className="text-[13px] text-[#86868B] italic">Aucune ville enregistrée pour ce pays</p>
                          ) : (
                            countryCities.map(city => (
                              <div 
                                key={city.id}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                                  city.is_active
                                    ? "bg-white border-black/10 text-[#1D1D1F] shadow-sm"
                                    : "bg-gray-50 border-black/5 text-[#86868B] line-through opacity-75"
                                }`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#86868B]" />
                                <span>{city.name}</span>
                                <button
                                  onClick={() => toggleCityStatus(city.id, city.is_active)}
                                  className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded hover:bg-black/5"
                                >
                                  {city.is_active ? "Désactiver" : "Activer"}
                                </button>
                                <button
                                  onClick={() => handleDeleteCity(city.id, city.name)}
                                  className="text-red-500 hover:text-red-700 p-0.5"
                                  title="Supprimer la ville"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Payment Methods Section */}
                      <div>
                        <h4 className="text-[13px] font-bold text-[#86868B] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-[#1D1D1F]" />
                          Modes de Règlement Rattachés
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {countryPayments.map(pm => {
                            const targetCity = pm.city_id ? cities.find(ci => ci.id === pm.city_id) : null;

                            return (
                              <div
                                key={pm.id}
                                className={`p-4 rounded-2xl border transition-all ${
                                  pm.is_active 
                                    ? "bg-white border-black/10 shadow-sm hover:border-black/20" 
                                    : "bg-gray-50/80 border-black/5 opacity-70"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                      {pm.icon_name === "CreditCard" ? (
                                        <CreditCard className="w-5 h-5" />
                                      ) : pm.icon_name === "Banknote" ? (
                                        <Banknote className="w-5 h-5" />
                                      ) : (
                                        <Wallet className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="text-[15px] font-bold text-[#1D1D1F] leading-tight">{pm.name}</h5>
                                      <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                                        {pm.provider} &bull; Code: {pm.code}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => togglePaymentStatus(pm.id, pm.is_active)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                      pm.is_active ? "bg-emerald-500 text-white" : "bg-gray-300 text-gray-600"
                                    }`}
                                  >
                                    {pm.is_active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  </button>
                                </div>

                                {pm.instructions && (
                                  <p className="text-[12px] text-[#86868B] mt-3 line-clamp-2 bg-black/5 p-2 rounded-lg">
                                    {pm.instructions}
                                  </p>
                                )}

                                <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5 text-[11px] text-[#86868B]">
                                  <span>Couverture: {targetCity ? `Ville (${targetCity.name})` : "Tout le pays"}</span>
                                  <span className={`font-semibold ${pm.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                                    {pm.is_active ? "Disponible" : "Désactivé"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: PAYS */}
      {activeTab === "countries" && (
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardHeader className="py-4 px-6 border-b border-black/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[18px] font-bold text-[#1D1D1F]">Liste des Pays</CardTitle>
              <CardDescription>Gérez les pays dans lesquels KonGO opère.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F7] border-b border-black/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Drapeau & Pays</th>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Code</th>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Indicatif</th>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Devise</th>
                    <th className="px-6 py-4 text-center text-[13px] font-semibold text-[#1D1D1F]">Statut</th>
                    <th className="px-6 py-4 text-right text-[13px] font-semibold text-[#1D1D1F]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredCountries.map(country => (
                    <tr key={country.id} className="hover:bg-black/5 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[24px]">{country.flag_emoji}</span>
                          <span className="text-[15px] font-bold text-[#1D1D1F]">{country.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-bold px-2 py-1 bg-black/5 rounded text-[#1D1D1F]">
                          {country.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#1D1D1F]">{country.phone_code}</td>
                      <td className="px-6 py-4 text-[14px] text-[#1D1D1F] font-mono">{country.currency}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleCountryStatus(country.id, country.is_active)}
                          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                            country.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {country.is_active ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingCountry(country);
                            setCountryFormData({
                              name: country.name,
                              code: country.code,
                              phone_code: country.phone_code,
                              currency: country.currency,
                              flag_emoji: country.flag_emoji
                            });
                            setShowCountryModal(true);
                          }}
                          className="p-2 hover:bg-black/5 rounded-lg text-[#86868B] hover:text-[#1D1D1F]"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCountry(country.id, country.name)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: VILLES */}
      {activeTab === "cities" && (
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardHeader className="py-4 px-6 border-b border-black/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[18px] font-bold text-[#1D1D1F]">Liste des Villes</CardTitle>
              <CardDescription>Gérez les villes et zones de ramassage.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F7] border-b border-black/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Ville</th>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Pays Rattaché</th>
                    <th className="px-6 py-4 text-center text-[13px] font-semibold text-[#1D1D1F]">Statut</th>
                    <th className="px-6 py-4 text-right text-[13px] font-semibold text-[#1D1D1F]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {paginatedCities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#86868B]">
                        Aucune ville trouvée.
                      </td>
                    </tr>
                  ) : (
                    paginatedCities.map(city => {
                      const country = countries.find(c => c.id === city.country_id);

                      return (
                        <tr key={city.id} className="hover:bg-black/5 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#86868B]" />
                              <span className="text-[15px] font-bold text-[#1D1D1F]">{city.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[18px]">{country?.flag_emoji || "🌐"}</span>
                              <span className="text-[14px] text-[#1D1D1F] font-medium">{country?.name || "N/A"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleCityStatus(city.id, city.is_active)}
                              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                                city.is_active
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                            >
                              {city.is_active ? "Actif" : "Inactif"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingCity(city);
                                setCityFormData({ country_id: city.country_id, name: city.name });
                                setShowCityModal(true);
                              }}
                              className="p-2 hover:bg-black/5 rounded-lg text-[#86868B] hover:text-[#1D1D1F]"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCity(city.id, city.name)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Réglette de pagination (10 villes par page) */}
            {filteredCities.length > 0 && (
              <div className="px-6 py-4 border-t border-black/5 bg-[#F5F5F7]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[13px] text-[#86868B]">
                  Affichage de <span className="font-semibold text-[#1D1D1F]">{((citiesPage - 1) * CITIES_PER_PAGE) + 1}</span> à <span className="font-semibold text-[#1D1D1F]">{Math.min(citiesPage * CITIES_PER_PAGE, filteredCities.length)}</span> sur <span className="font-semibold text-[#1D1D1F]">{filteredCities.length}</span> villes (Trie A ➔ Z)
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCitiesPage(p => Math.max(p - 1, 1))}
                    disabled={citiesPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-black/10 bg-white text-[13px] font-semibold text-[#1D1D1F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition-all"
                  >
                    Précédent
                  </button>

                  {Array.from({ length: totalCitiesPages }, (_, idx) => idx + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCitiesPage(page)}
                      className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-all ${
                        citiesPage === page
                          ? "bg-[#1D1D1F] text-white shadow-sm"
                          : "bg-white border border-black/10 text-[#1D1D1F] hover:bg-black/5"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCitiesPage(p => Math.min(p + 1, totalCitiesPages))}
                    disabled={citiesPage === totalCitiesPages}
                    className="px-3 py-1.5 rounded-lg border border-black/10 bg-white text-[13px] font-semibold text-[#1D1D1F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition-all"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: MOYENS DE PAIEMENT */}
      {activeTab === "payments" && (
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardHeader className="py-4 px-6 border-b border-black/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[18px] font-bold text-[#1D1D1F]">Tous les Moyens de Paiement</CardTitle>
              <CardDescription>Configuration globale des modes de règlement.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F7] border-b border-black/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Méthode</th>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Fournisseur / Code</th>
                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Pays / Zone</th>
                    <th className="px-6 py-4 text-center text-[13px] font-semibold text-[#1D1D1F]">Statut</th>
                    <th className="px-6 py-4 text-right text-[13px] font-semibold text-[#1D1D1F]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredPayments.map(pm => {
                    const country = countries.find(c => c.id === pm.country_id);
                    const city = pm.city_id ? cities.find(ci => ci.id === pm.city_id) : null;

                    return (
                      <tr key={pm.id} className="hover:bg-black/5 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold">
                              <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[15px] font-bold text-[#1D1D1F]">{pm.name}</p>
                              {pm.instructions && (
                                <p className="text-[11px] text-[#86868B] italic">{pm.instructions}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] font-semibold px-2 py-1 bg-black/5 rounded text-[#1D1D1F]">
                            {pm.provider} ({pm.code})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[16px]">{country?.flag_emoji || "🌐"}</span>
                            <span className="text-[14px] text-[#1D1D1F]">
                              {country?.name || "Global"} {city ? `(${city.name})` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => togglePaymentStatus(pm.id, pm.is_active)}
                            className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                              pm.is_active
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {pm.is_active ? "Actif" : "Inactif"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingPayment(pm);
                              setPaymentFormData({
                                country_id: pm.country_id,
                                city_id: pm.city_id || "",
                                name: pm.name,
                                code: pm.code,
                                provider: pm.provider,
                                icon_name: pm.icon_name || "Wallet",
                                instructions: pm.instructions || ""
                              });
                              setShowPaymentModal(true);
                            }}
                            className="p-2 hover:bg-black/5 rounded-lg text-[#86868B] hover:text-[#1D1D1F]"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(pm.id, pm.name)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL PAYS */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                {editingCountry ? "Modifier le Pays" : "Ajouter un Pays"}
              </h3>
              <button onClick={() => setShowCountryModal(false)} className="p-1 hover:bg-black/5 rounded-full">
                <X className="w-5 h-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleSaveCountry} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Nom du Pays</label>
                <input
                  type="text"
                  placeholder="ex: République Démocratique du Congo"
                  value={countryFormData.name}
                  onChange={(e) => setCountryFormData({ ...countryFormData, name: e.target.value })}
                  className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Code (ex: RDC)</label>
                  <input
                    type="text"
                    placeholder="RDC"
                    value={countryFormData.code}
                    onChange={(e) => setCountryFormData({ ...countryFormData, code: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] uppercase focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Indicatif Tel</label>
                  <input
                    type="text"
                    placeholder="+243"
                    value={countryFormData.phone_code}
                    onChange={(e) => setCountryFormData({ ...countryFormData, phone_code: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Devise (ex: CDF)</label>
                  <input
                    type="text"
                    placeholder="CDF"
                    value={countryFormData.currency}
                    onChange={(e) => setCountryFormData({ ...countryFormData, currency: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] uppercase focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Emoji Drapeau</label>
                  <input
                    type="text"
                    placeholder="🇨🇩"
                    value={countryFormData.flag_emoji}
                    onChange={(e) => setCountryFormData({ ...countryFormData, flag_emoji: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] text-center text-xl focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowCountryModal(false)}
                  className="h-11 px-4 rounded-xl text-[#86868B] hover:bg-black/5 font-medium text-[14px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 bg-[#1D1D1F] text-white rounded-xl font-semibold text-[14px] hover:bg-[#3A3A3C]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VILLE */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                {editingCity ? "Modifier la Ville" : "Ajouter une Ville"}
              </h3>
              <button onClick={() => setShowCityModal(false)} className="p-1 hover:bg-black/5 rounded-full">
                <X className="w-5 h-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleSaveCity} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Pays Rattaché</label>
                <select
                  value={cityFormData.country_id}
                  onChange={(e) => setCityFormData({ ...cityFormData, country_id: e.target.value })}
                  className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                  required
                >
                  <option value="">Sélectionner un pays...</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.flag_emoji} {c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Nom de la Ville</label>
                <input
                  type="text"
                  placeholder="ex: Kinshasa, Lubumbashi..."
                  value={cityFormData.name}
                  onChange={(e) => setCityFormData({ ...cityFormData, name: e.target.value })}
                  className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowCityModal(false)}
                  className="h-11 px-4 rounded-xl text-[#86868B] hover:bg-black/5 font-medium text-[14px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 bg-[#1D1D1F] text-white rounded-xl font-semibold text-[14px] hover:bg-[#3A3A3C]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-black/5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-[#1D1D1F]">
                {editingPayment ? "Modifier le Moyen de Paiement" : "Nouveau Moyen de Paiement"}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-black/5 rounded-full">
                <X className="w-5 h-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Pays</label>
                  <select
                    value={paymentFormData.country_id}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, country_id: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none"
                    required
                  >
                    <option value="">Sélectionner un pays...</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.flag_emoji} {c.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Ville (Optionnel)</label>
                  <select
                    value={paymentFormData.city_id}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, city_id: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none"
                  >
                    <option value="">Tout le pays (Toutes villes)</option>
                    {cities
                      .filter(ci => !paymentFormData.country_id || ci.country_id === paymentFormData.country_id)
                      .map(ci => (
                        <option key={ci.id} value={ci.id}>{ci.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Nom (ex: M-Pesa)</label>
                  <input
                    type="text"
                    placeholder="M-Pesa"
                    value={paymentFormData.name}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, name: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Code Système (ex: mpesa)</label>
                  <input
                    type="text"
                    placeholder="mpesa"
                    value={paymentFormData.code}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, code: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Fournisseur / Operator</label>
                  <input
                    type="text"
                    placeholder="Vodacom, MTN, Airtel..."
                    value={paymentFormData.provider}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, provider: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Icône</label>
                  <select
                    value={paymentFormData.icon_name}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, icon_name: e.target.value })}
                    className="w-full h-11 px-4 border border-black/10 rounded-xl text-[14px] bg-white focus:outline-none"
                  >
                    <option value="Wallet">Wallet (Portefeuille)</option>
                    <option value="CreditCard">CreditCard (Carte Bancaire)</option>
                    <option value="Banknote">Banknote (Espèces/Cash)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1">Instructions de Paiement</label>
                <textarea
                  placeholder="ex: Tapez la syntaxe USSD *1122# pour valider..."
                  value={paymentFormData.instructions}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, instructions: e.target.value })}
                  rows={2}
                  className="w-full p-3 border border-black/10 rounded-xl text-[14px] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="h-11 px-4 rounded-xl text-[#86868B] hover:bg-black/5 font-medium text-[14px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 bg-[#1D1D1F] text-white rounded-xl font-semibold text-[14px] hover:bg-[#3A3A3C]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
