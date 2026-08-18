// [Agent Dev Mobile] - Composant Notation & Avis d'Agence - KonGO User App
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Star, X, CheckCircle2, MessageSquare, AlertCircle, Send, Pencil, Trash2, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface AgencyReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  agencyId: string | null;
  agencyName: string | null;
  navigation: any;
}

export default function AgencyReviewsModal({
  visible,
  onClose,
  agencyId,
  agencyName,
  navigation,
}: AgencyReviewsModalProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState<number>(4.8);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State du formulaire d'ajout d'avis
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [routeText, setRouteText] = useState('Kinshasa → Lubumbashi');
  const [tripType, setTripType] = useState('VIP');
  const [submitting, setSubmitting] = useState(false);

  // State d'édition d'avis
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>('');
  const [editRouteText, setEditRouteText] = useState<string>('');
  const [editTripType, setEditTripType] = useState<string>('VIP');
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);

  const handleStartEdit = (item: any) => {
    setEditingReviewId(item.id);
    setEditRating(Number(item.rating) || 5);
    setEditComment(item.comment || '');
    setEditRouteText(item.route || 'Kinshasa → Lubumbashi');
    setEditTripType(item.trip_type || 'VIP');
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditComment('');
  };

  const handleSaveEdit = async (reviewId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté.');
      return;
    }
    if (!editComment.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir votre commentaire.');
      return;
    }

    setSubmittingEdit(true);
    try {
      const { error } = await supabase
        .from('agency_reviews')
        .update({
          rating: editRating,
          comment: editComment.trim(),
          route: editRouteText,
          trip_type: editTripType,
        })
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      Alert.alert('Succès', 'Votre avis a été modifié avec succès !');
      setEditingReviewId(null);
      await fetchReviews();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "Impossible de modifier votre avis.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      'Supprimer l\'avis',
      'Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('agency_reviews')
                .delete()
                .eq('id', reviewId)
                .eq('user_id', user.id);

              if (error) throw error;

              Alert.alert('Succès', 'Votre avis a été supprimé.');
              await fetchReviews();
            } catch (err: any) {
              Alert.alert('Erreur', err.message || "Impossible de supprimer votre avis.");
            }
          },
        },
      ]
    );
  };

  const fetchReviews = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      // Vérifier session utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) {
          setAuthorName(profile.full_name);
        } else if (user.email) {
          setAuthorName(user.email.split('@')[0]);
        }
      }

      // Charger les avis depuis Supabase
      const { data, error } = await supabase
        .from('agency_reviews')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setReviews(data);
        const sum = data.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 5), 0);
        const avg = parseFloat((sum / data.length).toFixed(1));
        setAvgRating(avg);
        setTotalCount(data.length);
      } else {
        // Fallback d'avis si la table est vide
        const sampleReviews = [
          {
            id: '1',
            author_name: 'Marie Kalala',
            rating: 5.0,
            comment: 'Service absolument exceptionnel ! Ponctualité irréprochable et bus très confortable.',
            route: 'Kinshasa → Lubumbashi',
            trip_type: 'VIP',
            verified: true,
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            author_name: 'Jean Kabasubabu',
            rating: 4.0,
            comment: 'Très satisfait du voyage. Personnel accueillant et professionnel à bord.',
            route: 'Goma → Kinshasa',
            trip_type: 'Standard',
            verified: true,
            created_at: new Date().toISOString(),
          },
        ];
        setReviews(sampleReviews);
        setAvgRating(4.8);
        setTotalCount(sampleReviews.length);
      }
    } catch (err) {
      console.error('Erreur chargement avis:', err);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    if (visible && agencyId) {
      fetchReviews();
    }
  }, [visible, agencyId, fetchReviews]);

  // Tentative d'ouverture du formulaire d'avis avec vérification d'authentification
  const handleOpenForm = () => {
    if (!currentUser) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) {
          Alert.alert(
            'Connexion requise',
            'Seuls les voyageurs possédant un compte et connectés peuvent donner une note et un avis sur cette agence.',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Se connecter',
                onPress: () => {
                  onClose();
                  navigation.navigate('Login');
                },
              },
            ]
          );
        } else {
          setCurrentUser(session.user);
          setShowForm(prev => !prev);
        }
      });
      return;
    }
    setShowForm(prev => !prev);
  };

  // Soumission de l'avis
  const handleSubmitReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour publier un avis.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir votre commentaire.');
      return;
    }

    setSubmitting(false);
    setSubmitting(true);
    try {
      const { error } = await supabase.from('agency_reviews').insert({
        agency_id: agencyId,
        user_id: user.id,
        author_name: authorName.trim() || 'Voyageur KonGO',
        rating: rating,
        comment: comment.trim(),
        route: routeText || 'Kinshasa → Lubumbashi',
        trip_type: tripType || 'VIP',
        verified: true,
      });

      if (error) throw error;

      Alert.alert('Succès', 'Votre avis a été publié avec succès ! Merci pour votre évaluation.');
      setComment('');
      setShowForm(false);
      await fetchReviews();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || "Impossible d'enregistrer votre avis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header du Modal */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.agencyTitle}>{agencyName || 'Agence'}</Text>
              <View style={styles.scoreRow}>
                <Star size={18} color="#9EBA15" fill="#C8E63C" />
                <Text style={styles.scoreNumber}>{avgRating}</Text>
                <Text style={styles.scoreTotal}>/ 5 ({totalCount} avis)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#0A0A0A" />
            </TouchableOpacity>
          </View>

          {/* Bouton pour laisser un avis */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.addReviewBtn, showForm && styles.addReviewBtnActive]}
              onPress={handleOpenForm}
            >
              <MessageSquare size={20} color={showForm ? "#C8E63C" : "#0A0A0A"} />
              <Text style={[styles.addReviewBtnText, showForm && styles.addReviewBtnTextActive]}>
                {showForm ? '✕ Fermer le formulaire' : '✍️ Laisser une note & avis'}
              </Text>
            </TouchableOpacity>

            {!currentUser && (
              <View style={styles.noticeBanner}>
                <AlertCircle size={14} color="#D97706" />
                <Text style={styles.noticeBannerText}>
                  Connexion requise pour évaluer cette agence.
                </Text>
              </View>
            )}
          </View>

          {/* Formulaire d'avis dépliable */}
          {showForm && (
            <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
              <Text style={styles.formTitle}>Votre évaluation sur {agencyName}</Text>

              {/* Étoiles interactives */}
              <View style={styles.starPickerRow}>
                <Text style={styles.inputLabel}>Votre note :</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(starIndex => (
                    <TouchableOpacity key={starIndex} onPress={() => setRating(starIndex)}>
                      <Star
                        size={28}
                        color={starIndex <= rating ? '#9EBA15' : '#CCC'}
                        fill={starIndex <= rating ? '#C8E63C' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Nom / Pseudo */}
              <Text style={styles.inputLabel}>Votre nom / pseudo :</Text>
              <TextInput
                style={styles.input}
                value={authorName}
                onChangeText={setAuthorName}
                placeholder="Ex: Marie Kalala"
                placeholderTextColor="#AAA"
              />

              {/* Trajet & Catégorie */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Trajet :</Text>
                  <TextInput
                    style={styles.input}
                    value={routeText}
                    onChangeText={setRouteText}
                    placeholder="Kinshasa → Lubumbashi"
                    placeholderTextColor="#AAA"
                  />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={styles.inputLabel}>Classe :</Text>
                  <View style={styles.typeRow}>
                    {['VIP', 'Standard'].map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeChip, tripType === t && styles.typeChipActive]}
                        onPress={() => setTripType(t)}
                      >
                        <Text style={[styles.typeChipText, tripType === t && styles.typeChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Commentaire */}
              <Text style={styles.inputLabel}>Votre avis * :</Text>
              <TextInput
                style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                value={comment}
                onChangeText={setComment}
                placeholder="Racontez votre voyage : ponctualité, confort, hygiène..."
                placeholderTextColor="#AAA"
                multiline
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={20} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Envoyer mon avis</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Liste des avis */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#9EBA15" />
            </View>
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isOwner = currentUser && item.user_id && item.user_id === currentUser.id;
                const isEditingThis = editingReviewId === item.id;

                if (isEditingThis) {
                  return (
                    <View style={[styles.reviewCard, styles.reviewCardEditing]}>
                      <Text style={styles.formTitle}>Modifier votre avis</Text>

                      {/* Étoiles interactives */}
                      <View style={styles.starPickerRow}>
                        <Text style={styles.inputLabel}>Votre note :</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map(starIndex => (
                            <TouchableOpacity key={starIndex} onPress={() => setEditRating(starIndex)}>
                              <Star
                                size={24}
                                color={starIndex <= editRating ? '#9EBA15' : '#CCC'}
                                fill={starIndex <= editRating ? '#C8E63C' : 'transparent'}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Trajet & Classe */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Trajet :</Text>
                          <TextInput
                            style={styles.input}
                            value={editRouteText}
                            onChangeText={setEditRouteText}
                            placeholder="Kinshasa → Lubumbashi"
                            placeholderTextColor="#AAA"
                          />
                        </View>
                        <View style={{ width: 100 }}>
                          <Text style={styles.inputLabel}>Classe :</Text>
                          <View style={styles.typeRow}>
                            {['VIP', 'Standard'].map(t => (
                              <TouchableOpacity
                                key={t}
                                style={[styles.typeChip, editTripType === t && styles.typeChipActive]}
                                onPress={() => setEditTripType(t)}
                              >
                                <Text style={[styles.typeChipText, editTripType === t && styles.typeChipTextActive]}>
                                  {t}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Commentaire */}
                      <Text style={styles.inputLabel}>Commentaire :</Text>
                      <TextInput
                        style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                        value={editComment}
                        onChangeText={setEditComment}
                        placeholder="Modifier votre commentaire..."
                        placeholderTextColor="#AAA"
                        multiline
                      />

                      {/* Boutons d'action pour l'édition */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        <TouchableOpacity
                          style={styles.cancelEditBtn}
                          onPress={handleCancelEdit}
                          disabled={submittingEdit}
                        >
                          <Text style={styles.cancelEditBtnText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.saveEditBtn}
                          onPress={() => handleSaveEdit(item.id)}
                          disabled={submittingEdit}
                        >
                          {submittingEdit ? (
                            <ActivityIndicator size="small" color="#0A0A0A" />
                          ) : (
                            <>
                              <Check size={14} color="#0A0A0A" />
                              <Text style={styles.saveEditBtnText}>Enregistrer</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                return (
                  <View style={[styles.reviewCard, isOwner && styles.ownerReviewCard]}>
                    <View style={styles.reviewCardHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.authorName}>{item.author_name}</Text>
                          {item.verified && (
                            <View style={styles.verifiedBadge}>
                              <CheckCircle2 size={12} color="#16A34A" />
                              <Text style={styles.verifiedText}>Vérifié</Text>
                            </View>
                          )}
                          {isOwner && (
                            <View style={styles.ownBadge}>
                              <Text style={styles.ownBadgeText}>Mon avis</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.reviewMeta}>
                          {item.route} · {item.trip_type || 'Standard'}
                        </Text>
                      </View>

                      {/* Étoiles du commentaire */}
                      <View style={styles.itemRatingRow}>
                        <Star size={14} color="#9EBA15" fill="#C8E63C" />
                        <Text style={styles.itemRatingText}>{Number(item.rating).toFixed(1)}</Text>
                      </View>
                    </View>

                    <Text style={styles.commentText}>{item.comment}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      {/* Boutons d'action Modifier / Supprimer si propriétaire de l'avis */}
                      {isOwner ? (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => handleStartEdit(item)}
                          >
                            <Pencil size={13} color="#2563EB" />
                            <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '700' }}>Modifier</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => handleDeleteReview(item.id)}
                          >
                            <Trash2 size={13} color="#DC2626" />
                            <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '700' }}>Supprimer</Text>
                          </TouchableOpacity>
                        </View>
                      ) : <View />}

                      <Text style={styles.dateText}>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('fr-FR')
                          : 'Récents'}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  agencyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A0A0A',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#9EBA15',
  },
  scoreTotal: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8E63C',
    borderWidth: 2,
    borderColor: '#9EBA15',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
    elevation: 3,
  },
  addReviewBtnActive: {
    backgroundColor: '#0A0A0A',
    borderColor: '#C8E63C',
  },
  addReviewBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A0A0A',
  },
  addReviewBtnTextActive: {
    color: '#C8E63C',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  noticeBannerText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    maxHeight: 340,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0A0A0A',
    marginBottom: 10,
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0A0A0A',
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  typeChipActive: {
    backgroundColor: '#C8E63C',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  typeChipTextActive: {
    color: '#0A0A0A',
  },
  submitBtn: {
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#15803D',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  reviewMeta: {
    fontSize: 11,
    color: '#777',
    fontWeight: '600',
    marginTop: 2,
  },
  itemRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCC5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  itemRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6A7D0A',
  },
  commentText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  ownerReviewCard: {
    backgroundColor: '#F4F7E6',
    borderColor: '#C8E63C',
    borderWidth: 1.5,
  },
  ownBadge: {
    backgroundColor: '#C8E63C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  reviewCardEditing: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  cancelEditBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  saveEditBtn: {
    flex: 1,
    backgroundColor: '#C8E63C',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveEditBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0A',
  },
});
