import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Bot,
  User,
  Minimize2,
  Maximize2
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Message {
  id: string;
  type: 'user' | 'agent' | 'bot';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'read';
}

interface ChatSupportProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

const QUICK_QUESTIONS = [
  { id: 'booking', text: "Comment réserver un voyage ?", icon: "🎫" },
  { id: 'payment', text: "Quels modes de paiement acceptez-vous ?", icon: "💳" },
  { id: 'baggage', text: "Politique de bagages", icon: "🧳" },
  { id: 'cancellation', text: "Comment annuler ma réservation ?", icon: "❌" },
  { id: 'schedule', text: "Horaires et retards", icon: "⏰" },
  { id: 'emergency', text: "Urgence - Besoin d'aide immédiate", icon: "🚨" }
];

const BOT_RESPONSES = {
  booking: "Pour réserver un voyage sur KonGO :\n\n1. 🔍 Utilisez notre recherche pour trouver votre trajet\n2. 🪑 Sélectionnez vos sièges préférés\n3. 💳 Effectuez le paiement sécurisé\n4. 📱 Recevez votre billet QR par SMS/Email\n\nBesoin d'aide pour une étape spécifique ?",
  payment: "KonGO accepte :\n\n💳 Cartes bancaires (Visa, Mastercard)\n📱 Mobile Money (Orange, Vodacom, Airtel)\n💰 Paiement en agence\n🏦 Virement bancaire\n\nTous les paiements sont sécurisés SSL. Des questions sur un mode spécifique ?",
  baggage: "Politique bagages KonGO :\n\n✅ Bagage à main : 7kg gratuit\n🧳 Bagage en soute : 23kg inclus\n📏 Dimensions max : 158cm (L+l+h)\n⚖️ Excédent : 5000 CDF/kg\n\nBagages spéciaux (vélo, instruments) : contactez-nous 24h avant le départ.",
  cancellation: "Annulation KonGO :\n\n✅ Gratuite : jusqu'à 24h avant départ\n💰 Frais 50% : entre 24h et 6h avant\n❌ Non remboursable : moins de 6h avant\n\nPour annuler : espace client ou contactez-nous. Remboursement sous 3-5 jours ouvrés.",
  schedule: "Informations horaires :\n\n🕒 Horaires mis à jour en temps réel\n📍 Tracking GPS de votre bus\n⏰ SMS d'alerte en cas de retard\n📱 Notifications push dans l'app\n\nConsultez 'Mes Voyages' pour le suivi live de votre trajet.",
  emergency: "🚨 URGENCE DÉTECTÉE\n\nContactez immédiatement :\n📞 Hotline 24/7 : +243 123 456 789\n🚓 Police : 911\n🏥 Ambulance : 912\n\nJe transfère vers un agent humain prioritaire..."
};

export function ChatSupport({ isOpen, onClose, userInfo }: ChatSupportProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: `Bonjour${userInfo?.name ? ` ${userInfo.name}` : ''} ! 👋\n\nJe suis l'assistant KonGO. Comment puis-je vous aider aujourd'hui ?\n\nVous pouvez :\n• Poser une question directement\n• Choisir un sujet ci-dessous\n• Demander un agent humain`,
        timestamp: new Date(),
        status: 'read'
      };
      setMessages([welcomeMessage]);
      setIsConnected(true);
    }
  }, [isOpen, userInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(newMessage),
        timestamp: new Date(),
        status: 'read'
      };

      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
      ).concat(botResponse));
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (questionId: string) => {
    const question = QUICK_QUESTIONS.find(q => q.id === questionId);
    if (!question) return;

    setNewMessage(question.text);
    setTimeout(() => handleSendMessage(), 100);
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('urgence') || lowerMessage.includes('emergency') || lowerMessage.includes('aide')) {
      return BOT_RESPONSES.emergency;
    } else if (lowerMessage.includes('réserv') || lowerMessage.includes('book')) {
      return BOT_RESPONSES.booking;
    } else if (lowerMessage.includes('paie') || lowerMessage.includes('payment')) {
      return BOT_RESPONSES.payment;
    } else if (lowerMessage.includes('bagage') || lowerMessage.includes('luggage')) {
      return BOT_RESPONSES.baggage;
    } else if (lowerMessage.includes('annul') || lowerMessage.includes('cancel')) {
      return BOT_RESPONSES.cancellation;
    } else if (lowerMessage.includes('horaire') || lowerMessage.includes('retard') || lowerMessage.includes('schedule')) {
      return BOT_RESPONSES.schedule;
    } else if (lowerMessage.includes('agent') || lowerMessage.includes('humain') || lowerMessage.includes('personne')) {
      return "Je vous mets en relation avec un agent humain. Temps d'attente estimé : 2-3 minutes.\n\n⏳ Vous êtes en position 2 dans la file d'attente.\n\nEn attendant, puis-je vous aider avec une question rapide ?";
    } else {
      return "Je comprends votre question. Voici quelques options :\n\n🤖 Reformulez votre question\n👤 Parler à un agent humain\n📞 Appeler notre hotline : +243 123 456 789\n📧 Email : support@kongo-transport.cd\n\nQue préférez-vous ?";
    }
  };

  const handleRequestAgent = () => {
    toast.success("🔄 Transfert vers un agent", {
      description: "Vous serez connecté dans 2-3 minutes",
      action: {
        label: "Annuler",
        onClick: () => toast.info("Transfert annulé")
      }
    });
  };

  const handleEmergencyCall = () => {
    window.open('tel:+243123456789', '_self');
    toast.error("📞 Appel d'urgence en cours...");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-6 right-6 z-[60] w-96 max-w-[calc(100vw-2rem)] max-h-[80vh] bg-surface-elevated border border-border-primary rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-kongo-black p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-kongo-lime rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-kongo-black" />
            </div>
            <div>
              <h3 className="text-body text-on-black font-semibold">Support KonGO</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-body-small text-on-black opacity-80">
                  {agentStatus === 'online' ? 'En ligne' : agentStatus === 'busy' ? 'Occupé' : 'Hors ligne'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              className="btn-ghost p-2 h-auto text-on-black hover:bg-kongo-black-light"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              onClick={onClose}
              className="btn-ghost p-2 h-auto text-on-black hover:bg-kongo-black-light"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Connection Status */}
            {isConnected && (
              <div className="bg-surface-kongo-lime-light p-2 border-b border-border-primary">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-body-small text-success font-medium">Connecté au support KonGO</span>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 bg-surface-secondary border-b border-border-primary">
              <div className="flex items-center justify-between mb-3">
                <span className="text-label-small text-tertiary">ACTIONS RAPIDES</span>
                <Badge className="status-kongo">24/7</Badge>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleEmergencyCall}
                  className="btn-accent flex-1 h-8"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  <span className="text-body-small font-semibold">Urgence</span>
                </Button>
                <Button
                  onClick={handleRequestAgent}
                  className="btn-outline-lime flex-1 h-8"
                >
                  <User className="w-3 h-3 mr-1" />
                  <span className="text-body-small font-semibold">Agent</span>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-kongo-black text-on-black' 
                      : message.type === 'bot'
                      ? 'bg-surface-kongo-lime-light border border-kongo-lime/20 text-kongo-black'
                      : 'bg-surface-tertiary text-primary'
                  } p-3 rounded-lg`}>
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && (
                        <Bot className="w-4 h-4 text-kongo-lime-dark mt-0.5 flex-shrink-0" />
                      )}
                      {message.type === 'agent' && (
                        <User className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-body-small whitespace-pre-line">{message.content}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-caption opacity-70">
                            {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.type === 'user' && (
                            <div className="flex items-center space-x-1">
                              {message.status === 'sending' && <Clock className="w-3 h-3 opacity-60" />}
                              {message.status === 'sent' && <CheckCircle2 className="w-3 h-3 opacity-60" />}
                              {message.status === 'read' && <CheckCircle2 className="w-3 h-3 text-success" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-surface-tertiary p-3 rounded-lg flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-kongo-lime-dark" />
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-tertiary rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-tertiary rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-tertiary rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="p-4 bg-surface-secondary border-t border-border-primary">
                <div className="text-label-small text-tertiary mb-3">QUESTIONS FRÉQUENTES</div>
                <div className="grid grid-cols-1 gap-2">
                  {QUICK_QUESTIONS.slice(0, 4).map((question) => (
                    <Button
                      key={question.id}
                      onClick={() => handleQuickQuestion(question.id)}
                      className="btn-ghost justify-start h-auto p-2 text-left"
                    >
                      <span className="mr-2">{question.icon}</span>
                      <span className="text-body-small">{question.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border-primary">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="btn-primary px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 text-caption text-quaternary">
                <span>Powered by KonGO AI</span>
                <span>Réponse moyenne: 30s</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}