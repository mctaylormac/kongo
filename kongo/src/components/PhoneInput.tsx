import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useCountry, Country, DEFAULT_COUNTRIES } from '../context/CountryContext';
import { ChevronDown, Phone, X } from 'lucide-react-native';

interface PhoneInputProps {
  label?: string;
  phoneCode: string;
  onPhoneCodeChange: (code: string, country?: Country) => void;
  phoneNumber: string;
  onPhoneNumberChange: (number: string) => void;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Numéro de téléphone',
  phoneCode,
  onPhoneCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  placeholder = '812 345 678',
}) => {
  const { countries } = useCountry();
  const [showPicker, setShowPicker] = useState(false);

  const activeCountry =
    (countries.length > 0 ? countries : DEFAULT_COUNTRIES).find(
      (c) => c.phone_code === phoneCode
    ) || DEFAULT_COUNTRIES[0];

  const handleSelectCountry = (country: Country) => {
    onPhoneCodeChange(country.phone_code, country);
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={styles.inputRow}>
        {/* Sélecteur d'indicatif avec drapeau */}
        <TouchableOpacity
          style={styles.codePickerBtn}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.flagEmoji}>{activeCountry.flag_emoji}</Text>
          <Text style={styles.phoneCodeText}>{phoneCode || activeCountry.phone_code}</Text>
          <ChevronDown size={14} color="#64748B" style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        {/* Champ de saisie du numéro local */}
        <View style={styles.phoneInputContainer}>
          <Phone size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.phoneTextInput}
            value={phoneNumber}
            onChangeText={onPhoneNumberChange}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>
      </View>

      {/* Modal de sélection d'indicatif */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoiding}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalTitle}>Choisir l'indicatif</Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPicker(false)}>
                      <X size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                <FlatList
                  data={countries.length > 0 ? countries : DEFAULT_COUNTRIES}
                  keyExtractor={(item) => item.code + item.phone_code}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = item.phone_code === phoneCode;
                    return (
                      <TouchableOpacity
                        style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                        onPress={() => handleSelectCountry(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.modalFlag}>{item.flag_emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>{item.name}</Text>
                          <Text style={styles.countrySub}>{item.code}</Text>
                        </View>
                        <Text style={styles.countryCodeBadge}>{item.phone_code}</Text>
                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />}
                />
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  codePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: 6,
  },
  flagEmoji: { fontSize: 18 },
  phoneCodeText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  phoneTextInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  keyboardAvoiding: { width: '100%', maxHeight: '75%', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  modalHeader: { alignItems: 'center', marginBottom: 12 },
  modalHandle: { width: 38, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, marginBottom: 14 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  modalTitle: { fontSize: 18, color: '#0F172A', fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12, gap: 12 },
  countryItemSelected: { backgroundColor: '#F2F9E8' },
  modalFlag: { fontSize: 24 },
  countryName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  countryNameSelected: { color: '#7A960C', fontWeight: '800' },
  countrySub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  countryCodeBadge: { fontSize: 14, fontWeight: '800', color: '#9EBA15', backgroundColor: '#F2F9E8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
