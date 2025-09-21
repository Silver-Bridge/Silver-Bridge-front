import React from 'react';
import { SignupProvider } from './SignupContext';

export default function SignupWrapper({ children }) {
    return <SignupProvider>{children}</SignupProvider>;
}
