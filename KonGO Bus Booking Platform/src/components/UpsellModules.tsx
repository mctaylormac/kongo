import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { 
  Shield, 
  Coffee, 
  Hotel, 
  Star, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  Utensils,
  Bed,
  Wifi,
  Car
} from "lucide-react";

interface UpsellModulesProps {
  tripRoute: string;
  arrivalCity: string;
  travelDate: string;
  basePrice: number;
}

export function UpsellModules({ tripRoute, arrivalCity, travelDate, basePrice }: UpsellModulesProps) {
  const [selectedInsurance, setSelectedInsurance] = useState("");
  const [selectedSnacks, setSelectedSnacks] = useState<string[]>([]);
  const [selectedHotel, setSelectedHotel] = useState("");

  const insuranceOptions = [
    {
      id: "basic",
      name: "Protection Essentielle",
      price: 3500,
      features: [
        "Annulation jusqu'à 24h avant",
        "Retard de plus de 2h remboursé", 
        "Assistance téléphonique 24/7"
      ],
      popular: false
    },
    {
      id: "premium",
      name: "Protection Premium",
      price: 7500,
      features: [
        "Annulation jusqu'à 2h avant",
        "Retard de plus de 1h remboursé",
        "Assistance téléphonique 24/7",
        "Remboursement médical d'urgence",
        "Protection bagages (50,000 CDF)"
      ],
      popular: true
    }
  ];

  const snackOptions = [
    {
      id: "water",
      name: "Eau minérale (500ml)",
      price: 1000,
      category: "Boissons"
    },
    {
      id: "soda",
      name: "Coca-Cola (330ml)",
      price: 1500,
      category: "Boissons"
    },
    {
      id: "sandwich",
      name: "Sandwich au poulet",
      price: 3500,
      category: "Repas"
    },
    {
      id: "nuts",
      name: "Mélange de noix",
      price: 2000,
      category: "Collations"
    },
    {
      id: "combo",
      name: "Pack voyage (sandwich + eau + chips)",
      price: 4500,
      originalPrice: 6000,
      category: "Pack",
      popular: true
    }
  ];

  const hotelOptions = [
    {
      id: "budget",
      name: "Hôtel Ville",
      rating: 3,
      price: 35000,
      originalPrice: 45000,
      features: ["WiFi gratuit", "Petit déjeuner", "Parking"],
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop",
      distance: "2 km du centre-ville"
    },
    {
      id: "comfort",
      name: "Grand Hôtel Palace",
      rating: 4,
      price: 65000,
      originalPrice: 80000,
      features: ["WiFi gratuit", "Piscine", "Restaurant", "Service de chambre"],
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=200&fit=crop",
      distance: "Centre-ville",
      popular: true
    },
    {
      id: "luxury",
      name: "Luxury Resort",
      rating: 5,
      price: 120000,
      features: ["Spa complet", "Restaurant gastronomique", "Navette aéroport", "Suite avec vue"],
      image: "https://images.unsplash.com/photo-1578774204375-826dc5d996ed?w=300&h=200&fit=crop",
      distance: "Zone premium"
    }
  ];

  const calculateTotalUpsell = () => {
    let total = 0;
    
    // Insurance
    const insurance = insuranceOptions.find(opt => opt.id === selectedInsurance);
    if (insurance) total += insurance.price;
    
    // Snacks
    selectedSnacks.forEach(snackId => {
      const snack = snackOptions.find(opt => opt.id === snackId);
      if (snack) total += snack.price;
    });
    
    // Hotel
    const hotel = hotelOptions.find(opt => opt.id === selectedHotel);
    if (hotel) total += hotel.price;
    
    return total;
  };

  const handleSnackToggle = (snackId: string, checked: boolean) => {
    if (checked) {
      setSelectedSnacks([...selectedSnacks, snackId]);
    } else {
      setSelectedSnacks(selectedSnacks.filter(id => id !== snackId));
    }
  };

  const totalUpsell = calculateTotalUpsell();
  const finalTotal = basePrice + totalUpsell;

  return (
    <div className="space-y-8">
      {/* Travel Insurance */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Assurance voyage</span>
            <Badge className="bg-blue-100 text-blue-800">Recommandé</Badge>
          </CardTitle>
          <p className="text-gray-600">
            Protégez votre voyage contre les imprévus
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedInsurance} onValueChange={setSelectedInsurance}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="no-insurance" />
                <Label htmlFor="no-insurance" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>Pas d'assurance</span>
                    <span className="text-green-600 font-medium">Gratuit</span>
                  </div>
                </Label>
              </div>
              
              {insuranceOptions.map((option) => (
                <div key={option.id} className={`border rounded-lg p-4 transition-colors ${
                  selectedInsurance === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{option.name}</span>
                          {option.popular && (
                            <Badge className="bg-orange-100 text-orange-800">Populaire</Badge>
                          )}
                        </div>
                        <span className="font-bold text-blue-600">
                          +{option.price.toLocaleString()} CDF
                        </span>
                      </div>
                    </Label>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 ml-6">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Snacks and Refreshments */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coffee className="w-6 h-6 text-orange-600" />
            <span>Collations et rafraîchissements</span>
          </CardTitle>
          <p className="text-gray-600">
            Profitez de votre voyage avec nos collations de qualité
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snackOptions.map((snack) => (
              <div 
                key={snack.id} 
                className={`border rounded-lg p-4 transition-colors ${
                  selectedSnacks.includes(snack.id) ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={snack.id}
                    checked={selectedSnacks.includes(snack.id)}
                    onCheckedChange={(checked) => handleSnackToggle(snack.id, !!checked)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={snack.id} className="cursor-pointer font-medium">
                          {snack.name}
                        </Label>
                        {snack.popular && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Populaire</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        {snack.originalPrice && (
                          <span className="text-xs text-gray-500 line-through">
                            {snack.originalPrice.toLocaleString()} CDF
                          </span>
                        )}
                        <div className="font-bold text-orange-600">
                          {snack.price.toLocaleString()} CDF
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {snack.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hotel Recommendations */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hotel className="w-6 h-6 text-purple-600" />
            <span>Hébergement à {arrivalCity}</span>
            <Badge className="bg-purple-100 text-purple-800">Offre spéciale</Badge>
          </CardTitle>
          <p className="text-gray-600">
            Réservez votre hôtel dès maintenant et économisez jusqu'à 30%
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedHotel} onValueChange={setSelectedHotel}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="no-hotel" />
                <Label htmlFor="no-hotel" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>Je réserverai plus tard</span>
                    <span className="text-gray-500">Aucun hôtel</span>
                  </div>
                </Label>
              </div>

              {hotelOptions.map((hotel) => (
                <div key={hotel.id} className={`border rounded-lg p-4 transition-colors ${
                  selectedHotel === hotel.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value={hotel.id} id={hotel.id} />
                    <Label htmlFor={hotel.id} className="flex-1 cursor-pointer">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Hotel Image */}
                        <div className="relative">
                          <img 
                            src={hotel.image} 
                            alt={hotel.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          {hotel.popular && (
                            <Badge className="absolute top-2 left-2 bg-red-100 text-red-800 text-xs">
                              Meilleur choix
                            </Badge>
                          )}
                        </div>

                        {/* Hotel Details */}
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">{hotel.name}</h4>
                            <div className="text-right">
                              {hotel.originalPrice && (
                                <div className="text-sm text-gray-500 line-through">
                                  {hotel.originalPrice.toLocaleString()} CDF
                                </div>
                              )}
                              <div className="font-bold text-purple-600">
                                {hotel.price.toLocaleString()} CDF
                              </div>
                              <div className="text-xs text-gray-500">par nuit</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-1">
                              {[...Array(hotel.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="text-sm text-gray-600 ml-1">
                                {hotel.rating} étoiles
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{hotel.distance}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {hotel.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Summary */}
      {totalUpsell > 0 && (
        <Card className="border-kongo-lime border-2 bg-kongo-lime/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Récapitulatif de votre commande</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Billet de bus ({tripRoute})</span>
                <span>{basePrice.toLocaleString()} CDF</span>
              </div>
              
              {selectedInsurance && (
                <div className="flex justify-between text-blue-600">
                  <span>Assurance voyage</span>
                  <span>+{insuranceOptions.find(o => o.id === selectedInsurance)?.price.toLocaleString()} CDF</span>
                </div>
              )}
              
              {selectedSnacks.length > 0 && (
                <div className="space-y-1">
                  {selectedSnacks.map(snackId => {
                    const snack = snackOptions.find(s => s.id === snackId);
                    return snack ? (
                      <div key={snackId} className="flex justify-between text-orange-600">
                        <span>{snack.name}</span>
                        <span>+{snack.price.toLocaleString()} CDF</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              
              {selectedHotel && (
                <div className="flex justify-between text-purple-600">
                  <span>Hébergement (1 nuit)</span>
                  <span>+{hotelOptions.find(h => h.id === selectedHotel)?.price.toLocaleString()} CDF</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-kongo-lime">{finalTotal.toLocaleString()} CDF</span>
              </div>
              
              {totalUpsell > 0 && (
                <div className="text-sm text-green-600 text-right">
                  Économies totales : {
                    (hotelOptions.find(h => h.id === selectedHotel)?.originalPrice || 0) - 
                    (hotelOptions.find(h => h.id === selectedHotel)?.price || 0) +
                    (snackOptions.find(s => selectedSnacks.includes(s.id) && s.originalPrice)?.originalPrice || 0) -
                    (snackOptions.find(s => selectedSnacks.includes(s.id) && s.originalPrice)?.price || 0)
                  } CDF
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
