import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Phone,
  Video,
  Paperclip,
  Smile,
  MoreVertical,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Zap,
  Search,
  Archive,
  Flag,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
  Copy,
  Download,
  Image as ImageIcon,
  FileText,
  Calendar,
  MapPin,
  CreditCard,
  Shield,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  Languages,
  Globe
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'agent' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    type: 'image' | 'file' | 'link';
    name: string;
    url: string;
    size?: string;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  isEdited?: boolean;
  replyTo?: string;
}

interface ChatSession {
  id: string;
  title: string;
  type: 'support' | 'sales' | 'feedback' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'waiting' | 'resolved' | 'closed';
  agent?: {
    id: string;
    name: string;
    avatar: string;
    department: string;
    rating: number;
  };
  startTime: Date;
  lastActivity: Date;
  satisfaction?: number;
  tags: string[];
}

interface AdvancedChatSystemProps {
  onClose?: () => void;
  initialMessage?: string;
  className?: string;
}

export function AdvancedChatSystem({ 
  onClose, 
  initialMessage = "", 
  className = "" 
}: AdvancedChatSystemProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentInput, setCurrentInput] = useState(initialMessage);
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSession, setCurrentSession] = useState<ChatSession>({
    id: 'session-1',
    title: 'Support Technique - Réservation',
    type: 'support',
    priority: 'medium',
    status: 'active',
    agent: {
      id: 'agent-1',
      name: 'Marie Kabamba',
      avatar: '/api/placeholder/40/40',
      department: 'Support Client',
      rating: 4.9
    },
    startTime: new Date(Date.now() - 300000), // 5 minutes ago
    lastActivity: new Date(),
    tags: ['réservation', 'paiement', 'mobile-money']
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Conversation démarrée avec le support KonGO',
      timestamp: new Date(Date.now() - 300000),
      status: 'read'
    },
    {
      id: '2',
      type: 'agent',
      content: 'Bonjour ! Je suis Marie, votre assistante support KonGO. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(Date.now() - 295000),
      status: 'read'
    },
    {
      id: '3',
      type: 'user',
      content: 'Bonjour, j\'ai un problème avec ma réservation. Le paiement ne passe pas.',
      timestamp: new Date(Date.now() - 290000),
      status: 'read'
    },
    {
      id: '4',
      type: 'agent',
      content: 'Je vais vous aider avec votre problème de paiement. Pouvez-vous me donner votre numéro de réservation ?',
      timestamp: new Date(Date.now() - 285000),
      status: 'read'
    },
    {
      id: '5',
      type: 'bot',
      content: '🤖 Suggestion IA : Vérifiez les informations de votre méthode de paiement Mobile Money. 89% des problèmes sont résolus en actualisant les informations de compte.',
      timestamp: new Date(Date.now() - 280000),
      status: 'read'
    }
  ]);

  const [quickReplies] = useState([
    'Merci beaucoup !',
    'Pouvez-vous m\'expliquer ?',
    'J\'ai d\'autres questions',
    'Le problème persiste',
    'C\'est résolu !',
    'Je vais essayer'
  ]);

  const [suggestedActions] = useState([
    { icon: CreditCard, label: 'Vérifier paiement', action: 'check_payment' },
    { icon: Calendar, label: 'Modifier réservation', action: 'modify_booking' },
    { icon: MapPin, label: 'Voir trajet', action: 'view_route' },
    { icon: Phone, label: 'Appel urgent', action: 'urgent_call' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Simuler agent qui tape
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        setAgentTyping(true);
        setTimeout(() => setAgentTyping(false), 2000);
      }
    }, 10000);

    return () => clearInterval(typingInterval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentInput('');
    setIsTyping(true);

    // Simuler envoi
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 500);

    // Simuler réponse de l'agent/bot
    setTimeout(() => {
      const responses = [
        'Je comprends votre situation. Laissez-moi vérifier cela pour vous.',
        'Parfait ! Je vais traiter votre demande immédiatement.',
        'Pouvez-vous me donner plus de détails sur ce problème ?',
        'C\'est une excellente question. Voici ce que je peux vous dire...',
        '🤖 IA KonGO : J\'ai analysé votre demande et trouvé une solution potentielle.'
      ];

      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: Math.random() > 0.7 ? 'bot' : 'agent',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        status: 'read'
      };

      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);

      if (soundEnabled) {
        // Jouer un son de notification
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeCDTR6T1');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    }, 1500 + Math.random() * 2000);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleSuggestedAction = (action: string) => {
    switch (action) {
      case 'check_payment':
        toast.info("🔍 Vérification des informations de paiement...", {
          description: "Redirection vers la page de paiement",
          action: {
            label: "Ouvrir",
            onClick: () => {}
          }
        });
        break;
      case 'modify_booking':
        toast.info("📝 Modification de réservation", {
          description: "Accès à vos réservations actives"
        });
        break;
      case 'view_route':
        toast.info("🗺️ Affichage du trajet", {
          description: "Ouverture de la carte interactive"
        });
        break;
      case 'urgent_call':
        toast.error("📞 Appel d'urgence", {
          description: "Connexion avec un agent disponible...",
          action: {
            label: "Appeler",
            onClick: () => window.open('tel:+243970123456', '_self')
          }
        });
        break;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-quaternary animate-pulse" />;
      case 'sent':
        return <CheckCircle2 className="w-3 h-3 text-quaternary" />;
      case 'delivered':
        return <CheckCircle2 className="w-3 h-3 text-info" />;
      case 'read':
        return <CheckCircle2 className="w-3 h-3 text-success" />;
    }
  };

  const getMessageTypeStyles = (type: Message['type']) => {
    switch (type) {
      case 'user':
        return {
          container: 'ml-auto bg-kongo-black text-on-black',
          text: 'text-on-black'
        };
      case 'agent':
        return {
          container: 'mr-auto bg-surface-elevated border border-border-primary',
          text: 'text-primary'
        };
      case 'bot':
        return {
          container: 'mr-auto bg-surface-kongo-lime-light border border-kongo-lime/20',
          text: 'text-kongo-lime-dark'
        };
      case 'system':
        return {
          container: 'mx-auto bg-surface-tertiary',
          text: 'text-tertiary text-center'
        };
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="btn-primary relative p-4 rounded-full shadow-kongo-black"
        >
          <MessageCircle className="w-6 h-6" />
          {agentTyping && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-kongo-lime rounded-full animate-pulse" />
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className={`fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50 ${className}`}
    >
      <Card className="card-elevated shadow-2xl border-0 overflow-hidden">
        {/* En-tête du chat */}
        <CardHeader className="p-4 bg-gradient-to-r from-kongo-black to-kongo-black-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-kongo-lime">
                  <AvatarImage src={currentSession.agent?.avatar} />
                  <AvatarFallback className="bg-kongo-lime text-kongo-black font-semibold">
                    {currentSession.agent?.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              
              <div>
                <h3 className="text-label font-semibold text-on-black">
                  {currentSession.agent?.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-body-xs text-on-black opacity-80">
                    {currentSession.agent?.department}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-body-xs text-on-black opacity-80">
                      {currentSession.agent?.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-8 h-8 p-0 text-on-black hover:bg-white/10"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 p-0 text-on-black hover:bg-white/10"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>

              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="w-8 h-8 p-0 text-on-black hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Statut de session */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center space-x-3">
              <Badge className={`text-xs ${
                currentSession.status === 'active' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}>
                {currentSession.status === 'active' ? 'En ligne' : 'En attente'}
              </Badge>
              
              <Badge className={`text-xs ${
                currentSession.priority === 'high' 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : currentSession.priority === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {currentSession.priority === 'high' ? 'Urgent' : 
                 currentSession.priority === 'medium' ? 'Moyen' : 'Faible'}
              </Badge>
            </div>

            <p className="text-body-xs text-on-black opacity-60">
              Démarré {formatTime(currentSession.startTime)}
            </p>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          {/* Navigation des onglets */}
          <TabsList className="grid w-full grid-cols-3 bg-surface-secondary m-0 rounded-none">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Actions</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Archive className="w-4 h-4" />
              <span>Historique</span>
            </TabsTrigger>
          </TabsList>

          {/* Contenu Chat */}
          <TabsContent value="chat" className="m-0">
            <CardContent className="p-0">
              {/* Zone des messages */}
              <div className="h-80 overflow-y-auto px-4 py-3 space-y-3 bg-surface-primary">
                <AnimatePresence>
                  {messages.map((message) => {
                    const styles = getMessageTypeStyles(message.type);
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${
                          message.type === 'user' ? 'justify-end' : 
                          message.type === 'system' ? 'justify-center' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-[80%] ${message.type === 'system' ? 'max-w-full' : ''}`}>
                          {/* Avatar pour les messages non-utilisateur */}
                          {(message.type === 'agent' || message.type === 'bot') && (
                            <div className="flex items-end space-x-2 mb-1">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className={`text-xs ${
                                  message.type === 'bot' 
                                    ? 'bg-kongo-lime text-kongo-black'
                                    : 'bg-kongo-black text-on-black'
                                }`}>
                                  {message.type === 'bot' ? <Bot className="w-3 h-3" /> : 'M'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-body-xs text-tertiary">
                                {message.type === 'bot' ? 'IA KonGO' : currentSession.agent?.name}
                              </span>
                            </div>
                          )}

                          <div className={`p-3 rounded-2xl ${styles.container}`}>
                            <p className={`text-body-small ${styles.text}`}>
                              {message.content}
                            </p>
                            
                            {/* Pièces jointes */}
                            {message.attachments && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center space-x-2 p-2 bg-black/5 rounded-lg">
                                    {attachment.type === 'image' && <ImageIcon className="w-4 h-4" />}
                                    {attachment.type === 'file' && <FileText className="w-4 h-4" />}
                                    <span className="text-body-xs">{attachment.name}</span>
                                    <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Métadonnées du message */}
                          <div className={`flex items-center space-x-2 mt-1 px-3 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-body-xs text-quaternary">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.type === 'user' && getMessageStatusIcon(message.status)}
                            {message.isEdited && (
                              <span className="text-body-xs text-quaternary italic">
                                modifié
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Indicateur de frappe */}
                <AnimatePresence>
                  {(agentTyping || isTyping) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-2"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-kongo-black text-on-black text-xs">
                          M
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-surface-elevated border border-border-primary p-3 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-kongo-lime rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-kongo-lime rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-kongo-lime rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Réponses rapides */}
              <div className="p-3 border-t border-border-primary bg-surface-secondary">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickReplies.map((reply, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs bg-surface-primary hover:bg-surface-hover"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>

                {/* Zone de saisie */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 text-tertiary"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>

                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(currentInput);
                        }
                      }}
                      placeholder="Tapez votre message..."
                      className="pr-12 h-10"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1 w-8 h-8 p-0 text-tertiary"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={() => sendMessage(currentInput)}
                    disabled={!currentInput.trim()}
                    className="btn-primary w-10 h-10 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Actions Rapides */}
          <TabsContent value="actions" className="m-0">
            <CardContent className="p-4 h-80 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="text-label font-semibold mb-3">Actions Suggérées</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={index}
                          onClick={() => handleSuggestedAction(action.action)}
                          variant="outline"
                          className="h-auto p-3 flex flex-col items-center space-y-2 hover:border-kongo-lime"
                        >
                          <Icon className="w-5 h-5 text-kongo-black" />
                          <span className="text-xs text-center">{action.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-label font-semibold mb-3">Support Avancé</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        toast.info("📞 Demande d'appel programmée", {
                          description: "Un agent vous rappellera dans 2-3 minutes"
                        });
                      }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Demander un rappel
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        toast.info("🎥 Session vidéo initiée", {
                          description: "Partage d'écran disponible"
                        });
                      }}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Partage d'écran
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        toast.success("📋 Rapport généré", {
                          description: "Copié dans le presse-papiers"
                        });
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Générer rapport
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-label font-semibold mb-3">Satisfaction</h4>
                  <div className="flex justify-center space-x-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex flex-col items-center p-4"
                      onClick={() => {
                        toast.success("👍 Merci pour votre retour positif !");
                      }}
                    >
                      <ThumbsUp className="w-5 h-5 text-green-600 mb-1" />
                      <span className="text-xs">Satisfait</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex flex-col items-center p-4"
                      onClick={() => {
                        toast.info("👎 Merci, nous allons améliorer notre service");
                      }}
                    >
                      <ThumbsDown className="w-5 h-5 text-red-600 mb-1" />
                      <span className="text-xs">À améliorer</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Historique */}
          <TabsContent value="history" className="m-0">
            <CardContent className="p-4 h-80 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="text-label font-semibold mb-3">Sessions Récentes</h4>
                  <div className="space-y-3">
                    {[
                      {
                        title: 'Problème de paiement Mobile Money',
                        date: new Date(Date.now() - 86400000),
                        status: 'resolved',
                        agent: 'Marie Kabamba'
                      },
                      {
                        title: 'Question sur les bagages',
                        date: new Date(Date.now() - 172800000),
                        status: 'resolved',
                        agent: 'Paul Mukendi'
                      },
                      {
                        title: 'Modification de réservation',
                        date: new Date(Date.now() - 259200000),
                        status: 'resolved',
                        agent: 'Sarah Nzuzi'
                      }
                    ].map((session, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border-primary rounded-lg hover:border-kongo-lime cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-label font-medium">{session.title}</h5>
                          <Badge className="status-success text-xs">
                            Résolu
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-body-xs text-tertiary">
                          <span>Agent: {session.agent}</span>
                          <span>{session.date.toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-label font-semibold mb-3">Statistiques</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-surface-kongo-lime-light rounded-lg">
                      <div className="text-h4 font-bold text-kongo-lime-dark">4.9</div>
                      <div className="text-body-xs text-kongo-lime-dark">Note moyenne</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-h4 font-bold text-green-700">97%</div>
                      <div className="text-body-xs text-green-600">Résolutions</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}