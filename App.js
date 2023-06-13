import React, { useEffect, useState } from "react";
import { LogBox } from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import { ActivityIndicator } from "react-native";
import { ThemeProvider, createTheme, Icon } from "@rneui/themed";
import Toast, { ErrorToast, InfoToast, SuccessToast } from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import UserContext from "./context";
import { auth } from "./firebase";

import Login from "./components/Login";
import Register from "./components/Register";

import Message from "./components/Message";
import Tabs from "./components/Tabs";

const toastConfig = {
  success: (props) => (
    <SuccessToast
      {...props}
      text1Style={{ fontSize: 16 }}
      text2Style={{ fontSize: 14 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{ fontSize: 16 }}
      text2Style={{ fontSize: 14 }}
    />
  ),
  info: (props) => {
    <InfoToast
      {...props}
      text1Style={{ fontSize: 16 }}
      text2Style={{ fontSize: 14 }}
    />;
  },
};

LogBox.ignoreLogs([
  "Setting a timer",
  "AsyncStorage has been extracted from react-native core and will be removed in a future release.",
]);

const Stack = createNativeStackNavigator();

const theme = createTheme({
  colors: {
    primary: "#00ADB5",
    secondary: "#A6E3E9",
    background: "#EEEEEE",
    white: "#ffffff",
    black: "#222831",
    grey0: "#e8e8e8",
    grey1: "#c2c2c2",
    grey2: "#9e9d9d",
    grey3: "#757575",
    grey4: "#4a4a4a",
    grey5: "#262626",
    greyOutline: "#c2c2c2",
    searchBg: "#BAD7DF",
    success: "#76BA99",
    error: "#F87474",
    warning: "#FFC54D",
    divider: "#95E1D3",
  },
});

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) setCurrentUser(user);
        setIsLoading(false);
      });
      return () => unsubscribe();
    };
  
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (currentUser) {
    return (
      <ThemeProvider theme={theme}>
        <UserContext.Provider value={{ currentUser, setCurrentUser }}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="Tabs"
                component={Tabs}
              />
              <Stack.Screen
                name="Message"
                component={Message}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <Toast config={toastConfig} />
        </UserContext.Provider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={{ currentUser, setCurrentUser }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="Login"
              component={Login}
            />
            <Stack.Screen
              name="Register"
              component={Register}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </UserContext.Provider>
    </ThemeProvider>
  );
};
export default App;
