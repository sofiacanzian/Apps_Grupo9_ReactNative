import {
  ThemeProvider,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useAuthStore } from "../src/store/authStore";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificationsSetup } from "@/hooks/use-notifications-setup";
import { usePushRegistration } from "@/hooks/use-push-registration";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { LoginScreen } from "../src/screens/auth/LoginScreen";
import { RegisterScreen } from "../src/screens/auth/RegisterScreen";
import { VerifyEmailScreen } from "../src/screens/auth/VerifyEmailScreen";
import { ForgotPasswordScreen } from "../src/screens/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../src/screens/auth/ResetPasswordScreen";
import { HomeScreen } from "../src/screens/home/HomeScreen";
import { ClassDetailScreen } from "../src/screens/home/ClassDetailScreen";
import { ReservasScreen } from "../src/screens/reservas/ReservasScreen";
import { QrScreen } from "../src/screens/qr/QrScreen";
import { PerfilScreen } from "../src/screens/perfil/PerfilScreen";

import HistorialScreen from "../src/screens/historial/HistorialScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ title: "Crear cuenta" }}
    />
    <Stack.Screen
      name="VerifyEmail"
      component={VerifyEmailScreen}
      options={{ title: "Confirmar email" }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ title: "Recuperar acceso" }}
    />
    <Stack.Screen
      name="ResetPassword"
      component={ResetPasswordScreen}
      options={{ title: "Nueva contraseña" }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string = "home";

        if (route.name === "Home") {
          iconName = focused ? "home" : "home-outline";
        } else if (route.name === "Historial") {
          iconName = focused ? "alarm" : "alarm-outline";
        } else if (route.name === "Reservas") {
          iconName = focused ? "calendar" : "calendar-outline";
        } else if (route.name === "Qr") {
          iconName = focused ? "qr-code" : "qr-code";
        } else if (route.name === "Perfil") {
          iconName = focused ? "person" : "person-outline";
        }

        return <Ionicons name={iconName as any} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#3b82f6",
      tabBarInactiveTintColor: "#999",
      headerShown: true,
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: "Clases" }}
    />
    <Tab.Screen
      name="Historial"
      component={HistorialScreen}
      options={{ title: "Historial" }}
    />
    <Tab.Screen
      name="Reservas"
      component={ReservasScreen}
      options={{ title: "Mis Reservas" }}
    />
    <Tab.Screen
      name="Qr"
      component={QrScreen}
      options={{ title: "Escanear QR" }}
    />
    <Tab.Screen
      name="Perfil"
      component={PerfilScreen}
      options={{ title: "Perfil" }}
    />
  </Tab.Navigator>
);

const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Tabs"
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Historial"
      component={HistorialScreen}
      options={{ title: "Historial" }}
    />
    <Stack.Screen
      name="ClassDetail"
      component={ClassDetailScreen}
      options={{ title: "Detalle de la clase" }}
    />
  </Stack.Navigator>
);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  useNotificationsSetup();
  usePushRegistration();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
