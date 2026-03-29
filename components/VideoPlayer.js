import React from 'react';
import { Text, View } from 'react-native';

export default function VideoPlayer({ video }) {
  return (
    <View style={{ padding: 16, borderWidth: 1, borderColor: '#d4d4d4', borderRadius: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>Video Player Placeholder</Text>
      <Text>{video?.title || 'No active video selected yet.'}</Text>
    </View>
  );
}
