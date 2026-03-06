import React, { useState } from "react";
import { StyleSheet, View,TouchableWithoutFeedback,Keyboard, ScrollView  } from "react-native";
import { Card, Text, Button, TextInput } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';
import {useForm, Controller} from 'react-hook-form';
import { Dropdown } from 'react-native-element-dropdown';


const customTheme = {
  colors: {
    primary: '#161616',      
    outline: '#c5c5a3',      
    onSurfaceVariant: '#666',
    surface: 'white',        
  }
};
 const facultades = [
      { label: 'Facultad de Informática', value: 'facci' },
      { label: 'Facultad de Ingeniería', value: 'faci' },
      { label: 'Empresa Pública', value: 'ep' },
    ];

  
  const carrerasPorFacultad = {
  facci: [
    { label: 'Tecnologías de la Información', value: 'ti' },
    { label: 'Software', value: 'sw' },
    { label: 'Ciencias de Datos', value: 'cd' },
  ],
  faci: [
    { label: 'Ingeniería Civil', value: 'civil' },
    { label: 'Ingeniería Eléctrica', value: 'electrica' },
  ],
  ep: [
    { label: 'Servicios Generales', value: 'servicios' },
    { label: 'Mantenimiento', value: 'mantenimiento' },
  ],
}



export default function Register() {


    const navigation = useNavigation();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
   

    const {control, handleSubmit, watch, formState: {errors}} = useForm({

      defaultValues: {
        'nombre': '',
        'apellido': '',
        'correo': '',
        'facultad': '',
        'carrera': '',
        'password': '',
        'confirmPassword': ''

      }
    });

    const selectedFacultad = watch("facultad");
    const passwordValue = watch("password");

    const carrerasDisponibles = selectedFacultad ? carrerasPorFacultad[selectedFacultad] : [];



    const onSubmit = (data) => {
    console.log("Datos para Laravel:", data);
  };



    return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
 <ScrollView contentContainerStyle={styles.scrollContainer}>
    <View style={styles.container}>
       <Card style={styles.card}>

        <Card.Title title="Registro ULEAM" titleStyle={styles.title} />

            <Card.Content>
              
              
                <Controller
                control={control}
                name="nombre"
                rules={{
                  required: "El nombre es obligatorio",
                 
                }}
                
                render={({field: {onChange, value}})=>(
                  <View style={styles.inputGap}>
                    <TextInput 
                        label="Nombre" 
                        onChangeText={onChange}
                        value={value}
                        theme={customTheme}
                        maxLength={15}
                        mode="outlined"
                        selectionColor="#000000"
                        textColor="black"
                        error={!!errors.nombre}
                        style={styles.input}
                        outlineStyle={[
                        styles.inputOutline, 
                        !!errors.nombre && styles.bordererror
                      ]}
                    />
                        {errors.nombre && <Text style={styles.errorText}>{errors.nombre.message}</Text>}               
                      </View>
                      )}
                    />
                    
                


              <Controller
                control={control}
                name="apellido"
                rules={{
                  required: "El apellido es obligatorio",
                 
                }}
                
                render={({field: {onChange, value}})=>(
                  <View style={styles.inputGap}>
                    <TextInput 
                        label="Apellido" 
                        onChangeText={onChange}
                        value={value}
                        maxLength={15}
                        theme={customTheme}
                        style={styles.input}
                        textColor="black"
                        mode="outlined" 
                        error={!!errors.apellido}
                        outlineStyle={[
                        styles.inputOutline, 
                        !!errors.apellido && styles.bordererror
                      ]}
                        
                    />
                        {errors.apellido && <Text style={styles.errorText}>{errors.apellido.message}</Text>}               
                      </View>
                      )}
                    />


            <Controller
                control={control}
                name="correo"
                rules={{
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "correo inválido"
                  }
                }}
                
                render={({field: {onChange, value}})=>(
                  <View style={styles.inputGap}>
                    <TextInput 
                        label="Correo institucional" 
                        onChangeText={onChange}
                        value={value}
                        maxLength={15}
                        theme={customTheme}
                        style={styles.input}
                        textColor="black"
                        mode="outlined" 
                        error={!!errors.correo}
                        outlineStyle={[
                        styles.inputOutline, 
                        !!errors.correo && styles.bordererror
                      ]}
                        
                    />
                        {errors.correo && <Text style={styles.errorText}>{errors.correo.message}</Text>}               
                      </View>
                      )}
                    />



                   <Controller
                    control={control}
                    name="facultad"
                    rules={{ required: "Selecciona una facultad" }}
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.inputGap}>
                        <Dropdown
                          style={[styles.dropdown, !!errors.facultad && styles.bordererror]}
                          data={facultades}
                          labelField="label"
                          theme={customTheme}
                          valueField="value"
                          placeholder="Selecciona Facultad"
                          placeholderStyle={{
                          fontSize: 16,
                          color: !!errors.facultad ? '#f2b9b6' : '#666',
                        }}
                          value={value}
                          onChange={item => onChange(item.value)} 
                        />
                        {errors.facultad && <Text style={styles.errorText}>{errors.facultad.message}</Text>}
                      </View>
                    )}
                  />
                  

                  <Controller
                    control={control}
                    name="carrera"
                    rules={{ required: "Selecciona tu carrera" }}
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.inputGap}>
                       
                        <Dropdown
                          disable={!selectedFacultad} 
                          style={[
                            styles.dropdown, 
                            !selectedFacultad && { opacity: 0.6 }, 
                            !!errors.carrera && styles.bordererror
                          ]}
                          data={carrerasDisponibles}
                          labelField="label"
                          valueField="value"
                          placeholder={selectedFacultad ? "Selecciona Carrera" : "Primero elige una facultad"}
                          placeholderStyle={{
                            fontSize: 16,
                            color: !!errors.carrera ? 'rgba(211, 47, 47, 0.6)' : '#666',
                          }}
                          selectedTextStyle={{ color: 'black' }}
                          containerStyle={{ 
                            backgroundColor: 'white', 
                                                     
                          }}
                          itemTextStyle={{ color: 'black' }}
                          value={value}
                          onChange={item => onChange(item.value)}
                        />
                    
                        {errors.carrera && <Text style={styles.errorText}>{errors.carrera.message}</Text>}
                      </View>
                    )}
                  />


                    <Controller
                      control={control}
                      name="password"
                      rules={{ 
                        required: "El nombre es obligatorio" ,
                        maxLength: {
                          value: 15,
                          message: "La contraseña no puede exceder los 15 caracteres"
                        },
                        minLength: {
                          value: 6,
                          message: "La contraseña debe tener al menos 6 caracteres"
                        }
                      
                      }}
                      render={({field: {onChange, value}})=>(
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

                    <Controller
                      control={control}
                      name="confirmPassword"
                      rules={{ 
                        required: "Debes confirmar tu contraseña",
                        validate: (value) => value === passwordValue || "Las contraseñas no coinciden" 
                      }}
                        render={({field: {onChange, value}})=>(
                      <View style={styles.inputGap}>
                        <TextInput 
                            label="Confirmar contraseña" 
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry={!isPasswordVisible} 
                            maxLength={15}
                            mode="outlined" 
                            theme={customTheme}
                            textColor="black"
                            style={styles.input}
                            outlineStyle={[
                              styles.inputOutline, 
                              !!errors.confirmPassword && styles.bordererror
                            ]}
                            error={!!errors.confirmPassword}
                            right={
                              <TextInput.Icon 
                                  onPress={() => setIsPasswordVisible(!isPasswordVisible)} 
                                  icon={isPasswordVisible ? "eye-off" : "eye"} 
                                  color="rgba(14, 13, 13, 0.7)"
                              />
                          }
                        />
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
                       </View>
                      )}
                    />

                    
             <Card.Actions style={{ justifyContent: 'center' }}>
            
              <Button 
                mode="contained" 
                onPress={handleSubmit(onSubmit)} 
                style={styles.button}
              >
                 Registrar
          </Button>
             </Card.Actions>
                <View style={styles.row}>
                    <Text style={styles.link2}>¿Ya tienes una cuenta?</Text>
                    <Text style={styles.link} onPress={() => navigation.replace("login")}> Iniciar sesión</Text>
                </View>

                
            </Card.Content>
        </Card>
    </View>
      </ScrollView>
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

    scrollContainer: { 
        paddingVertical: 40 
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
  dropdown: {
    height: 50,
    borderColor: '#c5c5a3',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    backgroundColor: 'white',
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

