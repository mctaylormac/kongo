import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Users, Clock, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";

interface SeatAvailabilityProps {
  totalSeats: number;
  availableSeats: number;
  tripId: string;
  showLiveUpdates?: boolean;
  compact?: boolean;
}

export function RealTimeSeatAvailability({ 
  totalSeats, 
  availableSeats: initialAvailableSeats, 
  tripId, 
  showLiveUpdates = true,
  compact = false 
}: SeatAvailabilityProps) {
  const [availableSeats, setAvailableSeats] = useState(initialAvailableSeats);
  const [recentBookings, setRecentBookings] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time seat updates
  useEffect(() => {
    if (!showLiveUpdates) return;

    const interval = setInterval(() => {
      // Randomly simulate seat bookings
      if (Math.random() < 0.15 && availableSeats > 0) {
        setAvailableSeats(prev => {
          const newAvailable = Math.max(0, prev - Math.floor(Math.random() * 2) - 1);
          const seatsBooked = prev - newAvailable;
          
          if (seatsBooked > 0) {
            setRecentBookings(current => [
              `${seatsBooked} siège${seatsBooked > 1 ? 's' : ''} réservé${seatsBooked > 1 ? 's' : ''} à l'instant`,
              ...current.slice(0, 4)
            ]);
            setLastUpdate(new Date());
          }
          
          return newAvailable;
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [availableSeats, showLiveUpdates]);

  const occupancyRate = ((totalSeats - availableSeats) / totalSeats) * 100;
  const isAlmostFull = availableSeats <= 5 && availableSeats > 0;
  const isFull = availableSeats === 0;

  const getAvailabilityStatus = () => {
    if (isFull) return { color: "text-red-600", bg: "bg-red-100", label: "Complet" };
    if (isAlmostFull) return { color: "text-orange-600", bg: "bg-orange-100", label: "Presque complet" };
    if (occupancyRate > 70) return { color: "text-yellow-600", bg: "bg-yellow-100", label: "Remplissage rapide" };
    return { color: "text-green-600", bg: "bg-green-100", label: "Places disponibles" };
  };

  const status = getAvailabilityStatus();

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
        <Badge className={`${status.bg} ${status.color} border-0`}>
          {availableSeats} places restantes
        </Badge>
        {isAlmostFull && (
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        )}
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="font-semibold text-kongo-black">Disponibilité en temps réel</span>
            </div>
            {showLiveUpdates && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Mis à jour il y a {Math.floor((Date.now() - lastUpdate.getTime()) / 60000)}min
              </Badge>
            )}
          </div>
          <Badge className={`${status.bg} ${status.color} border-0 font-medium`}>
            {status.label}
          </Badge>
        </div>

        {/* Visual seat availability */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Taux d'occupation</span>
            <span className="text-sm font-medium text-kongo-black">
              {totalSeats - availableSeats}/{totalSeats} sièges
            </span>
          </div>
          <Progress 
            value={occupancyRate} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Availability details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="font-bold text-xl text-kongo-black">{availableSeats}</div>
            <div className="text-xs text-gray-600">Places disponibles</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <div className="font-bold text-xl text-kongo-black">{occupancyRate.toFixed(0)}%</div>
            <div className="text-xs text-gray-600">Taux d'occupation</div>
          </div>
        </div>

        {/* Recent booking activity */}
        {recentBookings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <Zap className="w-4 h-4" />
              <span>Activité récente</span>
            </h4>
            <div className="space-y-1">
              {recentBookings.slice(0, 3).map((booking, index) => (
                <div key={index} className="text-xs text-gray-600 bg-blue-50 p-2 rounded flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>{booking}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {!isFull && (
            <Button className="w-full bg-kongo-lime text-kongo-black hover:bg-kongo-lime-hover">
              <CheckCircle className="w-4 h-4 mr-2" />
              Réserver maintenant
            </Button>
          )}
          
          {isFull && (
            <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
              <Users className="w-4 h-4 mr-2" />
              Rejoindre la liste d'attente
            </Button>
          )}

          {isAlmostFull && !isFull && (
            <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Dépêchez-vous !</div>
                <div className="text-orange-700">Plus que {availableSeats} place{availableSeats > 1 ? 's' : ''} à ce prix.</div>
              </div>
            </div>
          )}
        </div>

        {/* Live indicator footer */}
        {showLiveUpdates && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Données mises à jour automatiquement</span>
              </div>
              <span>•</span>
              <span>Voyage {tripId}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}