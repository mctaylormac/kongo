import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Cloud, CloudRain, Sun, Wind, Thermometer, Droplets, Eye, Compass } from "lucide-react";
import { useState, useEffect } from "react";

interface WeatherData {
  city: string;
  current: {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    visibility: number;
    pressure: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipitation: number;
  }>;
}

interface WeatherForecastWidgetProps {
  departureCity: string;
  arrivalCity: string;
  travelDate: string;
}

export function WeatherForecastWidget({ departureCity, arrivalCity, travelDate }: WeatherForecastWidgetProps) {
  const [departureWeather, setDepartureWeather] = useState<WeatherData | null>(null);
  const [arrivalWeather, setArrivalWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock weather data (in real app, would fetch from weather API)
  useEffect(() => {
    const fetchWeatherData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        setDepartureWeather({
          city: departureCity,
          current: {
            temp: 28,
            condition: "Ensoleillé",
            icon: "sun",
            humidity: 65,
            windSpeed: 12,
            visibility: 10,
            pressure: 1013
          },
          forecast: [
            { date: "Aujourd'hui", high: 32, low: 24, condition: "Ensoleillé", icon: "sun", precipitation: 0 },
            { date: "Demain", high: 30, low: 22, condition: "Partiellement nuageux", icon: "cloud", precipitation: 20 },
            { date: "Après-demain", high: 28, low: 21, condition: "Averses", icon: "rain", precipitation: 80 }
          ]
        });

        setArrivalWeather({
          city: arrivalCity,
          current: {
            temp: 25,
            condition: "Nuageux",
            icon: "cloud",
            humidity: 78,
            windSpeed: 8,
            visibility: 8,
            pressure: 1010
          },
          forecast: [
            { date: "Aujourd'hui", high: 28, low: 19, condition: "Nuageux", icon: "cloud", precipitation: 10 },
            { date: "Demain", high: 26, low: 18, condition: "Averses éparses", icon: "rain", precipitation: 60 },
            { date: "Après-demain", high: 24, low: 17, condition: "Pluie", icon: "rain", precipitation: 90 }
          ]
        });

        setIsLoading(false);
      }, 1500);
    };

    fetchWeatherData();
  }, [departureCity, arrivalCity]);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case "sun":
        return <Sun className="w-6 h-6 text-yellow-500" />;
      case "cloud":
        return <Cloud className="w-6 h-6 text-gray-500" />;
      case "rain":
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      default:
        return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getSmallWeatherIcon = (icon: string) => {
    switch (icon) {
      case "sun":
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case "cloud":
        return <Cloud className="w-4 h-4 text-gray-500" />;
      case "rain":
        return <CloudRain className="w-4 h-4 text-blue-500" />;
      default:
        return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Cloud className="w-5 h-5 text-blue-600 animate-pulse" />
            <h3 className="font-semibold text-blue-800">Prévisions météorologiques</h3>
          </div>
          <div className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-blue-200 rounded w-3/4"></div>
              <div className="h-4 bg-blue-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Météo pour votre voyage</h3>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {travelDate}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departure Weather */}
          {departureWeather && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-kongo-black">{departureWeather.city}</h4>
                  <p className="text-sm text-gray-600">Ville de départ</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {getWeatherIcon(departureWeather.current.icon)}
                    <span className="text-2xl font-bold text-kongo-black">
                      {departureWeather.current.temp}°C
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{departureWeather.current.condition}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">{departureWeather.current.humidity}%</div>
                  <div className="text-xs text-gray-500">Humidité</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Wind className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">{departureWeather.current.windSpeed} km/h</div>
                  <div className="text-xs text-gray-500">Vent</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Eye className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">{departureWeather.current.visibility} km</div>
                  <div className="text-xs text-gray-500">Visibilité</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Prévisions 3 jours</h5>
                {departureWeather.forecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {getSmallWeatherIcon(day.icon)}
                      <span className="w-20">{day.date}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>{day.high}°/{day.low}°</span>
                      <span className="text-blue-600">{day.precipitation}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arrival Weather */}
          {arrivalWeather && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-kongo-black">{arrivalWeather.city}</h4>
                  <p className="text-sm text-gray-600">Ville d'arrivée</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {getWeatherIcon(arrivalWeather.current.icon)}
                    <span className="text-2xl font-bold text-kongo-black">
                      {arrivalWeather.current.temp}°C
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{arrivalWeather.current.condition}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">{arrivalWeather.current.humidity}%</div>
                  <div className="text-xs text-gray-500">Humidité</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Wind className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">{arrivalWeather.current.windSpeed} km/h</div>
                  <div className="text-xs text-gray-500">Vent</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Eye className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <div className="text-xs font-medium">{arrivalWeather.current.visibility} km</div>
                  <div className="text-xs text-gray-500">Visibilité</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Prévisions 3 jours</h5>
                {arrivalWeather.forecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {getSmallWeatherIcon(day.icon)}
                      <span className="w-20">{day.date}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>{day.high}°/{day.low}°</span>
                      <span className="text-blue-600">{day.precipitation}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Travel Recommendations */}
        <div className="mt-6 p-4 bg-white rounded-lg">
          <h5 className="font-medium text-kongo-black mb-3">Recommandations pour votre voyage</h5>
          <div className="space-y-2 text-sm">
            {arrivalWeather && arrivalWeather.forecast[0].precipitation > 50 && (
              <div className="flex items-center space-x-2 text-blue-700 bg-blue-50 p-2 rounded">
                <CloudRain className="w-4 h-4" />
                <span>Prévoyez un imperméable - risque de pluie à l'arrivée</span>
              </div>
            )}
            {departureWeather && departureWeather.current.temp > 30 && (
              <div className="flex items-center space-x-2 text-orange-700 bg-orange-50 p-2 rounded">
                <Sun className="w-4 h-4" />
                <span>Température élevée au départ - restez hydraté</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-2 rounded">
              <Compass className="w-4 h-4" />
              <span>Conditions généralement favorables pour le voyage</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}