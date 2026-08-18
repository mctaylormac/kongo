import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
/*
  Exemple d'utilisation correcte de Dialog avec DialogDescription :
  
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
  
  <Dialog>
    <DialogTrigger asChild>
      <Button>Ouvrir</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Titre du dialogue</DialogTitle>
        <DialogDescription>
          Description accessible du contenu du dialogue pour les lecteurs d'écran
        </DialogDescription>
      </DialogHeader>
      // Contenu du dialogue
    </DialogContent>
  </Dialog>
*/
import {
  Bell,
  X,
  Check,
  Trash2,
  Clock,
  Star,
  MapPin,
  CreditCard,
  Users,
  AlertCircle,
  Info,
  CheckCircle,
  Gift
} from "lucide-react";

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: () => void;
  actionLabel?: string;
  category?: 'booking' | 'promotion' | 'system' | 'social';
}

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const getNotificationIcon = (type: string, category?: string) => {
  if (category === 'booking') return MapPin;
  if (category === 'promotion') return Gift;
  if (category === 'social') return Users;
  
  switch (type) {
    case 'success': return CheckCircle;
    case 'error': return AlertCircle;
    case 'warning': return AlertCircle;
    case 'info': return Info;
    default: return Bell;
  }
};

const getNotificationStyle = (type: string) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-color-success-light',
        border: 'border-success',
        icon: 'text-success'
      };
    case 'error':
      return {
        bg: 'bg-color-error-light',
        border: 'border-error',
        icon: 'text-error'
      };
    case 'warning':
      return {
        bg: 'bg-color-warning-light',
        border: 'border-warning',
        icon: 'text-warning'
      };
    case 'info':
      return {
        bg: 'bg-color-info-light',
        border: 'border-info',
        icon: 'text-info'
      };
    default:
      return {
        bg: 'bg-surface-secondary',
        border: 'border-primary',
        icon: 'text-secondary'
      };
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function NotificationCenter({
  notifications,
  onClose,
  onMarkAsRead,
  onClearAll,
  onNotificationClick
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'promotion'>('all');
  
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const filters = [
    { key: 'all', label: 'Toutes', count: notifications.length },
    { key: 'unread', label: 'Non lues', count: unreadCount },
    { key: 'booking', label: 'Réservations', count: notifications.filter(n => n.category === 'booking').length },
    { key: 'promotion', label: 'Offres', count: notifications.filter(n => n.category === 'promotion').length }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-surface-overlay z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] bg-surface-elevated rounded-xl shadow-2xl border border-border-primary overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary bg-gradient-to-r from-surface-primary to-surface-secondary">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-kongo-lime rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-on-lime" />
            </div>
            <div>
              <h2 className="text-h4 text-kongo-black font-bold">Notifications</h2>
              <p className="text-body-small text-secondary">
                {unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-tertiary hover:text-error"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Effacer tout
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 p-4 border-b border-border-primary bg-surface-secondary">
          {filters.map((filterOption) => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(filterOption.key as any)}
              className={`transition-all ${
                filter === filterOption.key
                  ? "bg-kongo-black text-on-black"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {filterOption.label}
              {filterOption.count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filterOption.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-2">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Bell className="w-16 h-16 text-quaternary mx-auto mb-4" />
                  <h3 className="text-h5 text-secondary mb-2">Aucune notification</h3>
                  <p className="text-body-small text-tertiary max-w-sm mx-auto">
                    {filter === 'unread' 
                      ? 'Toutes vos notifications sont à jour !'
                      : 'Nous vous tiendrons informé des mises à jour importantes.'
                    }
                  </p>
                </motion.div>
              ) : (
                filteredNotifications.map((notification, index) => {
                  const IconComponent = getNotificationIcon(notification.type, notification.category);
                  const styles = getNotificationStyle(notification.type);
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="mb-2"
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 border hover:border-kongo-lime hover:shadow-md ${
                          notification.read ? 'opacity-60' : ''
                        } ${styles.border}`}
                        onClick={() => {
                          if (!notification.read) {
                            onMarkAsRead(notification.id);
                          }
                          if (onNotificationClick) {
                            onNotificationClick(notification);
                          }
                          if (notification.action) {
                            notification.action();
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.bg}`}>
                              <IconComponent className={`w-5 h-5 ${styles.icon}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-label text-primary font-semibold mb-1">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-kongo-lime rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                              
                              <p className="text-body-small text-secondary mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-caption text-tertiary">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTimeAgo(notification.timestamp)}</span>
                                  {notification.category && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize">{notification.category}</span>
                                    </>
                                  )}
                                </div>
                                
                                {notification.actionLabel && (
                                  <Button variant="ghost" size="sm" className="text-kongo-lime hover:text-kongo-lime-dark">
                                    {notification.actionLabel}
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {/* Mark as read button */}
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(notification.id);
                                }}
                                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer with quick actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-border-primary bg-surface-secondary">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      notifications.forEach(n => {
                        if (!n.read) onMarkAsRead(n.id);
                      });
                    }}
                    className="border-kongo-lime text-kongo-lime-dark hover:bg-kongo-lime hover:text-on-lime"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
              
              <Button
                onClick={onClose}
                className="btn-primary"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
