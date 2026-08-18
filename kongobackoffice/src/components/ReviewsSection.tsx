import { Card, CardContent } from "./ui/card";
import { Star, Quote } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function ReviewsSection() {
  const reviews = [
    {
      id: 1,
      name: "Marie Tshala",
      location: "Kinshasa",
      rating: 5,
      comment: "Excellent service ! J'ai pu choisir mon siège et le paiement Mobile Money était très simple. Le voyage s'est bien passé.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Joseph Mukendi",
      location: "Lubumbashi",
      rating: 5,
      comment: "Très pratique ! Plus besoin de se déplacer pour acheter les billets. Le code QR fonctionne parfaitement même sans internet.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Grace Mbuyi",
      location: "Kisangani",
      rating: 4,
      comment: "Interface très claire et les prix sont transparents. J'ai économisé du temps et de l'argent. Je recommande vivement !",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face"
    },
    {
      id: 4,
      name: "Paul Kabila",
      location: "Goma",
      rating: 5,
      comment: "Service client excellent et les compagnies partenaires sont fiables. Mon voyage de Goma à Bukavu s'est parfaitement déroulé.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-kongo-black mb-4">
            Ce que disent nos voyageurs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plus de 50,000 voyageurs nous font confiance chaque mois
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-kongo-lime" />
                </div>
                
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{review.comment}"
                </p>
                
                <div className="flex items-center space-x-3">
                  <ImageWithFallback
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-kongo-black">{review.name}</div>
                    <div className="text-sm text-gray-500">{review.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-6 bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-kongo-black">4.7/5</div>
              <div className="text-sm text-gray-500">Note moyenne</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-kongo-black">50K+</div>
              <div className="text-sm text-gray-500">Voyageurs satisfaits</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-kongo-black">25</div>
              <div className="text-sm text-gray-500">Villes desservies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
