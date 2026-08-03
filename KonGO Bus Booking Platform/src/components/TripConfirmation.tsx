import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { KonGOLogo } from "./KonGOLogo";
import {
  CheckCircle2,
  Download,
  Share2,
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  QrCode,
  Smartphone,
  Home,
  Shield,
  Ticket,
  Copy,
  Info,
  Users,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";


interface TripConfirmationProps {
  bookingData: any;
  searchParams?: any;
  selectedTrip?: any;
  selectedSeats?: any[];
  onNewSearch: () => void;
  onViewDashboard: () => void;
  preferences: any;
}

export function TripConfirmation({
  bookingData,
  searchParams,
  selectedTrip,
  selectedSeats,
  onNewSearch,
  onViewDashboard,
  preferences
}: TripConfirmationProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  

  // Enhanced booking reference generation
  const bookingReference = bookingData?.transactionId || `KGO${Date.now().toString().slice(-8)}`;

  // Complete booking data with all necessary info
  const completeBookingData = {
    bookingReference,
    bookingDate: bookingData?.processedAt || new Date().toISOString(),
    trip: selectedTrip || bookingData?.trip || {
      from: searchParams?.from || bookingData?.trip?.from || "Ville de départ",
      to: searchParams?.to || bookingData?.trip?.to || "Ville d'arrivée",
      departure: selectedTrip?.departure || bookingData?.trip?.departure || "08:00",
      duration: selectedTrip?.duration || bookingData?.trip?.duration || "16h",
      date: searchParams?.date || bookingData?.trip?.date || new Date().toISOString().split('T')[0],
      operator: selectedTrip?.agencies?.name || bookingData?.trip?.operator || "KonGO Express"
    },
    seats: selectedSeats && selectedSeats.length > 0 ? selectedSeats : (bookingData?.seats || [
      { row: "0", column: "0", type: "standard", price: bookingData?.amount || bookingData?.totalPrice || 0 }
    ]),
    passenger: {
      firstName: bookingData?.firstName || "Voyageur",
      lastName: bookingData?.lastName || "KonGO",
      email: bookingData?.email || "contact@kongo-transport.cd",
      phone: bookingData?.phone || bookingData?.phoneNumber || "+243 123 456 789"
    },
    payment: {
      method: bookingData?.method || bookingData?.paymentMethod || "paiement",
      amount: bookingData?.amount || bookingData?.totalPrice || 0,
      currency: bookingData?.currency || "CDF",
      fees: bookingData?.fees || 0,
      discount: bookingData?.discount || 0,
      transactionId: bookingData?.transactionId || bookingReference,
      status: bookingData?.status || "completed",
      processedAt: bookingData?.processedAt || new Date().toISOString()
    },
    baggage: bookingData?.baggage || bookingData?.baggageInfo || null
  };

  // Generate QR Code data - Optimized for ticket reference
  const qrCodeData = `TICKET-${bookingReference}`;


  useEffect(() => {
    // Simulate ticket generation and confirmation sending
    const generateTicket = setTimeout(() => {
      setTicketGenerated(true);
      toast.success("🎫 Billet numérique généré", {
        description: "Votre QR code est prêt à l'utilisation"
      });
    }, 1000);

    const sendConfirmation = setTimeout(() => {
      setConfirmationSent(true);
      toast.success("📧 Confirmation envoyée", {
        description: "Vérifiez votre email et SMS"
      });
    }, 2500);

    return () => {
      clearTimeout(generateTicket);
      clearTimeout(sendConfirmation);
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: completeBookingData.payment.currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDownloadTicket = async () => {
    setIsDownloading(true);

    try {
      toast.loading("📄 Génération du billet PDF...", { id: 'pdf-gen' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const doc = new jsPDF();
      let currentY = 0;

      // En-tête noire
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(190, 255, 0);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("BILLET DE VOYAGE KONGO", 105, 22, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text(`Réf: ${bookingReference}`, 105, 34, { align: "center" });

      // Séparateur
      doc.setDrawColor(190, 255, 0);
      doc.setLineWidth(1);
      doc.line(10, 45, 200, 45);

      // Détails du voyage
      currentY = 55;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("VOYAGE", 10, currentY);
      doc.text("PASSAGER", 115, currentY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      currentY += 10;
      doc.text(`De: ${completeBookingData.trip.from}`, 10, currentY);
      doc.text(`${completeBookingData.passenger.firstName} ${completeBookingData.passenger.lastName}`, 115, currentY);
      currentY += 8;
      doc.text(`À: ${completeBookingData.trip.to}`, 10, currentY);
      doc.text(`Tél: ${completeBookingData.passenger.phone}`, 115, currentY);
      currentY += 8;
      doc.text(`Date: ${completeBookingData.trip.date}`, 10, currentY);
      doc.text(`Email: ${completeBookingData.passenger.email}`, 115, currentY);
      currentY += 8;
      doc.text(`Départ: ${completeBookingData.trip.departure}`, 10, currentY);
      currentY += 8;
      doc.text(`Durée: ${completeBookingData.trip.duration}`, 10, currentY);

      // Sièges & Paiement
      currentY += 14;
      doc.setDrawColor(200, 200, 200);
      doc.line(10, currentY, 200, currentY);
      currentY += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SIÈGES", 10, currentY);
      doc.text("PAIEMENT", 115, currentY);

      currentY += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const seatLabels = completeBookingData.seats.map((s: any) => `${s.row}${s.column}`).join(', ') || 'Non assigné';
      doc.text(seatLabels, 10, currentY);
      doc.text(`Total: ${formatPrice(completeBookingData.payment.amount)}`, 115, currentY);
      currentY += 8;
      doc.text(`Méthode: ${completeBookingData.payment.method}`, 115, currentY);
      currentY += 8;
      doc.text("Statut: PAYÉ", 115, currentY);

      // --- Section BAGAGES si présents ---
      const baggage = completeBookingData.baggage;
      if (baggage && (baggage.items?.length > 0 || baggage.totalWeight)) {
        currentY += 14;
        doc.line(10, currentY, 200, currentY);
        currentY += 8;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 100, 0);
        doc.text("BAGAGES ENREGISTRÉS", 10, currentY);
        doc.setTextColor(0, 0, 0);

        currentY += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        if (baggage.totalWeight) {
          doc.text(`Poids total: ${baggage.totalWeight} kg`, 10, currentY);
          currentY += 7;
        }
        if (baggage.totalFee) {
          doc.text(`Frais bagages: ${formatPrice(baggage.totalFee)}`, 10, currentY);
          currentY += 7;
        }
        if (baggage.items && baggage.items.length > 0) {
          doc.text("Détail des bagages:", 10, currentY);
          currentY += 6;
          baggage.items.forEach((item: any, idx: number) => {
            const desc = `  ${idx + 1}. ${item.type || 'Bagage'} - ${item.weight || '?'} kg${item.description ? ` (${item.description})` : ''}`;
            doc.text(desc, 10, currentY);
            currentY += 6;
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }
          });
        }

        // Note règlements bagages
        doc.setFillColor(240, 255, 240);
        doc.rect(10, currentY, 190, 16, 'F');
        doc.setFontSize(9);
        doc.setTextColor(0, 100, 0);
        doc.text("⚠ Présentez-vous au comptoir avec vos bagages 45 mn avant le départ.", 14, currentY + 7);
        doc.text("Tout excédent de poids sera facturé sur place.", 14, currentY + 13);
        doc.setTextColor(0, 0, 0);
        currentY += 22;
      }

      // Note QR code
      currentY = Math.max(currentY + 10, 210);
      doc.setFillColor(245, 245, 245);
      doc.rect(10, currentY, 190, 24, 'F');
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Scannez le QR code sur votre application KonGO pour l'embarquement.", 105, currentY + 9, { align: "center" });
      doc.text(`Code de vérification: ${bookingReference}`, 105, currentY + 17, { align: "center" });

      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Merci d'avoir choisi KonGO. Veuillez vous présenter 30 minutes avant l'heure de départ avec une pièce d'identité.", 10, 283);
      doc.text("KonGO Support 24/7: +243 123 456 789 | www.kongo-transport.cd", 10, 288);

      doc.save(`Billet-KonGO-${bookingReference}.pdf`);

      toast.success("✅ Billet PDF téléchargé", {
        id: 'pdf-gen',
        description: `Fichier: Billet-KonGO-${bookingReference}.pdf`
      });
    } catch (error) {
      toast.error("❌ Erreur lors du téléchargement", { id: 'pdf-gen' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareTicket = async () => {
    const shareData = {
      title: 'Mon billet KonGO',
      text: `🎫 Voyage KonGO: ${completeBookingData.trip.from} → ${completeBookingData.trip.to}\n📅 ${completeBookingData.trip.date} à ${completeBookingData.trip.departure}\n🪑 Sièges: ${completeBookingData.seats.map((s: any) => `${s.row}${s.column}`).join(', ')}\n📋 Réf: ${bookingReference}`,
      url: `https://kongo-verify.com/${bookingReference}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("📤 Billet partagé");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          copyTicketInfo();
        }
      }
    } else {
      copyTicketInfo();
    }
  };

  const copyTicketInfo = () => {
    const ticketInfo = `🎫 BILLET KONGO
📋 Référence: ${bookingReference}
🛣️ Voyage: ${completeBookingData.trip.from} → ${completeBookingData.trip.to}
📅 Date: ${completeBookingData.trip.date}
⏰ Départ: ${completeBookingData.trip.departure}
🪑 Sièges: ${completeBookingData.seats.map((s: any) => `${s.row}${s.column}`).join(', ')}
👤 Passager: ${completeBookingData.passenger.firstName} ${completeBookingData.passenger.lastName}
💰 Total: ${formatPrice(completeBookingData.payment.amount)}
🔍 Vérification: https://kongo-verify.com/${bookingReference}

🚌 KonGO - Transport RDC
📞 Support: +243 123 456 789`;

    navigator.clipboard.writeText(ticketInfo);
    toast.success("📋 Informations copiées");
  };

  const handleAddToCalendar = () => {
    const [hours, minutes] = completeBookingData.trip.departure.split(':');
    const [year, month, day] = completeBookingData.trip.date.split('-');

    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    const durationHours = parseInt(completeBookingData.trip.duration.replace('h', ''));
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`🚌 Voyage KonGO: ${completeBookingData.trip.from} → ${completeBookingData.trip.to}`)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=${encodeURIComponent(`Gare routière, ${completeBookingData.trip.from}`)}`;

    window.open(calendarUrl, '_blank');
    toast.success("📅 Évènement ajouté au calendrier");
  };


  return (
    <div className="min-h-screen bg-gradient-kongo-subtle">
      <div className="container-professional py-8 space-y-8">

        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-success rounded-full flex items-center justify-center mx-auto shadow-lg"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-display-2 text-kongo-black font-bold leading-tight">
              Réservation Confirmée !
            </h1>
            <p className="text-body-large text-secondary max-w-2xl mx-auto">
              Votre voyage avec KonGO est confirmé. Billet numérique et QR code générés avec succès.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center justify-center space-x-2 flex-wrap"
            >
              <Badge className="status-success px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Paiement confirmé
              </Badge>
              {confirmationSent && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Badge className="status-kongo px-4 py-2">
                    <Ticket className="w-4 h-4 mr-2" />
                    Billet généré
                  </Badge>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Digital Ticket */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="xl:col-span-2"
          >
            <Card className="card-kongo overflow-hidden">
              <CardContent className="p-0">
                {/* Ticket Header */}
                <div className="relative p-6 pb-4 bg-gradient-to-r from-kongo-black via-kongo-black-light to-kongo-black">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col items-start translate-y-[-4px]">
                      <KonGOLogo variant="full" size="md" />
                      <div className="text-on-black text-[9px] font-bold mt-1 uppercase tracking-tighter opacity-70 border-l border-kongo-lime pl-2 leading-none">
                        Opéré par {completeBookingData.trip.operator}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-body-small text-on-black opacity-90">Référence</div>
                      <div className="text-h5 text-kongo-lime font-bold">{bookingReference}</div>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-h3 text-on-black font-bold mb-1 uppercase">
                        {completeBookingData.trip.from}
                      </div>
                      <div className="text-body-small text-on-black opacity-75">Départ</div>
                      <div className="text-body text-kongo-lime font-semibold">
                        {completeBookingData.trip.departure}
                      </div>
                    </div>

                    <div className="flex-1 px-6">
                      <div className="relative">
                        <div className="h-px bg-kongo-lime"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-kongo-lime rounded-full flex items-center justify-center">
                          <span className="text-kongo-black font-bold text-sm">🚌</span>
                        </div>
                      </div>
                      <div className="text-center text-body-small text-on-black opacity-75 mt-2">
                        {completeBookingData.trip.duration}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-h3 text-on-black font-bold mb-1 uppercase">
                        {completeBookingData.trip.to}
                      </div>
                      <div className="text-body-small text-on-black opacity-75">Arrivée</div>
                      <div className="text-body text-kongo-lime font-semibold">
                        {(() => {
                          try {
                            const departure = completeBookingData.trip.departure || "00:00";
                            const duration = completeBookingData.trip.duration || "0h";

                            const [hours, minutes] = departure.split(':').map((n: string) => parseInt(n) || 0);
                            const departureTime = new Date();
                            departureTime.setHours(hours, minutes, 0);

                            const durationHours = parseInt(duration.replace(/[^0-9]/g, '')) || 0;
                            const arrivalTime = new Date(departureTime.getTime() + durationHours * 60 * 60 * 1000);

                            return arrivalTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                          } catch (e) {
                            return "--:--";
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="bg-surface-elevated p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-label-small text-tertiary mb-2">PASSAGER</div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-kongo-black" />
                        <span className="text-body text-kongo-black font-medium">
                          {completeBookingData.passenger.firstName} {completeBookingData.passenger.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-secondary" />
                        <span className="text-body-small text-secondary">
                          {completeBookingData.passenger.phone}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-label-small text-tertiary mb-2">SIÈGES</div>
                      <div className="flex flex-wrap gap-2">
                        {completeBookingData.seats.map((seat: any, index: number) => (
                          <div key={index} className="flex items-center space-x-1">
                            <div className="w-8 h-8 bg-kongo-lime text-kongo-black rounded flex items-center justify-center font-bold text-sm">
                              {seat.row}{seat.column}
                            </div>
                            {seat.type === 'premium' && (
                              <Star className="w-4 h-4 text-warning" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-label-small text-tertiary mb-2">TOTAL</div>
                      <div className="text-h4 text-kongo-black font-bold">
                        {formatPrice(completeBookingData.payment.amount)}
                      </div>
                      <div className="text-body-small text-success">✓ Payé</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-secondary" />
                        <div>
                          <div className="text-body-small text-secondary">Email</div>
                          <div className="text-body text-kongo-black">
                            {completeBookingData.passenger.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-secondary" />
                        <div>
                          <div className="text-body-small text-secondary">Téléphone</div>
                          <div className="text-body text-kongo-black">
                            {completeBookingData.passenger.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-4 h-4 text-secondary" />
                        <div>
                          <div className="text-body-small text-secondary">Méthode de paiement</div>
                          <div className="text-body text-kongo-black">
                            {(() => {
                              const methodNames: Record<string, string> = {
                                'orange_money': 'Orange Money',
                                'airtel_money': 'Airtel Money',
                                'mpesa': 'M-Pesa',
                                'visa_card': 'Carte Visa',
                                'mastercard': 'Mastercard'
                              };
                              return methodNames[completeBookingData.payment.method] || completeBookingData.payment.method;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-secondary" />
                        <div>
                          <div className="text-body-small text-secondary">Réservé le</div>
                          <div className="text-body text-kongo-black">
                            {formatDateTime(completeBookingData.bookingDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perforated edge */}
                <div className="h-4 bg-surface-secondary relative">
                  <div className="absolute inset-0 flex justify-center">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-surface-elevated rounded-full mx-1 mt-1"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card className="card-elevated mt-6">
              <CardHeader>
                <CardTitle className="text-h5 text-kongo-black flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Informations importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-surface-kongo-lime-light p-4 rounded-lg border border-kongo-lime/30">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-kongo-lime-dark mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-lime-dark mb-1">
                            Arrivée recommandée
                          </div>
                          <div className="text-body-small text-kongo-lime-dark">
                            Présentez-vous 30 minutes avant le départ avec une pièce d'identité valide
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-tertiary p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-black mb-1">
                            Point de départ
                          </div>
                          <div className="text-body-small text-secondary">
                            Gare routière centrale - {completeBookingData.trip.from}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-surface-secondary p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Smartphone className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-black mb-1">
                            Billet numérique
                          </div>
                          <div className="text-body-small text-secondary">
                            Présentez ce billet sur votre téléphone ou imprimez-le
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-secondary p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-black mb-1">
                            Support 24/7
                          </div>
                          <div className="text-body-small text-secondary">
                            +243 123 456 789 pour toute assistance
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* QR Code & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* QR Code Card */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-h5 text-kongo-black flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  QR Code Billet
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: ticketGenerated ? 1 : 0.5, opacity: ticketGenerated ? 1 : 0.5 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="relative w-40 h-40 bg-white p-3 rounded-lg border-2 border-kongo-black shadow-lg">
                    <QRCodeSVG
                      value={qrCodeData}
                      size={136}
                      bgColor="#ffffff"
                      fgColor="#101820"
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <p className="text-body-small text-secondary">
                    Scannez ce code à l'embarquement
                  </p>
                  <p className="text-caption text-tertiary">
                    Référence: {bookingReference}
                  </p>
                </div>

                <Button
                  onClick={copyTicketInfo}
                  className="btn-outline-lime w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier les infos
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-h5 text-kongo-black">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleDownloadTicket}
                  disabled={isDownloading}
                  className="btn-secondary w-full"
                >
                  {isDownloading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-kongo-black border-t-transparent rounded-full mr-2"
                      />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </>
                  )}
                </Button>

                <Button onClick={handleShareTicket} className="btn-outline w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>

                <Button onClick={handleAddToCalendar} className="btn-ghost w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ajouter au calendrier
                </Button>

                <Separator />

                <Button onClick={onViewDashboard} className="btn-outline-lime w-full">
                  <User className="w-4 h-4 mr-2" />
                  Mes voyages
                </Button>

                <Button onClick={onNewSearch} className="btn-primary w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Nouvelle recherche
                </Button>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="bg-surface-kongo-lime-light border-kongo-lime/30">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-kongo-lime rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6 text-kongo-black" />
                </div>
                <div>
                  <div className="text-body font-medium text-kongo-lime-dark mb-2">
                    Support 24/7
                  </div>
                  <div className="text-body-small text-kongo-lime-dark mb-4">
                    Une question ? Notre équipe est là pour vous aider
                  </div>
                  <Button
                    onClick={() => window.open('tel:+243123456789', '_self')}
                    className="btn-outline-lime w-full"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    +243 123 456 789
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
