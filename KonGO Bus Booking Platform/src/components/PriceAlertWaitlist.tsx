import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Bell, AlertCircle, TrendingDown, Users, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PriceAlertWaitlistProps {
  tripRoute: string;
  currentPrice: string;
  isFullyBooked?: boolean;
}

export function PriceAlertWaitlist({ tripRoute, currentPrice, isFullyBooked = false }: PriceAlertWaitlistProps) {
  const [alertPrice, setAlertPrice] = useState("");
  const [alertMethod, setAlertMethod] = useState("email");
  const [enableInstantNotifications, setEnableInstantNotifications] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const handleSetPriceAlert = () => {
    if (!alertPrice) {
      toast.error("Veuillez entrer un prix cible");
      return;
    }
    
    toast.success("Alerte prix activée ! Nous vous préviendrons quand le prix baisse.");
  };

  const handleJoinWaitlist = () => {
    if (alertMethod === "sms" && !phoneNumber) {
      toast.error("Veuillez entrer votre numéro de téléphone");
      return;
    }
    if (alertMethod === "email" && !email) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }
    
    toast.success("Vous êtes sur la liste d'attente ! Nous vous contacterons dès qu'une place se libère.");
  };

  return (
    <div className="space-y-4">
      {/* Price Alert */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full btn-outline-lime">
            <Bell className="w-4 h-4 mr-2" />
            Alerte prix
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md card-elevated">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-h4 text-kongo-black">
              <TrendingDown className="w-5 h-5 text-info" />
              <span>Alerte baisse de prix</span>
            </DialogTitle>
            <DialogDescription className="text-body-small text-secondary">
              Recevez une notification dès que le prix du trajet baisse selon vos critères.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 bg-surface-kongo-lime-light rounded-lg border border-kongo-lime/20">
              <p className="text-body-small text-kongo-black font-semibold">
                {tripRoute}
              </p>
              <p className="text-caption text-kongo-lime-dark mt-1">
                Prix actuel : {currentPrice}
              </p>
            </div>

            <div>
              <Label htmlFor="target-price" className="text-label text-kongo-black font-semibold">
                Prix cible (CDF)
              </Label>
              <Input
                id="target-price"
                type="number"
                placeholder="Ex: 95000"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                className="mt-2 h-12 border-2 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20"
              />
              <p className="text-caption text-tertiary mt-1">
                Nous vous alerterons si le prix descend à ce montant ou moins
              </p>
            </div>

            <div>
              <Label className="text-label text-kongo-black font-semibold">
                Mode de notification
              </Label>
              <Select value={alertMethod} onValueChange={setAlertMethod}>
                <SelectTrigger className="mt-2 h-12 border-2 border-border-secondary focus:border-kongo-lime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="both">Email + SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(alertMethod === "sms" || alertMethod === "both") && (
              <div>
                <Label htmlFor="phone" className="text-label text-kongo-black font-semibold">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+243 123 456 789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-2 h-12 border-2 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20"
                />
              </div>
            )}

            {(alertMethod === "email" || alertMethod === "both") && (
              <div>
                <Label htmlFor="email" className="text-label text-kongo-black font-semibold">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 border-2 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20"
                />
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Switch
                id="instant-notifications"
                checked={enableInstantNotifications}
                onCheckedChange={setEnableInstantNotifications}
              />
              <Label htmlFor="instant-notifications" className="text-body-small text-secondary">
                Notifications instantanées (recommandé)
              </Label>
            </div>

            <Button 
              onClick={handleSetPriceAlert}
              className="btn-primary w-full h-12"
            >
              <Bell className="w-4 h-4 mr-2" />
              Activer l'alerte
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waitlist for Fully Booked Trips */}
      {isFullyBooked && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-2 border-warning text-warning hover:bg-color-warning-light">
              <Users className="w-4 h-4 mr-2" />
              Rejoindre la liste d'attente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md card-elevated">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-h4 text-kongo-black">
                <Clock className="w-5 h-5 text-warning" />
                <span>Liste d'attente</span>
              </DialogTitle>
              <DialogDescription className="text-body-small text-secondary">
                Soyez alerté dès qu'une place se libère sur ce trajet complet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="p-4 bg-color-warning-light rounded-lg border border-warning/20">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <span className="text-body-small text-warning font-semibold">Voyage complet</span>
                </div>
                <p className="text-body-small text-kongo-black font-medium">
                  {tripRoute}
                </p>
                <p className="text-caption text-secondary mt-1">
                  Nous vous contacterons si une place se libère
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-label text-kongo-black font-semibold">
                    Comment souhaitez-vous être contacté ?
                  </Label>
                  <Select value={alertMethod} onValueChange={setAlertMethod}>
                    <SelectTrigger className="mt-2 h-12 border-2 border-border-secondary focus:border-kongo-lime">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS (recommandé)</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="both">SMS + Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(alertMethod === "sms" || alertMethod === "both") && (
                  <div>
                    <Label htmlFor="waitlist-phone" className="text-label text-kongo-black font-semibold">
                      Numéro de téléphone
                    </Label>
                    <Input
                      id="waitlist-phone"
                      type="tel"
                      placeholder="+243 123 456 789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="mt-2 h-12 border-2 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20"
                    />
                  </div>
                )}

                {(alertMethod === "email" || alertMethod === "both") && (
                  <div>
                    <Label htmlFor="waitlist-email" className="text-label text-kongo-black font-semibold">
                      Adresse email
                    </Label>
                    <Input
                      id="waitlist-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 h-12 border-2 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-surface-secondary rounded-lg border border-border-primary">
                <div className="flex items-center space-x-2 text-body-small text-secondary mb-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Position estimée dans la file : 3ème</span>
                </div>
                <div className="flex items-center space-x-2 text-body-small text-secondary">
                  <Clock className="w-4 h-4 text-info" />
                  <span>Temps d'attente moyen : 2-4 heures</span>
                </div>
              </div>

              <Button 
                onClick={handleJoinWaitlist}
                className="w-full h-12 bg-warning hover:bg-color-warning-dark text-white font-semibold"
              >
                <Users className="w-4 h-4 mr-2" />
                Rejoindre la liste d'attente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Active Alerts Display */}
      <Card className="bg-color-success-light border-2 border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-body-small text-success font-semibold">
                Alerte active pour {tripRoute || "votre trajet"}
              </p>
              <p className="text-caption text-success/80">
                Vous serez notifié si le prix descend sous {alertPrice ? `${alertPrice} CDF` : 'le prix cible'}
              </p>
            </div>
            <Badge className="status-success">
              Actif
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
