import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { searchClasses } from '../classes';
import { colors, shared } from '../theme';

// Search box with a live autocomplete dropdown over the master class list.
export default function ClassPicker({ classes, onSelect, placeholder = 'Search for a class...' }) {
  const [text, setText] = useState('');
  const results = useMemo(() => searchClasses(classes, text), [classes, text]);

  const handlePick = (item) => {
    setText('');
    onSelect(item);
  };

  return (
    <View>
      <TextInput
        style={shared.input}
        placeholder={placeholder}
        value={text}
        onChangeText={setText}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {text.trim() !== '' && (
        <View style={styles.dropdown}>
          {results.length === 0 ? (
            <Text style={styles.none}>No matching classes</Text>
          ) : (
            results.map((item) => (
              <TouchableOpacity key={item.id} style={styles.item} onPress={() => handlePick(item)}>
                <Text style={styles.name}>{item.className}</Text>
                <Text style={shared.muted}>
                  Period {item.period ?? '?'}
                  {item.teacher ? ` · ${item.teacher}` : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 16, color: colors.text },
  none: { padding: 12, color: colors.muted },
});
