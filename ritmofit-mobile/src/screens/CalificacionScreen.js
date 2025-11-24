import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { getClaseById } from '../services/claseService';
import api from '../services/api';

export const CalificacionScreen = ({ route, navigation }) => {
  const { claseId } = route.params;
  const { user } = useAuthStore();
  const [clase, setClase] = useState(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClase = async () => {
      try {
        const data = await getClaseById(claseId);
        setClase(data);
      } catch (err) {
        Alert.alert('Error', 'No se pudo cargar la clase.');
      }
    };
    fetchClase();
  }, [claseId]);

  const enviarCalificacion = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Calificación inválida', 'Selecciona entre 1 y 5 estrellas.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/calificaciones', {
        userId: user.id,
        claseId,
        rating,
        comentario,
      });
      Alert.alert('Gracias', 'Tu calificación fue enviada.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la calificación.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((num) => (
          <TouchableOpacity key={num} onPress={() => setRating(num)}>
            <Text style={[styles.star, rating >= num ? styles.starSelected : styles.starUnselected]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!clase) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calificar Clase</Text>
      <Text style={styles.claseNombre}>{clase.nombre}</Text>
      <Text style={styles.claseDetalle}>{clase.disciplina} • {clase.fecha}</Text>

      <Text style={styles.label}>Tu calificación</Text>
      {renderStars()}

      <Text style={styles.label}>Comentario (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe tu opinión..."
        multiline
        value={comentario}
        onChangeText={setComentario}
      />

      <TouchableOpacity style={styles.button} onPress={enviarCalificacion} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center', color: '#1f2937' },
  claseNombre: { fontSize: 18, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  claseDetalle: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, marginBottom: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  star: { fontSize: 32, marginHorizontal: 6 },
  starSelected: { color: '#facc15' },
  starUnselected: { color: '#d1d5db' },
});