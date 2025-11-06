import { Button } from "./ui/button";
import { Smartphone, Download } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function AppDownloadSection() {
  return (
    <section className="py-20 bg-kongo-black text-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Téléchargez l'app KonGO
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Réservez vos billets encore plus facilement avec notre application mobile. 
              Accédez à vos billets même hors ligne et recevez des notifications pour vos voyages.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size="lg" 
                className="bg-kongo-lime text-kongo-black hover:bg-kongo-lime-hover font-semibold"
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1611532736914-d3adbf90b8c9?w=24&h=24&fit=crop"
                  alt="App Store"
                  className="w-6 h-6 mr-2"
                />
                App Store
              </Button>
              <Button 
                size="lg" 
                className="bg-kongo-lime text-kongo-black hover:bg-kongo-lime-hover font-semibold"
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1611532736914-d3adbf90b8c9?w=24&h=24&fit=crop"
                  alt="Google Play"
                  className="w-6 h-6 mr-2"
                />
                Google Play
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Download className="w-4 h-4" />
                <span>Plus de 100K téléchargements</span>
              </div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 text-kongo-lime">★</div>
                ))}
                <span className="text-sm text-gray-400 ml-2">4.8/5</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-64 h-64 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-32 h-32 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-16 h-16 text-kongo-lime" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Scannez pour télécharger</p>
                <div className="text-xs text-gray-500">Code QR</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}