// screens/main/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel Principal</Text>
            <Text>Aquí se mostrarán noticias, próximas clases reservadas y saludos.</Text>
        </View>
    );
};
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 } });
export default HomeScreen;