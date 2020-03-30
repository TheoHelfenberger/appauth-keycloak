import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import { logoutApi } from '../authentication'
import { getAuthentication } from '../authentication'
import { Authentication } from '../Navigation'
import jwt_decode from 'jwt-decode'

type HomeProps = {
  authentication: Authentication
  setAuthentication: (authi: Authentication) => void
}

export default function Home(props: HomeProps) {
  const { authentication, setAuthentication } = props
  const [idToken, setIdToken] = useState(null)

  useEffect(() => {
    const asyncEffect = async () => {
      try {
        if (!idToken) {
          const _idToken = await getAuthentication().getIdToken()
          if (_idToken == null) {
            setAuthentication({ isAuthenticated: false })
          } else {
            setIdToken(_idToken)
          }
        }
      } catch (e) {
        console.warn('catched')
      }
    }
    asyncEffect()
  }, [])

  const parsedRefreshToken = jwt_decode(authentication.refreshToken)
  const parsedIdToken = idToken ? jwt_decode(idToken) : 'no id token available'

  return (
    <View style={styles.container}>
      <View style={{ width: '90%' }}>
        <Text>Home</Text>
        <Text>{`Refresh Token valid until ${new Date(parsedRefreshToken.exp * 1000)}`}</Text>
        <Text>{`IdToken: ${JSON.stringify(parsedIdToken, null, 2)}`}</Text>
        <View style={styles.buttons}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Button
              title="Logout"
              onPress={async () => {
                await logoutApi()
                setAuthentication({ isAuthenticated: false })
              }}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Button
              title="Refresh Id Token"
              onPress={async () => {
                const _idToken = await getAuthentication().getIdToken()
                if (_idToken) {
                  setIdToken(_idToken)
                } else {
                  setAuthentication({ isAuthenticated: false })
                }
              }}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 10
  },
  buttons: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'space-between'
  }
})
