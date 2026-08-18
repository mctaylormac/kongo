import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
}

export function DeleteAccountDialog({ isOpen, onClose, onAccountDeleted }: DeleteAccountDialogProps) {
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleClose = () => {
    if (isDeleting) return;
    setReason('');
    setIsDeleted(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error('Session expirée. Reconnectez-vous.'); return; }
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Erreur de suppression');
      setIsDeleted(true);
      await supabase.auth.signOut();
      setTimeout(() => { onAccountDeleted(); handleClose(); }, 2500);
    } catch (err: any) {
      toast.error('Erreur : ' + (err.message ?? 'Impossible de supprimer le compte.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white border-2 border-red-100 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Supprimer le compte</DialogTitle>
          <DialogDescription>Suppression definitive du compte KonGO</DialogDescription>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {!isDeleted ? (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-red-100">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Supprimer mon compte</h2>
                  <p className="text-sm text-gray-500">Action irréversible</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Ce qui sera supprimé définitivement :
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside ml-2">
                  <li>Votre profil et informations personnelles</li>
                  <li>Votre historique de réservations</li>
                  <li>Vos avis publiés sur les agences</li>
                  <li>Vos préférences et favoris</li>
                </ul>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Raison (optionnel)</label>
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Pourquoi souhaitez-vous supprimer votre compte ?"
                  disabled={isDeleting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none disabled:opacity-50" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} disabled={isDeleting} className="flex-1 rounded-xl text-gray-800 font-bold border-2 border-gray-300">Annuler</Button>
                <Button onClick={handleDelete} disabled={isDeleting} style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }} className="flex-1 bg-[#DC2626] text-white hover:bg-red-700 font-extrabold text-base py-3 rounded-xl border-2 border-red-800 disabled:opacity-50">
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Compte supprimé</h2>
              <p className="text-sm text-gray-500">Votre compte et toutes vos données ont été supprimés. Merci d'avoir utilisé KonGO.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
