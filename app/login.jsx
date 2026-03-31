import React, { useState } from "react";
import { StyleSheet, View, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { Card, Text, Button, TextInput } from "react-native-paper";
import { useForm, Controller } from 'react-hook-form';
import { useAppContext } from '../src/context/AppContext';
import { useRouter } from 'expo-router';


const customTheme = {
  colors: {
    primary: '#161616',
    outline: '#c5c5a3',
    onSurfaceVariant: '#666',
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
      'email': '',
      'password': '',

    }
  });
  //     ejemplo@gmail.com

  const onSubmit = async (formData) => {
  setLoading(true);

  try {
    const response = await fetch('http://192.168.100.9:8000/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok) {
      login(result.user, result.token);
      router.replace('/(tabs)/Dashboard');
    } else {
      
      if (result.errors) {
        Object.keys(result.errors).forEach((key) => {
          setError(key, { type: "server", message: result.errors[key][0] });
        });
      } 
      else if (result.message) {
        const errorMsg = result.message.toLowerCase();

        if (errorMsg.includes('contraseña')) {
          setError("password", { type: "server", message: result.message });
        } 
        else if (errorMsg.includes('correo') || errorMsg.includes('desactivada')) {
          setError("email", { type: "server", message: result.message });
        } else {
          setError("email", { type: "server", message: result.message });
        }
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

      <View style={styles.container}>
        <Card style={styles.card}>

          <Card.Title title="Login ULEAM" titleStyle={styles.title} />

          <Card.Content>

            <Controller
              control={control}
              name="email"
              rules={{
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "correo inválido"
                }
              }}

              render={({ field: { onChange, value } }) => (
                <View style={styles.inputGap}>
                  <TextInput
                    label="Correo institucional"
                    onChangeText={onChange}
                    value={value}
                    maxLength={30}
                    theme={customTheme}
                    style={styles.input}
                    textColor="black"
                    mode="outlined"
                    error={!!errors.email}
                    outlineStyle={[
                      styles.inputOutline,
                      !!errors.email && styles.bordererror
                    ]}

                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: "El nombre es obligatorio",
                maxLength: {
                  value: 15,
                  message: "La contraseña no puede exceder los 15 caracteres"
                },
                minLength: {
                  value: 5,
                  message: "La contraseña debe tener al menos 5 caracteres"
                }

              }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputGap}>
                  <TextInput
                    label="Contraseña"
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!isPasswordVisible}
                    maxLength={15}
                    mode="outlined"
                    theme={customTheme}
                    style={styles.input}
                    textColor="black"
                    outlineStyle={[
                      styles.inputOutline,
                      !!errors.password && styles.bordererror
                    ]}
                    error={!!errors.password}
                    right={
                      <TextInput.Icon
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        icon={isPasswordVisible ? "eye-off" : "eye"}
                        color="rgba(14, 13, 13, 0.7)"
                      />
                    }
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                </View>
              )}
            />
            <Card.Actions style={{ justifyContent: 'center' }}>

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                style={styles.button}
                loading={loading}
              >
                Iniciar sesión
              </Button>
            </Card.Actions>
            <View style={styles.row}>
              <Text style={styles.link2}>No tienes una cuenta?</Text>
              <Text style={styles.link} onPress={() => router.replace("Register")}> Registrarse</Text>
            </View>



          </Card.Content>
        </Card>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },

  title: {
    fontSize: 27,
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 30,
    color: '#000000',
    fontWeight: 'bold'

  },
  card: {
    width: '90%',
    maxWidth: 400,
    padding: 10,
    elevation: 4,
    backgroundColor: '#f9f9f9',
  },
  inputGap: {
    marginBottom: 15,

  },

  inputOutline: {
    borderRadius: 30,
    borderColor: '#c5c5a3',
    borderWidth: 1,
    backgroundColor: 'white',
  },

  input: {
    backgroundColor: 'white',

  },

  button: {
    marginTop: 30,
    paddingVertical: 10,
    borderRadius: 20,
    width: '100%',

  },

  bordererror: {
    borderColor: 'red'

  },

  row: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 14,
  },


  errorText: {
    color: 'red',
    fontSize: 13,
    marginLeft: 15,
    marginTop: 5
  },

  link: {
    color: '#b0b300',
    fontWeight: 'bold',
    fontSize: 17,
  },
  link2: {
    fontSize: 17,
    color: '#000000',
  },

});