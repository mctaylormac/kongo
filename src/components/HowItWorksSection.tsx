import { Search, Armchair, CreditCard, Bus } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: Search,
      title: "Comparez",
      description: "Recherchez et comparez les horaires, prix et services de différentes compagnies d'autobus.",
      color: "bg-blue-500"
    },
    {
      icon: Armchair,
      title: "Choisissez votre siège",
      description: "Sélectionnez votre siège préféré sur le plan interactif de l'autobus.",
      color: "bg-green-500"
    },
    {
      icon: CreditCard,
      title: "Payez",
      description: "Réglez en toute sécurité avec Mobile Money ou votre carte bancaire.",
      color: "bg-purple-500"
    },
    {
      icon: Bus,
      title: "Embarquez",
      description: "Présentez votre billet QR code et montez à bord. Bon voyage !",
      color: "bg-orange-500"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-kongo-black mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Réservez votre voyage en 4 étapes simples
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative text-center">
                  {/* Connection Line (desktop only) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-300 z-0">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-300 rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Step Content */}
                  <div className="relative z-10">
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full ${step.color} flex items-center justify-center shadow-lg`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-md">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-kongo-lime text-kongo-black rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      <h3 className="text-xl font-semibold text-kongo-black mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-kongo-lime text-kongo-black px-6 py-3 rounded-full font-semibold">
            <span>Prêt à commencer votre voyage ?</span>
            <Bus className="w-5 h-5" />
          </div>
        </div>
      </div>
    </section>
  );
}