//AppNavigation.js
import { createStackNavigator } from '@react-navigation/stack';

import Home from '../screens/Home';

const Stack = createStackNavigator();

function AppNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='Home' component={Home} />
    </Stack.Navigator>
  );
}
// const AppNavigation = createStackNavigator(
//   {
//     Home: { screen: Home }
//   },
//   {
//     initialRouteName: 'Home'
//   }
// );

export default AppNavigation;
