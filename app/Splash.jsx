import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.15)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace("/Login");
    });
  }, [logoScale, opacity, router]);

  return (
    <View style={styles.screen}>
      <Animated.Image
        source={require("../assets/images/logo-sgm-uleam-sinfondo.png")}
        style={[styles.logo, { opacity, transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 320,
    height: 320,
  },
});
