import { motion } from "motion/react";
import { 
  Shield, 
  Clock, 
  CreditCard, 
  MapPin, 
  Smartphone, 
  Award,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Zap,
  Heart
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export function USPSection() {
  const mainUSPs = [
    {
      icon: Shield,
      title: "100% Sécurisé",
      description: "Paiements protégés par chiffrement bancaire et garantie de remboursement intégrale",
      stats: "99.9% de transactions sécurisées",
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20"
    },
    {
      icon: Clock,
      title: "Ponctualité Garantie",
      description: "98% de nos bus partent à l'heure avec suivi en temps réel de votre voyage",
      stats: "98% de ponctualité",
      color: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/20"
    },
    {
      icon: CreditCard,
      title: "Paiement Flexible",
      description: "Mobile Money, cartes bancaires, et options de paiement échelonné disponibles",
      stats: "5+ méthodes de paiement",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20"
    }
  ];

  const secondaryFeatures = [
    {
      icon: MapPin,
      title: "50+ Destinations",
      description: "Réseau national couvrant toute la RDC"
    },
    {
      icon: Smartphone,
      title: "Billets Digitaux",
      description: "QR codes et e-tickets instantanés"
    },
    {
      icon: Award,
      title: "Service Primé",
      description: "Élu meilleur transport RDC 2024"
    },
    {
      icon: Users,
      title: "2M+ Voyageurs",
      description: "Communauté de confiance depuis 2020"
    },
    {
      icon: TrendingUp,
      title: "Meilleurs Prix",
      description: "Garantie du prix le plus bas"
    },
    {
      icon: Heart,
      title: "Support 24/7",
      description: "Assistance humaine disponible"
    }
  ];

  const testimonialStats = [
    { number: "4.9", label: "Note moyenne", sublabel: "/5 étoiles" },
    { number: "2M+", label: "Voyageurs", sublabel: "satisfaits" },
    { number: "50+", label: "Villes", sublabel: "desservies" },
    { number: "99%", label: "Satisfaction", sublabel: "client" }
  ];

  return (
    <section className="py-24 bg-gradient-kongo-subtle relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${encodeURIComponent('101820').slice(1)}' fill-opacity='0.3'%3E%3Cpath d='M10 10h60v60H10z' fill='none' stroke='%23${encodeURIComponent('bfeb30').slice(1)}' stroke-width='1' stroke-opacity='0.2'/%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="container-professional relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16 space-y-6"
        >
          <Badge className="status-kongo mx-auto px-6 py-3">
            <Star className="w-4 h-4 mr-2" />
            <span className="text-body-small font-semibold">Pourquoi Choisir KonGO ?</span>
          </Badge>
          
          <h2 className="text-display-2 text-kongo-black leading-tight">
            L'Excellence du Transport
            <span className="block text-kongo-lime">Congolais</span>
          </h2>
          
          <p className="text-body-large text-secondary max-w-2xl mx-auto leading-relaxed">
            Découvrez pourquoi plus de 2 millions de voyageurs nous font confiance pour leurs déplacements à travers la République Démocratique du Congo.
          </p>
        </motion.div>

        {/* Main USPs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {mainUSPs.map((usp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`card-interactive h-full ${usp.bgColor} ${usp.borderColor} border-2 hover:border-kongo-lime/50 transition-all duration-300`}>
                <CardContent className="p-8 text-center space-y-6">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`w-16 h-16 ${usp.bgColor} ${usp.borderColor} border rounded-2xl flex items-center justify-center mx-auto`}
                  >
                    <usp.icon className={`w-8 h-8 ${usp.color}`} />
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-h4 text-kongo-black font-semibold">
                      {usp.title}
                    </h3>
                    
                    <p className="text-body-small text-secondary leading-relaxed">
                      {usp.description}
                    </p>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className={`w-4 h-4 ${usp.color}`} />
                      <span className={`text-label-small font-semibold ${usp.color}`}>
                        {usp.stats}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Secondary Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-h2 text-kongo-black mb-4">
              Fonctionnalités Avancées
            </h3>
            <p className="text-body text-secondary max-w-2xl mx-auto">
              Une plateforme complète pensée pour simplifier vos voyages en République Démocratique du Congo
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {secondaryFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center space-y-4 p-6 bg-surface-elevated rounded-xl border border-border-primary hover:border-kongo-lime/30 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 bg-surface-kongo-lime-light rounded-xl flex items-center justify-center mx-auto">
                  <feature.icon className="w-6 h-6 text-kongo-lime-dark" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-body-small text-kongo-black font-semibold">
                    {feature.title}
                  </h4>
                  <p className="text-caption text-tertiary">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <Card className="card-kongo overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-6 h-6 text-kongo-lime" />
                    <Badge className="bg-kongo-lime/20 text-kongo-lime border-kongo-lime/30">
                      <span className="text-label-small font-bold">CHIFFRES CLÉS</span>
                    </Badge>
                  </div>
                  
                  <h3 className="text-h2 text-on-black">
                    La Confiance en Chiffres
                  </h3>
                  
                  <p className="text-body-large text-on-black/90 max-w-2xl mx-auto">
                    Des résultats concrets qui témoignent de notre engagement envers l'excellence
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {testimonialStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.6, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="space-y-2"
                    >
                      <div className="text-display-2 text-kongo-lime font-bold leading-none">
                        {stat.number}
                      </div>
                      <div className="text-body text-on-black font-medium">
                        {stat.label}
                      </div>
                      <div className="text-caption text-on-black/70">
                        {stat.sublabel}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mt-16"
        >
          <div className="space-y-6">
            <h3 className="text-h3 text-kongo-black">
              Prêt à Découvrir la Différence KonGO ?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary px-8 py-4 text-h6"
                onClick={() => {
                  document.getElementById('search-form')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                <span className="flex items-center">
                  Réserver Maintenant
                  <Zap className="w-5 h-5 ml-2" />
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline-lime px-8 py-4 text-h6"
              >
                <span className="flex items-center">
                  En Savoir Plus
                  <Star className="w-5 h-5 ml-2" />
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              delay: Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute w-2 h-2 bg-kongo-lime rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>
    </section>
  );
}