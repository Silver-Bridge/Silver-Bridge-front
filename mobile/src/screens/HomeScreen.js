import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <View className="flex-1 items-center justify-center bg-paper">
                 <Text className="text-2xl font-bold mb-4">Home</Text>

            <Pressable className="px-4 py-2 rounded-2xl bg-brand mb-2"
                       onPress={() => navigation.navigate('Details')}>
                <Text className="text-white font-semibold">Go Details</Text>
            </Pressable>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Card Title</Text>
                <Text>Card content…</Text>
            </View>
        </View>
    );
}



const styles = StyleSheet.create({
    card: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        marginTop: 16,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
});
