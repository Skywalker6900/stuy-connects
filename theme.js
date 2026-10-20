import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#007AFF',
  danger: '#FF3B30',
  text: '#111',
  muted: '#666',
  border: '#e2e2e2',
  surface: '#fafafa',
};

// Styles shared by several screens.
export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: colors.text },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 90, paddingTop: 10, textAlignVertical: 'top' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  linkText: { color: colors.primary, fontSize: 14 },
  dangerText: { color: colors.danger, fontSize: 14 },
});
