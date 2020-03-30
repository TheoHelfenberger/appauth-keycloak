import React, { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import Home from './screens/Home'
import Login from './screens/Login'

const Stack = createStackNavigator()

export interface Authentication {
  isAuthenticated: boolean
  idToken?: string
  refreshToken?: string
  loginHint?: string
}

const intialAuthentication = { isAuthenticated: false }

export default function Navigation(props) {
  const [authentication, setAuthentication] = useState({ ...intialAuthentication })

  return (
    <NavigationContainer>
      {authentication.isAuthenticated ? (
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home">
            {props => <Home {...props} setAuthentication={setAuthentication} authentication={authentication} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login">
            {props => <Login {...props} setAuthentication={setAuthentication} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}
