import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, IconButton } from 'react-native-paper';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.main}>
      {/* Cabecera de Bienvenida */}
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge" style={styles.userName}>Hola, Jordan</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Gestión de Mantenimiento ULEAM</Text>
        </View>
        <Avatar.Icon size={48} icon="account" style={{backgroundColor: '#b0b300'}} />
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Estado de Limpieza</Text>
        
        {/* Fila de Estadísticas */}
        <View style={styles.row}>
          <Card style={[styles.statCard, { borderLeftColor: '#f44336', borderLeftWidth: 5 }]}>
            <Card.Content>
              <Text variant="titleMedium">Pendientes</Text>
              <Text variant="headlineMedium" style={{fontWeight: 'bold'}}>05</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { borderLeftColor: '#4caf50', borderLeftWidth: 5 }]}>
            <Card.Content>
              <Text variant="titleMedium">Resueltos</Text>
              <Text variant="headlineMedium" style={{fontWeight: 'bold'}}>12</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Acceso Rápido o Actividad Reciente */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <Card style={styles.actionCard} onPress={() => console.log('Reportar')}>
          <Card.Title
            title="Nuevo Reporte"
            subtitle="Informa un problema en tu área"
            left={(props) => <Avatar.Icon {...props} icon="plus" style={{backgroundColor: '#e0e0e0'}} color="black" />}
            right={(props) => <IconButton {...props} icon="chevron-right" />}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    color: '#666',
  },
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
  },
  actionCard: {
    backgroundColor: 'white',
    marginBottom: 10,
  }
});