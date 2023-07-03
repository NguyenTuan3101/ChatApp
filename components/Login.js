import React, { useState, useEffect, useContext } from 'react';
import {ActivityIndicator, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import validator from "validator";
import { withTheme } from '@rneui/themed';

import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import { showToast } from '../utils';
import UserContext from '../context';
import { SafeAreaView } from 'react-native-safe-area-context';
import {GoogleSocialButton} from 'react-native-social-buttons'
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const Login = withTheme(props => {
  const { theme } = props;
  const { navigate } =  props.navigation;
  const { setCurrentUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    return () => {
      setIsLoading(false);
    }
  }, []);

  //google
  const [request, response, promptAsync] = Google.useAuthRequest({
    responseType: "id_token",
    expoClientId:'731270731716-vpjise0omcgfnna8sjfnn0td25kd3obq.apps.googleusercontent.com',
    iosClientId:'731270731716-1s0h84j24ul0jkfpr2q5cbt2hipj3ss8.apps.googleusercontent.com',
    androidClientId:'731270731716-i8por7jf3gouqc2fl5562ct52r6tohv3.apps.googleusercontent.com',
  });

  useEffect(() => {
    if(response?.type == "success"){
      const {id_token} = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  const login = async () => {
    if (validator.isEmpty(email)) {
      setIsLoading(false);
      showToast('error', 'Error', 'Please enter your email');
      return;
    }
    if (!validator.isEmail(email)) {
      setIsLoading(false);
      showToast('error', 'Error', 'Your email is not valid');
      return;
    }
    if (validator.isEmpty(password)) {
      setIsLoading(false);
      showToast('error', 'Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential) {
        setCurrentUser(userCredential.user);
      } else {
        setIsLoading(false);
        showToast('error', 'Info', 'Cannot login, please try again');
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/wrong-password':
          setIsLoading(false);
          showToast('error', 'Error', 'Your password is not correct');
          break;
        default:
          showToast('error', 'Info', 'Cannot login, please try again');
          console.log(error.message)
      }
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={{
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: 20,
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{
      backgroundColor: theme.colors.background,
      flex: 1,
      padding: 20,
    }}>
     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image style={{ height: 200, width: 200 }} resizeMode={"contain"} source={require('../assets/logolight.png')} />
      </View>
      <View style={{ flex: 1 }}>
        <TextInput
          autoCapitalize='none'
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.colors.grey1}
          style={{
            borderColor: theme.colors.greyOutline,
            borderRadius: 10,
            borderWidth: 1,
            padding: 10,
            marginBottom: 10,
            fontSize: 16
          }}
        />
        <TextInput
          autoCapitalize='none'
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.grey1}
          style={{
            borderColor: theme.colors.greyOutline,
            borderRadius: 10,
            borderWidth: 1,
            padding: 10,
            marginBottom: 10,
            fontSize: 16
          }}
          secureTextEntry
        />
        <TouchableOpacity style={{
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          padding: 10,
        }} onPress={login}>
          <Text style={{
            color: theme.colors.white,
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>LOGIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{
          padding: 10,
        }} onPress={() => { navigate('Register') }}>
          <Text style={{
            textAlign: "center",
            color: theme.colors.grey4
          }}>Don't have an account?
            <Text style={{ color: theme.colors.primary }} > Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <GoogleSocialButton onPress={() => promptAsync()}>
        </GoogleSocialButton>
      </View>
      
    </SafeAreaView>
  );
  
});

export default Login;