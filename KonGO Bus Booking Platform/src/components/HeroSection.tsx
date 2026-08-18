import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Bus,
  Calendar,
  ChevronDown,
  Headphones,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  TicketCheck,
  Train,
  Users,
  WalletCards
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "../lib/supabase";
import type { SearchParams } from "./app/AppTypes";

interface HeroSectionProps {
  onSearch?: (searchParams: SearchParams) => void;
}

interface LocationOption {
  id: string;
  name: string;
}

interface StopOption {
  id: string;
  name: string;
}

const fallbackLocations: LocationOption[] = [
  { id: "1", name: "Kinshasa" },
  { id: "2", name: "Lubumbashi" },
  { id: "3", name: "Goma" },
  { id: "4", name: "Bukavu" },
  { id: "5", name: "Kananga" },
  { id: "6", name: "Mbuji-Mayi" },
  { id: "7", name: "Kisangani" },
  { id: "8", name: "Kolwezi" }
];

const popularRoutes = [
  { from: "Kinshasa", to: "Lubumbashi", price: "125,000 CDF" },
  { from: "Kinshasa", to: "Goma", price: "95,000 CDF" },
  { from: "Lubumbashi", to: "Bukavu", price: "85,000 CDF" }
];

const trustItems = [
  { icon: WalletCards, label: "Aucun frais caché" },
  { icon: ShieldCheck, label: "Paiement sécurisé" },
  { icon: TicketCheck, label: "Billet QR instantané" },
  { icon: Headphones, label: "Support 24/7" }
];

const getDefaultDepartureDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState(getDefaultDepartureDate);
  const [passengers, setPassengers] = useState("1");
  const [transportType, setTransportType] = useState<"bus" | "train" | "all">("all");
  const [departureStops, setDepartureStops] = useState<StopOption[]>([]);
  const [arrivalStops, setArrivalStops] = useState<StopOption[]>([]);
  const [selectedDepartureStop, setSelectedDepartureStop] = useState("all");
  const [selectedArrivalStop, setSelectedArrivalStop] = useState("all");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dbLocations, setDbLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    void fetchLocations();
  }, []);

  useEffect(() => {
    const fetchStops = async () => {
      if (!fromLocation) {
        setDepartureStops([]);
        setSelectedDepartureStop("all");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("stops")
          .select("id, name")
          .ilike("city_name", `%${fromLocation}%`);

        if (error) throw error;
        setDepartureStops(data || []);
      } catch (error) {
        console.error("Error fetching departure stops:", error);
        setDepartureStops([]);
      }
      setSelectedDepartureStop("all");
    };

    void fetchStops();
  }, [fromLocation]);

  useEffect(() => {
    const fetchStops = async () => {
      if (!toLocation) {
        setArrivalStops([]);
        setSelectedArrivalStop("all");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("stops")
          .select("id, name")
          .ilike("city_name", `%${toLocation}%`);

        if (error) throw error;
        setArrivalStops(data || []);
      } catch (error) {
        console.error("Error fetching arrival stops:", error);
        setArrivalStops([]);
      }
      setSelectedArrivalStop("all");
    };

    void fetchStops();
  }, [toLocation]);

  const fetchLocations = async () => {
    try {
      // 1. Essayer de charger les villes dynamiques depuis la table 'cities'
      const { data: citiesData, error: citiesErr } = await supabase
        .from("cities")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!citiesErr && citiesData && citiesData.length > 0) {
        setDbLocations(citiesData);
        return;
      }

      // 2. Fallback table 'locations'
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;

      const uniqueLocations =
        data?.reduce<LocationOption[]>((acc, current) => {
          if (!acc.some((item) => item.name === current.name)) {
            acc.push(current);
          }
          return acc;
        }, []) || [];

      setDbLocations(uniqueLocations.length ? uniqueLocations : fallbackLocations);
    } catch (error: any) {
      console.error("Error fetching locations:", error.message);
      setDbLocations(fallbackLocations);
    }
  };

  const buildSearchParams = (from = fromLocation, to = toLocation): SearchParams => ({
    from,
    to,
    date: departureDate || getDefaultDepartureDate(),
    passengers: Number.parseInt(passengers, 10) || 1,
    transportType,
    departureStopId: selectedDepartureStop,
    arrivalStopId: selectedArrivalStop
  });

  const handleSearch = () => {
    if (!fromLocation || !toLocation) {
      toast.error("Veuillez sélectionner les villes de départ et d'arrivée");
      return;
    }

    if (fromLocation === toLocation) {
      toast.error("La ville de départ et d'arrivée ne peuvent pas être identiques");
      return;
    }

    setIsSearching(true);
    const searchParams = buildSearchParams();

    try {
      onSearch?.(searchParams);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Impossible de lancer la recherche pour le moment");
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickSearch = (route: (typeof popularRoutes)[number]) => {
    setFromLocation(route.from);
    setToLocation(route.to);
    setSelectedDepartureStop("all");
    setSelectedArrivalStop("all");

    onSearch?.({
      ...buildSearchParams(route.from, route.to),
      departureStopId: "all",
      arrivalStopId: "all"
    });
  };

  const swapLocations = () => {
    setFromLocation(toLocation);
    setToLocation(fromLocation);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="relative min-h-[calc(100svh-3.5rem)] overflow-hidden bg-kongo-black md:min-h-[calc(100vh-3.5rem)]">
      <img
        src="/hero.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-left"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-kongo-black/90 via-kongo-black/70 to-kongo-black/55" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-kongo-black/70 to-transparent" />

      <div className="relative z-10 flex min-h-[calc(100svh-3.5rem)] w-full flex-col justify-center px-4 py-8 sm:px-6 md:min-h-[calc(100vh-3.5rem)] md:px-10 md:py-10 lg:px-16 lg:py-12 xl:px-24">
        <div className="flex w-full flex-col gap-4 md:gap-5 lg:ml-auto lg:w-[calc(50vw-4rem)] lg:max-w-[720px] xl:w-[calc(50vw-6rem)] xl:max-w-[760px]">
          <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl text-white"
        >
          <h1 className="mb-3 text-3xl font-extrabold leading-tight text-white md:mb-4 md:text-5xl lg:text-5xl xl:text-6xl">
            Trouvez votre prochain trajet avec KonGO
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-white/90 md:text-body-large">
            Comparez les départs, choisissez votre billet et voyagez avec un QR code prêt à embarquer.
          </p>
        </motion.div>

        <motion.div
          id="search-form"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="relative mt-8 rounded-lg border border-border-primary bg-white shadow-2xl"
        >
          <div className="absolute right-3 top-0 z-10 -translate-y-[calc(100%+0.5rem)] rounded-md bg-kongo-lime px-4 py-2 text-label-small font-extrabold uppercase tracking-wide text-kongo-black shadow-lg md:right-5">
            Réservation bus et train en RDC
          </div>

          <div className="flex flex-col gap-3 border-b border-border-primary p-3 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="grid grid-cols-3 gap-2 md:w-[360px]">
              {[
                { value: "bus", label: "Bus", icon: Bus },
                { value: "train", label: "Train", icon: Train },
                { value: "all", label: "Tous", icon: Search }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTransportType(item.value as "bus" | "train" | "all")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-md border text-body-small font-bold transition-colors ${
                    transportType === item.value
                      ? "border-kongo-black bg-kongo-black text-white"
                      : "border-border-primary bg-surface-primary text-kongo-black hover:border-kongo-lime"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:grid-cols-2 md:p-5 lg:items-end">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-label font-bold text-kongo-black">
                <MapPin className="h-4 w-4 text-success" />
                Départ
              </label>
              <Select value={fromLocation} onValueChange={setFromLocation}>
                <SelectTrigger className="h-[52px] rounded-md border-2 border-border-secondary bg-white text-base font-semibold text-kongo-black">
                  <SelectValue placeholder="Ville de départ" />
                </SelectTrigger>
                <SelectContent>
                  {dbLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              aria-label="Inverser les villes"
              onClick={swapLocations}
              disabled={!fromLocation && !toLocation}
              className="hidden"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-label font-bold text-kongo-black">
                <MapPin className="h-4 w-4 text-error" />
                Arrivée
              </label>
              <Select value={toLocation} onValueChange={setToLocation}>
                <SelectTrigger className="h-[52px] rounded-md border-2 border-border-secondary bg-white text-base font-semibold text-kongo-black">
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {dbLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={swapLocations}
              disabled={!fromLocation && !toLocation}
              className="flex h-11 items-center justify-center gap-2 rounded-md border-2 border-border-secondary bg-surface-secondary text-body-small font-bold text-kongo-black transition-colors hover:border-kongo-lime hover:bg-surface-kongo-lime-light disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Inverser départ et arrivée
            </button>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-label font-bold text-kongo-black">
                <Calendar className="h-4 w-4 text-info" />
                Date
              </label>
              <Input
                type="date"
                value={departureDate}
                onChange={(event) => setDepartureDate(event.target.value)}
                min={today}
                className="h-[52px] rounded-md border-2 border-border-secondary bg-white text-base font-semibold text-kongo-black"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-label font-bold text-kongo-black">
                <Users className="h-4 w-4 text-warning" />
                Passagers
              </label>
              <Select value={passengers} onValueChange={setPassengers}>
                <SelectTrigger className="h-[52px] rounded-md border-2 border-border-secondary bg-white text-base font-semibold text-kongo-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(50)].map((_, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {index + 1} {index === 0 ? "passager" : "passagers"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="btn-secondary h-[52px] w-full rounded-md text-lg font-extrabold sm:col-span-2"
            >
              <Search className="mr-2 h-5 w-5" />
              Rechercher
            </Button>
          </div>

          <div className="px-3 pb-3 md:px-5 md:pb-4">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions((value) => !value)}
              className="flex w-full items-center justify-between rounded-md border-2 border-border-secondary bg-surface-secondary px-3 py-2 text-left text-body-small font-bold text-kongo-black transition-colors hover:border-kongo-lime hover:bg-surface-kongo-lime-light md:w-auto md:min-w-[260px]"
              aria-expanded={showAdvancedOptions}
            >
              Options avancées
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAdvancedOptions ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAdvancedOptions && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 grid gap-3 md:grid-cols-2"
              >
                <Select value={selectedDepartureStop} onValueChange={setSelectedDepartureStop}>
                  <SelectTrigger className="h-11 rounded-md border-2 border-border-secondary bg-white text-body-small font-semibold">
                    <SelectValue placeholder="Tous les arrêts de départ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les arrêts de départ</SelectItem>
                    {departureStops.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id}>
                        {stop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedArrivalStop} onValueChange={setSelectedArrivalStop}>
                  <SelectTrigger className="h-11 rounded-md border-2 border-border-secondary bg-white text-body-small font-semibold">
                    <SelectValue placeholder="Tous les arrêts d'arrivée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les arrêts d'arrivée</SelectItem>
                    {arrivalStops.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id}>
                        {stop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          <div className="hidden border-t border-border-primary bg-surface-secondary px-4 py-4 sm:block md:px-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-body-small font-bold text-kongo-black">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-kongo-lime-light text-kongo-lime-dark">
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden flex-col gap-3 border-t border-border-primary px-4 py-4 md:flex md:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {popularRoutes.map((route) => (
                <button
                  key={`${route.from}-${route.to}`}
                  type="button"
                  onClick={() => handleQuickSearch(route)}
                  className="rounded-md border border-border-primary px-3 py-2 text-body-small font-bold text-kongo-black transition-colors hover:border-kongo-lime hover:bg-surface-kongo-lime-light"
                >
                  {route.from} vers {route.to}
                  <span className="ml-2 text-kongo-lime-dark">{route.price}</span>
                </button>
              ))}
            </div>

            <a
              href="tel:+243819189716"
              className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-body-small font-bold text-kongo-black transition-colors hover:bg-surface-secondary"
            >
              <Phone className="h-4 w-4" />
              +243 819 189 716
            </a>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
