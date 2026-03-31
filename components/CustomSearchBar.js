import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SearchBar } from '@rneui/themed';
import { useState } from 'react';



export function CustomSearchBar({ onChangeText, value, placeholder }) {
   

    return (
        <View style={styles.view}>
            <SearchBar
                placeholder={placeholder}
                onChangeText={onChangeText}
                value={value}
                platform="android"
                 containerStyle={styles.searchBar}
                 //showLoading={true}
           
            />
        </View>
    );
}
const styles = StyleSheet.create({
   
    searchBar: {
        backgroundColor: "transparent",
        borderTopWidth: 0,
        borderBottomWidth: 0,
        paddingHorizontal: 15,
        marginBottom: 10,
    },
});