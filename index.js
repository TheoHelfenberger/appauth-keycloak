import { AppRegistry } from 'react-native';
import { createAppContainer } from 'react-navigation';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
