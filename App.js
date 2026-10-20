import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Alert, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { signInWithGoogle, restoreSession, logOutStudent, isStuyEmail, ALLOWED_DOMAIN } from './auth';
import { fetchAllClasses } from './classes';
import ScheduleScreen from './screens/ScheduleScreen';
import BulletinScreen from './screens/BulletinScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import GuideScreen from './screens/GuideScreen';
import { colors } from './theme';

const TABS = [
  { key: 'schedule', label: 'Schedule' },
  { key: 'bulletin', label: 'Bulletin' },
  { key: 'resources', label: 'Resources' },
  { key: 'guide', label: 'Guide' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [tab, setTab] = useState('schedule');

  // Track login status. Anyone who is not on the school domain is signed straight back out.
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !isStuyEmail(currentUser.email)) {
        logOutStudent();
        setUser(null);
        return;
      }
      setUser(currentUser);
    });

    // The Firebase session is not kept between app launches, so rebuild it from the
    // student's saved Google sign-in before deciding which screen to show.
    restoreSession().finally(() => {
      if (active) setAuthReady(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Load the master class list once a student is signed in.
  useEffect(() => {
    if (!user) {
      setAllClasses([]);
      return;
    }
    let cancelled = false;
    fetchAllClasses().then((list) => {
      if (!cancelled) setAllClasses(list);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logOutStudent();
    setTab('schedule');
  };

  if (!authReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginTitle}>Stuy Connects</Text>
        <Text style={styles.loginSubtitle}>Sign in with your @{ALLOWED_DOMAIN} Google account</Text>
        {signingIn ? (
          <ActivityIndicator />
        ) : (
          <Button title="Sign in with Google" onPress={handleLogin} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText} numberOfLines={1}>
          Hey, {user.displayName || 'Student'}!
        </Text>
        <Button title="Sign Out" onPress={handleLogout} color={colors.danger} />
      </View>

      <View style={styles.body}>
        {tab === 'schedule' && <ScheduleScreen user={user} classes={allClasses} />}
        {tab === 'bulletin' && <BulletinScreen user={user} />}
        {tab === 'resources' && <ResourcesScreen user={user} classes={allClasses} />}
        {tab === 'guide' && <GuideScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity key={key} style={styles.tabButton} onPress={() => setTab(key)}>
            <Text style={tab === key ? styles.tabLabelActive : styles.tabLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  welcomeText: { fontSize: 18, fontWeight: 'bold', flexShrink: 1, marginRight: 10 },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  tabButton: { flex: 1, alignItems: 'center', paddingTop: 12 },
  tabLabel: { color: colors.muted, fontSize: 14 },
  tabLabelActive: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  loginTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  loginSubtitle: { color: colors.muted, marginBottom: 30, textAlign: 'center' },
});
