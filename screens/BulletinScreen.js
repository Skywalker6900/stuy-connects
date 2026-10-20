import React, { useEffect, useState } from 'react';
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
import { POST_CATEGORIES, subscribeToPosts, addPost, deletePost } from '../database';
import { colors, shared } from '../theme';

const MAX_TITLE = 100;
const MAX_BODY = 1000;

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return 'just now';
  return timestamp.toDate().toLocaleDateString();
};

export default function BulletinScreen({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(POST_CATEGORIES[0]);
  const [posting, setPosting] = useState(false);

  // Live updates: new posts appear without refreshing.
  useEffect(() => {
    const unsubscribe = subscribeToPosts(
      (list) => {
        setPosts(list);
        setLoading(false);
      },
      (error) => {
        console.error('Bulletin error:', error);
        setLoading(false);
        Alert.alert('Could not load the bulletin', error.message);
      }
    );
    return unsubscribe;
  }, []);

  const handlePost = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (cleanTitle.length < 3 || cleanBody.length < 3) {
      Alert.alert('Almost there', 'Please add a title and a short description.');
      return;
    }
    setPosting(true);
    try {
      await addPost({
        title: cleanTitle,
        body: cleanBody,
        category,
        authorId: user.uid,
        authorName: user.displayName || 'Stuy Student',
      });
      setTitle('');
      setBody('');
      setShowForm(false);
    } catch (error) {
      Alert.alert('Could not post', error.message);
    } finally {
      setPosting(false);
    }
  };

  const confirmDelete = (post) => {
    Alert.alert('Delete post?', post.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post.id);
          } catch (error) {
            Alert.alert('Could not delete', error.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.scroll} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={shared.button} onPress={() => setShowForm((v) => !v)}>
        <Text style={shared.buttonText}>{showForm ? 'Cancel' : 'New post'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <View style={styles.chips}>
            {POST_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={category === c ? styles.chipTextActive : styles.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={shared.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={MAX_TITLE}
          />
          <TextInput
            style={[shared.input, shared.multiline]}
            placeholder="What's the opportunity? Include how to contact you."
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={MAX_BODY}
          />
          <TouchableOpacity
            style={[shared.button, posting && shared.buttonDisabled]}
            onPress={handlePost}
            disabled={posting}
          >
            <Text style={shared.buttonText}>{posting ? 'Posting...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : posts.length === 0 ? (
        <Text style={shared.empty}>No posts yet. Be the first to share an opportunity!</Text>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={shared.card}>
            <Text style={styles.category}>{post.category}</Text>
            <Text style={shared.cardTitle}>{post.title}</Text>
            <Text style={styles.body}>{post.body}</Text>
            <View style={styles.footer}>
              <Text style={shared.muted}>
                {post.authorName || 'Stuy Student'} · {formatDate(post.createdAt)}
              </Text>
              {post.authorId === user.uid && (
                <TouchableOpacity onPress={() => confirmDelete(post)}>
                  <Text style={shared.dangerText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  category: { color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  body: { marginTop: 6, marginBottom: 10, color: colors.text },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});
