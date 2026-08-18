export function PartnersSection() {
  const partners = [
    { name: "Express Congo", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=80&fit=crop" },
    { name: "Trans-Katanga", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=80&fit=crop" },
    { name: "Kasai Express", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=80&fit=crop" },
    { name: "Kivu Transport", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=80&fit=crop" },
    { name: "Bandundu Lines", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=80&fit=crop" },
    { name: "Maniema Bus", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=80&fit=crop" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-kongo-black mb-4">
            Nos compagnies partenaires
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nous travaillons avec les meilleures compagnies de transport de la RDC 
            pour vous offrir un service de qualité.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center p-4 grayscale transition-colors duration-150 hover:grayscale-0"
            >
              <div className="w-32 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                <span className="text-gray-600 font-medium text-sm text-center px-2">
                  {partner.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
