// [Agent Dev Mobile] - Action: Écran d'Inscription White Mode - KonGO User App
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { PhoneInput } from '../../components/PhoneInput';
import { useCountry } from '../../context/CountryContext';

export default function RegisterScreen({ navigation }: any) {
  const { selectedCountry } = useCountry();
  const [fullName, setFullName] = useState('');
  const [phoneCode, setPhoneCode] = useState(selectedCountry.phone_code || '+243');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  async function signUpWithEmail() {
    if (!fullName || !email || !password) {
      const msg = 'Veuillez remplir tous les champs obligatoires (Nom, Email, Mot de passe).';
      showToast('error', 'Problème de création de compte : ' + msg);
      Alert.alert('Problème de création de compte', msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Le mot de passe doit contenir au moins 6 caractères.';
      showToast('error', 'Problème de création de compte : ' + msg);
      Alert.alert('Problème de création de compte', msg);
      return;
    }

    setLoading(true);

    const fullPhone = phone.trim() ? `${phoneCode}${phone.trim().replace(/\s+/g, '')}` : null;

    // Étape 1 : Créer le compte
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone_code: phoneCode,
          phone_number: phone.trim() ? phone.trim() : null,
          phone: fullPhone,
          role: 'client'
        }
      }
    });

    if (authError) {
      showToast('error', 'Problème de création de compte : ' + authError.message);
      Alert.alert('Problème de création de compte', authError.message);
      setLoading(false);
      return;
    }

    // Étape 2 : Connexion immédiate après inscription
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        showToast('success', 'La création de compte s\'est bien passée !');
        Alert.alert(
          'Succès',
          'La création de compte s\'est bien passée ! Vous pouvez maintenant vous connecter.',
          [{ text: 'Se connecter', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        showToast('error', 'Problème de création de compte : ' + signInError.message);
        Alert.alert(
          'Problème de création de compte',
          signInError.message,
          [{ text: 'Se connecter', onPress: () => navigation.navigate('Login') }]
        );
      }
    } else {
      // Succès total avec connexion directe
      showToast('success', 'La création de compte s\'est bien passée !');
      Alert.alert(
        'Succès',
        'La création de compte s\'est bien passée !',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {toastMessage && (
        <View style={[styles.toastBanner, toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toastMessage.text}</Text>
        </View>
      )}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#0A0A0A" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Nouveau trajet</Text>
            <Text style={styles.subtitle}>Créez votre compte pour réserver plus rapidement</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex. Christian Mpungi"
                  placeholderTextColor="#AAA"
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
              </View>
            </View>

            <PhoneInput
              label="Téléphone (optionnel)"
              phoneCode={phoneCode}
              onPhoneCodeChange={(code) => setPhoneCode(code)}
              phoneNumber={phone}
              onPhoneNumberChange={setPhone}
              placeholder="812 345 678"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor="#AAA"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#AAA"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]} 
              onPress={signUpWithEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={styles.registerBtnText}>S'inscrire</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà membre ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 60, paddingTop: 20 },
  toastBanner: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  toastSuccess: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#34A853'
  },
  toastError: {
    backgroundColor: '#FCE8E6',
    borderWidth: 1,
    borderColor: '#EA4335'
  },
  toastText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
    textAlign: 'center'
  },
  backBtn: { width: 44, height: 44, backgroundColor: '#F5F5F5', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, color: '#0A0A0A', fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', fontWeight: '500', lineHeight: 22 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, color: '#0A0A0A', fontWeight: '800', marginBottom: 10, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 16, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 18, color: '#0A0A0A', fontSize: 15, fontWeight: '600' },
  eyeIcon: { padding: 10 },
  registerBtn: { backgroundColor: '#C8E63C', borderRadius: 18, padding: 20, alignItems: 'center', marginTop: 12, elevation: 4, shadowColor: '#9EBA15', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  registerBtnDisabled: { backgroundColor: '#EEE', opacity: 0.7, shadowOpacity: 0, elevation: 0 },
  registerBtnText: { fontSize: 16, color: '#0A0A0A', fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { fontSize: 14, color: '#666', fontWeight: '500' },
  loginLink: { fontSize: 14, color: '#9EBA15', fontWeight: '800' }
});
