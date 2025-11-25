import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useAuthStore } from "../src/store/authStore";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificationsSetup } from "@/hooks/use-notifications-setup";
import { usePushRegistration } from "@/hooks/use-push-registration";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Importaciones de pantallas
import { LoginScreen } from "../src/screens/auth/LoginScreen";
import { RegisterScreen } from "../src/screens/auth/RegisterScreen";
import { VerifyEmailScreen } from "../src/screens/auth/VerifyEmailScreen";
import { ForgotPasswordScreen } from "../src/screens/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../src/screens/auth/ResetPasswordScreen";

import { HomeScreen } from "../src/screens/home/HomeScreen";
import { ClassDetailScreen } from "../src/screens/home/ClassDetailScreen";
import { NoticiasScreen } from "../src/screens/home/NoticiasScreen";
import { NoticiaDetalleScreen } from "../src/screens/home/NoticiaDetalleScreen";
import { ReservasScreen } from "../src/screens/reservas/ReservasScreen";
import { QrScreen } from "../src/screens/qr/QrScreen";
import { PerfilScreen } from "../src/screens/perfil/PerfilScreen";
import HistorialScreen from "../src/screens/historial/HistorialScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack de Autenticación
const AuthStack = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Confirmar email" }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Recuperar acceso" }} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Nueva contraseña" }} />
  </Stack.Navigator>
);

// Navegador de Pestañas Principal
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = "home";

        if (route.name === "Home") {
          iconName = focused ? "home" : "home-outline";
        } else if (route.name === "Noticias") {
          iconName = focused ? "newspaper" : "newspaper-outline";
        } else if (route.name === "Historial") {
          iconName = focused ? "time" : "time-outline"; // Cambié 'alarm' por 'time' que es más común para historial
        } else if (route.name === "Reservas") {
          iconName = focused ? "calendar" : "calendar-outline";
        } else if (route.name === "Qr") {
          iconName = focused ? "qr-code" : "qr-code-outline";
        } else if (route.name === "Perfil") {
          iconName = focused ? "person" : "person-outline";
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#3b82f6",
      tabBarInactiveTintColor: "#999",
      headerShown: true,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Clases" }} />
    <Tab.Screen name="Noticias" component={NoticiasScreen} options={{ title: "Noticias" }} />
    <Tab.Screen name="Historial" component={HistorialScreen} options={{ title: "Historial" }} />
    <Tab.Screen name="Reservas" component={ReservasScreen} options={{ title: "Mis Reservas" }} />
    <Tab.Screen name="Qr" component={QrScreen} options={{ title: "Escanear QR" }} />
    <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: "Perfil" }} />
  </Tab.Navigator>
);

// Stack Principal de la App (Una vez logueado)
const AppStack = () => (
  <Stack.Navigator>
    {/* La pantalla principal son los Tabs */}
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }} 
    />
    {/* Pantallas adicionales que se abren sobre los tabs (como detalle de clase) */}
    <Stack.Screen 
      name="ClassDetail" 
      component={ClassDetailScreen} 
      options={{ title: "Detalle de la clase" }} 
    />
    {/* Pantalla de detalle de noticia */}
    <Stack.Screen 
      name="NoticiaDetalle" 
      component={NoticiaDetalleScreen} 
      options={{ title: "Noticia" }} 
    />
  </Stack.Navigator>
);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Asegurarse de que useAuthStore esté inicializado correctamente
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isLoading = useAuthStore((state) => state.isLoading); // Si tienes un estado de carga inicial

  useNotificationsSetup();
  usePushRegistration();

  // Opcional: Mostrar pantalla de carga mientras se verifica el estado de autenticación
  // if (isLoading) {
  //   return null; // O un componente de Loading
  // }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}