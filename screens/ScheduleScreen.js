import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import ClassPicker from '../components/ClassPicker';
import {
  PERIODS,
  getUserProfile,
  saveUserProfile,
  saveSchedulePeriod,
  findClassmates,
} from '../database';
import { colors, shared } from '../theme';

const MAX_HANDLE_LENGTH = 40;

export default function ScheduleScreen({ user, classes }) {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState({});
  const [instagram, setInstagram] = useState('');
  const [discord, setDiscord] = useState('');
  const [savingSocials, setSavingSocials] = useState(false);
  const [openPeriod, setOpenPeriod] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [loadingMates, setLoadingMates] = useState(false);
  const latestRequest = useRef(0);

  const displayName = user.displayName || 'Stuy Student';

  const classById = useMemo(() => {
    const map = {};
    for (const c of classes) map[c.id] = c;
    return map;
  }, [classes]);

  // Load this student's saved schedule and contact info.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (cancelled) return;
        setSchedule(profile?.schedule || {});
        setInstagram(profile?.socials?.instagram || '');
        setDiscord(profile?.socials?.discord || '');
        if (!profile?.name) await saveUserProfile(user.uid, { name: displayName });
      } catch (error) {
        console.error('Error loading profile:', error);
        if (!cancelled) Alert.alert('Could not load your schedule', error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user.uid, displayName]);

  const handleSelectClass = async (classItem) => {
    const period = Number(classItem.period);
    if (!PERIODS.includes(period)) {
      Alert.alert('Missing period', `${classItem.className} does not have a valid period yet.`);
      return;
    }
    try {
      await saveSchedulePeriod(user.uid, period, classItem.id);
      setSchedule((prev) => ({ ...prev, [`period${period}`]: classItem.id }));
      setOpenPeriod(null);
      setClassmates([]);
    } catch (error) {
      Alert.alert('Could not save class', error.message);
    }
  };

  const handleRemove = async (period) => {
    try {
      await saveSchedulePeriod(user.uid, period, null);
      setSchedule((prev) => ({ ...prev, [`period${period}`]: null }));
      if (openPeriod === period) {
        setOpenPeriod(null);
        setClassmates([]);
      }
    } catch (error) {
      Alert.alert('Could not remove class', error.message);
    }
  };

  const handlePeriodPress = async (period) => {
    const classId = schedule[`period${period}`];
    if (!classId) return;

    if (openPeriod === period) {
      setOpenPeriod(null);
      setClassmates([]);
      return;
    }

    const requestId = ++latestRequest.current;
    setOpenPeriod(period);
    setClassmates([]);
    setLoadingMates(true);
    try {
      const list = await findClassmates(period, classId);
      if (requestId !== latestRequest.current) return; // a newer tap replaced this one
      setClassmates(list.filter((item) => item.id !== user.uid));
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      Alert.alert('Could not load classmates', error.message);
    } finally {
      if (requestId === latestRequest.current) setLoadingMates(false);
    }
  };

  const handleSaveSocials = async () => {
    const ig = instagram.trim();
    const dc = discord.trim();
    if (ig.length > MAX_HANDLE_LENGTH || dc.length > MAX_HANDLE_LENGTH) {
      Alert.alert('Too long', `Each handle must be ${MAX_HANDLE_LENGTH} characters or fewer.`);
      return;
    }
    setSavingSocials(true);
    try {
      await saveUserProfile(user.uid, {
        name: displayName,
        socials: { instagram: ig, discord: dc },
      });
      setInstagram(ig);
      setDiscord(dc);
      Alert.alert('Saved', 'Your contact info was updated.');
    } catch (error) {
      Alert.alert('Could not save', error.message);
    } finally {
      setSavingSocials(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.scroll} keyboardShouldPersistTaps="handled">
      <Text style={shared.sectionHeader}>Add a class</Text>
      <ClassPicker classes={classes} onSelect={handleSelectClass} placeholder="Search by class or teacher..." />

      <Text style={[shared.sectionHeader, styles.gap]}>Your Schedule</Text>
      {PERIODS.map((period) => {
        const classId = schedule[`period${period}`];
        const classItem = classId ? classById[classId] : null;
        const isOpen = openPeriod === period;
        return (
          <View key={period} style={styles.periodBlock}>
            <TouchableOpacity
              style={styles.periodRow}
              onPress={() => handlePeriodPress(period)}
              disabled={!classId}
            >
              <Text style={styles.periodLabel}>Period {period}</Text>
              <Text style={classId ? styles.classLabel : shared.muted} numberOfLines={1}>
                {classId ? classItem?.className || 'Unknown class' : 'No class added'}
              </Text>
            </TouchableOpacity>

            {classId && (
              <View style={styles.rowActions}>
                <Text style={shared.muted}>{isOpen ? 'Tap the class to hide classmates' : 'Tap the class to see classmates'}</Text>
                <TouchableOpacity onPress={() => handleRemove(period)}>
                  <Text style={shared.dangerText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            {isOpen && (
              <View style={styles.classmates}>
                {loadingMates ? (
                  <ActivityIndicator />
                ) : classmates.length === 0 ? (
                  <Text style={shared.muted}>No classmates have added this class yet.</Text>
                ) : (
                  classmates.map((mate) => (
                    <View key={mate.id} style={styles.mateRow}>
                      <Text style={styles.mateName}>{mate.name || 'Stuy Student'}</Text>
                      <Text style={shared.muted}>
                        Insta: {mate.socials?.instagram || 'N/A'} | Discord: {mate.socials?.discord || 'N/A'}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        );
      })}

      <Text style={[shared.sectionHeader, styles.gap]}>Your contact info</Text>
      <Text style={[shared.muted, styles.note]}>Shown to classmates who share a class with you.</Text>
      <TextInput
        style={shared.input}
        placeholder="Instagram (e.g. @yourname)"
        value={instagram}
        onChangeText={setInstagram}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={MAX_HANDLE_LENGTH}
      />
      <TextInput
        style={shared.input}
        placeholder="Discord tag"
        value={discord}
        onChangeText={setDiscord}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={MAX_HANDLE_LENGTH}
      />
      <TouchableOpacity
        style={[shared.button, savingSocials && shared.buttonDisabled]}
        onPress={handleSaveSocials}
        disabled={savingSocials}
      >
        <Text style={shared.buttonText}>{savingSocials ? 'Saving...' : 'Save contact info'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gap: { marginTop: 20 },
  note: { marginBottom: 10 },
  periodBlock: { marginBottom: 10 },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  periodLabel: { fontWeight: 'bold', marginRight: 12 },
  classLabel: { color: colors.primary, flexShrink: 1 },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  classmates: {
    marginTop: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  mateRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  mateName: { fontSize: 16, fontWeight: 'bold' },
});
