import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { GUIDE_SECTIONS } from '../guideContent';
import { shared } from '../theme';

export default function GuideScreen() {
  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.scroll}>
      <Text style={shared.sectionHeader}>Maximizing Your Classes</Text>
      {GUIDE_SECTIONS.map((section) => (
        <View key={section.title} style={shared.card}>
          <Text style={shared.cardTitle}>{section.title}</Text>
          {section.tips.map((tip) => (
            <Text key={tip} style={{ marginTop: 6 }}>
              • {tip}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
