import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Search, 
  ChevronDown, 
  MessageCircle, 
  Phone, 
  Mail, 
  HelpCircle,
  BookOpen,
  CreditCard,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  helpful?: number;
  notHelpful?: number;
  lastUpdated: string;
}

interface FAQCenterProps {
  onContactSupport: () => void;
}

const FAQ_CATEGORIES = [
  { id: 'all', name: 'Toutes', icon: HelpCircle, color: 'text-primary' },
  { id: 'booking', name: 'Réservation', icon: BookOpen, color: 'text-kongo-lime-dark' },
  { id: 'payment', name: 'Paiement', icon: CreditCard, color: 'text-info' },
  { id: 'travel', name: 'Voyage', icon: MapPin, color: 'text-success' },
  { id: 'schedule', name: 'Horaires', icon: Clock, color: 'text-warning' },
  { id: 'emergency', name: 'Urgence', icon: AlertTriangle, color: 'text-error' }
];

const FAQ_DATA: FAQItem[] = [
  {
    id: 'booking-1',
    category: 'booking',
    question: "Comment réserver un billet de bus sur KonGO ?",
    answer: "Pour réserver votre billet :\n\n1. **Recherche** : Entrez votre ville de départ, destination et date\n2. **Sélection** : Choisissez parmi les trajets disponibles\n3. **Sièges** : Sélectionnez vos sièges préférés sur le plan\n4. **Informations** : Renseignez vos données passager\n5. **Paiement** : Réglez par Mobile Money, carte ou en agence\n6. **Confirmation** : Recevez votre billet QR par SMS/Email\n\n💡 **Astuce** : Réservez à l'avance pour les meilleurs prix et plus de choix de sièges !",
    tags: ['réservation', 'billet', 'étapes', 'guide'],
    helpful: 156,
    notHelpful: 8,
    lastUpdated: "2024-01-15"
  },
  {
    id: 'payment-1',
    category: 'payment',
    question: "Quels sont les modes de paiement acceptés ?",
    answer: "KonGO accepte plusieurs modes de paiement sécurisés :\n\n**💳 Cartes bancaires**\n• Visa, Mastercard, American Express\n• Paiement sécurisé SSL 256-bit\n\n**📱 Mobile Money**\n• Orange Money\n• Vodacom M-Pesa\n• Airtel Money\n• Tigo Cash\n\n**🏢 En agence**\n• Espèces dans nos 200+ agences\n• Carte bancaire sur terminal\n\n**🏦 Virement bancaire**\n• Avec référence de réservation\n• Délai 24h pour confirmation\n\n**💰 Portefeuille KonGO**\n• Rechargeable en ligne\n• Bonus fidélité inclus",
    tags: ['paiement', 'mobile money', 'carte', 'agence'],
    helpful: 203,
    notHelpful: 12,
    lastUpdated: "2024-01-20"
  },
  {
    id: 'travel-1',
    category: 'travel',
    question: "Que faire en cas de retard ou d'annulation ?",
    answer: "**🚌 En cas de retard :**\n• Notification automatique par SMS/Email\n• Suivi temps réel sur votre espace client\n• Compensation si retard > 2h\n\n**❌ En cas d'annulation :**\n• Remboursement intégral automatique\n• Report gratuit sur prochain trajet\n• Hébergement offert si annulation tardive\n\n**📞 Contact prioritaire :**\n• Hotline dédiée : +243 123 456 789\n• Chat support dans l'app\n• Email : incidents@kongo-transport.cd\n\n**💰 Compensations :**\n• Retard 2-4h : Bon 25% voyage suivant\n• Retard >4h : Remboursement 50%\n• Annulation <6h : Hébergement + transport alternatif",
    tags: ['retard', 'annulation', 'compensation', 'incident'],
    helpful: 89,
    notHelpful: 23,
    lastUpdated: "2024-01-18"
  },
  {
    id: 'schedule-1',
    category: 'schedule',
    question: "Comment consulter les horaires en temps réel ?",
    answer: "**📱 Plusieurs moyens de suivre vos trajets :**\n\n**Application KonGO**\n• Géolocalisation GPS en temps réel\n• Notifications push automatiques\n• Estimation d'arrivée mise à jour\n\n**Espace client web**\n• Carte interactive du trajet\n• Historique des positions\n• Alertes personnalisables\n\n**SMS/Email automatique**\n• Départ confirmé\n• Arrivée aux étapes\n• Retards ou incidents\n\n**🗺️ Tracking avancé :**\n• Position exacte du bus\n• Vitesse et direction\n• Temps d'arrêt aux stations\n• Météo sur le trajet\n\n💡 **Conseil** : Activez les notifications push pour être informé en permanence !",
    tags: ['horaires', 'temps réel', 'tracking', 'GPS'],
    helpful: 142,
    notHelpful: 5,
    lastUpdated: "2024-01-22"
  },
  {
    id: 'emergency-1',
    category: 'emergency',
    question: "Que faire en cas d'urgence pendant le voyage ?",
    answer: "**🚨 EN CAS D'URGENCE IMMÉDIATE :**\n\n**Contactez directement :**\n• 📞 Hotline urgence 24/7 : +243 123 456 789\n• 🚓 Police : 911\n• 🏥 Ambulance : 912\n• 🔥 Pompiers : 913\n\n**Dans le bus :**\n• Alertez immédiatement le chauffeur\n• Utilisez le bouton d'urgence (siège conducteur)\n• Géolocalisation automatique envoyée\n\n**App KonGO - Fonction SOS :**\n• Bouton rouge dans 'Mon Voyage'\n• Localisation GPS partagée\n• Contact automatique famille + KonGO\n• Assistance médicale si nécessaire\n\n**🏥 Assistance médicale :**\n• Premiers secours dans chaque bus\n• Partenariat hôpitaux sur tous trajets\n• Assurance voyage incluse\n• Évacuation d'urgence si nécessaire\n\n**Après l'incident :**\n• Support psychologique disponible\n• Rapport détaillé fourni\n• Suivi médical assuré",
    tags: ['urgence', 'sécurité', 'accident', 'SOS'],
    helpful: 67,
    notHelpful: 3,
    lastUpdated: "2024-01-25"
  },
  {
    id: 'booking-2',
    category: 'booking',
    question: "Puis-je modifier ou annuler ma réservation ?",
    answer: "**✏️ MODIFICATION DE RÉSERVATION :**\n\n**Gratuite jusqu'à 24h avant :**\n• Changement de date/heure\n• Modification nom passager\n• Changement de siège\n\n**Avec frais entre 24h-6h :**\n• Frais 20% du prix billet\n• Selon disponibilité\n\n**❌ ANNULATION :**\n\n**Remboursement intégral :**\n• Plus de 24h avant départ\n• Conditions météo extrêmes\n• Force majeure certifiée\n\n**Remboursement partiel :**\n• 24h-6h avant : 50% remboursé\n• 6h-2h avant : 25% remboursé\n• Moins de 2h : Non remboursable\n\n**💡 Options flexibles :**\n• Assurance annulation +15% : Remboursement à 100%\n• Report gratuit vers crédit KonGO (valid. 12 mois)\n• Échange famille/amis possible",
    tags: ['modification', 'annulation', 'remboursement', 'flexible'],
    helpful: 178,
    notHelpful: 15,
    lastUpdated: "2024-01-20"
  },
  {
    id: 'payment-2',
    category: 'payment',
    question: "Comment fonctionne le programme de fidélité KonGO ?",
    answer: "**⭐ PROGRAMME FIDÉLITÉ KONGO PLUS :**\n\n**🥉 Bronze (0-999 points) :**\n• 1 point = 100 CDF dépensé\n• 5% réduction anniversaire\n• Support prioritaire\n\n**🥈 Silver (1000-2999 points) :**\n• 1.5x points sur voyages\n• 10% réduction anniversaire\n• Surclassement gratuit si disponible\n• Bagages +5kg offerts\n\n**🥇 Gold (3000+ points) :**\n• 2x points sur voyages\n• 15% réduction anniversaire\n• Surclassement automatique VIP\n• Bagages +10kg offerts\n• Lounge accès dans gares\n• Support dédié 24/7\n\n**💰 Utilisation des points :**\n• 1000 points = 10,000 CDF de réduction\n• Voyages gratuits dès 5000 points\n• Cadeaux boutique KonGO\n• Don associations partenaires\n\n**🎁 Bonus spéciaux :**\n• Parrainage : 500 points/ami\n• Avis voyage : 50 points\n• Anniversaire : Points doublés",
    tags: ['fidélité', 'points', 'réduction', 'avantages'],
    helpful: 234,
    notHelpful: 7,
    lastUpdated: "2024-01-23"
  }
];

export function FAQCenter({ onContactSupport }: FAQCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'up' | 'down' | null>>({});

  const filteredFAQs = FAQ_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleHelpfulVote = (itemId: string, vote: 'up' | 'down') => {
    setHelpfulVotes(prev => ({
      ...prev,
      [itemId]: prev[itemId] === vote ? null : vote
    }));
  };

  return (
    <div className="min-h-screen bg-surface-primary py-20">
      <div className="container-professional">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-surface-kongo-lime-light px-4 py-2 rounded-full mb-6"
          >
            <HelpCircle className="w-5 h-5 text-kongo-lime-dark" />
            <span className="text-body-small text-kongo-lime-dark font-semibold">Centre d'Aide KonGO</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-display-1 text-kongo-black mb-6"
          >
            Comment pouvons-nous <span className="text-kongo-lime">vous aider</span> ?
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-body-large text-secondary max-w-2xl mx-auto"
          >
            Trouvez rapidement les réponses à vos questions ou contactez notre équipe support disponible 24/7.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-quaternary" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la FAQ... (ex: 'paiement', 'retard', 'modification')"
              className="pl-12 h-14 text-body border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {FAQ_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${
                  isSelected 
                    ? 'btn-primary' 
                    : 'btn-ghost border border-border-primary hover:border-kongo-lime'
                } h-auto py-3 px-6`}
              >
                <Icon className={`w-4 h-4 mr-2 ${isSelected ? 'text-on-black' : category.color}`} />
                <span className="font-medium">{category.name}</span>
              </Button>
            );
          })}
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-body text-secondary">
            <strong>{filteredFAQs.length}</strong> {filteredFAQs.length === 1 ? 'résultat trouvé' : 'résultats trouvés'}
            {searchQuery && ` pour "${searchQuery}"`}
          </p>
          
          {/* Quick Contact */}
          <div className="flex items-center space-x-3">
            <span className="text-body-small text-tertiary">Besoin d'aide directe ?</span>
            <Button
              onClick={onContactSupport}
              className="btn-outline-lime h-8 px-4"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="text-body-small font-medium">Chat Support</span>
            </Button>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item, index) => {
            const isExpanded = expandedItems.includes(item.id);
            const userVote = helpfulVotes[item.id];
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-interactive bg-surface-elevated border border-border-primary rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full p-6 text-left hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={
                          item.category === 'booking' ? 'status-success' :
                          item.category === 'payment' ? 'status-info' :
                          item.category === 'travel' ? 'status-warning' :
                          item.category === 'schedule' ? 'status-kongo' :
                          item.category === 'emergency' ? 'status-error' :
                          'bg-surface-tertiary text-tertiary'
                        }>
                          {FAQ_CATEGORIES.find(cat => cat.id === item.category)?.name || 'Général'}
                        </Badge>
                        
                        <div className="flex items-center space-x-2 text-caption text-quaternary">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mis à jour le {new Date(item.lastUpdated).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-h5 text-primary font-medium pr-8">{item.question}</h3>
                      
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-4 h-4 text-success" />
                          <span className="text-body-small text-success font-medium">{item.helpful || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsDown className="w-4 h-4 text-quaternary" />
                          <span className="text-body-small text-quaternary">{item.notHelpful || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-tertiary" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-border-primary"
                    >
                      <div className="p-6 pt-4">
                        <div className="prose prose-sm max-w-none">
                          <div className="text-body text-secondary whitespace-pre-line leading-relaxed">
                            {item.answer}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-6 mb-4">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-surface-tertiary text-caption text-tertiary rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Helpful Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-border-primary">
                          <span className="text-body-small text-tertiary">Cette réponse était-elle utile ?</span>
                          
                          <div className="flex items-center space-x-3">
                            <Button
                              onClick={() => handleHelpfulVote(item.id, 'up')}
                              className={`btn-ghost h-8 px-3 ${
                                userVote === 'up' ? 'bg-success-light text-success' : ''
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              <span className="text-body-small">Oui</span>
                            </Button>
                            
                            <Button
                              onClick={() => handleHelpfulVote(item.id, 'down')}
                              className={`btn-ghost h-8 px-3 ${
                                userVote === 'down' ? 'bg-error-light text-error' : ''
                              }`}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              <span className="text-body-small">Non</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredFAQs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <HelpCircle className="w-16 h-16 text-quaternary mx-auto mb-6" />
            <h3 className="text-h3 text-primary mb-4">Aucun résultat trouvé</h3>
            <p className="text-body text-secondary mb-8 max-w-md mx-auto">
              Nous n'avons pas trouvé de réponse pour "{searchQuery}". 
              Contactez notre équipe support pour une aide personnalisée.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onContactSupport}
                className="btn-primary"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contacter le Support
              </Button>
              
              <Button
                onClick={() => window.open('tel:+243123456789', '_self')}
                className="btn-outline-lime"
              >
                <Phone className="w-5 h-5 mr-2" />
                Appeler +243 123 456 789
              </Button>
            </div>
          </motion.div>
        )}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 p-8 bg-gradient-kongo-subtle rounded-lg text-center"
        >
          <h3 className="text-h3 text-kongo-black mb-4">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-body text-secondary mb-8 max-w-2xl mx-auto">
            Notre équipe support KonGO est disponible 24/7 pour vous aider. 
            Contactez-nous par chat, téléphone ou email pour une assistance personnalisée.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onContactSupport}
              className="btn-primary"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat en Direct
            </Button>
            
            <Button
              onClick={() => window.open('tel:+243123456789', '_self')}
              className="btn-secondary"
            >
              <Phone className="w-5 h-5 mr-2" />
              +243 123 456 789
            </Button>
            
            <Button
              onClick={() => window.open('mailto:support@kongo-transport.cd', '_self')}
              className="btn-outline"
            >
              <Mail className="w-5 h-5 mr-2" />
              support@kongo-transport.cd
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
