import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Button, Alert } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { signInWithGoogle, logOutStudent } from './auth';
import { fetchAllClasses } from './classes';
import { saveUserProfile, findClassmates } from './database';

export default function App() {
  // 1. All your state hooks
  const [user, setUser] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [mySchedule, setMySchedule] = useState({ period1: null });
  const [classmates, setClassmates] = useState([]);

  // 2. Auth State Listener (automatically tracks login status)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // 3. Load classes list from Firestore
  useEffect(() => {
    const loadClasses = async () => {
      const list = await fetchAllClasses();
      setAllClasses(list);
    };
    loadClasses();
  }, []);

  // 4. All your handler functions
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const handleLogout = async () => {
    await logOutStudent();
    setMySchedule({ period1: null });
    setClassmates([]);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredClasses([]);
    } else {
      const filtered = allClasses.filter(item => 
        item.className.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredClasses(filtered);
    }
  };

  const handleSelectClass = async (classItem) => {
    setSearchQuery('');
    setFilteredClasses([]);
    setMySchedule({ period1: classItem });

    if (user) {
      await saveUserProfile(user.uid, {
        name: user.displayName || "Stuy Student",
        email: user.email,
        socials: { instagram: "@stuy_student", discord: "stuy#111" },
        schedule: { period1: classItem.id }
      });
      Alert.alert("Success", `Assigned ${classItem.className} to Period 1!`);
    }
  };

  const handleViewClassmates = async () => {
    if (!mySchedule.period1) return;
    const list = await findClassmates(1, mySchedule.period1.id);
    const others = list.filter(item => item.id !== user?.uid);
    setClassmates(others);
  };

  // 5. ONE SINGLE TOP-LEVEL RETURN STATEMENT
  return (
    <View style={styles.container}>
      {user ? (
        // 🟢 SCREEN FOR LOGGED-IN STUDENTS
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Hey, {user.displayName || "Student"}!</Text>
            <Button title="Sign Out" onPress={handleLogout} color="#FF3B30" />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Search to add class to Period 1..."
            value={searchQuery}
            onChangeText={handleSearch}
          />

          {filteredClasses.length > 0 && (
            <FlatList
              data={filteredClasses}
              keyExtractor={(item) => item.id}
              style={styles.dropdown}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelectClass(item)}>
                  <Text>{item.className} (Period {item.period})</Text>
                </TouchableOpacity>
              )}
            />
          )}

          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionHeader}>Your Schedule</Text>
            <TouchableOpacity style={styles.periodRow} onPress={handleViewClassmates}>
              <Text style={styles.periodLabel}>Period 1</Text>
              <Text style={styles.classLabel}>
                {mySchedule.period1 ? `${mySchedule.period1.className} (Tap to see classmates)` : "No Class Added"}
              </Text>
            </TouchableOpacity>
          </View>

          {classmates.length > 0 && (
            <View style={styles.classmatesContainer}>
              <Text style={styles.sectionHeader}>Classmates</Text>
              <FlatList
                data={classmates}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.classmateRow}>
                    <Text style={styles.classmateName}>{item.name}</Text>
                    <Text style={styles.classmateSocial}>Insta: {item.socials?.instagram || "N/A"} | Discord: {item.socials?.discord || "N/A"}</Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      ) : (
        // 🔴 SCREEN FOR LOGGED-OUT STUDENTS
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Stuy Connects</Text>
          <Button title="Sign in with Google" onPress={handleLogin} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 30, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 18, fontWeight: 'bold' },
  input: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, fontSize: 16 },
  dropdown: { maxHeight: 120, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginTop: 5 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  scheduleContainer: { marginTop: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 8, backgroundColor: '#fafafa' },
  periodLabel: { fontWeight: 'bold' },
  classLabel: { color: '#007AFF' },
  classmatesContainer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15, flex: 1 },
  classmateRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  classmateName: { fontSize: 16, fontWeight: 'bold' },
  classmateSocial: { fontSize: 14, color: '#666' },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loginTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
});
