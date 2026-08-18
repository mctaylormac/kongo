import { motion } from "motion/react";
import {
  Award,
  CheckCircle,
  Clock,
  CreditCard,
  Heart,
  MapPin,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Users
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

const mainUSPs = [
  {
    icon: Shield,
    title: "100% Sécurisé",
    description: "Paiements protégés par chiffrement bancaire et garantie de remboursement intégrale",
    stats: "99.9% DE TRANSACTIONS SÉCURISÉES",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20"
  },
  {
    icon: Clock,
    title: "Ponctualité Garantie",
    description: "98% de nos bus partent à l'heure avec suivi en temps réel de votre voyage",
    stats: "98% DE PONCTUALITÉ",
    color: "text-info",
    bgColor: "bg-info/10",
    borderColor: "border-info/20"
  },
  {
    icon: CreditCard,
    title: "Paiement Flexible",
    description: "Mobile Money, cartes bancaires, et options de paiement échelonné disponibles",
    stats: "5+ MÉTHODES DE PAIEMENT",
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

export function USPSection() {
  return (
    <section className="relative overflow-hidden bg-surface-primary py-20 md:py-24">
      <div className="container-professional">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-4xl space-y-6 text-center md:mb-16"
        >
          <Badge className="status-kongo mx-auto px-5 py-2">
            <Star className="mr-2 h-4 w-4" />
            <span className="text-body-small font-bold uppercase tracking-wide">
              Pourquoi choisir KONGO ?
            </span>
          </Badge>

          <div className="space-y-4">
            <h2 className="text-display-2 leading-tight text-kongo-black">
              L'Excellence du Transport
              <span className="block text-kongo-lime">Congolais</span>
            </h2>
            <p className="mx-auto max-w-3xl text-body-large leading-relaxed text-secondary">
              Découvrez pourquoi plus de 2 millions de voyageurs nous font confiance pour
              leurs déplacements à travers la République Démocratique du Congo.
            </p>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {mainUSPs.map((usp, index) => (
            <motion.div
              key={usp.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Card className="h-full rounded-xl border border-border-primary bg-surface-elevated shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-kongo-lime/50 hover:shadow-lg">
                <CardContent className="flex h-full flex-col items-center gap-6 p-8 text-center md:p-10">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-2xl border ${usp.bgColor} ${usp.borderColor}`}
                  >
                    <usp.icon className={`h-9 w-9 ${usp.color}`} />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-h4 font-bold text-kongo-black">
                      {usp.title}
                    </h3>
                    <p className="text-body text-secondary">
                      {usp.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${usp.color}`} />
                    <span className={`text-label-small font-extrabold tracking-wide ${usp.color}`}>
                      {usp.stats}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mt-20 md:mt-24"
        >
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h3 className="text-h2 font-bold text-kongo-black">
              Fonctionnalités Avancées
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-body-large leading-relaxed text-secondary">
              Une plateforme complète pensée pour simplifier vos voyages en République
              Démocratique du Congo
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {secondaryFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="h-full"
              >
                <div className="flex h-full min-h-[230px] flex-col items-center justify-start rounded-xl border border-border-primary bg-white px-4 py-7 text-center transition-colors duration-200 hover:border-kongo-lime/50">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-kongo-lime-light text-kongo-lime-dark">
                    <feature.icon className="h-6 w-6" />
                  </div>

                  <h4 className="text-body font-extrabold text-kongo-black">
                    {feature.title}
                  </h4>
                  <p className="mt-3 max-w-[145px] text-label-small font-bold uppercase leading-relaxed tracking-wider text-tertiary">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
