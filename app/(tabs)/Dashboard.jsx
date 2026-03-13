import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, IconButton } from 'react-native-paper';
import { useAppContext } from '../../src/context/AppContext';



 

export default function DashboardScreen() {


  const { user } = useAppContext();

  return (
    <ScrollView style={styles.containerç}>
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge" style={styles.userName}>Hola, {user ? user.name : 'Invitado'}</Text>
        </View>
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Estado de Limpieza</Text>
        

        <View style={styles.row}>
          <Card style={[styles.all_tasks, {backgroundColor: '#4336f4'}]}>
            <Card.Content>
              <Text style={styles.textcard} >Totales</Text>
              <Text  style={{fontWeight: 'bold', color: '#333', fontSize: 24}}>03</Text>
            </Card.Content>
          </Card>
        </View>
        <View style={styles.row}>
          <Card style={[styles.statCard, {backgroundColor: '#F5CF27'}]}>
            <Card.Content>
              <Text style={styles.textcard} >Pendientes</Text>
              <Text  style={{fontWeight: 'bold', color: '#333', fontSize: 24}}>05</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, {backgroundColor: '#4caf50'}]}>
            <Card.Content>
              <Text style={styles.textcard}>Resueltos</Text>
              <Text style={{fontWeight: 'bold', color: '#333', fontSize: 24}}>12</Text>
            </Card.Content>
          </Card>
        </View>

      <View style={styles.textTask}>
        <View>
          <Text variant="titleLarge" style={styles.userName}>Asignar Tarea</Text>
        </View>
      </View>

      
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    paddingTop: 80,
    elevation: 4,
  },
  textTask:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    elevation: 4,
  },

  userName: {
    fontWeight: 'bold',
    color: '#000',
  },
  textcard:{
    fontSize: 20,
     color: '#333',
      marginBottom: 5,
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
  all_tasks: {
    width: '100%',
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    paddingBottom: 30,
  },
  row: {
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
  },

});