import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function IncidentsScreen(){
    
    return (
        <View style={styles.container}>
            <Text>Incidencias</Text>
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