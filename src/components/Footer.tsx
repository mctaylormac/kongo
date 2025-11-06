import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Send, 
  CheckCircle, 
  Star, 
  Users, 
  ArrowRight, 
  Shield, 
  Award, 
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface FooterProps {
  onQuickSearch?: (from: string, to: string) => void;
  onContactClick?: () => void;
}

export function Footer({ onQuickSearch, onContactClick }: FooterProps) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Veuillez entrer un email valide");
      return;
    }
    
    toast.loading("Inscription en cours...", { id: 'newsletter' });
    setTimeout(() => {
      setIsSubscribed(true);
      setEmail('');
      toast.success("🎉 Inscription réussie !", {
        id: 'newsletter',
        description: "Vous recevrez nos meilleures offres par email"
      });
    }, 1000);
  };

  const quickRoutes = [
    { from: 'Kinshasa', to: 'Lubumbashi', price: '125,000 CDF' },
    { from: 'Kinshasa', to: 'Goma', price: '95,000 CDF' },
    { from: 'Lubumbashi', to: 'Bukavu', price: '85,000 CDF' }
  ];

  const footerStats = [
    { icon: Users, number: '2M+', label: 'Voyageurs' },
    { icon: MapPin, number: '50+', label: 'Destinations' },
    { icon: Star, number: '4.9★', label: 'Satisfaction' },
    { icon: Shield, number: '99.9%', label: 'Sécurité' }
  ];

  const footerSections = {
    company: {
      title: "KonGO",
      links: [
        { name: "À propos", action: () => toast.info("📖 À propos de KonGO") },
        { name: "Notre équipe", action: () => toast.info("👥 Notre équipe") },
        { name: "Carrières", action: () => toast.success("💼 Rejoignez KonGO !") },
        { name: "Presse", action: () => toast.info("📰 Espace Presse") }
      ]
    },
    services: {
      title: "Services",
      links: [
        { name: "Réserver un billet", action: () => onQuickSearch?.('Kinshasa', 'Lubumbashi') },
        { name: "Nos agences", action: () => window.dispatchEvent(new CustomEvent('navigate-to-agencies')) },
        { name: "Suivi de voyage", action: () => toast.info("📍 Suivi en temps réel") },
        { name: "KonGO Business", action: () => toast.info("🏢 Solutions Entreprise") }
      ]
    },
    support: {
      title: "Support",
      links: [
        { name: "Centre d'aide", action: () => toast.info("🆘 Centre d'aide KonGO") },
        { name: "Contact", action: () => onContactClick?.() },
        { name: "Chat en direct", action: () => toast.info("💬 Chat support") },
        { name: "Statut services", action: () => toast.success("✅ Tous services opérationnels") }
      ]
    },
    legal: {
      title: "Légal",
      links: [
        { name: "Conditions d'utilisation", action: () => toast.info("📋 Conditions d'utilisation") },
        { name: "Confidentialité", action: () => toast.info("🔒 Politique de confidentialité") },
        { name: "Remboursements", action: () => toast.info("💰 Politique de remboursement") },
        { name: "Mentions légales", action: () => toast.info("⚖️ Mentions légales") }
      ]
    }
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, color: 'hover:bg-blue-600' },
    { name: 'Twitter', icon: Twitter, color: 'hover:bg-blue-400' },
    { name: 'Instagram', icon: Instagram, color: 'hover:bg-pink-600' },
    { name: 'LinkedIn', icon: Linkedin, color: 'hover:bg-blue-700' }
  ];

  return (
    <footer className="bg-kongo-black text-on-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${encodeURIComponent('bfeb30').slice(1)}' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container-professional relative z-10">
        {/* Top Section - Newsletter & Stats */}
        <div className="py-16 border-b border-kongo-black-light">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Newsletter Section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Badge className="bg-kongo-lime/20 text-kongo-lime border border-kongo-lime/40 px-4 py-2">
                  <Star className="w-4 h-4 mr-2" />
                  Newsletter KonGO
                </Badge>
                
                <h3 className="text-h3 text-on-black font-bold">
                  Restez informé des meilleures offres
                </h3>
                
                <p className="text-body text-on-black/80 max-w-md">
                  Recevez nos promotions exclusives et nouvelles destinations directement par email.
                </p>
              </div>

              {!isSubscribed ? (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 h-12 bg-kongo-black-light border-kongo-black-lighter text-on-black placeholder:text-on-black/60 focus:border-kongo-lime focus:ring-kongo-lime/30"
                    required
                  />
                  <Button 
                    type="submit"
                    className="h-12 px-6 bg-kongo-lime text-kongo-black hover:bg-kongo-lime-hover font-semibold"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <div className="flex items-center space-x-3 text-kongo-lime">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-body font-semibold">Inscription confirmée !</span>
                </div>
              )}
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-6"
            >
              {footerStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-kongo-black-light rounded-xl border border-kongo-black-lighter hover:border-kongo-lime/50 transition-all duration-300"
                >
                  <stat.icon className="w-8 h-8 text-kongo-lime mx-auto mb-3" />
                  <div className="text-h4 text-on-black font-bold">{stat.number}</div>
                  <div className="text-body-small text-on-black/80">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-kongo-lime rounded-xl flex items-center justify-center">
                  <span className="text-kongo-black font-extrabold text-xl">K</span>
                </div>
                <div>
                  <div className="text-h3 text-on-black font-extrabold">KonGO</div>
                  <div className="text-caption text-kongo-lime font-bold tracking-wider">
                    TRANSPORT MODERNE RDC
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-body text-on-black/90 leading-relaxed max-w-sm">
                La première plateforme digitale de réservation de transport en RDC.{" "}
                <span className="text-kongo-lime font-semibold">Sécurisé, fiable, accessible 24h/24.</span>
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-on-black/80">
                  <MapPin className="w-4 h-4 text-kongo-lime" />
                  <span className="text-body-small">Avenue Lumumba, Gombe, Kinshasa</span>
                </div>
                
                <button
                  onClick={() => window.open('tel:+243123456789', '_self')}
                  className="flex items-center space-x-3 text-on-black/80 hover:text-kongo-lime transition-colors group"
                >
                  <Phone className="w-4 h-4 text-kongo-lime" />
                  <span className="text-body-small font-medium group-hover:underline">+243 123 456 789</span>
                </button>
                
                <button
                  onClick={() => window.open('mailto:contact@kongo-transport.cd', '_blank')}
                  className="flex items-center space-x-3 text-on-black/80 hover:text-kongo-lime transition-colors group"
                >
                  <Mail className="w-4 h-4 text-kongo-lime" />
                  <span className="text-body-small group-hover:underline">contact@kongo-transport.cd</span>
                </button>
              </div>

              {/* Award */}
              <div className="flex items-center space-x-2 text-kongo-lime pt-2">
                <Award className="w-5 h-5" />
                <span className="text-body-small font-semibold">Meilleur Service Transport RDC 2024</span>
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerSections).map(([key, section]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                <h4 className="text-body text-on-black font-bold mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <button
                        onClick={link.action}
                        className="text-body-small text-on-black/80 hover:text-kongo-lime transition-colors text-left group flex items-center"
                      >
                        <span className="group-hover:underline">{link.name}</span>
                        <ChevronRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Routes Section */}
        <div className="py-12 border-t border-kongo-black-light">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h4 className="text-body text-on-black font-bold flex items-center">
              <Star className="w-5 h-5 text-kongo-lime mr-2" />
              Routes Populaires
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickRoutes.map((route, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    onQuickSearch?.(route.from, route.to);
                    toast.success(`🚌 Recherche ${route.from} → ${route.to}`);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-kongo-black-light rounded-lg border border-kongo-black-lighter hover:border-kongo-lime hover:bg-kongo-black-lighter transition-all duration-300 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-body-small text-on-black font-semibold group-hover:text-kongo-lime transition-colors">
                      {route.from} → {route.to}
                    </div>
                    <ArrowRight className="w-4 h-4 text-on-black/60 group-hover:text-kongo-lime group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-body-small text-kongo-lime font-bold mt-2">{route.price}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Footer */}
        <Separator className="bg-kongo-black-light" />
        <div className="py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
            
            {/* Copyright */}
            <div className="space-y-2">
              <div className="text-body-small text-on-black/90">
                © 2024{" "}
                <span className="text-kongo-lime font-semibold">KonGO Transport S.A.R.L.</span>
                {" "}Tous droits réservés.
              </div>
              <div className="flex items-center space-x-4 text-caption text-on-black/70">
                <span className="flex items-center space-x-1">
                  <span>🇨🇩</span>
                  <span>Fait en RDC</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Sécurisé SSL</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Service 24/7</span>
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3">
              <span className="text-body-small text-on-black/80 mr-2">Suivez-nous</span>
              {socialLinks.map((social) => (
                <motion.button
                  key={social.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    toast.info(`Ouverture de ${social.name}`, {
                      description: "Rejoignez notre communauté"
                    });
                  }}
                  className={`w-10 h-10 bg-kongo-black-light border border-kongo-black-lighter hover:border-kongo-lime rounded-lg flex items-center justify-center transition-all duration-300 group ${social.color}`}
                  aria-label={`Suivre KonGO sur ${social.name}`}
                >
                  <social.icon className="w-5 h-5 text-on-black/80 group-hover:text-white transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}