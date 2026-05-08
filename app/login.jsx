import React, { useState } from "react";
import { Alert, Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useAppContext } from '../src/context/AppContext';
import { buildApiUrl } from '../src/services/api';
import { extractAuthPayload } from '../src/services/auth';

const customTheme = {
  colors: {
    primary: '#0f2f29',
    outline: '#cad7d2',
    onSurfaceVariant: '#64746f',
    surface: 'white',
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAppContext();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, setError, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (formData) => {
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        const { user, token } = extractAuthPayload(result);

        if (!token) {
          Alert.alert("Error de autenticación", "El backend respondió sin token de acceso.");
          return;
        }

        login(user, token);
        router.replace('/');
      } else if (result.errors) {
        Object.keys(result.errors).forEach((key) => {
          setError(key, { type: "server", message: result.errors[key][0] });
        });
      } else if (result.message) {
        const errorMsg = result.message.toLowerCase();

        if (errorMsg.includes('contraseña')) {
          setError("password", { type: "server", message: result.message });
        } else {
          setError("email", { type: "server", message: result.message });
        }
      }
    } catch (error) {
      console.error("Error de conexión técnica:", error.message);
      Alert.alert("Error de Red", "No hay conexión con el servidor de la Uleam. Revisa tu internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#f3f7f5', '#eef3f0', '#f8faf9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <View style={styles.shell}>
          <View style={styles.card}>
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>
              Accede al sistema para consultar tareas, incidencias y seguimiento operativo.
            </Text>

            <Controller
              control={control}
              name="email"
              rules={{
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Correo inválido"
                }
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
                    textColor="#18201d"
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={!!errors.email}
                    outlineStyle={styles.inputOutline}
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
                required: "La contraseña es obligatoria",
                maxLength: {
                  value: 40,
                  message: "La contraseña no puede exceder los 40 caracteres"
                },
                minLength: {
                  value: 5,
                  message: "La contraseña debe tener al menos 5 caracteres"
                }
              }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <TextInput
                    label="Contraseña"
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!isPasswordVisible}
                    maxLength={40}
                    mode="outlined"
                    theme={customTheme}
                    style={styles.input}
                    textColor="#18201d"
                    outlineStyle={styles.inputOutline}
                    error={!!errors.password}
                    right={
                      <TextInput.Icon
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        icon={isPasswordVisible ? "eye-off" : "eye"}
                        color="#4e625d"
                      />
                    }
                  />
                  <HelperText type="error" visible={!!errors.password}>
                    {errors.password?.message}
                  </HelperText>
                </View>
              )}
            />

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.primaryButton}
              buttonColor="#0f2f29"
              textColor="#f4f7f5"
              loading={loading}
              contentStyle={styles.primaryButtonContent}
            >
              Entrar
            </Button>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => router.replace("Register")}>
                <Text style={styles.footerLink}>Registrarse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 22,
  },
  shell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: '#dce7e2',
    shadowColor: '#0f2f29',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    color: '#16221e',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#687974',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },
  field: {
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fbfcfb',
  },
  inputOutline: {
    borderRadius: 18,
    borderColor: '#c8d5d0',
  },
  primaryButton: {
    borderRadius: 18,
    marginTop: 8,
  },
  primaryButtonContent: {
    height: 54,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },
  footerText: {
    color: '#62736f',
    fontSize: 15,
  },
  footerLink: {
    color: '#0f2f29',
    fontSize: 15,
    fontWeight: '800',
  },
});
