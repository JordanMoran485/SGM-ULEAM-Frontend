import React, { useEffect, useState } from "react";
import { Alert, Keyboard, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { Dropdown } from 'react-native-element-dropdown';
import { useAppContext } from '../src/context/AppContext';
import { buildApiUrl } from '../src/services/api';
import { extractAuthPayload } from '../src/services/auth';
import { getRegistrationCatalogs } from '../src/services/catalogs';

const customTheme = {
  colors: {
    primary: '#0f2f29',
    outline: '#cad7d2',
    onSurfaceVariant: '#64746f',
    surface: 'white',
  }
};

export default function RegisterScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [facultades, setFacultades] = useState([]);
  const { login } = useAppContext();
  const router = useRouter();

  const { control, handleSubmit, watch, setError, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      lastname: '',
      email: '',
      facultad_id: '',
      password: '',
      confirmPassword: ''
    }
  });

  const passwordValue = watch("password");

  useEffect(() => {
    const loadCatalogs = async () => {
      setCatalogLoading(true);
      setCatalogError('');

      try {
        const catalogs = await getRegistrationCatalogs();
        setFacultades(catalogs.facultades);
      } catch (error) {
        console.error('Error cargando catálogos:', error);
        setCatalogError('No se pudieron cargar las facultades desde la base de datos.');
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  const onSubmit = async (formData) => {
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        lastname: formData.lastname,
        email: formData.email,
        facultad_id: Number(formData.facultad_id),
        password: formData.password,
      };

      const response = await fetch(buildApiUrl('/api/register'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        const { user, token } = extractAuthPayload(result);

        if (!token) {
          Alert.alert("Error de autenticación", "El backend respondió sin token de acceso.");
          return;
        }

        login(user, token);
        Alert.alert("Éxito", "Usuario registrado exitosamente.");
        router.replace('/');
      } else if (result.errors) {
        Object.keys(result.errors).forEach((key) => {
          setError(key, {
            type: "server",
            message: result.errors[key][0],
          });
        });
      } else {
        Alert.alert("Atención", result.message || "Ocurrió un error inesperado");
      }
    } catch (error) {
      console.error("Error en submit:", error);
      Alert.alert("Error de Conexión", "No se pudo establecer contacto con el servidor de la Uleam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#f4f7f5', '#eef3f0', '#f8faf9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>REGISTRO</Text>
          <Text style={styles.title}>Crear cuenta institucional</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Registro institucional</Text>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: "El nombre es obligatorio" }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <TextInput
                        label="Nombre"
                        onChangeText={onChange}
                        value={value}
                        theme={customTheme}
                        maxLength={30}
                        mode="outlined"
                        textColor="#18201d"
                        error={!!errors.name}
                        style={styles.input}
                        outlineStyle={styles.inputOutline}
                      />
                      <HelperText type="error" visible={!!errors.name}>{errors.name?.message}</HelperText>
                    </>
                  )}
                />
              </View>

              <View style={[styles.field, styles.halfField]}>
                <Controller
                  control={control}
                  name="lastname"
                  rules={{ required: "El apellido es obligatorio" }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <TextInput
                        label="Apellido"
                        onChangeText={onChange}
                        value={value}
                        theme={customTheme}
                        maxLength={30}
                        mode="outlined"
                        textColor="#18201d"
                        error={!!errors.lastname}
                        style={styles.input}
                        outlineStyle={styles.inputOutline}
                      />
                      <HelperText type="error" visible={!!errors.lastname}>{errors.lastname?.message}</HelperText>
                    </>
                  )}
                />
              </View>
            </View>

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
                    maxLength={80}
                    theme={customTheme}
                    style={styles.input}
                    textColor="#18201d"
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={!!errors.email}
                    outlineStyle={styles.inputOutline}
                  />
                  <HelperText type="error" visible={!!errors.email}>{errors.email?.message}</HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="facultad_id"
              rules={{ required: "Selecciona una facultad" }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Dropdown
                    disable={catalogLoading || facultades.length === 0}
                    style={[styles.dropdown, !!errors.facultad_id && styles.dropdownError]}
                    data={facultades}
                    labelField="label"
                    valueField="value"
                    placeholder={catalogLoading ? "Cargando facultades..." : "Selecciona facultad"}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelected}
                    itemTextStyle={styles.dropdownItem}
                    value={value}
                    onChange={(item) => onChange(item.value)}
                  />
                  <HelperText type="error" visible={!!errors.facultad_id}>{errors.facultad_id?.message}</HelperText>
                </View>
              )}
            />

            {catalogError ? (
              <Text style={styles.catalogError}>{catalogError}</Text>
            ) : null}

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
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
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres"
                    }
                  }}
                  render={({ field: { onChange, value } }) => (
                    <>
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
                      <HelperText type="error" visible={!!errors.password}>{errors.password?.message}</HelperText>
                    </>
                  )}
                />
              </View>

              <View style={[styles.field, styles.halfField]}>
                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{
                    required: "Confirma tu contraseña",
                    validate: (value) => value === passwordValue || "Las contraseñas no coinciden"
                  }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <TextInput
                        label="Confirmar"
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!isPasswordVisible}
                        maxLength={40}
                        mode="outlined"
                        theme={customTheme}
                        textColor="#18201d"
                        style={styles.input}
                        outlineStyle={styles.inputOutline}
                        error={!!errors.confirmPassword}
                      />
                      <HelperText type="error" visible={!!errors.confirmPassword}>{errors.confirmPassword?.message}</HelperText>
                    </>
                  )}
                />
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.primaryButton}
              buttonColor="#0f2f29"
              textColor="#f4f7f5"
              loading={loading}
              disabled={catalogLoading || !!catalogError}
              contentStyle={styles.primaryButtonContent}
            >
              Crear cuenta
            </Button>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => router.replace("Login")}>
                <Text style={styles.footerLink}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 56,
  },
  hero: {
    gap: 10,
    marginBottom: 18,
  },
  kicker: {
    color: '#5b6f69',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: '#13211c',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#dce7e2',
    shadowColor: '#0f2f29',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    color: '#13211c',
    fontSize: 24,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    marginBottom: 4,
  },
  halfField: {
    flex: 1,
  },
  input: {
    backgroundColor: '#fcfdfb',
  },
  inputOutline: {
    borderRadius: 18,
    borderColor: '#c8d5d0',
  },
  dropdown: {
    height: 56,
    borderColor: '#c8d5d0',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: '#fcfdfb',
  },
  dropdownError: {
    borderColor: '#b3261e',
  },
  dropdownPlaceholder: {
    color: '#70817b',
    fontSize: 15,
  },
  dropdownSelected: {
    color: '#18201d',
    fontSize: 15,
  },
  dropdownItem: {
    color: '#18201d',
  },
  catalogError: {
    color: '#b3261e',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
    marginBottom: 10,
  },
  primaryButton: {
    borderRadius: 18,
    marginTop: 10,
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
    color: '#5b6b66',
    fontSize: 15,
  },
  footerLink: {
    color: '#0f2f29',
    fontSize: 15,
    fontWeight: '800',
  },
});
