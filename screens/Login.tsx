import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import { initAuthenication } from '../authentication'
import { Authentication } from '../Navigation'
import { TokenResponse } from 'expo-app-auth'
type LoginProps = {
  setAuthentication: (authi: Authentication) => void
}

export default function Login(props: LoginProps) {
  const { setAuthentication } = props
  const [authState, setAuthState] = useState(null)
  const [authenticationRunning, setAuthenticationRunning] = useState(false)

  useEffect(() => {
    const asyncEffect = async () => {
      try {
        if (!authenticationRunning && authState == null) {
          setAuthenticationRunning(true)
          let cachedAuth: TokenResponse = null
          cachedAuth = await initAuthenication()
          if (cachedAuth) {
            setAuthentication(toAuthentication(cachedAuth))
            setAuthState(cachedAuth)
          }
        }
      } catch (err) {
        console.warn('Error during authentication', err)
      } finally {
        setAuthenticationRunning(false)
      }
    }
    asyncEffect()
  }, [])

  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <Button
        title="Login"
        disabled={authenticationRunning}
        onPress={async () => {
          const _authState = await initAuthenication()
          if (_authState) {
            setAuthentication(toAuthentication(_authState))
          }
        }}
      />
    </View>
  )

  function toAuthentication(authState: TokenResponse): Authentication {
    const { idToken, refreshToken } = authState
    return { isAuthenticated: true, idToken, refreshToken }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
