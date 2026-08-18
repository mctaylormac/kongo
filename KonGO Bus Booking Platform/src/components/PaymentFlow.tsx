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
  baggageData?: any;
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
  baggageData,
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

  const [dbPaymentMethods, setDbPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const { data, error } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error || !data || data.length === 0) return;

        const mapped: PaymentMethod[] = data.map((pm: any) => {
          const code = (pm.code || "").toLowerCase();
          let logoType: any = "orange_money";
          if (code.includes("airtel")) logoType = "airtel_money";
          else if (code.includes("mpesa")) logoType = "mpesa";
          else if (code.includes("visa")) logoType = "visa";
          else if (code.includes("mastercard")) logoType = "mastercard";
          else if (code.includes("equity")) logoType = "equity_bank";
          else if (code.includes("rawbank")) logoType = "rawbank";
          else if (code.includes("tmb")) logoType = "tmb";

          let type: any = "mobile_money";
          if (code.includes("card") || code.includes("visa") || code.includes("mastercard")) type = "card";
          else if (code.includes("bank") || code.includes("equity") || code.includes("rawbank") || code.includes("tmb")) type = "bank_transfer";

          return {
            id: pm.code || pm.id,
            name: pm.name,
            type,
            logoType,
            description: pm.instructions || `Payez via ${pm.name}`,
            fees: (pm.fees_percentage || 0) / 100,
            processingTime: pm.processing_time || "Instantane",
            supported: true
          };
        });

        if (mapped.length > 0) {
          setDbPaymentMethods(mapped);
        }
      } catch (err) {
        console.error("Error fetching db payment methods:", err);
      }
    };

    fetchPaymentMethods();
  }, []);

  const defaultPaymentMethods: PaymentMethod[] = [
    {
      id: "orange_money",
      name: "Orange Money",
      type: "mobile_money",
      logoType: "orange_money",
      description: "Paiement rapide et securise avec Orange Money",
      fees: 0.015, // 1.5%
      processingTime: "Instantane",
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
      processingTime: "Instantane",
      supported: true,
      popular: true,
      bonus: "Cashback 1% sur votre premiere reservation"
    },
    {
      id: "mpesa",
      name: "M-Pesa Vodacom",
      type: "mobile_money",
      logoType: "mpesa",
      description: "Service mobile money de Vodacom Congo",
      fees: 0.02, // 2%
      processingTime: "Instantane",
      supported: true,
      bonus: "Points de fidelite doubles"
    },
    {
      id: "visa_card",
      name: "Carte Visa",
      type: "card",
      logoType: "visa",
      description: "Cartes de credit/debit Visa acceptees partout",
      fees: 0.035, // 3.5%
      processingTime: "2-5 minutes",
      supported: isOnline
    },
    {
      id: "mastercard",
      name: "Mastercard",
      type: "card",
      logoType: "mastercard",
      description: "Cartes de credit/debit Mastercard",
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

  const paymentMethods: PaymentMethod[] = dbPaymentMethods.length ? dbPaymentMethods : defaultPaymentMethods;

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
    const baggageCost = baggageData?.totalCost || 0;
    return getSubtotal() + getSelectedMethodFees() + baggageCost - getPromoDiscount();
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
      toast.success("Code promo applique !", {
        description: "10% de reduction sur votre reservation"
      });
    } else {
      toast.error("Code promo invalide", {
        description: "Verifiez votre code et reessayez"
      });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Selectionnez une methode de paiement");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Veuillez accepter les conditions generales");
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

        toast.loading("En attente de votre confirmation sur votre telephone", { id: 'payment' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (method.type === "card") {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        toast.loading("Traitement du paiement...", { id: 'payment' });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Guard: trip_id is required before finalizing a booking.
      if (!trip?.id) {
        toast.error("Impossible de finaliser la reservation", {
          description: "Le voyage selectionne est invalide. Veuillez revenir a la recherche et selectionner un trajet."
        });
        setIsProcessing(false);
        return;
      }

      // Calculate final pricing and code ONCE to guarantee consistency
      // between the database and the client-side confirmation UI.
      const bookingCode = `KGO${Date.now().toString().slice(-6)}`;
      const finalTotalPrice = getTotal();
      const finalMethodFees = getSelectedMethodFees();
      const finalDiscount = getPromoDiscount();

      // Enregistrer la reservation dans Supabase pour le backoffice
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // payment_status allows 'pending','paid','failed','refunded'.
        // Keep 'paid' for successful payments.
        const bookingPayload: any = {
          booking_code: bookingCode,
          trip_id: trip.id,
          total_price: finalTotalPrice,
          payment_status: 'paid',
          status: 'confirmed',
          currency,
          passenger_count: seats.length,
          seats: seats,
          contact_email: autoFilledData.email || '',
          contact_phone: autoFilledData.phone || '',
          baggage_fee: baggageData?.totalCost || 0,
          baggage_info: baggageData ? JSON.stringify(baggageData) : null,
          payment_method: selectedMethod,
        };

        // Lier a l'utilisateur courant si disponible
        if (user) {
          bookingPayload.user_id = user.id;
        }

        const { data: newBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingPayload)
          .select()
          .single();

        if (bookingError) {
          toast.error("La reservation n'a pas pu etre enregistree dans l'admin", {
            description: bookingError.message
          });
        }

        // [Agent Dev Web] - Action: Synchronisation de la table booking_seats pour compatibilité Borne/Backoffice
        if (newBooking && seats.length > 0) {
          const seatRecords = seats.map((s: any) => ({
            booking_id: newBooking.id,
            seat_number: typeof s === 'string' ? s : (s.id || s.seatNumber),
            price: s.price || (finalTotalPrice / seats.length),
            seat_type: s.type || 'standard'
          }));
          
          await supabase.from('booking_seats').insert(seatRecords);
        }
      } catch (bookingException: any) {
        console.error("Booking recording error:", bookingException);
      }

      const bookingData: any = {
        id: `BK${Date.now()}`,
        trip: trip,
        seats: seats,
        baggage: baggageData || undefined,
        totalPrice: finalTotalPrice,
        currency: currency,
        paymentMethod: selectedMethod,
        paymentStatus: 'completed',
        bookingDate: new Date().toISOString(),
        confirmationCode: bookingCode,
        booking_code: bookingCode,
        transactionId: bookingCode,
        fees: finalMethodFees,
        discount: finalDiscount,
        ...safePaymentData
      };

      toast.success("Paiement reussi !", {
        id: 'payment',
        description: "Votre reservation a ete confirmee. Billet envoye par email.",
        action: {
          label: "Voir le billet",
          onClick: () => { }
        }
      });

      // Add bonus animation for successful payment
      const celebrationEvent = new CustomEvent('payment-success', {
        detail: { method: method.name, amount: formatPrice(convertCurrency(finalTotalPrice)) }
      });
      window.dispatchEvent(celebrationEvent);

      onPaymentComplete(bookingData);
    } catch (error) {
      toast.error("Erreur de paiement", {
        id: 'payment',
        description: "Veuillez reessayer ou changer de methode"
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
                  Numero de telephone *
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
                  <span>Code de confirmation envoye automatiquement</span>
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
                        { step: 1, text: `Composez *144# sur votre telephone ${method.name}` },
                        { step: 2, text: 'Selectionnez "Payer marchand"' },
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
                    Numero de carte *
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
                        <span className="text-secondary font-medium">Reference :</span>
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
                    Votre reservation sera confirmee apres validation du virement ({method.processingTime}).
                    Vous recevrez un email de confirmation une fois le paiement traite.
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
                        {trip?.from} - {trip?.to} | {seats.length} siege{seats.length > 1 ? 's' : ''} | {trip?.date}
                      </p>
                      <div className="flex items-center space-x-6 text-body-small text-white/75">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>Paiement 100% securise</span>
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
                        <span>Methodes de paiement</span>
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
                          <span>Details de paiement</span>
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
                          Prenom *
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
                        <span>Votre billet electronique sera envoye a cette adresse</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-label text-primary font-semibold mb-2 block">
                        Telephone *
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
                    <span>Resume du voyage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-surface-secondary border border-border-secondary rounded-lg">
                    <div className="w-12 h-12 bg-kongo-lime rounded-xl flex items-center justify-center">
                      <span className="text-kongo-black font-bold text-lg">K</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-body font-semibold text-kongo-black">{trip?.from} - {trip?.to}</div>
                      <div className="text-body-small text-secondary">{trip?.date} | {trip?.time}</div>
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
                              <span className="text-body-small font-bold">Siege {seat.number}</span>
                              <span className="text-body-xs font-medium text-tertiary">
                                {formatPrice(convertCurrency(Number(seat.price || trip.price || 0)))}
                              </span>
                            </div>
                            <Select 
                              value={seatPassengers[seat.id]} 
                              onValueChange={(val: string) => setSeatPassengers(prev => ({ ...prev, [seat.id]: val }))}
                            >
                              <SelectTrigger className="h-10 border border-border-secondary rounded-lg text-xs bg-white">
                                <SelectValue placeholder="Categorie d'age" />
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
                      <span className="text-body-small text-secondary">Total Sieges ({seats.length})</span>
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
                        <span className="text-body-small font-medium">Reduction (KONGO10)</span>
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
                        <div className="text-body-small font-semibold text-success">Code applique avec succes</div>
                        <div className="text-body-xs text-success/80">{promoCode} - 10% de reduction</div>
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
                        conditions generales
                      </span>
                      {" "}et la{" "}
                      <span className="text-kongo-black font-semibold underline cursor-pointer hover:text-kongo-lime">
                        politique de confidentialite
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


