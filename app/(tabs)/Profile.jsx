import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ProfileScreen(){


    return (
        <View style={styles.container}>
            <Text>Perfil</Text>
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