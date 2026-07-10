import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { HelperText, TextInput } from "react-native-paper";
import { useAppContext } from "../src/context/AppContext";
import { useToast } from "../src/components/Toast";
import { buildApiUrl, getApiErrorMessage } from "../src/services/api";
import { extractAuthPayload } from "../src/services/auth";

const customTheme = {
  colors: {
    primary: "#2D3FE0",
    outline: "#C9D4FF",
    onSurfaceVariant: "#8F95B2",
    surface: "#FFFFFF",
    error: "#F43F5E",
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAppContext();
  const toast = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData) => {
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/login"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        const { user, token } = extractAuthPayload(result);

        if (!token) {
          toast.error("Error de autenticacion", "El backend respondio sin token de acceso.");
          return;
        }

        login(user, token);
        router.replace("/");
      } else if (result.errors) {
        Object.keys(result.errors).forEach((key) => {
          setError(key, { type: "server", message: result.errors[key][0] });
        });
      } else if (result.message) {
        const errorMsg = result.message.toLowerCase();

        if (errorMsg.includes("contrasena")) {
          setError("password", { type: "server", message: result.message });
        } else {
          setError("email", { type: "server", message: result.message });
        }
      }
    } catch (error) {
      console.error("Error de conexion tecnica:", error.message);
      toast.error("Error de red", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                source={require("../assets/images/logo-sgm-uleam-sinfondo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.eyebrow}>SGM Uleam</Text>
            <Text style={styles.title}>Iniciar sesion</Text>
          </View>

          <View style={styles.card}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Correo invalido",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    label="Correo institucional"
                    onChangeText={onChange}
                    value={value}
                    maxLength={60}
                    theme={customTheme}
                    style={styles.input}
                    textColor="#1A1F36"
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={!!errors.email}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="email-outline" color="#4A6CF7" />}
                  />
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: "La contrasena es obligatoria",
                maxLength: {
                  value: 40,
                  message: "La contrasena no puede exceder los 40 caracteres",
                },
                minLength: {
                  value: 5,
                  message: "La contrasena debe tener al menos 5 caracteres",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    label="Contrasena"
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!isPasswordVisible}
                    maxLength={40}
                    mode="outlined"
                    theme={customTheme}
                    style={styles.input}
                    textColor="#1A1F36"
                    outlineStyle={styles.inputOutline}
                    error={!!errors.password}
                    left={<TextInput.Icon icon="lock-outline" color="#4A6CF7" />}
                    right={
                      <TextInput.Icon
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        icon={isPasswordVisible ? "eye-off" : "eye"}
                        color="#8F95B2"
                      />
                    }
                  />
                  <HelperText type="error" visible={!!errors.password}>
                    {errors.password?.message}
                  </HelperText>
                </View>
              )}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={styles.primaryButton}
            >
              <LinearGradient
                colors={["#2D3FE0", "#4A6CF7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonInner}
              >
                {loading && <ActivityIndicator size="small" color="#ffffff" />}
                <Text style={styles.primaryButtonText}>Entrar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    gap: 6,
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#2D3FE0",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  eyebrow: {
    color: "#4A6CF7",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  title: {
    color: "#1A1F36",
    fontSize: 28,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: "#4A6CF7",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  field: {
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#ffffff",
  },
  inputOutline: {
    borderRadius: 16,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 8,
  },
  primaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
