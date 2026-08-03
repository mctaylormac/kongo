import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  DollarSign,
  Lock,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Zap,
  Star,
  Info,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Sparkles,
  TrendingUp,
  Heart
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { InteractiveRouteMap } from "./InteractiveRouteMap";
import {
  PaymentLogo,
  PaymentMethodCard,
  SecurityBadge,
  BonusBadge,
  ProcessingStatus
} from "./PaymentLogos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AgeCategory } from "./app/AppConstants";

interface PaymentFlowProps {
  trip: any;
  seats: any[];
  searchParams: any;
  onPaymentComplete: (paymentData: any) => void;
  onBack: () => void;
  preferences: any;
  isOnline: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: "mobile_money" | "card" | "bank_transfer" | "crypto";
  logoType: 'orange_money' | 'airtel_money' | 'mpesa' | 'visa' | 'mastercard' | 'equity_bank' | 'rawbank' | 'tmb' | 'biac';
  description: string;
  fees: number;
  processingTime: string;
  supported: boolean;
  popular?: boolean;
  bonus?: string;
}

export function PaymentFlow({
  trip,
  seats,
  searchParams,
  onPaymentComplete,
  onBack,
  preferences,
  isOnline
}: PaymentFlowProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentData, setPaymentData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currency, setCurrency] = useState("CDF");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>([]);
  const [seatPassengers, setSeatPassengers] = useState<Record<string, string>>({}); // seat_id -> category_id

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            setCurrentUserProfile(profile);
            setPaymentData((prev: any) => ({
              ...prev,
              firstName: profile.full_name?.split(' ')[0] || '',
              lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
              email: profile.email || user.email || '',
              phone: profile.phone_number || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile in PaymentFlow:', error);
      }
    };
    fetchProfile();

    const fetchAgeCategories = async () => {
      // Prioritize categories where trip_id = current trip.id, or trip_id is null (global)
      // Note: trip.id is required here
      if (!trip?.id) return;

      const { data } = await supabase
        .from('age_categories')
        .select('*')
        .or(`trip_id.is.null,trip_id.eq.${trip.id}`)
        .order('discount_percentage', { ascending: false });

      if (data) {
        // If there are specific trip categories, we might want to filter out global ones with the same name
        // For simplicity, we just keep all matching rows
        setAgeCategories(data);
        // Default all seats to the "Adulte" category if it exists
        const defaultCat = data.find(c => c.name.toLowerCase().includes('adulte')) || data.find(c => c.discount_percentage === 0) || data[0];
        if (defaultCat) {
          const initialPassengers: Record<string, string> = {};
          seats.forEach(seat => {
            initialPassengers[seat.id] = defaultCat.id!;
          });
          setSeatPassengers(initialPassengers);
        }
      }
    };
    fetchAgeCategories();
  }, [seats, trip?.id]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "orange_money",
      name: "Orange Money",
      type: "mobile_money",
      logoType: "orange_money",
      description: "Paiement rapide et sécurisé avec Orange Money",
      fees: 0.015, // 1.5%
      processingTime: "Instantané",
      supported: true,
      popular: true,
      bonus: "0% de frais pour les nouveaux utilisateurs"
    },
    {
      id: "airtel_money",
      name: "Airtel Money",
      type: "mobile_money",
      logoType: "airtel_money",
      description: "Payez facilement avec votre compte Airtel Money",
      fees: 0.015, // 1.5%
      processingTime: "Instantané",
      supported: true,
      popular: true,
      bonus: "Cashback 1% sur votre première ràƒÂ©servation"
    },
    {
      id: "mpesa",
      name: "M-Pesa Vodacom",
      type: "mobile_money",
      logoType: "mpesa",
      description: "Service mobile money de Vodacom Congo",
      fees: 0.02, // 2%
      processingTime: "Instantané",
      supported: true,
      bonus: "Points de fidélité doublàƒÂ©s"
    },
    {
      id: "visa_card",
      name: "Carte Visa",
      type: "card",
      logoType: "visa",
      description: "Cartes de cràƒÂ©dit/dàƒÂ©bit Visa acceptées partout",
      fees: 0.035, // 3.5%
      processingTime: "2-5 minutes",
      supported: isOnline
    },
    {
      id: "mastercard",
      name: "Mastercard",
      type: "card",
      logoType: "mastercard",
      description: "Cartes de cràƒÂ©dit/dàƒÂ©bit Mastercard",
      fees: 0.035, // 3.5%
      processingTime: "2-5 minutes",
      supported: isOnline
    },
    {
      id: "equity_bank",
      name: "Equity Bank",
      type: "bank_transfer",
      logoType: "equity_bank",
      description: "Virement depuis Equity Bank RDC",
      fees: 0.01, // 1%
      processingTime: "1-3 jours ouvrables",
      supported: true
    },
    {
      id: "rawbank",
      name: "Rawbank",
      type: "bank_transfer",
      logoType: "rawbank",
      description: "Virement depuis Rawbank",
      fees: 0.01, // 1%
      processingTime: "1-3 jours ouvrables",
      supported: true
    },
    {
      id: "tmb",
      name: "TMB",
      type: "bank_transfer",
      logoType: "tmb",
      description: "Virement depuis Trust Merchant Bank",
      fees: 0.012, // 1.2%
      processingTime: "1-3 jours ouvrables",
      supported: true
    }
  ];

  const getSubtotal = () => {
    return seats.reduce((sum, seat) => {
      const catId = seatPassengers[seat.id];
      const category = ageCategories.find(c => c.id === catId);
      const discount = category ? category.discount_percentage : 0;
      const seatPrice = Number(seat.price || trip.price || 0);
      return sum + (seatPrice * (1 - discount / 100));
    }, 0);
  };

  const getSelectedMethodFees = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    return method ? getSubtotal() * method.fees : 0;
  };

  const getPromoDiscount = () => {
    if (promoApplied) {
      return getSubtotal() * 0.1; // 10% discount
    }
    return 0;
  };

  const getTotal = () => {
    return getSubtotal() + getSelectedMethodFees() - getPromoDiscount();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(preferences.language === 'FR' ? 'fr-CD' : 'en-CD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const convertCurrency = (amount: number) => {
    if (currency === "USD") {
      return amount / 2000; // Approximate CDF to USD conversion
    }
    return amount;
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "kongo10" || promoCode.toLowerCase() === "welcome") {
      setPromoApplied(true);
      toast.success("à°Å¸Å½â€° Code promo appliqué !", {
        description: "10% de réduction sur votre ràƒÂ©servation"
      });
    } else {
      toast.error("Code promo invalide", {
        description: "VàƒÂ©rifiez votre code et réessayez"
      });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Sélectionnez une màƒÂ©thode de paiement");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Veuillez accepter les conditions générales");
      return;
    }

    // Use profile data or fallbacks
    const autoFilledData = {
      firstName: paymentData.firstName || currentUserProfile?.full_name?.split(' ')[0] || "Voyageur",
      lastName: paymentData.lastName || currentUserProfile?.full_name?.split(' ').slice(1).join(' ') || "",
      email: paymentData.email || currentUserProfile?.email || "",
      phone: paymentData.phone || currentUserProfile?.phone_number || "",
      ...paymentData
    };
    setPaymentData(autoFilledData);

    const { cardNumber, cvv, expiryDate, cardName, ...safePaymentData } = autoFilledData;

    // Validate payment data based on method (simplified for demo)
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return;

    // Auto-fill missing payment data for demo
    if (method.type === "mobile_money" && !paymentData.phoneNumber) {
      setPaymentData(prev => ({ ...prev, phoneNumber: "+243 123 456 789" }));
    } else if (method.type === "card") {
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
        setPaymentData(prev => ({
          ...prev,
          cardNumber: prev.cardNumber || "1234 5678 9012 3456",
          expiryDate: prev.expiryDate || "12/25",
          cvv: prev.cvv || "123",
          cardName: prev.cardName || "JEAN DUPONT"
        }));
      }
    }

    setIsProcessing(true);

    try {
      // Show different processing messages based on method
      if (method.type === "mobile_money") {
        toast.loading("Envoi de la demande de paiement...", { id: 'payment' });
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.loading("En attente de votre confirmation sur votre téléphone", { id: 'payment' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        toast.loading("Traitement du paiement...", { id: 'payment' });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // [Agent Dev] Guard: trip_id is NOT NULL in DB â€” block payment if missing
      if (!trip?.id) {
        toast.error("Impossible de finaliser la réservation", {
          description: "Le voyage sélectionné est invalide. Veuillez revenir à la recherche et sélectionner un trajet."
        });
        setIsProcessing(false);
        return;
      }

      // Enregistrer la réservation dans Supabase pour le backoffice
      let bookingCode = `KGO${Date.now().toString().slice(-6)}`;
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // [Agent Dev] Fix: payment_status CHECK constraint only allows: 'pending','paid','failed','refunded'
        // 'completed' was causing a 400 violation â€” use 'paid' for successful payments
        const bookingPayload: any = {
          booking_code: bookingCode,
          trip_id: trip.id,              // Required NOT NULL â€” guaranteed by guard above
          total_price: getTotal(),
          payment_status: 'paid',        // FIX: was 'completed' â†’ violates CHECK constraint
          status: 'confirmed',
          currency,
          passenger_count: seats.length,
          seats: seats,
          contact_email: paymentData.email || '',
          contact_phone: paymentData.phone || '',
        };

        // Lier à l'utilisateur courant si disponible
        if (user) {
          bookingPayload.user_id = user.id;
        }

        const { error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingPayload);

        if (bookingError) {
          console.error('Erreur lors de la cràƒÂ©ation de la ràƒÂ©servation:', bookingError);
          console.error('Détails:', JSON.stringify(bookingError, null, 2));
          toast.error("La ràƒÂ©servation n'a pas pu àƒÂªtre enregistràƒÂ©e dans l'admin", {
            description: bookingError.message
          });
        } else {
          console.log('[KonGO] RàƒÂ©servation cràƒÂ©àƒÂ©e avec succàƒÂ¨s:', bookingCode);
        }
      } catch (bookingException: any) {
        console.error('Exception lors de la cràƒÂ©ation de la ràƒÂ©servation:', bookingException);
      }

      const bookingData = {
        method: selectedMethod,
        amount: getTotal(),
        currency: currency,
        fees: getSelectedMethodFees(),
        discount: getPromoDiscount(),
        transactionId: `KGO${Date.now()}`,
        status: "completed",
        processedAt: new Date().toISOString(),
        promoCode: promoApplied ? promoCode : null,
        booking_code: bookingCode,
        ...safePaymentData,
        trip: trip || {
          from: searchParams?.from || "Kinshasa",
          to: searchParams?.to || "Lubumbashi",
          departure: "08:00",
          duration: "16h",
          date: searchParams?.date || new Date().toISOString().split('T')[0]
        },
        seats: seats || [{ row: "12", column: "A", type: "standard", price: getTotal() }]
      };

      toast.success("à°Å¸Å½â€° Paiement réussi !", {
        id: 'payment',
        description: "Votre ràƒÂ©servation a àƒÂ©tàƒÂ© confirmàƒÂ©e. Billet envoyàƒÂ© par email.",
        action: {
          label: "Voir le billet",
          onClick: () => { }
        }
      });

      // Add bonus animation for successful payment
      const celebrationEvent = new CustomEvent('payment-success', {
        detail: { method: method.name, amount: formatPrice(convertCurrency(getTotal())) }
      });
      window.dispatchEvent(celebrationEvent);

      onPaymentComplete(bookingData);
    } catch (error) {
      toast.error("Erreur de paiement", {
        id: 'payment',
        description: "Veuillez ràƒÂ©essayer ou changer de màƒÂ©thode"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return null;

    switch (method.type) {
      case "mobile_money":
        return (
          <motion.div
            key="mobile-money-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-surface-elevated border border-border-primary p-6 rounded-xl">
              <div className="flex items-center space-x-4 mb-4">
                <PaymentLogo type={method.logoType} size="lg" />
                <div className="flex-1">
                  <div className="text-h5 font-semibold text-kongo-black mb-1">{method.name}</div>
                  <div className="text-body-small text-secondary mb-2">{method.description}</div>
                  {method.bonus && (
                    <BonusBadge text={method.bonus} />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber" className="text-label text-primary font-semibold mb-2 block">
                  Numéro de téléphone *
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+243 XXX XXX XXX"
                    value={paymentData.phoneNumber || ""}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="pl-12 h-14 text-body border-2 border-border-secondary focus:border-kongo-lime focus:ring-2 focus:ring-kongo-lime/20"
                  />
                </div>
                <div className="text-body-xs text-tertiary mt-2 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Code de confirmation envoyàƒÂ© automatiquement</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-surface-secondary border border-border-primary p-6 rounded-xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-kongo-black rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-kongo-lime" />
                  </div>
                  <div className="flex-1">
                    <div className="text-body font-semibold text-kongo-black mb-3">Instructions de paiement :</div>
                    <ol className="space-y-3">
                      {[
                        { step: 1, text: `Composez *144# sur votre téléphone ${method.name}` },
                        { step: 2, text: 'Sélectionnez "Payer marchand"' },
                        { step: 3, text: 'Entrez le code marchand KonGO: 567890' },
                        { step: 4, text: `Confirmez le montant : ${formatPrice(convertCurrency(getTotal()))}` }
                      ].map((instruction) => (
                        <li key={instruction.step} className="flex items-center space-x-3">
                          <span className="w-7 h-7 bg-kongo-black text-kongo-lime rounded-full flex items-center justify-center text-sm font-bold">
                            {instruction.step}
                          </span>
                          <span className="text-body-small text-primary font-medium">
                            {instruction.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      case "card":
        return (
          <motion.div
            key="card-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-kongo-black text-white p-8 rounded-xl border border-kongo-black-light">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <CreditCard className="w-8 h-8 text-kongo-lime" />
                  <div>
                    <div className="text-h5 font-semibold text-white">{method.name}</div>
                    <div className="text-body-small text-white/80">{method.description}</div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <PaymentLogo type="visa" size="sm" />
                  <PaymentLogo type="mastercard" size="sm" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="cardNumber" className="text-label text-white font-semibold mb-2 block">
                    Numéro de carte *
                  </Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || '';
                      if (value.length <= 19) {
                        setPaymentData(prev => ({ ...prev, cardNumber: value }));
                      }
                    }}
                    className="h-14 font-mono tracking-wider bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-kongo-lime"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="expiryDate" className="text-label text-white font-semibold mb-2 block">
                      Date d'expiration *
                    </Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      placeholder="MM/YY"
                      value={paymentData.expiryDate || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2, 4);
                        }
                        setPaymentData(prev => ({ ...prev, expiryDate: value }));
                      }}
                      className="h-14 font-mono bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-kongo-lime"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cvv" className="text-label text-white font-semibold mb-2 block">
                      Code CVV *
                    </Label>
                    <div className="relative">
                      <Input
                        id="cvv"
                        type={showCardDetails ? "text" : "password"}
                        placeholder="123"
                        value={paymentData.cvv || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                          setPaymentData(prev => ({ ...prev, cvv: value }));
                        }}
                        className="h-14 font-mono pr-12 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-kongo-lime"
                        maxLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCardDetails(!showCardDetails)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-kongo-lime"
                      >
                        {showCardDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardName" className="text-label text-white font-semibold mb-2 block">
                    Nom sur la carte *
                  </Label>
                  <Input
                    id="cardName"
                    type="text"
                    placeholder="JEAN DUPONT"
                    value={paymentData.cardName || ""}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, cardName: e.target.value.toUpperCase() }))}
                    className="h-14 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-kongo-lime"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <SecurityBadge type="ssl" />
              <SecurityBadge type="pci" />
              <SecurityBadge type="verified" />
            </div>
          </motion.div>
        );

      case "bank_transfer":
        return (
          <motion.div
            key="bank-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-surface-elevated border border-border-primary p-8 rounded-xl">
              <div className="text-center space-y-6">
                <PaymentLogo type={method.logoType} size="lg" className="mx-auto" />
                <div>
                  <div className="text-h4 text-kongo-black font-semibold mb-4">
                    Informations bancaires KonGO
                  </div>
                  <div className="bg-surface-secondary border border-border-secondary p-6 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-small">
                      <div className="flex justify-between">
                        <span className="text-secondary font-medium">Banque :</span>
                        <span className="text-kongo-black font-semibold">{method.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary font-medium">Compte :</span>
                        <span className="text-kongo-black font-semibold font-mono">001234567890</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary font-medium">Nom :</span>
                        <span className="text-kongo-black font-semibold">KonGO SARL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary font-medium">RàƒÂ©fàƒÂ©rence :</span>
                        <span className="text-kongo-lime-dark font-bold font-mono bg-kongo-lime/20 px-2 py-1 rounded">
                          {`KGO${Date.now().toString().slice(-6)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
              <div className="flex items-start space-x-4">
                <Clock className="w-6 h-6 text-orange-600 mt-0.5" />
                <div className="text-body-small text-orange-800">
                  <div className="font-semibold text-orange-900 mb-2">Temps de traitement :</div>
                  <div className="leading-relaxed">
                    Votre ràƒÂ©servation sera confirmàƒÂ©e apràƒÂ¨s validation du virement ({method.processingTime}).
                    Vous recevrez un email de confirmation une fois le paiement traitàƒÂ©.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="container-professional py-8">
        <div className="max-w-7xl mx-auto">

          {/* Enhanced Header with Better Contrast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-kongo-black text-white border-kongo-black-light shadow-kongo-black">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-kongo-lime rounded-2xl flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-kongo-black" />
                    </div>
                    <div>
                      <h1 className="text-h2 font-bold text-white mb-2">Finaliser votre paiement</h1>
                      <p className="text-body-large text-white/90 mb-2">
                        {trip?.from} ââ€ â€™ {trip?.to} ââ‚¬Â¢ {seats.length} siàƒÂ¨ge{seats.length > 1 ? 's' : ''} ââ‚¬Â¢ {trip?.date}
                      </p>
                      <div className="flex items-center space-x-6 text-body-small text-white/75">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>Paiement 100% sécurisé</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                          <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Currency Toggle with Better Contrast */}
                  <div className="flex items-center space-x-3 bg-white/10 border border-white/20 p-2 rounded-lg">
                    <Button
                      onClick={() => setCurrency("CDF")}
                      className={`px-6 py-3 rounded-md transition-all font-semibold ${currency === "CDF"
                          ? 'bg-kongo-lime text-kongo-black border border-kongo-lime'
                          : 'bg-transparent text-white border border-white/30 hover:bg-white/10'
                        }`}
                    >
                      CDF
                    </Button>
                    <Button
                      onClick={() => setCurrency("USD")}
                      className={`px-6 py-3 rounded-md transition-all font-semibold ${currency === "USD"
                          ? 'bg-kongo-lime text-kongo-black border border-kongo-lime'
                          : 'bg-transparent text-white border border-white/30 hover:bg-white/10'
                        }`}
                    >
                      USD
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* Payment Methods & Form */}
            <div className="xl:col-span-2 space-y-8">

              {/* Enhanced Payment Methods */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="card-elevated">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-h4 text-kongo-black flex items-center space-x-3">
                        <Sparkles className="w-6 h-6 text-kongo-lime" />
                        <span>MàƒÂ©thodes de paiement</span>
                      </CardTitle>
                      <div className="bg-kongo-lime/15 text-kongo-black border border-kongo-lime/30 px-3 py-1 rounded-full text-sm font-semibold">
                        {paymentMethods.filter(m => m.supported).length} options
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <AnimatePresence>
                      {paymentMethods
                        .sort((a, b) => {
                          if (a.popular && !b.popular) return -1;
                          if (!a.popular && b.popular) return 1;
                          if (a.supported && !b.supported) return -1;
                          if (!a.supported && b.supported) return 1;
                          return 0;
                        })
                        .map((method, index) => (
                          <motion.div
                            key={method.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <PaymentMethodCard
                              method={method}
                              isSelected={selectedMethod === method.id}
                              onSelect={() => setSelectedMethod(method.id)}
                              disabled={!method.supported}
                            />
                          </motion.div>
                        ))}
                    </AnimatePresence>

                    {!isOnline && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-orange-50 border border-orange-200 p-4 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <WifiOff className="w-5 h-5 text-orange-600" />
                          <div className="text-body-small text-orange-800">
                            <div className="font-semibold text-orange-900">Mode hors ligne actif</div>
                            <div>Les paiements par carte ne sont pas disponibles</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Payment Form */}
              <AnimatePresence mode="wait">
                {selectedMethod && (
                  <motion.div
                    key="payment-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h5 text-kongo-black flex items-center space-x-3">
                          <Lock className="w-5 h-5 text-success" />
                          <span>Détails de paiement</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderPaymentForm()}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-h5 text-kongo-black flex items-center space-x-3">
                      <User className="w-5 h-5 text-kongo-lime" />
                      <span>Informations de contact</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName" className="text-label text-primary font-semibold mb-2 block">
                          Prénom *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Jean"
                            value={paymentData.firstName || ""}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="pl-12 h-14 border-2 border-border-secondary focus:border-kongo-lime focus:ring-2 focus:ring-kongo-lime/20"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="lastName" className="text-label text-primary font-semibold mb-2 block">
                          Nom *
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Dupont"
                          value={paymentData.lastName || ""}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="h-14 border-2 border-border-secondary focus:border-kongo-lime focus:ring-2 focus:ring-kongo-lime/20"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-label text-primary font-semibold mb-2 block">
                        Adresse e-mail *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="jean@exemple.com"
                          value={paymentData.email || ""}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-12 h-14 border-2 border-border-secondary focus:border-kongo-lime focus:ring-2 focus:ring-kongo-lime/20"
                        />
                      </div>
                      <div className="text-body-xs text-tertiary mt-2 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span>Votre billet àƒÂ©lectronique sera envoyàƒÂ© àƒÂ  cette adresse</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-label text-primary font-semibold mb-2 block">
                        TàƒÂ©làƒÂ©phone *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+243 XXX XXX XXX"
                          value={paymentData.phone || ""}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, phone: e.target.value }))}
                          className="pl-12 h-14 border-2 border-border-secondary focus:border-kongo-lime focus:ring-2 focus:ring-kongo-lime/20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Enhanced Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Trip Summary */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-h5 text-kongo-black flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-kongo-lime" />
                    <span>Résumé du voyage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-surface-secondary border border-border-secondary rounded-lg">
                    <div className="w-12 h-12 bg-kongo-lime rounded-xl flex items-center justify-center">
                      <span className="text-kongo-black font-bold text-lg">à°Å¸Å¡Å’</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-body font-semibold text-kongo-black">{trip?.from} ââ€ â€™ {trip?.to}</div>
                      <div className="text-body-small text-secondary">{trip?.date} ââ‚¬Â¢ {trip?.time}</div>
                      <div className="text-body-small text-tertiary">{trip?.company}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-4 pt-2">
                      <div className="text-body-small font-bold text-kongo-black flex items-center gap-2">
                        <User className="w-4 h-4 text-kongo-lime" /> Configuration des passagers
                      </div>
                      <div className="space-y-3">
                        {seats.map((seat) => (
                          <div key={seat.id} className="flex flex-col space-y-2 p-3 bg-white border border-border-secondary rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-body-small font-bold">Siège {seat.number}</span>
                              <span className="text-body-xs font-medium text-tertiary">
                                {formatPrice(convertCurrency(Number(seat.price || trip.price || 0)))}
                              </span>
                            </div>
                            <Select 
                              value={seatPassengers[seat.id]} 
                              onValueChange={(val: string) => setSeatPassengers(prev => ({ ...prev, [seat.id]: val }))}
                            >
                              <SelectTrigger className="h-10 border border-border-secondary rounded-lg text-xs bg-white">
                                <SelectValue placeholder="Catégorie d'âge" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="z-[9999] min-w-[150px]">
                                {ageCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id!} className="text-xs py-2 cursor-pointer">
                                    {cat.name} {cat.discount_percentage > 0 ? `(-${cat.discount_percentage}%)` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-body-small text-secondary">Total Sièges ({seats.length})</span>
                      <span className="text-body font-semibold text-kongo-black">
                        {seats.map(s => s.number).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-small text-secondary">Sous-total</span>
                      <span className="text-body font-semibold text-kongo-black">
                        {formatPrice(convertCurrency(getSubtotal()))}
                      </span>
                    </div>
                    {selectedMethod && (
                      <div className="flex justify-between items-center">
                        <span className="text-body-small text-secondary">Frais de service</span>
                        <span className="text-body font-semibold text-kongo-black">
                          {formatPrice(convertCurrency(getSelectedMethodFees()))}
                        </span>
                      </div>
                    )}
                    {promoApplied && (
                      <div className="flex justify-between items-center text-success">
                        <span className="text-body-small font-medium">Réduction (KONGO10)</span>
                        <span className="text-body font-semibold">
                          -{formatPrice(convertCurrency(getPromoDiscount()))}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-h5 font-bold text-kongo-black">Total</span>
                    <span className="text-h4 font-bold text-kongo-black">
                      {formatPrice(convertCurrency(getTotal()))}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Promo Code */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-h6 text-kongo-black flex items-center space-x-2">
                    <Star className="w-5 h-5 text-kongo-lime" />
                    <span>Code promo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!promoApplied ? (
                    <div className="flex space-x-3">
                      <Input
                        placeholder="Entrez votre code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 h-12 border-2 border-border-secondary focus:border-kongo-lime"
                      />
                      <Button
                        onClick={applyPromoCode}
                        className="btn-outline-lime px-6"
                        disabled={!promoCode}
                      >
                        Appliquer
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-success/10 border border-success/30 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <div className="flex-1">
                        <div className="text-body-small font-semibold text-success">Code appliqué avec succàƒÂ¨s</div>
                        <div className="text-body-xs text-success/80">{promoCode} - 10% de ràƒÂ©duction</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Terms and Payment Button */}
              <Card className="card-elevated">
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={setAgreedToTerms}
                      className="mt-1 data-[state=checked]:bg-kongo-lime data-[state=checked]:border-kongo-lime"
                    />
                    <label htmlFor="terms" className="text-body-small text-secondary leading-relaxed cursor-pointer">
                      J'accepte les{" "}
                      <span className="text-kongo-black font-semibold underline cursor-pointer hover:text-kongo-lime">
                        conditions gàƒÂ©nàƒÂ©rales
                      </span>
                      {" "}et la{" "}
                      <span className="text-kongo-black font-semibold underline cursor-pointer hover:text-kongo-lime">
                        politique de confidentialitàƒÂ©
                      </span>
                      {" "}de KonGO
                    </label>
                  </div>

                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={!selectedMethod || !agreedToTerms || isProcessing || !paymentData.firstName || !paymentData.lastName || !paymentData.email || !paymentData.phone}
                    className="w-full h-16 btn-primary text-body font-bold text-lg shadow-lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Traitement en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Lock className="w-6 h-6" />
                        <span>Payer {formatPrice(convertCurrency(getTotal()))}</span>
                      </div>
                    )}
                  </Button>

                  <div className="flex items-center justify-center space-x-4">
                    <SecurityBadge type="ssl" />
                    <SecurityBadge type="verified" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

