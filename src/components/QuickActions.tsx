import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { 
  Phone, 
  MessageCircle, 
  ArrowUp, 
  History,
  Bookmark,
  Share2,
  HelpCircle,
  ChevronUp,
  AlertTriangle,
  Star,
  Gift,
  Zap,
  Heart,
  Settings
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface QuickActionsProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
  bookingHistory?: any[];
  onQuickAction?: (action: string, data?: any) => void;
}

export function QuickActions({ currentPage, onPageChange, bookingHistory = [], onQuickAction }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show scroll to top button after scrolling down 300px
      setShowScrollTop(currentScrollY > 300);
      
      // Auto-collapse when scrolling up rapidly
      if (currentScrollY < lastScrollY - 100 && isExpanded) {
        setIsExpanded(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isExpanded]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KonGO - Transport RDC',
          text: 'Découvrez KonGO, la meilleure plateforme de réservation de bus en RDC',
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copy to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié dans le presse-papier !");
  };

  const handleCall = () => {
    window.open('tel:+243123456789', '_self');
  };

  const handleChat = () => {
    onQuickAction?.('support');
    toast.info("Chat en cours d'ouverture...", {
      description: "Notre équipe vous répond en moins de 2 minutes",
      action: {
        label: "WhatsApp",
        onClick: () => window.open('https://wa.me/243987654321', '_blank')
      }
    });
  };

  const handleHistory = () => {
    if (bookingHistory.length === 0) {
      toast.info("Aucune réservation trouvée", {
        description: "Commencez par effectuer votre première réservation"
      });
    } else {
      onPageChange?.("dashboard");
    }
  };

  const handleHelp = () => {
    const helpTopics = [
      "Comment réserver un billet ?",
      "Modification/Annulation",
      "Paiement Mobile Money",
      "Sélection de sièges",
      "Conditions de voyage"
    ];
    
    toast.info("Centre d'aide KonGO", {
      description: "FAQ complète disponible sur notre site",
      action: {
        label: "Voir la FAQ",
        onClick: () => {
          toast.success("FAQ KonGO", {
            description: "Trouvez toutes les réponses à vos questions",
            duration: 6000
          });
        }
      }
    });
  };

  const handleEmergency = () => {
    onQuickAction?.('emergency');
    window.open('tel:+243123456789', '_self');
  };

  const handleFeedback = () => {
    onQuickAction?.('feedback');
    toast("⭐ Votre avis compte !", {
      description: "Aidez-nous à améliorer KonGO",
      action: {
        label: "5 étoiles ⭐",
        onClick: () => {
          toast.success("Merci pour vos 5 étoiles ! 🎉", {
            description: "Votre avis nous motive à donner le meilleur"
          });
        }
      },
      cancel: {
        label: "Plus tard",
        onClick: () => {}
      }
    });
  };

  const handleBookmark = () => {
    const currentPageTitle = {
      'home': 'Accueil KonGO',
      'search': 'Recherche de trajets',
      'dashboard': 'Mon tableau de bord',
      'agencies': 'Nos agences partenaires'
    }[currentPage] || 'KonGO Transport';
    
    if ('bookmarks' in navigator) {
      // Future API
      toast.success("Page ajoutée aux favoris ! 🔖");
    } else {
      toast.info("Ajoutez KonGO aux favoris", {
        description: `Utilisez Ctrl+D pour marquer cette page`,
        action: {
          label: "Raccourci",
          onClick: () => {
            toast.info("💡 Astuce", {
              description: "Ctrl+D (PC) ou Cmd+D (Mac) pour ajouter aux favoris"
            });
          }
        }
      });
    }
  };

  const handleSpecialOffer = () => {
    toast("🎁 Offre spéciale !", {
      description: "10% de réduction sur votre prochain voyage",
      action: {
        label: "J'en profite !",
        onClick: () => {
          onPageChange?.('search');
          toast.success("Code promo appliqué : KONGO10", {
            description: "Valable jusqu'à la fin du mois"
          });
        }
      },
      duration: 8000
    });
  };

  const quickActions = [
    {
      icon: AlertTriangle,
      label: "Urgence",
      action: handleEmergency,
      color: "text-error",
      show: true,
      priority: 1
    },
    {
      icon: History,
      label: "Historique",
      action: handleHistory,
      color: "text-info",
      show: true,
      priority: 2
    },
    {
      icon: Heart,
      label: "Favoris",
      action: handleBookmark,
      color: "text-error",
      show: currentPage === 'home' || currentPage === 'search',
      priority: 3
    },
    {
      icon: Gift,
      label: "Promo",
      action: handleSpecialOffer,
      color: "text-kongo-lime-dark",
      show: currentPage !== 'payment' && currentPage !== 'confirmation',
      priority: 4
    },
    {
      icon: Share2,
      label: "Partager",
      action: handleShare,
      color: "text-kongo-lime-dark",
      show: true,
      priority: 5
    },
    {
      icon: Star,
      label: "Avis",
      action: handleFeedback,
      color: "text-warning",
      show: bookingHistory.length > 0,
      priority: 6
    },
    {
      icon: MessageCircle,
      label: "Chat",
      action: handleChat,
      color: "text-success",
      show: true,
      priority: 7
    },
    {
      icon: HelpCircle,
      label: "Aide",
      action: handleHelp,
      color: "text-info",
      show: true,
      priority: 8
    }
  ].filter(action => action.show).sort((a, b) => a.priority - b.priority);

  return (
    <>
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-40 md:bottom-6"
          >
            <Button
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full bg-kongo-black text-on-black shadow-kongo-black hover:shadow-lg p-0 flex items-center justify-center"
              aria-label="Retour en haut"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-3">
        {/* Expanded Actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col space-y-3"
            >
              {quickActions.slice(0, 6).map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    onClick={action.action}
                    className="flex items-center space-x-3 bg-surface-elevated text-primary border border-border-primary shadow-lg hover:shadow-xl hover:bg-surface-hover px-4 py-3 rounded-full transition-all duration-200"
                  >
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                    <span className="text-body-small font-medium hidden sm:inline">
                      {action.label}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Call Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleCall}
            className="w-14 h-14 rounded-full bg-kongo-lime text-kongo-black shadow-kongo-lime hover:shadow-lg p-0 flex items-center justify-center relative overflow-hidden group"
            aria-label="Appeler KonGO"
          >
            <Phone className="w-6 h-6 z-10 transition-transform group-hover:scale-110" />
            
            {/* Pulse animation */}
            <motion.div
              className="absolute inset-0 bg-kongo-lime rounded-full"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: [0.5, 0], 
                scale: [1, 1.4] 
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </Button>
        </motion.div>

        {/* Expand/Collapse Toggle */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 rounded-full bg-kongo-black text-on-black shadow-kongo-black hover:shadow-lg p-0 flex items-center justify-center"
            aria-label={isExpanded ? "Réduire les actions" : "Voir plus d'actions"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="w-5 h-5" />
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Emergency Contact Banner */}
      {currentPage !== "home" && (
        <div className="fixed bottom-0 left-0 right-0 bg-kongo-black text-on-black p-3 z-30 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="text-body-small">
                Urgence ? <span className="font-semibold">+243 123 456 789</span>
              </span>
            </div>
            <Button
              onClick={handleCall}
              size="sm"
              className="btn-secondary text-kongo-black px-3 py-1"
            >
              Appeler
            </Button>
          </div>
        </div>
      )}
    </>
  );
}