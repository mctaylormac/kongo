import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, BellRing, X, Check, AlertTriangle, Info, TrendingDown, 
  MapPin, Clock, Calendar, Star, Settings, Filter, Archive,
  ChevronDown, Volume2, VolumeX, Smartphone
} from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface PushNotification {
  id: string;
  type: 'price_alert' | 'trip_update' | 'promotion' | 'system' | 'booking' | 'weather';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  actions?: {
    primary?: { label: string; action: string };
    secondary?: { label: string; action: string };
  };
  data?: any;
  expiresAt?: Date;
  persistent?: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  priceAlerts: boolean;
  tripUpdates: boolean;
  promotions: boolean;
  system: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface PushNotificationCenterProps {
  notifications: PushNotification[];
  settings: NotificationSettings;
  onNotificationAction: (notificationId: string, action: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  onClose: () => void;
  className?: string;
}

export function PushNotificationCenter({
  notifications = [],
  settings,
  onNotificationAction,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onUpdateSettings,
  onClose,
  className = ""
}: PushNotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(settings.sound);
  const audioRef = useRef<HTMLAudioElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  // Simulate notification sound
  useEffect(() => {
    if (soundEnabled && audioRef.current) {
      // Play notification sound for new notifications
      // audioRef.current.play().catch(() => {}); // Silent fail if audio blocked
    }
  }, [notifications.length, soundEnabled]);

  const getNotificationIcon = (type: PushNotification['type'], priority: PushNotification['priority']) => {
    const baseClass = "w-5 h-5";
    const colorClass = priority === 'critical' 
      ? 'text-error' 
      : priority === 'high'
      ? 'text-warning'
      : priority === 'medium'
      ? 'text-kongo-lime-dark'
      : 'text-info';

    switch (type) {
      case 'price_alert':
        return <TrendingDown className={`${baseClass} ${colorClass}`} />;
      case 'trip_update':
        return <MapPin className={`${baseClass} ${colorClass}`} />;
      case 'booking':
        return <Calendar className={`${baseClass} ${colorClass}`} />;
      case 'promotion':
        return <Star className={`${baseClass} ${colorClass}`} />;
      case 'weather':
        return <Info className={`${baseClass} ${colorClass}`} />;
      case 'system':
        return priority === 'critical' ? 
          <AlertTriangle className={`${baseClass} ${colorClass}`} /> :
          <Info className={`${baseClass} ${colorClass}`} />;
      default:
        return <Bell className={`${baseClass} ${colorClass}`} />;
    }
  };

  const getPriorityColor = (priority: PushNotification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'status-error';
      case 'high':
        return 'status-warning';
      case 'medium':
        return 'status-info';
      default:
        return 'status-success';
    }
  };

  const getTypeLabel = (type: PushNotification['type']) => {
    switch (type) {
      case 'price_alert':
        return 'Prix';
      case 'trip_update':
        return 'Trajet';
      case 'booking':
        return 'Réservation';
      case 'promotion':
        return 'Offre';
      case 'weather':
        return 'Météo';
      case 'system':
        return 'Système';
      default:
        return 'Info';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread' && notification.read) return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    return true;
  }).sort((a, b) => {
    // Sort by priority first, then by timestamp
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <>
      {/* Hidden audio element for notification sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed top-16 right-4 w-96 max-w-[90vw] max-h-[80vh] bg-surface-elevated border border-border-primary rounded-xl shadow-2xl z-50 ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-5 h-5 text-kongo-black" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center status-kongo text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <h2 className="text-h5 text-primary font-semibold">
                  Notifications
                </h2>
                <p className="text-body-small text-secondary">
                  {unreadCount > 0 ? `${unreadCount} non lues` : 'Tout lu'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="btn-ghost text-kongo-lime-dark"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Tout lire
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="btn-ghost"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
              <TabsTrigger value="all" className="text-sm">
                Toutes ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-sm">
                Non lues ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-sm">
                Paramètres
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1 flex flex-col m-0">
              {/* Filters */}
              <div className="p-4 pb-2 border-b border-border-secondary">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-tertiary" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-body-small bg-transparent border-none outline-none text-secondary"
                  >
                    <option value="all">Tous les types</option>
                    <option value="price_alert">Alertes prix</option>
                    <option value="trip_update">Mises à jour trajet</option>
                    <option value="booking">Réservations</option>
                    <option value="promotion">Promotions</option>
                    <option value="system">Système</option>
                  </select>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        className={`
                          relative group border rounded-lg transition-all duration-200 cursor-pointer
                          ${notification.read 
                            ? 'bg-surface-secondary border-border-secondary' 
                            : 'bg-surface-elevated border-border-primary shadow-sm'
                          }
                          ${notification.priority === 'critical' ? 'border-l-4 border-l-error' : ''}
                          ${notification.priority === 'high' ? 'border-l-4 border-l-warning' : ''}
                          hover:shadow-md hover:border-kongo-lime
                        `}
                        onClick={() => !notification.read && onMarkAsRead(notification.id)}
                      >
                        {/* Critical notification glow */}
                        {notification.priority === 'critical' && !notification.read && (
                          <motion.div
                            className="absolute inset-0 rounded-lg bg-error/10 pointer-events-none"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}

                        <div className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-0.5">
                                {getNotificationIcon(notification.type, notification.priority)}
                              </div>
                              
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className={`text-label font-medium ${notification.read ? 'text-secondary' : 'text-primary'}`}>
                                    {notification.title}
                                  </h4>
                                  
                                  <Badge variant="outline" className="text-xs">
                                    {getTypeLabel(notification.type)}
                                  </Badge>
                                  
                                  {notification.priority !== 'low' && (
                                    <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                      {notification.priority === 'critical' ? 'Urgent' :
                                       notification.priority === 'high' ? 'Important' : 'Normal'}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className={`text-body-small ${notification.read ? 'text-tertiary' : 'text-secondary'}`}>
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-body-xs text-quaternary">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatRelativeTime(notification.timestamp)}</span>
                                  </div>
                                  
                                  {notification.expiresAt && (
                                    <div className="flex items-center space-x-1">
                                      <AlertTriangle className="w-3 h-3 text-warning" />
                                      <span>Expire {formatRelativeTime(notification.expiresAt)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notification.id);
                                  }}
                                  className="btn-ghost p-1"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(notification.id);
                                }}
                                className="btn-ghost p-1 text-tertiary hover:text-error"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          {notification.actionable && notification.actions && (
                            <div className="flex items-center space-x-2 pt-2 border-t border-border-secondary">
                              {notification.actions.primary && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNotificationAction(notification.id, notification.actions!.primary!.action);
                                  }}
                                  className="btn-primary flex-1"
                                >
                                  {notification.actions.primary.label}
                                </Button>
                              )}
                              
                              {notification.actions.secondary && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNotificationAction(notification.id, notification.actions!.secondary!.action);
                                  }}
                                  className="btn-outline flex-1"
                                >
                                  {notification.actions.secondary.label}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-surface-kongo-lime-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-kongo-lime-dark" />
                      </div>
                      <h3 className="text-h5 text-primary font-semibold mb-2">
                        Aucune notification
                      </h3>
                      <p className="text-body-small text-secondary">
                        {activeTab === 'unread' 
                          ? 'Toutes vos notifications sont lues' 
                          : 'Vous n\'avez aucune notification pour le moment'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread" className="flex-1 flex flex-col m-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.filter(n => !n.read).map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        className="relative group bg-surface-elevated border border-border-primary rounded-lg shadow-sm hover:shadow-md hover:border-kongo-lime transition-all duration-200 cursor-pointer"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <div className="p-4 space-y-3">
                          {/* Same content as above, but only unread notifications */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-0.5">
                                {getNotificationIcon(notification.type, notification.priority)}
                              </div>
                              
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-label font-medium text-primary">
                                    {notification.title}
                                  </h4>
                                  
                                  <Badge variant="outline" className="text-xs">
                                    {getTypeLabel(notification.type)}
                                  </Badge>
                                  
                                  {notification.priority !== 'low' && (
                                    <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                      {notification.priority === 'critical' ? 'Urgent' :
                                       notification.priority === 'high' ? 'Important' : 'Normal'}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-body-small text-secondary">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center space-x-1 text-body-xs text-quaternary">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatRelativeTime(notification.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {notifications.filter(n => !n.read).length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-surface-kongo-lime-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-kongo-lime-dark" />
                      </div>
                      <h3 className="text-h5 text-primary font-semibold mb-2">
                        Tout est lu !
                      </h3>
                      <p className="text-body-small text-secondary">
                        Vous êtes à jour avec toutes vos notifications.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 flex flex-col m-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  <h3 className="text-h5 text-primary font-semibold">
                    Paramètres de notifications
                  </h3>
                  
                  {/* General settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-label text-primary">
                          Notifications activées
                        </div>
                        <div className="text-body-small text-secondary">
                          Recevoir des notifications push
                        </div>
                      </div>
                      <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) => onUpdateSettings({ enabled: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="text-label text-primary">Sons</div>
                          {soundEnabled ? 
                            <Volume2 className="w-4 h-4 text-kongo-lime-dark" /> : 
                            <VolumeX className="w-4 h-4 text-tertiary" />
                          }
                        </div>
                        <div className="text-body-small text-secondary">
                          Sons pour les nouvelles notifications
                        </div>
                      </div>
                      <Switch
                        checked={soundEnabled}
                        onCheckedChange={(checked) => {
                          setSoundEnabled(checked);
                          onUpdateSettings({ sound: checked });
                        }}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Notification types */}
                  <div className="space-y-4">
                    <h4 className="text-h6 text-primary font-medium">
                      Types de notifications
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <TrendingDown className="w-4 h-4 text-success" />
                            <div className="text-label text-primary">Alertes de prix</div>
                          </div>
                          <div className="text-body-small text-secondary">
                            Baisse de prix sur vos trajets favoris
                          </div>
                        </div>
                        <Switch
                          checked={settings.priceAlerts}
                          onCheckedChange={(checked) => onUpdateSettings({ priceAlerts: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-info" />
                            <div className="text-label text-primary">Mises à jour de trajet</div>
                          </div>
                          <div className="text-body-small text-secondary">
                            Changements d'horaires, retards, annulations
                          </div>
                        </div>
                        <Switch
                          checked={settings.tripUpdates}
                          onCheckedChange={(checked) => onUpdateSettings({ tripUpdates: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-warning" />
                            <div className="text-label text-primary">Promotions</div>
                          </div>
                          <div className="text-body-small text-secondary">
                            Offres spéciales et réductions
                          </div>
                        </div>
                        <Switch
                          checked={settings.promotions}
                          onCheckedChange={(checked) => onUpdateSettings({ promotions: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Settings className="w-4 h-4 text-tertiary" />
                            <div className="text-label text-primary">Notifications système</div>
                          </div>
                          <div className="text-body-small text-secondary">
                            Maintenance, mises à jour de sécurité
                          </div>
                        </div>
                        <Switch
                          checked={settings.system}
                          onCheckedChange={(checked) => onUpdateSettings({ system: checked })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Quiet hours */}
                  <div className="space-y-4">
                    <h4 className="text-h6 text-primary font-medium">
                      Heures de silence
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-label text-primary">
                          Mode silencieux
                        </div>
                        <div className="text-body-small text-secondary">
                          Pas de notifications pendant ces heures
                        </div>
                      </div>
                      <Switch
                        checked={settings.quietHours.enabled}
                        onCheckedChange={(checked) => 
                          onUpdateSettings({ 
                            quietHours: { ...settings.quietHours, enabled: checked } 
                          })
                        }
                      />
                    </div>
                    
                    {settings.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4 bg-surface-secondary rounded-lg p-4">
                        <div className="space-y-2">
                          <label className="text-label-small text-tertiary">DÉBUT</label>
                          <input
                            type="time"
                            value={settings.quietHours.start}
                            onChange={(e) => 
                              onUpdateSettings({ 
                                quietHours: { ...settings.quietHours, start: e.target.value } 
                              })
                            }
                            className="w-full p-2 bg-surface-primary border border-border-primary rounded text-body text-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-label-small text-tertiary">FIN</label>
                          <input
                            type="time"
                            value={settings.quietHours.end}
                            onChange={(e) => 
                              onUpdateSettings({ 
                                quietHours: { ...settings.quietHours, end: e.target.value } 
                              })
                            }
                            className="w-full p-2 bg-surface-primary border border-border-primary rounded text-body text-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Device notifications */}
                  <div className="space-y-3">
                    <h4 className="text-h6 text-primary font-medium">
                      Notifications sur cet appareil
                    </h4>
                    
                    <div className="bg-surface-kongo-lime-light rounded-lg p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <Smartphone className="w-5 h-5 text-kongo-lime-dark mt-0.5" />
                        <div className="space-y-2">
                          <div className="text-label text-kongo-black">
                            Notifications push activées
                          </div>
                          <div className="text-body-small text-kongo-lime-dark">
                            Ce navigateur peut recevoir des notifications même quand KonGO est fermé.
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if ('Notification' in window) {
                                Notification.requestPermission();
                              }
                            }}
                            className="btn-outline-lime"
                          >
                            Autoriser les notifications du navigateur
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </>
  );
}
