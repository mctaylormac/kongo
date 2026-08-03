import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Plus, X, MapPin, Clock, ArrowRight, Route, Calendar, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

interface TripLeg {
  id: string;
  from: string;
  to: string;
  date: string;
  duration: string;
  price: string;
  company: string;
  departure: string;
  arrival: string;
  layover?: string;
}

export function MultiLegTripBooking() {
  const [tripLegs, setTripLegs] = useState<TripLeg[]>([
    {
      id: "1",
      from: "Kinshasa",
      to: "Kananga",
      date: "15 Fév 2024",
      duration: "10h",
      price: "85,000 CDF",
      company: "Express Congo",
      departure: "06:00",
      arrival: "16:00",
      layover: "2h à Kananga"
    },
    {
      id: "2",
      from: "Kananga",
      to: "Lubumbashi",
      date: "15 Fév 2024",
      duration: "8h",
      price: "65,000 CDF",
      company: "Trans-Katanga",
      departure: "18:00",
      arrival: "02:00+1"
    }
  ]);

  const [isSearchingAlternatives, setIsSearchingAlternatives] = useState(false);

  const totalPrice = tripLegs.reduce((sum, leg) => 
    sum + parseInt(leg.price.replace(/[^\d]/g, '')), 0
  );

  const totalDuration = tripLegs.reduce((sum, leg) => 
    sum + parseInt(leg.duration.replace('h', '')), 0
  );

  const suggestedRoutes = [
    {
      name: "Route économique",
      legs: [
        { from: "Kinshasa", to: "Mbuji-Mayi", price: "75,000 CDF", duration: "9h" },
        { from: "Mbuji-Mayi", to: "Lubumbashi", price: "55,000 CDF", duration: "7h" }
      ],
      totalPrice: "130,000 CDF",
      totalDuration: "18h",
      savings: "20,000 CDF"
    },
    {
      name: "Route rapide",
      legs: [
        { from: "Kinshasa", to: "Lubumbashi", price: "125,000 CDF", duration: "16h" }
      ],
      totalPrice: "125,000 CDF",
      totalDuration: "16h",
      direct: true
    }
  ];

  const handleRemoveLeg = (legId: string) => {
    if (tripLegs.length > 1) {
      setTripLegs(tripLegs.filter(leg => leg.id !== legId));
      toast.success("Étape supprimée du voyage");
    }
  };

  const handleSearchAlternatives = () => {
    setIsSearchingAlternatives(true);
    // Simulate search delay
    setTimeout(() => {
      setIsSearchingAlternatives(false);
      toast.success("Alternatives trouvées ! Consultez les suggestions ci-dessous.");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Multi-leg Trip Overview */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Route className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Voyage à étapes multiples</h3>
              <Badge className="bg-blue-100 text-blue-800">
                {tripLegs.length} étapes
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchAlternatives}
              disabled={isSearchingAlternatives}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {isSearchingAlternatives ? "Recherche..." : "Voir alternatives"}
            </Button>
          </div>

          {/* Trip Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-white rounded-lg">
              <MapPin className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <div className="font-semibold text-kongo-black">
                {tripLegs[0]?.from} → {tripLegs[tripLegs.length - 1]?.to}
              </div>
              <div className="text-xs text-gray-500">Itinéraire complet</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <div className="font-semibold text-kongo-black">{totalDuration}h</div>
              <div className="text-xs text-gray-500">Durée totale</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <div className="font-semibold text-kongo-black">{tripLegs[0]?.date}</div>
              <div className="text-xs text-gray-500">Date de départ</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <div className="font-semibold text-kongo-lime">{totalPrice.toLocaleString()} CDF</div>
              <div className="text-xs text-gray-500">Prix total</div>
            </div>
          </div>

          {/* Trip Legs */}
          <div className="space-y-4">
            {tripLegs.map((leg, index) => (
              <div key={leg.id}>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <Badge variant="secondary">Étape {index + 1}</Badge>
                          <span className="font-medium">{leg.company}</span>
                          {tripLegs.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLeg(leg.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="font-bold text-lg">{leg.departure}</div>
                            <div className="text-sm text-gray-600">{leg.from}</div>
                          </div>
                          
                          <div className="flex-1 flex items-center">
                            <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                <div className="text-xs text-gray-500 text-center">
                                  {leg.duration}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                          </div>
                          
                          <div className="text-center">
                            <div className="font-bold text-lg">{leg.arrival}</div>
                            <div className="text-sm text-gray-600">{leg.to}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-kongo-black">{leg.price}</div>
                            <div className="text-xs text-gray-500">par personne</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {leg.layover && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <Clock className="w-4 h-4 inline mr-2 text-yellow-600" />
                        <span className="text-yellow-800">Correspondance : {leg.layover}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {index < tripLegs.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-6" />
          
          {/* Total Summary */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-semibold text-lg">Total du voyage</div>
              <div className="text-sm text-gray-600">
                {tripLegs.length} étapes • {totalDuration}h de voyage
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-kongo-lime">
                {totalPrice.toLocaleString()} CDF
              </div>
              <div className="text-sm text-gray-600">pour 1 passager</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Alternative Routes */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4 flex items-center space-x-2">
            <Route className="w-5 h-5 text-green-600" />
            <span>Routes alternatives suggérées</span>
          </h4>
          
          <div className="space-y-4">
            {suggestedRoutes.map((route, index) => (
              <Card key={index} className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-medium">{route.name}</h5>
                      {route.direct && (
                        <Badge className="bg-green-100 text-green-800">Direct</Badge>
                      )}
                      {route.savings && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Économisez {route.savings}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-kongo-black">{route.totalPrice}</div>
                      <div className="text-sm text-gray-500">{route.totalDuration}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {route.legs.map((leg, legIndex) => (
                      <div key={legIndex} className="flex items-center space-x-2">
                        <span>{leg.from} → {leg.to}</span>
                        {legIndex < route.legs.length - 1 && (
                          <ArrowRight className="w-3 h-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une étape personnalisée
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
