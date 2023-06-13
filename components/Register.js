import React, { useState, useEffect, useContext } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import validator from "validator";
import { auth, uploadImage, updateUser } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth"
import { showToast, selectImage } from "../utils";
import { Avatar, withTheme } from "@rneui/themed";
import UserContext from "../context";

const Register = withTheme(props => {
  const { theme } = props;
  const { navigate } = props.navigation;
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullname, setFullname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      flex: 1,
      padding: 20,
    },
    avatarContainer: {
      backgroundColor: theme.colors.background,
      alignItems: "center",
      marginBottom: 20,
    },
    form: {
      backgroundColor: theme.colors.background,
      justifyContent: "center",
    },
    uploadImage: {
      height: 128,
      width: 128,
    },
    uploadTitle: {
      fontSize: 18,
      fontWeight: "bold",
    },
    input: {
      borderColor: theme.colors.greyOutline,
      borderRadius: 10,
      borderWidth: 1,
      fontSize: 16,
      padding: 10,
      marginBottom: 10,
    },
    registerBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      fontSize: 18,
      padding: 10,
    },
    registerLabel: {
      color: theme.colors.white,
      fontWeight: "bold",
      textAlign: "center",
      textTransform: "uppercase",
    },

  });

  useEffect(() => {
    return () => {
      setIsLoading(false);
    }
  }, []);

  const register = async () => {
    if (validate()) {
      setIsLoading(true);

      createUserWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
        if (userCredential) {
          const url = await uploadImage("users/" + userCredential.user.uid, userAvatar ? userAvatar.uri : null);
          const user = await updateUser({ displayName: fullname, photoURL: url })
          if (user) {
            setCurrentUser(user)
            showToast("success", "Success", "Registered successful");
          } else showToast("error", "Info", "Cannot create account, please try again");
        } else {
          setIsLoading(false);
          showToast("error", "Info", "Cannot create account, please try again");
        }
      }).catch((error) => {
        setIsLoading(false);
        switch (error.code) {
          case "auth/email-already-in-use":
            showToast("error", "Error", "Email already in use");
            break;
          case "auth/weak-password":
            showToast("error", "Error", "Weak password");
            break;
          default: console.error(error)
        }
      });
    }
  };

  const validate = () => {
    if (validator.isEmpty(fullname)) {
      showToast("error", "Error", "Please input your full name");
      return false;
    }
    if (validator.isEmpty(email)) {
      showToast("error", "Error", "Please input your email");
      return false;
    }
    if (!validator.isEmail(email)) {
      showToast("error", "Error", "Your email is not valid");
      return false;
    }
    if (validator.isEmpty(password)) {
      showToast("error", "Error", "Please input your password");
      return false;
    }
    if (validator.isEmpty(confirmPassword)) {
      showToast("error", "Error", "Please input your confirm password");
      return false;
    }
    if (password !== confirmPassword) {
      showToast("error", "Error", "Your confirm password must be matched with your password");
      return false;
    }
    return true;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.avatarContainer} onPress={async () => {
        const image = await selectImage();
        if (image) setUserAvatar(image);
      }}>
        {!userAvatar && (
          <>
            <Image
              style={styles.uploadImage}
              source={require("../images/image-gallery.png")}
            />
            <Text style={styles.uploadTitle}>Upload your avatar</Text>
          </>
        )}
        {userAvatar && (
          <Avatar
            size={'xlarge'}
            rounded
            source={{ uri: userAvatar.uri }}
          />
        )}
      </TouchableOpacity>
      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          value={fullname}
          onChangeText={setFullname}
          placeholder="Full name"
          placeholderTextColor={theme.colors.grey1}
          style={styles.input}
        />
        <TextInput
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.colors.grey1}
          style={styles.input}
        />
        <TextInput
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.grey1}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          placeholderTextColor={theme.colors.grey1}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity style={styles.registerBtn} onPress={async () => { await register() }}>
          <Text style={styles.registerLabel}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }} onPress={() => navigate("Login")}>
          <Text
            style={{
              color: theme.colors.grey2,
            }}
          >
            Already have an account?
          </Text>
          <Text style={{
            marginStart: 5,
            color: theme.colors.primary,
          }}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default Register;