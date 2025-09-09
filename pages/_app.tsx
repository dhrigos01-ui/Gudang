import '../styles/globals.css';
import type { AppProps } from 'next/app';
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LoginPage } from '../components/LoginPage';
import * as api from '../lib/api';

function MyApp({ Component, pageProps }: AppProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        if (token && user) {
            setCurrentUser(JSON.parse(user));
        }
        setAuthLoading(false);
    }, []);

    const handleLoginSuccess = (token: string, user: User) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    };

    if (authLoading) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex justify-center items-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }
    
    if (!currentUser) {
        // FIX: The type mismatch error is resolved by updating LoginPage to expect this function signature.
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return <Component {...pageProps} currentUser={currentUser} onLogout={handleLogout} />;
}

export default MyApp;