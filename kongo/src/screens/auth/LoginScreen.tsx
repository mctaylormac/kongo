// [Agent Dev Mobile] - Action: Écran de Connexion White Mode - KonGO User App
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const getFrenchError = (msg: string): string => {
    if (msg.includes('Email not confirmed'))
      return "Votre compte est en attente de validation. Contactez le support si le problème persiste.";
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
      return 'Email ou mot de passe incorrect. Vérifiez vos informations.';
    if (msg.includes('Too many requests'))
      return 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.';
    if (msg.includes('User not found'))
      return 'Aucun compte trouvé avec cet email. Veuillez vous inscrire.';
    if (msg.includes('Network request failed') || msg.includes('fetch'))
      return 'Erreur de connexion internet. Vérifiez votre connexion réseau.';
    return msg;
  };

  async function signInWithEmail() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (error) {
      Alert.alert('Erreur de connexion', getFrenchError(error.message));
      setLoading(false);
    } else {
      setLoading(false);
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color="#0A0A0A" />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer votre voyage</Text>
        </View>

        <View style={styles.form}>
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

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginBtn, (loading || !email || !password) && styles.loginBtnDisabled]} 
            onPress={signInWithEmail}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.loginBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtn: { position: 'absolute', top: 60, left: 24, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  keyboardView: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 80, height: 80, backgroundColor: '#F9FCC5', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#C8E63C44' },
  logo: { width: 56, height: 56 },
  title: { fontSize: 32, color: '#0A0A0A', fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', fontWeight: '500', textAlign: 'center', lineHeight: 20 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, color: '#0A0A0A', fontWeight: '800', marginBottom: 10, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 16, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 18, color: '#0A0A0A', fontSize: 15, fontWeight: '600' },
  eyeIcon: { padding: 10 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 32 },
  forgotText: { fontSize: 13, color: '#9EBA15', fontWeight: '700' },
  loginBtn: { backgroundColor: '#C8E63C', borderRadius: 18, padding: 20, alignItems: 'center', elevation: 4, shadowColor: '#9EBA15', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  loginBtnDisabled: { backgroundColor: '#EEE', shadowOpacity: 0, elevation: 0 },
  loginBtnText: { fontSize: 16, color: '#0A0A0A', fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { fontSize: 14, color: '#666', fontWeight: '500' },
  registerLink: { fontSize: 14, color: '#9EBA15', fontWeight: '800' }
});
