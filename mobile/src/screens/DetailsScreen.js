import React, { useEffect } from 'react';
import { View, Text } from 'react-native';

export default function DetailsScreen() {
    useEffect(() => { console.log('Details mounted'); }, []);
    return (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
            <Text>Details</Text>
        </View>
    );
}
