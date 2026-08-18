import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { 
  Star, 
  Send, 
  Camera, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Clock,
  MapPin,
  User,
  Shield,
  Car,
  Wifi,
  Coffee,
  Volume2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface FeedbackSystemProps {
  tripInfo: {
    id: string;
    from: string;
    to: string;
    date: string;
    duration: string;
    driverName: string;
    busModel: string;
    plateNumber: string;
  };
  onSubmit: (feedback: any) => void;
}

interface RatingCategory {
  id: string;
  name: string;
  icon: any;
  rating: number;
  description: string;
}

export function FeedbackSystem({ tripInfo, onSubmit }: FeedbackSystemProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [categories, setCategories] = useState<RatingCategory[]>([
    { id: 'punctuality', name: 'Ponctualité', icon: Clock, rating: 0, description: 'Respect des horaires' },
    { id: 'comfort', name: 'Confort', icon: Car, rating: 0, description: 'Qualité des sièges et voyage' },
    { id: 'driver', name: 'Chauffeur', icon: User, rating: 0, description: 'Professionnalisme et conduite' },
    { id: 'safety', name: 'Sécurité', icon: Shield, rating: 0, description: 'Sécurité du voyage' },
    { id: 'amenities', name: 'Équipements', icon: Wifi, rating: 0, description: 'WiFi, climatisation, etc.' },
    { id: 'cleanliness', name: 'Propreté', icon: Coffee, rating: 0, description: 'État du bus et toilettes' }
  ]);
  
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [recommendToFriends, setRecommendToFriends] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleCategoryRating = (categoryId: string, rating: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, rating } : cat
    ));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 3)); // Max 3 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (overallRating === 0) {
      toast.error("Veuillez donner une note globale");
      return;
    }

    const feedback = {
      tripId: tripInfo.id,
      overallRating,
      categories: categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.rating }), {}),
      comment,
      isAnonymous,
      recommendToFriends,
      photos: photos.map(photo => photo.name),
      submittedAt: new Date().toISOString()
    };

    onSubmit(feedback);
    setSubmitted(true);
    
    toast.success("🌟 Merci pour votre évaluation !", {
      description: "Votre avis nous aide à améliorer nos services"
    });
  };

  const averageRating = categories.length > 0 
    ? categories.reduce((sum, cat) => sum + cat.rating, 0) / categories.length 
    : 0;

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-surface-primary py-20 flex items-center justify-center"
      >
        <div className="container-professional max-w-2xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-success rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-h2 text-kongo-black mb-4">Merci pour votre évaluation !</h1>
          <p className="text-body-large text-secondary mb-8">
            Votre avis est très important pour nous. Il nous aide à améliorer continuellement 
            nos services et à offrir la meilleure expérience de voyage possible.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface-kongo-lime-light p-6 rounded-lg">
              <h3 className="text-h5 text-kongo-black mb-2">Points de fidélité gagnés</h3>
              <div className="text-display-2 text-kongo-lime-dark">+50</div>
              <p className="text-body-small text-kongo-lime-dark">Pour votre évaluation détaillée</p>
            </div>
            
            <div className="bg-surface-elevated p-6 rounded-lg border border-border-primary">
              <h3 className="text-h5 text-primary mb-2">Prochain voyage ?</h3>
              <Button className="btn-primary w-full">
                Réserver Maintenant
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={() => setSubmitted(false)}
            className="btn-ghost"
          >
            Modifier mon évaluation
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary py-20">
      <div className="container-professional max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-surface-kongo-lime-light px-4 py-2 rounded-full mb-6"
          >
            <Star className="w-5 h-5 text-kongo-lime-dark" />
            <span className="text-body-small text-kongo-lime-dark font-semibold">Évaluation KonGO</span>
          </motion.div>
          
          <h1 className="text-display-1 text-kongo-black mb-4">
            Comment était votre <span className="text-kongo-lime">voyage</span> ?
          </h1>
          
          <p className="text-body-large text-secondary">
            Partagez votre expérience pour nous aider à améliorer nos services
          </p>
        </div>

        {/* Trip Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h4 text-primary mb-2">{tripInfo.from} → {tripInfo.to}</h3>
              <div className="flex items-center space-x-4 text-body-small text-secondary">
                <span>{tripInfo.date}</span>
                <span>Durée: {tripInfo.duration}</span>
                <span>Bus: {tripInfo.plateNumber}</span>
              </div>
            </div>
            <Badge className="status-success">Voyage terminé</Badge>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Column - Ratings */}
          <div className="space-y-8">
            
            {/* Overall Rating */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elevated p-6"
            >
              <h3 className="text-h4 text-primary mb-6">Note globale</h3>
              
              <div className="text-center mb-6">
                <div className="flex justify-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setOverallRating(star)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        star <= overallRating 
                          ? 'bg-kongo-lime text-kongo-black' 
                          : 'bg-surface-tertiary text-quaternary hover:bg-surface-hover'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${star <= overallRating ? 'fill-current' : ''}`} />
                    </motion.button>
                  ))}
                </div>
                
                <div className="text-h3 text-kongo-black">
                  {overallRating > 0 && (
                    <>
                      {overallRating}/5 - {
                        overallRating === 5 ? 'Excellent' :
                        overallRating === 4 ? 'Très bien' :
                        overallRating === 3 ? 'Bien' :
                        overallRating === 2 ? 'Moyen' : 'Décevant'
                      }
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Category Ratings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card-elevated p-6"
            >
              <h3 className="text-h4 text-primary mb-6">Évaluation détaillée</h3>
              
              <div className="space-y-6">
                {categories.map((category, index) => {
                  const Icon = category.icon;
                  
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-kongo-lime-dark" />
                          <div>
                            <span className="text-body font-medium text-primary">{category.name}</span>
                            <div className="text-body-small text-secondary">{category.description}</div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleCategoryRating(category.id, star)}
                              className={`w-6 h-6 rounded transition-colors ${
                                star <= category.rating 
                                  ? 'text-kongo-lime' 
                                  : 'text-quaternary hover:text-kongo-lime-light'
                              }`}
                            >
                              <Star className={`w-full h-full ${star <= category.rating ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-border-primary">
                <div className="flex items-center justify-between">
                  <span className="text-body font-medium text-primary">Note moyenne</span>
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-kongo-lime fill-current" />
                    <span className="text-h5 text-kongo-black">{averageRating.toFixed(1)}/5</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Comments & Actions */}
          <div className="space-y-8">
            
            {/* Recommendation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card-elevated p-6"
            >
              <h3 className="text-h4 text-primary mb-4">Recommandation</h3>
              <p className="text-body text-secondary mb-6">
                Recommanderiez-vous KonGO à vos amis et famille ?
              </p>
              
              <div className="flex space-x-4">
                <Button
                  onClick={() => setRecommendToFriends(true)}
                  className={`flex-1 h-12 ${
                    recommendToFriends === true 
                      ? 'btn-primary' 
                      : 'btn-ghost border border-border-primary hover:border-success'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  Oui, absolument
                </Button>
                
                <Button
                  onClick={() => setRecommendToFriends(false)}
                  className={`flex-1 h-12 ${
                    recommendToFriends === false 
                      ? 'bg-error text-white' 
                      : 'btn-ghost border border-border-primary hover:border-error'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5 mr-2" />
                  Non, pas vraiment
                </Button>
              </div>
            </motion.div>

            {/* Comments */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card-elevated p-6"
            >
              <h3 className="text-h4 text-primary mb-4">Commentaires</h3>
              <p className="text-body-small text-secondary mb-4">
                Partagez les détails de votre expérience (optionnel)
              </p>
              
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez votre expérience, ce qui vous a plu ou ce qui pourrait être amélioré..."
                className="min-h-32 mb-4"
                maxLength={500}
              />
              
              <div className="text-caption text-quaternary text-right">
                {comment.length}/500 caractères
              </div>
            </motion.div>

            {/* Photos */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="card-elevated p-6"
            >
              <h3 className="text-h4 text-primary mb-4">Photos (optionnel)</h3>
              <p className="text-body-small text-secondary mb-4">
                Ajoutez jusqu'à 3 photos pour illustrer votre voyage
              </p>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                
                <label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border-secondary rounded-lg cursor-pointer hover:border-kongo-lime transition-colors"
                >
                  <div className="text-center">
                    <Camera className="w-6 h-6 text-quaternary mx-auto mb-2" />
                    <span className="text-body-small text-tertiary">Cliquez pour ajouter des photos</span>
                  </div>
                </label>
                
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-surface-tertiary rounded-lg flex items-center justify-center">
                          <span className="text-caption text-tertiary">{photo.name.substring(0, 10)}...</span>
                        </div>
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Privacy & Submit */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="card-elevated p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-kongo-lime border-border-secondary rounded focus:ring-kongo-lime"
                />
                <label htmlFor="anonymous" className="text-body-small text-secondary">
                  Publier cet avis de manière anonyme
                </label>
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={overallRating === 0}
                className="btn-primary w-full h-12"
              >
                <Send className="w-5 h-5 mr-2" />
                Envoyer mon évaluation
              </Button>
              
              <p className="text-caption text-quaternary text-center mt-4">
                En envoyant cette évaluation, vous acceptez nos conditions d'utilisation
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
