// The screens import from here. One switch decides: real Laravel API or the fake one.
// Set EXPO_PUBLIC_USE_MOCK=true in .env to use the fake one (no server needed).
import { USE_MOCK } from '../constants/config';
import * as real from './auth.api';
import * as mock from './auth.mock';

const impl = USE_MOCK ? mock : real;

export const {
  login, register, verifyCode, resendCode, forgotPassword, resetPassword, googleSignIn, me, logout, setToken,
} = impl;
