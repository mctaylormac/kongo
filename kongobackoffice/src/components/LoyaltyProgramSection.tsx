import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Star, Gift, Crown, Zap, Trophy, Users, TrendingUp, Award, Sparkles } from "lucide-react";

export function LoyaltyProgramSection() {
  const [selectedTier, setSelectedTier] = useState(1);
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  const loyaltyTiers = [
    {
      id: 0,
      name: "KonGO Explorer",
      icon: Star,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      accentColor: "bg-gray-500",
      trips: "0-5 voyages",
      benefits: ["5% de réduction", "Support client prioritaire"],
      minTrips: 0,
      maxTrips: 5
    },
    {
      id: 1,
      name: "KonGO Voyageur",
      icon: Gift,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      accentColor: "bg-blue-500",
      trips: "6-15 voyages",
      benefits: ["10% de réduction", "Choix de siège gratuit", "Annulation flexible"],
      minTrips: 6,
      maxTrips: 15
    },
    {
      id: 2,
      name: "KonGO VIP",
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      accentColor: "bg-purple-500",
      trips: "16+ voyages",
      benefits: ["15% de réduction", "Surclassement gratuit", "Lounge partenaire", "Bagages supplémentaires"],
      minTrips: 16,
      maxTrips: 999
    }
  ];

  const currentProgress = 65;
  const nextTierPoints = 150;
  const currentPoints = 975;
  const currentUserTrips = 12;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const tierCardVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -10 },
    selected: { scale: 1.02, y: -5 }
  };

  const getUserCurrentTier = () => {
    return loyaltyTiers.find(tier => 
      currentUserTrips >= tier.minTrips && currentUserTrips <= tier.maxTrips
    ) || loyaltyTiers[0];
  };

  const currentTier = getUserCurrentTier();

  return (
    <section className="py-20 bg-gradient-to-br from-kongo-black via-gray-900 to-kongo-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <Sparkles className="w-6 h-6 text-kongo-lime/20" />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-kongo-lime to-yellow-400 text-kongo-black px-6 py-3 rounded-full font-semibold mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Trophy className="w-6 h-6" />
              </motion.div>
              <span>Programme KonGO Rewards</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Plus vous voyagez, plus vous{" "}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-kongo-lime to-yellow-400"
              >
                économisez
              </motion.span>
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto">
              Gagnez des points à chaque voyage et débloquez des avantages exclusifs qui rendent vos déplacements plus agréables et économiques.
            </p>
          </motion.div>

          {/* Current Status and Progress */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-16">
            <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left - Current Status */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Votre statut actuel</h3>
                        <div className="flex items-center space-x-3">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={`w-10 h-10 ${currentTier.bgColor} rounded-full flex items-center justify-center`}
                          >
                            <currentTier.icon className={`w-6 h-6 ${currentTier.color}`} />
                          </motion.div>
                          <span className="text-xl font-semibold text-white">
                            {currentTier.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.div 
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ type: "spring", bounce: 0.6, delay: 0.5 }}
                          className="text-3xl font-bold text-kongo-lime"
                        >
                          {currentPoints.toLocaleString()}
                        </motion.div>
                        <div className="text-sm text-white/90 font-medium">points KonGO</div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-white/90 font-medium mb-2">
                        <span>Progression vers {loyaltyTiers[selectedTier + 1]?.name || 'Niveau Max'}</span>
                        <span>{nextTierPoints - Math.floor(currentPoints * 0.1)} points restants</span>
                      </div>
                      <Progress value={currentProgress} className="h-3 bg-gray-700" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm"
                      >
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.6 }}
                          className="text-2xl font-bold text-kongo-lime"
                        >
                          {currentUserTrips}
                        </motion.div>
                        <div className="text-sm text-white/90 font-medium">Voyages cette année</div>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm"
                      >
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.7 }}
                          className="text-2xl font-bold text-kongo-lime"
                        >
                          2,450 km
                        </motion.div>
                        <div className="text-sm text-white/90 font-medium">Distance parcourue</div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm"
                      >
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.8 }}
                          className="text-2xl font-bold text-kongo-lime"
                        >
                          {currentTier.benefits[0].match(/\d+/)?.[0] || '0'}%
                        </motion.div>
                        <div className="text-sm text-white/90 font-medium">Réduction actuelle</div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Right - Benefits Overview */}
                  <div>
                    <h3 className="text-2xl font-bold mb-6">Vos avantages actuels</h3>
                    
                    <div className="space-y-4">
                      {currentTier.benefits.map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg backdrop-blur-sm"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-kongo-lime to-yellow-400 rounded-full flex items-center justify-center">
                            <Award className="w-6 h-6 text-kongo-black" />
                          </div>
                          <div>
                            <div className="font-semibold">{benefit}</div>
                            <div className="text-white/90 text-sm font-medium">Actif sur votre compte</div>
                          </div>
                          <Badge className="bg-green-500 text-white ml-auto">Actif</Badge>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="mt-8 p-6 bg-gradient-to-r from-kongo-lime/15 to-yellow-400/15 border border-kongo-lime/40 rounded-lg backdrop-blur-sm"
                    >
                      <h4 className="font-semibold text-kongo-lime mb-2">Prochaine récompense</h4>
                      <p className="text-white/90 text-sm mb-4">
                        Plus que {loyaltyTiers[selectedTier + 1]?.minTrips - currentUserTrips || 0} voyages pour débloquer le statut{" "}
                        {loyaltyTiers[selectedTier + 1]?.name || "maximum"} !
                      </p>
                      <Button variant="outline" className="border-kongo-lime text-kongo-lime hover:bg-kongo-lime hover:text-kongo-black">
                        Voir tous les avantages
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Loyalty Tiers */}
          <motion.div variants={itemVariants}>
            <h3 className="text-3xl font-bold text-center mb-12">Nos niveaux de fidélité</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loyaltyTiers.map((tier, index) => {
                const IconComponent = tier.icon;
                const isCurrentTier = tier.id === currentTier.id;
                const isHovered = hoveredTier === index;
                
                return (
                  <motion.div
                    key={index}
                    variants={tierCardVariants}
                    animate={
                      isCurrentTier ? "selected" : isHovered ? "hover" : "rest"
                    }
                    onHoverStart={() => setHoveredTier(index)}
                    onHoverEnd={() => setHoveredTier(null)}
                    onClick={() => setSelectedTier(index)}
                    className="cursor-pointer"
                  >
                    <Card className={`bg-white/10 border-2 text-white hover:bg-white/15 transition-all duration-300 relative overflow-hidden ${
                      isCurrentTier ? 'border-kongo-lime bg-kongo-lime/10' : 'border-white/30'
                    }`}>
                      {isCurrentTier && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-kongo-lime to-yellow-400"
                        />
                      )}
                      
                      <CardContent className="p-6 text-center relative">
                        {isCurrentTier && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-4 right-4"
                          >
                            <Badge className="bg-kongo-lime text-kongo-black font-bold">
                              Votre niveau
                            </Badge>
                          </motion.div>
                        )}
                        
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className={`w-20 h-20 mx-auto mb-6 ${tier.bgColor} rounded-full flex items-center justify-center relative`}
                        >
                          <IconComponent className={`w-10 h-10 ${tier.color}`} />
                          {isCurrentTier && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -inset-2 border-2 border-kongo-lime rounded-full"
                            />
                          )}
                        </motion.div>
                        
                        <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                        <p className="text-white text-sm font-medium mb-6">{tier.trips}</p>
                        
                        <ul className="space-y-3 text-sm text-white">
                          {tier.benefits.map((benefit, benefitIndex) => (
                            <motion.li
                              key={benefitIndex}
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.2 + benefitIndex * 0.1 }}
                              className="flex items-center justify-center space-x-2"
                            >
                              <div className="w-2 h-2 bg-kongo-lime rounded-full flex-shrink-0"></div>
                              <span>{benefit}</span>
                            </motion.li>
                          ))}
                        </ul>

                        {!isCurrentTier && tier.id > currentTier.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 pt-4 border-t border-white/20"
                          >
                            <p className="text-xs text-white/90 font-medium mb-2">
                              Il vous faut encore {tier.minTrips - currentUserTrips} voyages
                            </p>
                            <Progress
                              value={Math.min((currentUserTrips / tier.minTrips) * 100, 100)}
                              className="h-2"
                            />
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-16"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="bg-gradient-to-r from-kongo-lime to-yellow-400 text-kongo-black hover:from-kongo-lime-hover hover:to-yellow-500 font-bold px-8 py-4 text-lg">
                <TrendingUp className="w-5 h-5 mr-2" />
                Rejoindre le programme
              </Button>
            </motion.div>
            <p className="text-white/90 text-sm mt-4 font-medium">
              Inscription gratuite • Points à vie • Avantages immédiats
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
