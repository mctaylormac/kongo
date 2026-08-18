import { useEffect, useState } from "react";
import { ArrowRight, Clock, MapPin, Search, Star, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { supabase } from "../lib/supabase";
import type { FavoriteRoute } from "./app/AppTypes";

interface Destination {
  id: string;
  from: string;
  to: string;
  price: number;
  currency: string;
  duration: string;
  nextDeparture: string;
  features: string[];
  popular: boolean;
}

interface DestinationsCarouselProps {
  favoriteRoutes: FavoriteRoute[];
}

const fallbackDestinations: Destination[] = [
  {
    id: "1",
    from: "Kinshasa",
    to: "Lubumbashi",
    price: 125000,
    currency: "CDF",
    duration: "16h",
    nextDeparture: "Aujourd'hui 14:00",
    features: ["WiFi", "Climatisation", "Repas"],
    popular: true
  },
  {
    id: "2",
    from: "Kinshasa",
    to: "Goma",
    price: 95000,
    currency: "CDF",
    duration: "12h",
    nextDeparture: "Demain 08:00",
    features: ["WiFi", "Climatisation"],
    popular: true
  },
  {
    id: "3",
    from: "Lubumbashi",
    to: "Kolwezi",
    price: 45000,
    currency: "CDF",
    duration: "4h",
    nextDeparture: "Aujourd'hui 16:30",
    features: ["Climatisation"],
    popular: false
  },
  {
    id: "4",
    from: "Kinshasa",
    to: "Matadi",
    price: 35000,
    currency: "CDF",
    duration: "5h",
    nextDeparture: "Aujourd'hui 10:00",
    features: ["WiFi", "Toilettes"],
    popular: false
  },
  {
    id: "5",
    from: "Goma",
    to: "Bukavu",
    price: 25000,
    currency: "CDF",
    duration: "3h",
    nextDeparture: "Demain 07:00",
    features: ["Climatisation", "Vue panoramique"],
    popular: true
  },
  {
    id: "6",
    from: "Kisangani",
    to: "Goma",
    price: 70000,
    currency: "CDF",
    duration: "9h",
    nextDeparture: "Vendredi 09:00",
    features: ["WiFi", "USB"],
    popular: false
  }
];

const getDayString = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === tomorrow.toDateString()) return "Demain";

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const mapAmenities = (amenitiesList: unknown) => {
  if (!Array.isArray(amenitiesList)) return [];

  return amenitiesList
    .filter((amenity): amenity is string => typeof amenity === "string")
    .map((amenity) => {
      switch (amenity.toLowerCase()) {
        case "wifi":
          return "WiFi";
        case "air_conditioning":
          return "Climatisation";
        case "food":
          return "Repas";
        case "toilet":
          return "Toilettes";
        case "tv":
          return "TV";
        default:
          return amenity;
      }
    });
};

const getDuration = (departureTime?: string, arrivalTime?: string) => {
  if (!departureTime || !arrivalTime) return "12h";

  const arrival = new Date(arrivalTime).getTime();
  const departure = new Date(departureTime).getTime();
  const diffMins = Math.round((arrival - departure) / 60000);

  if (diffMins <= 0) return "12h";

  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  return `${hours}h${minutes ? minutes.toString().padStart(2, "0") : ""}`;
};

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: currency === "CDF" ? "CDF" : "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);

const launchRouteSearch = (from: string, to: string) => {
  window.dispatchEvent(new CustomEvent("quick-search", { detail: { from, to } }));
};

export function DestinationsCarousel({ favoriteRoutes }: DestinationsCarouselProps) {
  const [destinations, setDestinations] = useState<Destination[]>(fallbackDestinations);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data, error } = await supabase
          .from("trips")
          .select(`
            id,
            departure_time,
            arrival_time,
            price,
            status,
            amenities,
            is_popular,
            origin:locations!origin_location_id (id, name, city),
            destination:locations!destination_location_id (id, name, city)
          `)
          .eq("status", "scheduled")
          .gte("departure_time", new Date().toISOString())
          .order("departure_time", { ascending: true });

        if (error) throw error;
        if (!data?.length) return;

        const uniqueRoutes = new Map<string, Destination>();

        data.forEach((trip: any) => {
          const originCity = trip.origin?.city || trip.origin?.name || "Origine inconnue";
          const destCity = trip.destination?.city || trip.destination?.name || "Destination inconnue";
          const routeKey = `${originCity}-${destCity}`;

          if (uniqueRoutes.has(routeKey)) return;

          const departureDate = new Date(trip.departure_time);
          const departureHour = departureDate.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
          });

          uniqueRoutes.set(routeKey, {
            id: trip.id,
            from: originCity,
            to: destCity,
            price: trip.price || 15000,
            currency: "CDF",
            duration: getDuration(trip.departure_time, trip.arrival_time),
            nextDeparture: `${getDayString(trip.departure_time)} ${departureHour}`,
            features: mapAmenities(trip.amenities).slice(0, 3),
            popular: trip.is_popular === true
          });
        });

        const loadedDestinations = Array.from(uniqueRoutes.values()).slice(0, 6);
        if (loadedDestinations.length) setDestinations(loadedDestinations);
      } catch (error) {
        console.error("Failed to fetch popular routes", error);
      }
    };

    void fetchTrips();
  }, []);

  return (
    <section className="bg-surface-secondary py-16 md:py-20">
      <div className="container-professional">
        <div className="mb-8 grid gap-4 md:grid-cols-[150px_minmax(0,1fr)] md:items-start lg:grid-cols-[170px_minmax(0,1fr)]">
          <Badge className="status-kongo w-fit justify-self-start">
            <Star className="mr-2 h-4 w-4" />
            Routes populaires
          </Badge>
          <Button
            className="btn-outline w-full md:col-start-2 md:row-start-1"
            onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-search"))}
          >
            <Search className="mr-2 h-4 w-4" />
            Voir toutes les routes
          </Button>
          <div className="max-w-3xl md:col-start-2 md:row-start-2">
            <h2 className="text-h2 text-kongo-black">
              Les trajets les plus recherchés
            </h2>
            <p className="mt-2 text-body text-secondary">
              Lancez une recherche en un clic sur les destinations les plus demandées.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destinations.map((destination) => (
            <div
              key={destination.id}
            >
              <Card className="card-interactive h-full rounded-lg border-border-primary bg-surface-elevated">
                <CardContent className="flex h-full flex-col gap-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 text-h4 text-kongo-black">
                        <span>{destination.from}</span>
                        <ArrowRight className="h-5 w-5 text-kongo-lime-dark" />
                        <span>{destination.to}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-body-small text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {destination.duration}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {destination.nextDeparture}
                        </span>
                      </div>
                    </div>

                    {destination.popular && (
                      <Badge className="status-kongo shrink-0">
                        Populaire
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(destination.features.length ? destination.features : ["Bus confortable"]).map((feature) => (
                      <span
                        key={feature}
                        className="rounded-md bg-surface-secondary px-2 py-1 text-caption text-tertiary"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col gap-4 border-t border-border-primary pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-caption text-tertiary">À partir de</div>
                      <div className="text-h4 font-bold text-kongo-black">
                        {formatPrice(destination.price, destination.currency)}
                      </div>
                    </div>

                    <Button
                      className="btn-primary rounded-md"
                      onClick={() => launchRouteSearch(destination.from, destination.to)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Rechercher
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {favoriteRoutes.length > 0 && (
          <div className="mt-8 rounded-lg border border-border-primary bg-surface-elevated p-4">
            <div className="mb-3 text-body-small font-semibold text-kongo-black">
              Vos routes favorites
            </div>
            <div className="flex flex-wrap gap-2">
              {favoriteRoutes.slice(0, 4).map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => launchRouteSearch(route.from, route.to)}
                  className="rounded-md border border-border-primary px-3 py-2 text-body-small font-semibold text-kongo-black transition-colors hover:border-kongo-lime hover:bg-surface-kongo-lime-light"
                >
                  {route.from} vers {route.to}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
