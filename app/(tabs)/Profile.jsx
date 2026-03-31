import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppContext } from '../../src/context/AppContext';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function ProfileScreen(){

    const { logout, token } = useAppContext();
    const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Avisamos al Backend (Opcional pero recomendado)
      await fetch('http://192.168.100.9:8000/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      console.log("2. Servidor avisado");
    } catch (e) {
      console.log("El servidor no respondió, pero cerraremos sesión igual");
    } finally {
      // 2. Pase lo que pase con el servidor, cerramos sesión en la App
      console.log("3. Ejecutando logout local...");
      logout();
      

    }
    };
    return (
        <View style={styles.container}>
            <Text>Perfil</Text>

            <Button 
      mode="contained" 
      onPress={handleLogout}
      buttonColor="#B00020" // Un rojo para indicar "salir"
    >
      Cerrar Sesión
    </Button>
        </View>
    );
}
const styles = StyleSheet.create({

    container:{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    }
    

})