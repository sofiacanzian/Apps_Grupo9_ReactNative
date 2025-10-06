// index.js (Debe ser similar a esto, pero verificando el nombre de tu App)
import { AppRegistry } from 'react-native';
import App from './App'; // Importa el nuevo archivo App.js
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);