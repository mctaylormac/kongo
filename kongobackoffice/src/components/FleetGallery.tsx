import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Play, 
  Star, 
  Users,
  Calendar,
  Zap,
  Shield,
  Eye
} from "lucide-react";

interface FleetPhoto {
  id: string;
  url: string;
  title: string;
  description: string;
  category: 'exterior' | 'interior' | 'amenities' | 'driver' | 'maintenance';
  isVideo?: boolean;
}

interface Bus {
  id: string;
  model: string;
  plateNumber: string;
  capacity: number;
  busType: 'Standard' | 'VIP' | 'Luxury' | 'VIP Coastal';
  yearManufactured: number;
  amenities: string[];
  status: 'Active' | 'Maintenance' | 'Retired';
  rating: number;
  totalTrips: number;
  photos?: FleetPhoto[];
}

interface FleetGalleryProps {
  bus: Bus;
  agencyName: string;
}

// Photos réelles d'internet pour chaque type de bus
const generateBusPhotos = (bus: Bus): FleetPhoto[] => {
  const baseUrl = 'https://images.unsplash.com';
  
  // Photos extérieures - Vrais bus de transport
  const exteriorPhotos = [
    {
      id: `${bus.id}-ext-1`,
      url: `${baseUrl}/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop`,
      title: `${bus.model} - Vue frontale`,
      description: 'Bus moderne pour transport interurbain, design professionnel et sécurisé',
      category: 'exterior' as const
    },
    {
      id: `${bus.id}-ext-2`, 
      url: `${baseUrl}/photo-1570125909232-da877d59e4ca?w=800&h=600&fit=crop`,
      title: `${bus.model} - Profil complet`,
      description: 'Vue latérale complète montrant la taille imposante et l\'élégance du véhicule',
      category: 'exterior' as const
    },
    {
      id: `${bus.id}-ext-3`,
      url: `${baseUrl}/photo-1449824904-4b354ce3441e?w=800&h=600&fit=crop`,
      title: `${bus.model} - En station`,
      description: 'Bus à quai dans une gare moderne, prêt pour l\'embarquement des passagers',
      category: 'exterior' as const
    },
    {
      id: `${bus.id}-ext-4`,
      url: `${baseUrl}/photo-1494515843-de4081b6e40a?w=800&h=600&fit=crop`,
      title: `${bus.model} - Sur route`,
      description: 'En service sur les routes congolaises, performance et fiabilité garanties',
      category: 'exterior' as const
    },
    {
      id: `${bus.id}-ext-5`,
      url: `${baseUrl}/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop`,
      title: `${bus.model} - Flotte KonGO`,
      description: 'Plusieurs bus de la flotte alignés, montrant la modernité du parc automobile',
      category: 'exterior' as const
    }
  ];

  // Photos intérieures - Adaptées au type de bus
  let interiorPhotos = [];
  
  if (bus.busType === 'Luxury') {
    interiorPhotos = [
      {
        id: `${bus.id}-int-1`,
        url: `${baseUrl}/photo-1544620363-2963bb6058ab?w=800&h=600&fit=crop`,
        title: 'Cabine Luxury - Sièges Premium',
        description: `Sièges en cuir véritable avec inclinaison 180°, espacement généreux pour ${bus.capacity} passagers de première classe`,
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-2`,
        url: `${baseUrl}/photo-1506905925-fb4b3db2f0e4?w=800&h=600&fit=crop`,
        title: 'Salon VIP',
        description: 'Espace salon exclusif avec éclairage LED ambiant et finitions premium',
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-3`,
        url: `${baseUrl}/photo-1556742502-ec7c0e9f34b1?w=800&h=600&fit=crop`,
        title: 'Configuration couchettes',
        description: 'Sièges transformables en couchettes pour un repos optimal durant les longs trajets',
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-4`,
        url: `${baseUrl}/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop`,
        title: 'Espace détente premium',
        description: 'Zone de relaxation avec écrans individuels et service personnalisé',
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-5`,
        url: `${baseUrl}/photo-1517263985-b4e3a0c7e1c7?w=800&h=600&fit=crop`,
        title: 'Fenêtres panoramiques',
        description: 'Grandes baies vitrées pour admirer les paysages congolais en tout confort',
        category: 'interior' as const
      }
    ];
  } else if (bus.busType === 'VIP' || bus.busType === 'VIP Coastal') {
    interiorPhotos = [
      {
        id: `${bus.id}-int-1`,
        url: `${baseUrl}/photo-1544731216-ec44d1b168b2?w=800&h=600&fit=crop`,
        title: 'Intérieur VIP',
        description: `Sièges rembourrés avec accoudoirs ergonomiques, capacité optimisée ${bus.capacity} passagers`,
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-2`,
        url: `${baseUrl}/photo-1578662996442-48f4ac4b4a20?w=800&h=600&fit=crop`,
        title: 'Allée centrale spacieuse',
        description: 'Circulation aisée avec revêtement antidérapant et éclairage de sécurité',
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-3`,
        url: `${baseUrl}/photo-1517263985-b4e3a0c7e1c7?w=800&h=600&fit=crop`,
        title: 'Fenêtres teintées',
        description: bus.busType === 'VIP Coastal' ? 
          'Grandes fenêtres pour admirer les paysages côtiers vers Muanda' : 
          'Vitres teintées pour protection solaire et intimité des passagers',
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-4`,
        url: `${baseUrl}/photo-1520637836862-4d197d17c0a5?w=800&h=600&fit=crop`,
        title: 'Sièges inclinables VIP',
        description: 'Sièges haute qualité avec inclinaison et repose-pieds pour voyages longue distance',
        category: 'interior' as const
      }
    ];
  } else {
    interiorPhotos = [
      {
        id: `${bus.id}-int-1`,
        url: `${baseUrl}/photo-1544731216-ec44d1b168b2?w=800&h=600&fit=crop`,
        title: 'Intérieur Standard confortable',
        description: `Sièges ergonomiques durables pour ${bus.capacity} passagers, confort garanti pour tous trajets`,
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-2`,
        url: `${baseUrl}/photo-1517263985-b4e3a0c7e1c7?w=800&h=600&fit=crop`,
        title: 'Configuration optimisée',
        description: 'Aménagement intelligent pour familles et voyageurs d\'affaires',
        category: 'interior' as const
      },
      {
        id: `${bus.id}-int-3`,
        url: `${baseUrl}/photo-1581093588502-9a35e6c2b025?w=800&h=600&fit=crop`,
        title: 'Espace bagages',
        description: 'Compartiments sécurisés pour vos effets personnels et bagages',
        category: 'interior' as const
      }
    ];
  }

  // Photos d'équipements - Selon les amenities du bus
  const amenityPhotos = [
    {
      id: `${bus.id}-amenity-1`,
      url: `${baseUrl}/photo-1512941937-74d9b59c8df1?w=800&h=600&fit=crop`,
      title: 'WiFi haut débit gratuit',
      description: 'Connexion internet stable pendant tout le voyage pour rester connecté',
      category: 'amenities' as const
    },
    {
      id: `${bus.id}-amenity-2`,
      url: `${baseUrl}/photo-1595436793-4ad1cd5b6df9?w=800&h=600&fit=crop`,
      title: 'Climatisation individuelle',
      description: 'Système de climatisation moderne avec contrôle de température par zone',
      category: 'amenities' as const
    },
    {
      id: `${bus.id}-amenity-3`,
      url: `${baseUrl}/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop`,
      title: 'Prises USB et électriques',
      description: 'Ports de rechargement à chaque siège pour appareils électroniques',
      category: 'amenities' as const
    },
    {
      id: `${bus.id}-amenity-4`,
      url: `${baseUrl}/photo-1556742049-0a0cb81e4d4c?w=800&h=600&fit=crop`,
      title: 'Éclairage LED moderne',
      description: 'Éclairage adaptatif pour lecture et détente selon le moment du voyage',
      category: 'amenities' as const
    },
    {
      id: `${bus.id}-amenity-5`,
      url: `${baseUrl}/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop`,
      title: 'Toilettes à bord',
      description: 'Sanitaires propres et modernes disponibles pour les longs trajets',
      category: 'amenities' as const
    }
  ];

  // Photos spéciales pour bus premium
  if (bus.busType === 'Luxury' || bus.busType === 'VIP') {
    amenityPhotos.push(
      {
        id: `${bus.id}-luxury-1`,
        url: `${baseUrl}/photo-1580393798125-7b63c8c07f38?w=800&h=600&fit=crop`,
        title: 'Service premium à bord',
        description: 'Personnel dédié pour votre confort : collations, boissons et assistance',
        category: 'amenities' as const
      },
      {
        id: `${bus.id}-luxury-2`,
        url: `${baseUrl}/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop`,
        title: 'Écrans de divertissement',
        description: 'Système multimédia individuel avec films et musique pour agrémenter le voyage',
        category: 'amenities' as const
      },
      {
        id: `${bus.id}-luxury-3`,
        url: `${baseUrl}/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop`,
        title: 'Kit confort premium',
        description: 'Couvertures, oreillers et trousses de voyage offertes en classe affaires',
        category: 'amenities' as const
      }
    );
  }

  // Photos spéciales pour VIP Coastal
  if (bus.busType === 'VIP Coastal') {
    amenityPhotos.push(
      {
        id: `${bus.id}-coastal-1`,
        url: `${baseUrl}/photo-1507003211169-0a1dd7a616e3?w=800&h=600&fit=crop`,
        title: 'Guide touristique expert',
        description: 'Guide professionnel connaisseur de la côte atlantique et des sites historiques',
        category: 'amenities' as const
      },
      {
        id: `${bus.id}-coastal-2`,
        url: `${baseUrl}/photo-1514933651-c17b3d73c6e1?w=800&h=600&fit=crop`,
        title: 'Spécialités culinaires locales',
        description: 'Dégustation de plats typiques et produits locaux pendant l\'excursion côtière',
        category: 'amenities' as const
      },
      {
        id: `${bus.id}-coastal-3`,
        url: `${baseUrl}/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop`,
        title: 'Panorama océanique',
        description: 'Vue imprenable sur l\'océan Atlantique et les paysages côtiers uniques du Congo',
        category: 'amenities' as const
      }
    );
  }

  // Photos de maintenance et sécurité
  const maintenancePhotos = [];
  if (bus.status === 'Active' && bus.rating >= 4.0) {
    maintenancePhotos.push(
      {
        id: `${bus.id}-maintenance-1`,
        url: `${baseUrl}/photo-1581093588502-9a35e6c2b025?w=800&h=600&fit=crop`,
        title: 'Maintenance préventive',
        description: 'Entretien régulier par des mécaniciens certifiés dans nos ateliers modernes',
        category: 'maintenance' as const
      },
      {
        id: `${bus.id}-maintenance-2`,
        url: `${baseUrl}/photo-1530046297-bce9d16d566e?w=800&h=600&fit=crop`,
        title: 'Contrôle sécurité quotidien',
        description: 'Inspection complète des freins, pneus et systèmes avant chaque départ',
        category: 'maintenance' as const
      },
      {
        id: `${bus.id}-maintenance-3`,
        url: `${baseUrl}/photo-1454165804-4f954022a2df?w=800&h=600&fit=crop`,
        title: 'Équipe technique qualifiée',
        description: 'Techniciens formés aux standards internationaux pour votre sécurité maximale',
        category: 'maintenance' as const
      },
      {
        id: `${bus.id}-maintenance-4`,
        url: `${baseUrl}/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop`,
        title: 'Garage moderne équipé',
        description: 'Installations de pointe avec outils diagnostics avancés pour maintenance optimale',
        category: 'maintenance' as const
      },
      {
        id: `${bus.id}-maintenance-5`,
        url: `${baseUrl}/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop`,
        title: 'Certification sécurité',
        description: 'Contrôles techniques réguliers conformes aux normes RDC et internationales',
        category: 'maintenance' as const
      }
    );
  }

  // Photos du personnel et service
  const driverPhotos = [
    {
      id: `${bus.id}-driver-1`,
      url: `${baseUrl}/photo-1507003211169-0a1dd7a616e3?w=800&h=600&fit=crop`,
      title: 'Chauffeur professionnel expérimenté',
      description: 'Conducteurs sélectionnés avec plus de 10 ans d\'expérience sur routes congolaises',
      category: 'driver' as const
    },
    {
      id: `${bus.id}-driver-2`,
      url: `${baseUrl}/photo-1556157382-97eda2d62740?w=800&h=600&fit=crop`,
      title: 'Équipe d\'accueil souriante',
      description: 'Personnel hospitalier formé pour assurer votre confort et répondre à vos besoins',
      category: 'driver' as const
    },
    {
      id: `${bus.id}-driver-3`,
      url: `${baseUrl}/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop`,
      title: 'Formation continue du personnel',
      description: 'Sessions régulières de formation sécurité et service client pour notre équipe',
      category: 'driver' as const
    },
    {
      id: `${bus.id}-driver-4`,
      url: `${baseUrl}/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop`,
      title: 'Service clientèle dédiée',
      description: 'Assistance personnalisée depuis la réservation jusqu\'à l\'arrivée à destination',
      category: 'driver' as const
    },
    {
      id: `${bus.id}-driver-5`,
      url: `${baseUrl}/photo-1584017911766-d451b3d0e843?w=800&h=600&fit=crop`,
      title: 'Uniforme professionnel',
      description: 'Présentation soignée et identification claire de tous nos collaborateurs',
      category: 'driver' as const
    }
  ];

  // Combiner toutes les photos selon le type de bus
  let allPhotos = [
    ...exteriorPhotos,
    ...interiorPhotos,
    ...amenityPhotos,
    ...driverPhotos
  ];

  // Ajouter les photos de maintenance seulement pour les bus actifs bien notés
  if (maintenancePhotos.length > 0) {
    allPhotos = [...allPhotos, ...maintenancePhotos];
  }

  return allPhotos.filter(photo => photo); // Filtrer les éléments undefined
};

export function FleetGallery({ bus, agencyName }: FleetGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const photos = bus.photos || generateBusPhotos(bus);
  const categories = [
    { id: 'all', label: 'Toutes', count: photos.length },
    { id: 'exterior', label: 'Extérieur', count: photos.filter(p => p.category === 'exterior').length },
    { id: 'interior', label: 'Intérieur', count: photos.filter(p => p.category === 'interior').length },
    { id: 'amenities', label: 'Équipements', count: photos.filter(p => p.category === 'amenities').length },
    { id: 'maintenance', label: 'Sécurité', count: photos.filter(p => p.category === 'maintenance').length },
    { id: 'driver', label: 'Service', count: photos.filter(p => p.category === 'driver').length }
  ].filter(cat => cat.count > 0); // Ne montrer que les catégories qui ont des photos

  const filteredPhotos = activeCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === activeCategory);

  const getBusTypeGradient = (busType: string) => {
    switch (busType) {
      case 'Luxury':
        return 'bg-gradient-to-br from-purple-600 to-purple-800';
      case 'VIP':
        return 'bg-gradient-to-br from-blue-600 to-blue-800';
      case 'VIP Coastal':
        return 'bg-gradient-to-br from-cyan-600 to-cyan-800';
      default:
        return 'bg-gradient-to-br from-gray-600 to-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'exterior': return 'Extérieur';
      case 'interior': return 'Intérieur';
      case 'amenities': return 'Équipements';
      case 'maintenance': return 'Sécurité';
      case 'driver': return 'Service';
      default: return 'Autre';
    }
  };

  const nextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const prevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  if (photos.length === 0) {
    return (
      <div className="bg-surface-secondary rounded-lg p-8 text-center">
        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-body text-secondary">Photos de la flotte bientôt disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec informations du bus */}
      <div className={`${getBusTypeGradient(bus.busType)} rounded-xl p-6 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-h3 font-bold mb-2">{bus.model}</h3>
              <div className="flex items-center space-x-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  {bus.busType}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span className="font-semibold">{bus.rating}</span>
                </div>
                <div className="text-body-small opacity-90">
                  {photos.length} photos
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-h4 font-bold">{bus.capacity}</div>
              <div className="text-body-small opacity-90">passagers</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Calendar className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <div className="text-body-small font-medium">{bus.yearManufactured}</div>
              <div className="text-caption opacity-70">Année</div>
            </div>
            <div>
              <Shield className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <div className="text-body-small font-medium">{bus.totalTrips}</div>
              <div className="text-caption opacity-70">Voyages</div>
            </div>
            <div>
              <Zap className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <div className="text-body-small font-medium">{bus.amenities.length}</div>
              <div className="text-caption opacity-70">Équipements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres de catégories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveCategory(category.id);
              setSelectedPhotoIndex(0);
            }}
            className={`transition-all duration-200 ${
              activeCategory === category.id 
                ? "bg-kongo-black text-white shadow-md" 
                : "border-kongo-black/20 hover:border-kongo-lime hover:text-kongo-lime-dark"
            }`}
          >
            {category.label} ({category.count})
          </Button>
        ))}
      </div>

      {/* Message informatif */}
      {filteredPhotos.length > 0 && (
        <div className="bg-surface-kongo-lime-light border border-kongo-lime/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-kongo-lime-dark" />
            <p className="text-body-small text-kongo-lime-dark">
              <strong>{filteredPhotos.length} photos authentiques</strong> - 
              Découvrez nos véhicules et services en images réelles. Cliquez pour voir en grand format.
            </p>
          </div>
        </div>
      )}

      {/* Galerie principale */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.slice(0, 11).map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group cursor-pointer"
            onClick={() => {
              setSelectedPhotoIndex(index);
              setIsGalleryOpen(true);
            }}
          >
            <div className="aspect-[4/3] relative overflow-hidden rounded-lg bg-surface-secondary shadow-base hover:shadow-md transition-all duration-300">
              <ImageWithFallback
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Overlay avec informations */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-white font-semibold text-sm mb-1 line-clamp-1">{photo.title}</h4>
                  <p className="text-white/80 text-xs line-clamp-2">{photo.description}</p>
                </div>
              </div>

              {/* Indicateur de vidéo */}
              {photo.isVideo && (
                <div className="absolute top-3 right-3">
                  <div className="bg-white/90 rounded-full p-2">
                    <Play className="w-4 h-4 text-kongo-black" />
                  </div>
                </div>
              )}

              {/* Indicateur de catégorie */}
              <div className="absolute top-3 left-3">
                <Badge className="bg-kongo-lime/90 text-kongo-black text-xs font-medium">
                  {getCategoryLabel(photo.category)}
                </Badge>
              </div>

              {/* Effet de surbrillance */}
              <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-kongo-lime/50 rounded-lg transition-all duration-300"></div>
            </div>
          </motion.div>
        ))}

        {/* Bouton voir plus si il y a plus de 11 photos */}
        {filteredPhotos.length > 11 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }}
            className="aspect-[4/3] relative"
          >
            <Button
              onClick={() => setIsGalleryOpen(true)}
              className="w-full h-full bg-surface-kongo-lime-light border-2 border-dashed border-kongo-lime hover:bg-surface-kongo-lime-medium transition-all duration-300 rounded-lg shadow-base hover:shadow-md"
            >
              <div className="text-center">
                <Eye className="w-8 h-8 text-kongo-lime-dark mx-auto mb-2" />
                <div className="text-kongo-lime-dark font-semibold text-lg">
                  +{filteredPhotos.length - 11}
                </div>
                <div className="text-kongo-lime-dark/70 text-sm">
                  autres photos
                </div>
                <div className="text-kongo-lime-dark/60 text-xs mt-1">
                  Voir toute la galerie
                </div>
              </div>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal de galerie complète */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          {/* Titre et description pour l'accessibilité */}
          <DialogTitle className="sr-only">
            Galerie photos {agencyName} - {bus.model}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Galerie complète des photos du {bus.model} de {agencyName}. 
            Naviguez entre les {filteredPhotos.length} photos disponibles en utilisant les flèches ou les miniatures.
          </DialogDescription>
          
          <div className="relative h-full">
            {/* Header avec informations visibles */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-xl">{agencyName}</h3>
                  <p className="text-white/80">{bus.model} - {filteredPhotos[selectedPhotoIndex]?.title}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-white/80 text-sm">
                    {getCategoryLabel(filteredPhotos[selectedPhotoIndex]?.category)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsGalleryOpen(false)}
                    className="text-white hover:bg-white/20"
                    aria-label="Fermer la galerie"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Image principale */}
            <div className="relative h-[70vh] bg-black">
              {filteredPhotos[selectedPhotoIndex] && (
                <ImageWithFallback
                  src={filteredPhotos[selectedPhotoIndex].url}
                  alt={filteredPhotos[selectedPhotoIndex].title}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Boutons navigation */}
              {filteredPhotos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 transition-all duration-200"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 transition-all duration-200"
                    aria-label="Photo suivante"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Compteur et indicateurs */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {selectedPhotoIndex + 1} / {filteredPhotos.length}
              </div>

              {/* Indicateur de catégorie en grand */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-kongo-lime/90 text-kongo-black text-sm font-medium">
                  {getCategoryLabel(filteredPhotos[selectedPhotoIndex]?.category)}
                </Badge>
              </div>
            </div>

            {/* Miniatures */}
            <div className="p-4 bg-surface-elevated max-h-[20vh] overflow-y-auto">
              <div className="flex space-x-2">
                {filteredPhotos.map((photo, index) => (
                  <Button
                    key={photo.id}
                    variant="ghost"
                    className={`relative p-0 h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${
                      index === selectedPhotoIndex 
                        ? 'ring-2 ring-kongo-lime shadow-lg' 
                        : 'opacity-70 hover:opacity-100 hover:ring-1 hover:ring-kongo-lime/50'
                    }`}
                    onClick={() => setSelectedPhotoIndex(index)}
                    aria-label={`Voir la photo: ${photo.title}`}
                  >
                    <ImageWithFallback
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Badge catégorie sur miniature */}
                    <div className="absolute top-1 left-1">
                      <div className={`w-2 h-2 rounded-full ${
                        index === selectedPhotoIndex ? 'bg-kongo-lime' : 'bg-white/60'
                      }`}></div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Description détaillée en bas */}
            {filteredPhotos[selectedPhotoIndex] && (
              <div className="absolute bottom-20 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-white text-lg mb-3 font-medium">
                    {filteredPhotos[selectedPhotoIndex].description}
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-white/70 text-sm">
                    <span className="flex items-center space-x-1">
                      <span>Bus</span>
                      <span className="font-medium text-kongo-lime">{bus.plateNumber}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{bus.capacity} places</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span>{bus.rating}/5</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
