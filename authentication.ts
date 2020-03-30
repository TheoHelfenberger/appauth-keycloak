import * as AppAuth from 'expo-app-auth'
import jwt_decode from 'jwt-decode'
import * as querystring from 'querystring'
import { AsyncStorage } from 'react-native'
import { TokenResponse } from 'expo-app-auth'
import { oauthIssuer, clientId } from './env.js'
import axios, { AxiosRequestConfig, Method } from 'axios'

export interface Authentication {
  loginHint?: string
  refreshToken?: string
  getIdToken: () => Promise<any>
}

const StorageKey = 'oAuthKey'

const isEmpty = (val?: string) => {
  return !val || 0 === val.length
}

const config = (loginHint: string = '') => {
  let additionalParameters: object = { ui_locales: 'de' }
  if (!isEmpty(loginHint)) {
    additionalParameters = { ...additionalParameters, login_hint: loginHint }
  }

  const config = {
    issuer: oauthIssuer,
    scopes: ['openid', 'profile'],
    clientId
  }

  return { ...config, additionalParameters }
}

export async function signInAsync(currloginHint?: string): Promise<TokenResponse> {
  const authState = await AppAuth.authAsync(config(currloginHint))
  // const loginHint = extractLoginHint(authState.idToken)
  await cacheTokenResponseAsync(authState)
  return authState
}

const readTokenResponseFromStorageAsync = async () => {
  const authValue = await AsyncStorage.getItem(StorageKey)
  // console.log('AuthInfo2Storage', authValue)
  let authInfoStorage: TokenResponse = authValue ? JSON.parse(authValue) : null
  return authInfoStorage
}

const clearTokenResponseInStorageAsync = async () => {
  await AsyncStorage.removeItem(StorageKey)
}

async function cacheTokenResponseAsync(authInfo: TokenResponse) {
  // console.log('AuthInfoFromStorage', JSON.stringify(authInfo, null, 2))
  return await AsyncStorage.setItem(StorageKey, JSON.stringify(authInfo))
}

function checkIfTokenExpired({ accessTokenExpirationDate }) {
  return new Date(accessTokenExpirationDate) < new Date()
}

async function refreshAuthAsync(): Promise<TokenResponse> {
  try {
    const storedAuthState = await readTokenResponseFromStorageAsync()
    if (!storedAuthState) return null
    const authState = await AppAuth.refreshAsync(config(), storedAuthState.refreshToken)
    await cacheTokenResponseAsync(authState)
    console.log('IdToken refreshed and stored in local storage')
    return authState
  } catch (err) {
    console.log('Refresh token expired - calling logout', err.message)
    // Clean up by existing tokens
    await clearTokenResponseInStorageAsync()
    return null
  }
}
const logoutParams = (authState: TokenResponse) => {
  const params = {
    url: `${oauthIssuer}/protocol/openid-connect/logout`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${authState.idToken}`
    },
    data: querystring.stringify({
      client_id: `${clientId}`,
      refresh_token: authState.refreshToken
    })
  }
  return params
}

export async function logoutApi() {
  try {
    const storedAuthState = await readTokenResponseFromStorageAsync()
    if (!storedAuthState) return
    const params = logoutParams(storedAuthState)
    const response = await axios.post(params.url, params.data, params)
    console.log('Response status: ' + response.status)
    if (response.status == 204) {
      await clearTokenResponseInStorageAsync()
    }
  } catch (error) {
    console.warn('error during logout', error)
  }
}

function extractLoginHint(idToken: string) {
  const parsedToken = parseJWT(idToken)
  return parsedToken.email
}

const isExpStillValid = (exp: number) => exp === 0 || new Date().getTime() / 1000 <= exp

const isNotExpired = (refreshToken: string) => {
  const parsedToken = parseJWT(refreshToken)
  return isExpStillValid(parsedToken.exp)
}

const parseJWT = (token: string): any => {
  try {
    return jwt_decode(token)
  } catch (e) {
    console.warn('Could not parse jwt ' + token)
    return null
  }
}

export async function initAuthenication(): Promise<TokenResponse> {
  let authState: TokenResponse = null

  try {
    // Try to refresh with the given information - if this fails take the long way
    let authState = await refreshAuthAsync()
    if (!authState) {
      authState = await signInAsync()
      await cacheTokenResponseAsync(authState)
    }

    const localAuthenticationImpl = {
      loginHint: extractLoginHint(authState.idToken),
      getIdToken: async () => {
        const parsedToken = parseJWT(authState.idToken)
        if (isExpStillValid(parsedToken.exp)) {
          console.log(`IdToken still valid`)
          return authState.idToken
        }
        console.log(`Fetching new idToken`)
        const newAuthState = await refreshAuthAsync()
        if (newAuthState) {
          authState = { ...newAuthState }
          return authState.idToken
        } else {
          return null
        }
      }
    }

    authenticationImpl = localAuthenticationImpl
    return authState
  } catch (e) {
    await handleError(e.message)
    return null
  }
}

const clearRefreshToken = async () => {
  const loginHint = authenticationImpl.loginHint
  if (!isEmpty(loginHint)) return await AsyncStorage.setItem(StorageKey, JSON.stringify({ loginHint }))
  return await AsyncStorage.removeItem(StorageKey)
}

const handleError = async (errMsg: string) => {
  console.warn('Error in initAuthentication ', errMsg)
  if (errMsg.indexOf('Session not active')) {
    return await clearRefreshToken()
  }
}
let authenticationImpl: Authentication = { loginHint: null, getIdToken: () => null }

export function getAuthentication(): Authentication {
  return authenticationImpl
}
