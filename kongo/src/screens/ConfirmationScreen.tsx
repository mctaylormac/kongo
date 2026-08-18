// [Agent Dev Mobile] - Action: Écran Confirmation / Billet Électronique - KonGO User App
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Share,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { 
  CheckCircle, Share2, FileDown, Home, ChevronRight, Info, 
  ShieldCheck, Shield, Bus, QrCode, User 
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

const PAYMENT_LABELS: Record<string, string> = {
  m_pesa: '📱 M-Pesa',
  orange_money: '🟠 Orange Money',
  airtel_money: '🔴 Airtel Money',
  cash_agency: '🏢 Règlement en Agence',
};

export default function ConfirmationScreen({ route, navigation }: any) {
  const {
    trip, from, to, date, passengers, seats,
    grandTotal, extras, paymentMethod, phone, bookingRef, isHandicap
  } = route?.params || {};

  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎫 Mon billet KonGO\n${from} → ${to}\n${trip?.departure} – ${trip?.arrival}\nBus: ${trip?.agency} (${trip?.class})\nRéf: ${bookingRef}\nTotal: ${grandTotal?.toLocaleString('fr-CD')} CDF`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; background: #F2F2F7; padding: 20px; display: flex; justify-content: center; }
              .ticket { background: white; width: 100%; max-width: 400px; border-radius: 40px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0,0,0,0.15); }
              
              .top-strip { background: #F2F2F7; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #EEE; position: relative; }
              .top-strip::before { content: ''; position: absolute; left: 0; top: 0; width: 6px; height: 100%; background: #9EBA15; }
              .scan-text { font-size: 11px; font-weight: 900; color: #1D1D1F; text-transform: uppercase; letter-spacing: 2px; }
              .scan-sub { font-size: 10px; font-weight: bold; color: #86868B; text-transform: uppercase; margin-top: 2px; }
              
              .header { background: #0A0A0F; padding: 35px; color: white; position: relative; }
              .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .logo-box { display: flex; align-items: center; gap: 12px; }
              .logo-icon { width: 44px; height: 44px; background: #9EBA15; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
              .brand { font-size: 20px; font-weight: 900; text-transform: uppercase; }
              .agency { font-size: 10px; font-weight: bold; color: #9EBA15; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
              .booking-code-label { font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; }
              .booking-code { font-size: 32px; font-weight: 900; color: #9EBA15; margin-top: 5px; letter-spacing: -1px; }
              
              .route { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
              .city-label { font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; }
              .city-name { font-size: 24px; font-weight: 900; text-transform: uppercase; margin-top: 4px; letter-spacing: -0.5px; }
              .arrow-circle { width: 36px; height: 36px; background: #9EBA15; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #0A0A0F; font-size: 20px; border: 3px solid #0A0A0F; }
              
              .perforation { height: 32px; position: relative; background: white; overflow: hidden; }
              .perforation::after { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 2px; border-top: 2px dashed #EEE; transform: translateY(-50%); }
              .cutout-l, .cutout-r { position: absolute; width: 32px; height: 32px; background: #F2F2F7; border-radius: 50%; top: 50%; transform: translateY(-50%); border: 1px solid rgba(0,0,0,0.05); }
              .cutout-l { left: -16px; } .cutout-r { right: -16px; }
              
              .body { padding: 30px; }
              .passenger-card { background: #F8F8FA; padding: 18px; border-radius: 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border: 1px solid rgba(0,0,0,0.05); }
              .p-name { font-size: 15px; font-weight: 800; color: #1D1D1F; text-transform: uppercase; }
              .p-phone { font-size: 11px; font-weight: bold; color: #86868B; margin-top: 4px; }
              .seat-badge { background: #1D1D1F; color: white; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; }
              
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 25px; }
              .label { font-size: 10px; font-weight: 900; color: #86868B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
              .value { font-size: 14px; font-weight: bold; color: #1D1D1F; }
              
              .secure-banner { background: #F8F8FA; padding: 20px; border-radius: 24px; display: flex; align-items: center; gap: 16px; border: 1px solid rgba(0,0,0,0.05); position: relative; margin-top: 20px; }
              .secure-banner::before { content: ''; position: absolute; left: 0; top: 0; width: 2px; height: 100%; background: #9EBA15; }
              .secure-icon { width: 44px; height: 44px; background: rgba(158,186,21,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #9EBA15; }
              .secure-title { font-size: 11px; font-weight: 900; color: #1D1D1F; text-transform: uppercase; letter-spacing: 1.5px; }
              .secure-text { font-size: 9px; font-weight: bold; color: #86868B; text-transform: uppercase; margin-top: 4px; line-height: 1.4; opacity: 0.8; }
              
              .footer { margin-top: 25px; border-top: 1px solid #F5F5F5; padding-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
              .total-price { font-size: 32px; font-weight: 900; color: #1D1D1F; letter-spacing: -1px; }
              .total-currency { font-size: 12px; font-weight: 900; color: #86868B; margin-left: 4px; }
              .valid-badge { background: rgba(158,186,21,0.1); border: 1px solid rgba(158,186,21,0.2); padding: 8px 16px; border-radius: 24px; color: #9EBA15; font-size: 10px; font-weight: 900; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="top-strip">
                <div>
                  <div class="scan-text">Scan d'accès rapide</div>
                  <div class="scan-sub">Borne & Embarquement Prioritaire</div>
                </div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TICKET-${bookingRef}" width="52" height="52" style="border-radius: 8px;" />
              </div>
              
              <div class="header">
                <div class="header-top">
                  <div>
                    <div class="logo-box">
                      <div class="logo-icon">🚌</div>
                      <div>
                        <div class="brand">KonGO</div>
                        <div class="agency">${trip?.agency || 'KonGO Bus'}</div>
                      </div>
                    </div>
                    <div style="margin-top: 20px;">
                      <div class="booking-code-label">Code Réservation</div>
                      <div class="booking-code">${bookingRef}</div>
                    </div>
                  </div>
                  <div style="background: white; padding: 10px; border-radius: 16px; transform: rotate(3deg);">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET-${bookingRef}" width="80" height="80" />
                  </div>
                </div>
                
                <div class="route">
                  <div>
                    <div class="city-label">Origine</div>
                    <div class="city-name">${from}</div>
                  </div>
                  <div class="arrow-circle">→</div>
                  <div style="text-align: right;">
                    <div class="city-label">Destination</div>
                    <div class="city-name">${to}</div>
                  </div>
                </div>
              </div>
              
              <div class="perforation">
                <div class="cutout-l"></div>
                <div class="cutout-r"></div>
              </div>
              
              <div class="body">
                <div class="passenger-card">
                  <div>
                    <div class="p-name">${passengers > 1 ? 'Multi-passagers' : 'Passager Mobile'}</div>
                    <div class="p-phone">${phone || 'KonGO User'}</div>
                  </div>
                  <div class="seat-badge">${Array.isArray(seats) ? seats.join(', ') : seats || '-'}</div>
                </div>
                
                <div class="grid">
                  <div>
                    <div class="label">Date du Voyage</div>
                    <div class="value">${date || "Aujourd'hui"}</div>
                  </div>
                  <div style="text-align: right;">
                    <div class="label">Paiement</div>
                    <div class="value">${PAYMENT_LABELS[paymentMethod] || paymentMethod || 'Confirmé'}</div>
                  </div>
                </div>
                
                <div class="secure-banner">
                  <div class="secure-icon">🛡️</div>
                  <div>
                    <div class="secure-title">Billet Sécurisé & Certifié KonGO</div>
                    <div class="secure-text">Validez l'accès au terminal via le QR code en haut. Billet nominatif, sécurisé et non-transferable.</div>
                  </div>
                </div>
                
                <div class="footer">
                  <div>
                    <div class="label">Montant Total</div>
                    <div class="total-price">${grandTotal?.toLocaleString('fr-CD')}<span class="total-currency">CDF</span></div>
                  </div>
                  <div class="valid-badge">Billet Valide</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('PDF error:', error);
      Alert.alert('Erreur', 'Impossible de générer le fichier PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Succès banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconCircle}>
            <CheckCircle size={40} color="#9EBA15" strokeWidth={2.5} />
          </View>
          <Text style={styles.successTitle}>Réservation Confirmée !</Text>
          <Text style={styles.successSub}>Votre billet est prêt. Bon voyage ! 🚌</Text>
        </View>

        {/* Billet Standardisé */}
        <View style={styles.ticket}>
          {/* ── Top Scanner Strip ── */}
          <View style={styles.topStrip}>
            <View style={styles.stripAccent} />
            <View>
              <View style={styles.scanHeader}>
                <QrCode size={14} color="#1D1D1F" />
                <Text style={styles.scanText}>SCAN D'ACCÈS</Text>
              </View>
              <Text style={styles.scanSub}>BORNE & EMBARQUEMENT</Text>
            </View>
            <View style={styles.smallQrContainer}>
              <QRCode 
                value={`TICKET-${bookingRef}`} 
                size={40} 
                color="#0A0A0A" 
                backgroundColor="#FFFFFF" 
              />
            </View>
          </View>

          {/* ── Dark Header ── */}
          <View style={styles.darkHeader}>
            <View style={styles.headerTop}>
              <View>
                <View style={styles.brandRow}>
                  <View style={styles.logoIcon}>
                    <Bus size={20} color="#0A0A0F" />
                  </View>
                  <View>
                    <Text style={styles.brandName}>KonGO</Text>
                    <Text style={styles.agencyTag}>{trip?.agency || 'KonGO Bus'}</Text>
                  </View>
                </View>
                <View style={styles.refContainer}>
                  <Text style={styles.refLabel}>CODE RÉSERVATION</Text>
                  <Text style={styles.refValue}>{bookingRef}</Text>
                </View>
              </View>
              <View style={styles.mainQrContainer}>
                <QRCode 
                  value={`TICKET-${bookingRef}`} 
                  size={70} 
                  color="#0A0A0A" 
                  backgroundColor="#FFFFFF" 
                />
              </View>
            </View>

            <View style={styles.routeContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>ORIGINE</Text>
                <Text style={styles.routeName} numberOfLines={1}>{from}</Text>
              </View>
              <View style={styles.routeArrow}>
                <ChevronRight size={20} color="#0A0A0F" />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.routeLabel}>DESTINATION</Text>
                <Text style={styles.routeName} numberOfLines={1}>{to}</Text>
              </View>
            </View>
          </View>

          {/* ── Perforation ── */}
          <View style={styles.perforationRow}>
            <View style={styles.cutoutLeft} />
            <View style={styles.dashLine} />
            <View style={styles.cutoutRight} />
          </View>

          {/* ── Body ── */}
          <View style={styles.ticketBody}>
            <View style={styles.passengerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.userIconCircle}>
                  <User size={18} color="#1D1D1F" />
                </View>
                <View>
                  <Text style={styles.passengerName}>{passengers > 1 ? 'Multi-passagers' : 'Passager Mobile'}</Text>
                  <Text style={styles.passengerPhone}>{phone || 'KonGO User'}</Text>
                </View>
              </View>
              <View style={styles.seatBadge}>
                <Text style={styles.seatText}>{Array.isArray(seats) ? seats.join(', ') : seats || '-'}</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.itemLabel}>DATE DU VOYAGE</Text>
                <Text style={styles.itemValue}>{date || "Aujourd'hui"}</Text>
              </View>
              <View style={[styles.detailItem, { alignItems: 'flex-end' }]}>
                <Text style={styles.itemLabel}>PAIEMENT</Text>
                <Text style={styles.itemValue}>{PAYMENT_LABELS[paymentMethod] || paymentMethod || 'Payé'}</Text>
              </View>
            </View>

            {extras && extras.length > 0 && (
              <View style={styles.extrasBox}>
                <Text style={styles.extrasLabel}>SERVICES & BAGAGES</Text>
                <Text style={styles.extrasValue}>{extras.map((e: any) => e.title).join(', ')}</Text>
              </View>
            )}

            {isHandicap && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: '#EAF4FF', borderRadius: 12,
                padding: 12, marginTop: 4, borderWidth: 1, borderColor: '#B8D9F4'
              }}>
                <Text style={{ fontSize: 20 }}>♿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1A6FA8' }}>ACCÈS MOBILITÉ RÉDUITE (PMR)</Text>
                  <Text style={{ fontSize: 11, color: '#4A90C4', marginTop: 2 }}>Siège adapté réservé. Présentez ce billet à l’embarquement.</Text>
                </View>
              </View>
            )}

            {/* ── Secure Banner ── */}
            <View style={styles.secureBanner}>
              <View style={styles.secureAccent} />
              <View style={styles.secureIconBox}>
                <ShieldCheck size={22} color="#9EBA15" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.secureTitle}>Billet Sécurisé & Certifié KonGO</Text>
                <Text style={styles.secureText}>
                  VALIDEZ L'ACCÈS AU TERMINAL VIA LE QR CODE EN HAUT. BILLET NOMINATIF, SÉCURISÉ ET NON-TRANSFERABLE.
                </Text>
              </View>
            </View>

            <View style={styles.ticketFooter}>
              <View>
                <Text style={styles.totalLabel}>MONTANT TOTAL</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={styles.totalValue}>{grandTotal?.toLocaleString('fr-CD')}</Text>
                  <Text style={styles.currencyText}>CDF</Text>
                </View>
              </View>
              <View style={styles.validTag}>
                <Text style={styles.validTagText}>BILLET VALIDE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.pdfBtn} 
            onPress={generatePDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#0A0A0A" />
            ) : (
              <>
                <FileDown size={20} color="#0A0A0A" />
                <Text style={styles.pdfBtnText}>Télécharger le Ticket (PDF)</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Share2 size={20} color="#0A0A0A" />
              <Text style={styles.shareBtnText}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.homeBtn} 
              onPress={() => navigation.navigate('Main')}
            >
              <Home size={20} color="#0A0A0A" />
              <Text style={styles.homeBtnText}>Accueil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  successBanner: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24 },
  successIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle: { fontSize: 22, color: '#0A0A0A', fontWeight: '900', marginBottom: 4 },
  successSub: { fontSize: 13, color: '#666', fontWeight: '500' },

  // Nouveau Billet Style
  ticket: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    borderRadius: 32, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.05)', 
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  
  // Top Strip
  topStrip: { 
    backgroundColor: '#F2F2F7', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  stripAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#9EBA15' },
  scanHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  scanText: { fontSize: 11, fontWeight: '900', color: '#1D1D1F', letterSpacing: 1.5 },
  scanSub: { fontSize: 9, fontWeight: '700', color: '#86868B' },
  smallQrContainer: { backgroundColor: '#FFF', padding: 6, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

  // Dark Header
  darkHeader: { backgroundColor: '#0A0A0F', padding: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 36, height: 36, backgroundColor: '#9EBA15', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  agencyTag: { color: '#9EBA15', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  refContainer: { marginTop: 16 },
  refLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  refValue: { color: '#9EBA15', fontSize: 24, fontWeight: '900', marginTop: 2 },
  mainQrContainer: { backgroundColor: '#FFF', padding: 10, borderRadius: 16, transform: [{ rotate: '2deg' }] },

  routeContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  routeName: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 4 },
  routeArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#9EBA15', alignItems: 'center', justifyContent: 'center' },

  // Perforation
  perforationRow: { height: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF' },
  cutoutLeft: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F2F2F7', marginLeft: -12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  dashLine: { flex: 1, height: 1, borderBottomWidth: 1, borderBottomColor: '#EEE', borderStyle: 'dashed', marginHorizontal: 4 },
  cutoutRight: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F2F2F7', marginRight: -12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },

  // Body
  ticketBody: { padding: 24 },
  passengerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#F8F8FA', 
    padding: 16, 
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
  },
  userIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  passengerName: { fontSize: 14, fontWeight: '800', color: '#1D1D1F', textTransform: 'uppercase' },
  passengerPhone: { fontSize: 11, fontWeight: '600', color: '#86868B', marginTop: 2 },
  seatBadge: { backgroundColor: '#1D1D1F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  seatText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailItem: { flex: 1 },
  itemLabel: { fontSize: 9, fontWeight: '900', color: '#86868B', letterSpacing: 1, marginBottom: 6 },
  itemValue: { fontSize: 13, fontWeight: '800', color: '#1D1D1F' },

  extrasBox: { 
    backgroundColor: '#F8F8FA', 
    padding: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: 20,
  },
  extrasLabel: { fontSize: 9, fontWeight: '900', color: '#86868B', letterSpacing: 1, marginBottom: 4 },
  extrasValue: { fontSize: 12, fontWeight: '700', color: '#1D1D1F' },

  // Secure Banner
  secureBanner: {
    backgroundColor: '#F8F8FA',
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginTop: 10,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  secureAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#9EBA15',
  },
  secureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(158,186,21,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(158,186,21,0.1)',
  },
  secureTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0A0A0A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  secureText: {
    fontSize: 9,
    color: '#666',
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 14,
    textTransform: 'uppercase',
    opacity: 0.8,
  },

  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 24 },
  totalLabel: { fontSize: 9, fontWeight: '900', color: '#86868B', letterSpacing: 1, marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: '900', color: '#1D1D1F', letterSpacing: -1 },
  currencyText: { fontSize: 12, fontWeight: '900', color: '#86868B', marginLeft: 2 },
  validTag: { backgroundColor: 'rgba(158,186,21,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(158,186,21,0.2)' },
  validTagText: { color: '#9EBA15', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Actions
  actions: { padding: 16, gap: 12 },
  pdfBtn: { backgroundColor: '#C8E63C', borderRadius: 16, padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  pdfBtnText: { fontSize: 15, color: '#0A0A0B', fontWeight: '900' },
  shareBtn: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#EEE' },
  shareBtnText: { fontSize: 13, color: '#0A0A0B', fontWeight: '800' },
  homeBtn: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#EEE' },
  homeBtnText: { fontSize: 13, color: '#0A0A0B', fontWeight: '800' },
});
