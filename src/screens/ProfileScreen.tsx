import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AppUser } from '../types';
import { logoutUser, linkPartner } from '../services/authService';

interface Props {
  user: AppUser;
  setUser: (u: AppUser | null) => void;
}

export default function ProfileScreen({ user, setUser }: Props) {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isLinked = !!user.partnerId;

  async function handleLink() {
    if (!partnerEmail.trim()) {
      Alert.alert('Attenzione', "Inserisci l'email del partner.");
      return;
    }
    if (partnerEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      Alert.alert('Attenzione', 'Non puoi collegarti a te stesso!');
      return;
    }
    setLinking(true);
    try {
      await linkPartner(user.uid, partnerEmail.trim().toLowerCase());
      Alert.alert('Collegato! 🎉', 'Ora condividete il calendario.');
      setPartnerEmail('');
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLinking(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Esci', "Vuoi davvero uscire dall'app?", [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logoutUser();
          setUser(null);
        },
      },
    ]);
  }

  const avatarColor = user.role === 'husband' ? colors.husband : colors.wife;
  const initial = user.displayName.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: avatarColor + '20' }]}>
          <Text style={[styles.roleText, { color: avatarColor }]}>
            {user.role === 'husband' ? '👨 Marito / Partner' : '👩 Moglie / Partner'}
          </Text>
        </View>
      </View>

      {/* Partner section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Partner</Text>
        </View>

        {isLinked ? (
          <View style={styles.linkedBox}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkedText}>Collegato con</Text>
              <Text style={styles.linkedEmail}>{user.partnerEmail}</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.cardDesc}>
              Collega il tuo partner per condividere calendario, spese e liste. Il partner deve essere già registrato.
            </Text>
            <View style={styles.linkRow}>
              <TextInput
                style={styles.linkInput}
                placeholder="Email del partner"
                value={partnerEmail}
                onChangeText={setPartnerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={handleLink}
                disabled={linking}
              >
                {linking ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.linkBtnText}>Collega</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Stats */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Il tuo account</Text>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statDot, { backgroundColor: avatarColor }]} />
          <Text style={styles.statLabel}>Il tuo colore nel calendario</Text>
        </View>
        <Text style={styles.statNote}>
          Tutti gli eventi e le spese che crei appaiono con questo colore per distinguerli da quelli del partner.
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
        {loggingOut ? (
          <ActivityIndicator color={colors.error} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Esci dall'account</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>Insieme v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 28,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarInitial: { fontSize: 38, fontWeight: '700', color: colors.white },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: { fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 14 },
  linkRow: { flexDirection: 'row', gap: 10 },
  linkInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  linkBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  linkedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    padding: 12,
  },
  linkedText: { fontSize: 12, color: colors.textSecondary },
  linkedEmail: { fontSize: 15, fontWeight: '600', color: colors.text },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  statDot: { width: 20, height: 20, borderRadius: 10 },
  statLabel: { fontSize: 14, color: colors.text },
  statNote: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.error + '15',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
  version: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 12,
    marginTop: 24,
  },
});
