import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import ClassPicker from '../components/ClassPicker';
import { fetchTeachers, addTeacher, fetchResources, addResource } from '../database';
import { colors, shared } from '../theme';

// Accepts "example.com/foo" or "https://example.com/foo"; only http(s) links are allowed.
const normalizeUrl = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(withScheme) ? withScheme : null;
};

export default function ResourcesScreen({ user, classes }) {
  const [tab, setTab] = useState('teachers');
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Teacher form
  const [teacherName, setTeacherName] = useState('');
  const [teacherRoom, setTeacherRoom] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');

  // Study link form
  const [pickedClass, setPickedClass] = useState(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teacherList, resourceList] = await Promise.all([fetchTeachers(), fetchResources()]);
      setTeachers(teacherList);
      setResources(resourceList);
    } catch (error) {
      console.error('Error loading resources:', error);
      Alert.alert('Could not load resources', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const switchTab = (next) => {
    setTab(next);
    setFilter('');
    setShowForm(false);
  };

  const term = filter.trim().toLowerCase();

  const visibleTeachers = useMemo(
    () =>
      teachers.filter(
        (t) =>
          !term ||
          (t.name || '').toLowerCase().includes(term) ||
          (t.subject || '').toLowerCase().includes(term) ||
          (t.room || '').toLowerCase().includes(term)
      ),
    [teachers, term]
  );

  const visibleResources = useMemo(
    () =>
      resources.filter(
        (r) =>
          !term ||
          (r.className || '').toLowerCase().includes(term) ||
          (r.title || '').toLowerCase().includes(term)
      ),
    [resources, term]
  );

  const handleAddTeacher = async () => {
    const name = teacherName.trim();
    const room = teacherRoom.trim();
    if (name.length < 2 || !room) {
      Alert.alert('Almost there', 'Please enter the teacher name and room number.');
      return;
    }
    setSaving(true);
    try {
      await addTeacher({ name, room, subject: teacherSubject.trim(), authorId: user.uid });
      setTeacherName('');
      setTeacherRoom('');
      setTeacherSubject('');
      setShowForm(false);
      await load();
    } catch (error) {
      Alert.alert('Could not add teacher', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    const title = linkTitle.trim();
    const url = normalizeUrl(linkUrl);
    if (!pickedClass) {
      Alert.alert('Pick a class', 'Search for the class this link is for.');
      return;
    }
    if (title.length < 2) {
      Alert.alert('Add a title', 'Give the link a short title.');
      return;
    }
    if (!url) {
      Alert.alert('Check the link', 'Please enter a valid http or https link.');
      return;
    }
    setSaving(true);
    try {
      await addResource({
        classId: pickedClass.id,
        className: pickedClass.className,
        title,
        url,
        authorId: user.uid,
      });
      setPickedClass(null);
      setLinkTitle('');
      setLinkUrl('');
      setShowForm(false);
      await load();
    } catch (error) {
      Alert.alert('Could not add link', error.message);
    } finally {
      setSaving(false);
    }
  };

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Could not open link', url);
    }
  };

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.tabs}>
        {[
          ['teachers', 'Teachers'],
          ['links', 'Study links'],
        ].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => switchTab(key)}
          >
            <Text style={tab === key ? styles.tabTextActive : styles.tabText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={shared.input}
        placeholder={tab === 'teachers' ? 'Search teachers, subjects, rooms...' : 'Search classes or links...'}
        value={filter}
        onChangeText={setFilter}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={shared.button} onPress={() => setShowForm((v) => !v)}>
        <Text style={shared.buttonText}>
          {showForm ? 'Cancel' : tab === 'teachers' ? 'Add a teacher' : 'Share a study link'}
        </Text>
      </TouchableOpacity>

      {showForm && tab === 'teachers' && (
        <View style={styles.form}>
          <TextInput style={shared.input} placeholder="Teacher name" value={teacherName} onChangeText={setTeacherName} maxLength={60} />
          <TextInput style={shared.input} placeholder="Room number" value={teacherRoom} onChangeText={setTeacherRoom} maxLength={20} />
          <TextInput style={shared.input} placeholder="Subject (optional)" value={teacherSubject} onChangeText={setTeacherSubject} maxLength={60} />
          <TouchableOpacity style={[shared.button, saving && shared.buttonDisabled]} onPress={handleAddTeacher} disabled={saving}>
            <Text style={shared.buttonText}>{saving ? 'Saving...' : 'Save teacher'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showForm && tab === 'links' && (
        <View style={styles.form}>
          {pickedClass ? (
            <TouchableOpacity style={styles.picked} onPress={() => setPickedClass(null)}>
              <Text style={shared.cardTitle}>{pickedClass.className}</Text>
              <Text style={shared.linkText}>Change class</Text>
            </TouchableOpacity>
          ) : (
            <ClassPicker classes={classes} onSelect={setPickedClass} placeholder="Which class is this for?" />
          )}
          <TextInput style={shared.input} placeholder="Title (e.g. Unit 3 review sheet)" value={linkTitle} onChangeText={setLinkTitle} maxLength={100} />
          <TextInput
            style={shared.input}
            placeholder="Link (https://...)"
            value={linkUrl}
            onChangeText={setLinkUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            maxLength={500}
          />
          <TouchableOpacity style={[shared.button, saving && shared.buttonDisabled]} onPress={handleAddLink} disabled={saving}>
            <Text style={shared.buttonText}>{saving ? 'Saving...' : 'Save link'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : tab === 'teachers' ? (
        visibleTeachers.length === 0 ? (
          <Text style={shared.empty}>No teachers found.</Text>
        ) : (
          visibleTeachers.map((t) => (
            <View key={t.id} style={shared.card}>
              <Text style={shared.cardTitle}>{t.name}</Text>
              <Text style={shared.muted}>
                Room {t.room}
                {t.subject ? ` · ${t.subject}` : ''}
              </Text>
            </View>
          ))
        )
      ) : visibleResources.length === 0 ? (
        <Text style={shared.empty}>No study links found.</Text>
      ) : (
        visibleResources.map((r) => (
          <TouchableOpacity key={r.id} style={shared.card} onPress={() => openLink(r.url)}>
            <Text style={shared.cardTitle}>{r.title}</Text>
            <Text style={shared.muted}>{r.className}</Text>
            <Text style={shared.linkText} numberOfLines={1}>
              {r.url}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.muted },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  form: { marginBottom: 10 },
  picked: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
});
