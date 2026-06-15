import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Keyboard, ScrollView, StyleSheet,
  Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HelperText, TextInput } from "react-native-paper";
import { Dropdown } from 'react-native-element-dropdown';
import { useAppContext } from '../src/context/AppContext';
import { useToast } from '../src/components/Toast';
import { buildApiUrl } from '../src/services/api';
import { extractAuthPayload } from '../src/services/auth';
import { getRegistrationCatalogs } from '../src/services/catalogs';

const customTheme = {
  colors: {
    primary: '#2D3FE0',
    outline: '#C9D4FF',
    onSurfaceVariant: '#8F95B2',
    surface: '#FFFFFF',
    error: '#F43F5E',
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
  const toast = useToast();

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
          toast.error('Error de autenticación', 'El backend respondió sin token de acceso.');
          return;
        }

        login(user, token);
        toast.success('Cuenta creada', 'Usuario registrado exitosamente.');
        router.replace('/');
      } else if (result.errors) {
        Object.keys(result.errors).forEach((key) => {
          setError(key, {
            type: "server",
            message: result.errors[key][0],
          });
        });
      } else {
        toast.warning('Atención', result.message || 'Ocurrió un error inesperado.');
      }
    } catch (error) {
      console.error("Error en submit:", error);
      toast.error('Error de conexión', 'No se pudo establecer contacto con el servidor de la Uleam.');
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled = loading || catalogLoading || !!catalogError;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Encabezado ── */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#2D3FE0', '#4A6CF7', '#7B9FFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <View style={styles.logoDeco} />
              <MaterialCommunityIcons name="account-plus-outline" size={36} color="rgba(255,255,255,0.95)" />
            </LinearGradient>
            <Text style={styles.eyebrow}>SGM Uleam</Text>
            <Text style={styles.title}>Crear cuenta</Text>
          </View>

          {/* ── Card del formulario ── */}
          <View style={styles.card}>
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
                        textColor="#1A1F36"
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
                        textColor="#1A1F36"
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
                    textColor="#1A1F36"
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={!!errors.email}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="email-outline" color="#4A6CF7" />}
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
                    containerStyle={styles.dropdownContainer}
                    activeColor="#E8EDFF"
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
                        textColor="#1A1F36"
                        outlineStyle={styles.inputOutline}
                        error={!!errors.password}
                        right={
                          <TextInput.Icon
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            icon={isPasswordVisible ? "eye-off" : "eye"}
                            color="#8F95B2"
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
                        textColor="#1A1F36"
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

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit(onSubmit)}
              disabled={submitDisabled}
              style={[styles.primaryButton, submitDisabled && styles.primaryButtonDisabled]}
            >
              <LinearGradient
                colors={['#2D3FE0', '#4A6CF7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonInner}
              >
                {loading && <ActivityIndicator size="small" color="#ffffff" />}
                <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace("Login")}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#2D3FE0',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  logoDeco: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  eyebrow: {
    color: '#4A6CF7',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    color: '#1A1F36',
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: '#4A6CF7',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
    backgroundColor: '#ffffff',
  },
  inputOutline: {
    borderRadius: 16,
  },
  dropdown: {
    height: 56,
    borderColor: '#C9D4FF',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginTop: 6,
  },
  dropdownError: {
    borderColor: '#F43F5E',
  },
  dropdownPlaceholder: {
    color: '#8F95B2',
    fontSize: 15,
  },
  dropdownSelected: {
    color: '#1A1F36',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownItem: {
    color: '#1A1F36',
  },
  dropdownContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  catalogError: {
    color: '#F43F5E',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
    marginBottom: 10,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    color: '#8F95B2',
    fontSize: 14,
    fontWeight: '500',
  },
  footerLink: {
    color: '#2D3FE0',
    fontSize: 14,
    fontWeight: '800',
  },
});
