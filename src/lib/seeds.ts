import { batchUpsert } from "./firestore";

// Agencies extracted from AgencyDirectory.mockAgencies (subset of fields)
const agencies = [
  {
    id: "1",
    name: "Express Premium",
    tier: "platinum",
    rating: 4.8,
    reviewCount: 2450,
    headquarters: "Kinshasa",
    region: "Kinshasa",
    operatingRoutes: [
      "Kinshasa-Lubumbashi",
      "Kinshasa-Goma",
      "Lubumbashi-Kolwezi",
      "Kinshasa-Mbuji-Mayi"
    ],
    popularRoutes: ["Kinshasa-Lubumbashi", "Kinshasa-Goma"],
    phone: "+243 81 234 5678",
    email: "contact@expresspremium.cd",
    website: "www.expresspremium.cd",
    description: "Leader du transport premium en RDC avec des véhicules climatisés et un service 5 étoiles.",
    isActive: true,
    isFeatured: true,
    isVerified: true,
    promotion: { active: true, text: "15% de réduction sur le premier voyage", code: "WELCOME15" }
  },
  {
    id: "2",
    name: "Congo Voyages",
    tier: "gold",
    rating: 4.5,
    reviewCount: 1890,
    headquarters: "Lubumbashi",
    region: "Katanga",
    operatingRoutes: [
      "Lubumbashi-Kinshasa",
      "Lubumbashi-Kolwezi",
      "Lubumbashi-Kalemie",
      "Lubumbashi-Likasi"
    ],
    popularRoutes: ["Lubumbashi-Kinshasa", "Lubumbashi-Kolwezi"],
    phone: "+243 82 345 6789",
    email: "info@congovoyages.cd",
    website: "www.congovoyages.cd",
    description: "Spécialiste des liaisons vers le Katanga avec une flotte moderne et fiable.",
    isActive: true,
    isFeatured: false,
    isVerified: true,
    promotion: { active: false, text: "", code: "" }
  }
];

// Popular routes extracted from DestinationsCarousel.destinations
const destinations = [
  {
    id: "1",
    from: "Kinshasa",
    to: "Lubumbashi",
    price: 125000,
    currency: "CDF",
    duration: "16h",
    distance: "1,200km",
    popular: true,
    features: ["WiFi", "Climatisation", "Repas"],
    rating: 4.8,
    nextDeparture: "Aujourd'hui 14:00"
  },
  {
    id: "2",
    from: "Kinshasa",
    to: "Goma",
    price: 95000,
    currency: "CDF",
    duration: "12h",
    distance: "850km",
    popular: true,
    features: ["WiFi", "Climatisation"],
    rating: 4.6,
    nextDeparture: "Demain 08:00"
  },
  {
    id: "3",
    from: "Lubumbashi",
    to: "Kolwezi",
    price: 45000,
    currency: "CDF",
    duration: "4h",
    distance: "220km",
    popular: false,
    features: ["Climatisation"],
    rating: 4.3,
    nextDeparture: "Aujourd'hui 16:30"
  },
  {
    id: "4",
    from: "Kinshasa",
    to: "Matadi",
    price: 35000,
    currency: "CDF",
    duration: "5h",
    distance: "350km",
    popular: false,
    features: ["WiFi", "Climatisation", "Toilettes"],
    rating: 4.5,
    nextDeparture: "Aujourd'hui 10:00"
  },
  {
    id: "5",
    from: "Goma",
    to: "Bukavu",
    price: 25000,
    currency: "CDF",
    duration: "3h",
    distance: "180km",
    popular: true,
    features: ["Climatisation", "Vue panoramique"],
    rating: 4.7,
    nextDeparture: "Demain 07:00"
  }
];

// Partners extracted from PartnersSection.partners
const partners = [
  { id: "partner-express-congo", name: "Express Congo" },
  { id: "partner-trans-katanga", name: "Trans-Katanga" },
  { id: "partner-kasai-express", name: "Kasai Express" },
  { id: "partner-kivu-transport", name: "Kivu Transport" },
  { id: "partner-bandundu-lines", name: "Bandundu Lines" },
  { id: "partner-maniema-bus", name: "Maniema Bus" }
];

// FAQs extracted from FAQCenter FAQ_DATA (simplified)
const faqs = [
  {
    id: "booking-1",
    category: "booking",
    question: "Comment réserver un billet de bus sur KonGO ?",
    tags: ["réservation", "billet", "étapes", "guide"],
    lastUpdated: "2024-01-15"
  },
  {
    id: "payment-1",
    category: "payment",
    question: "Quels sont les modes de paiement acceptés ?",
    tags: ["paiement", "mobile money", "carte", "agence"],
    lastUpdated: "2024-01-20"
  },
  {
    id: "travel-1",
    category: "travel",
    question: "Que faire en cas de retard ou d'annulation ?",
    tags: ["retard", "annulation", "compensation", "incident"],
    lastUpdated: "2024-01-18"
  },
  {
    id: "schedule-1",
    category: "schedule",
    question: "Comment consulter les horaires en temps réel ?",
    tags: ["horaires", "temps réel", "tracking", "GPS"],
    lastUpdated: "2024-01-22"
  },
  {
    id: "emergency-1",
    category: "emergency",
    question: "Que faire en cas d'urgence pendant le voyage ?",
    tags: ["urgence", "sécurité", "accident", "SOS"],
    lastUpdated: "2024-01-25"
  },
  {
    id: "booking-2",
    category: "booking",
    question: "Puis-je modifier ou annuler ma réservation ?",
    tags: ["modification", "annulation", "remboursement", "flexible"],
    lastUpdated: "2024-01-20"
  },
  {
    id: "payment-2",
    category: "payment",
    question: "Comment fonctionne le programme de fidélité KonGO ?",
    tags: ["fidélité", "points", "réduction", "avantages"],
    lastUpdated: "2024-01-23"
  }
];

// Banners: keeping minimal defaults (no strong static source)
const banners = [
  { id: "banner-welcome", title: "Bienvenue sur KonGO !", active: true },
  { id: "banner-discount", title: "-10% premier voyage", active: true }
];

export async function seedStaticData(): Promise<void> {
  await batchUpsert("agencies", agencies.map(a => ({ id: a.id, data: a })));
  await batchUpsert("destinations", destinations.map(d => ({ id: d.id, data: d })));
  await batchUpsert("partners", partners.map(p => ({ id: p.id, data: p })));
  await batchUpsert("faqs", faqs.map(f => ({ id: f.id, data: f })));
  await batchUpsert("banners", banners.map(b => ({ id: b.id, data: b })));
}


