import '../styles/globals.css';
import type { AppProps } from 'next/app';
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { LoginPage } from '../components/LoginPage';
import * as api from '../lib/api';

function MyApp({ Component, pageProps }: AppProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const inactivityTimerId = useRef<number | null>(null);
    const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 jam

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        if (token && user) {
            setCurrentUser(JSON.parse(user));
        }
        setAuthLoading(false);
    }, []);

    // Helpers
    const clearAuthStorage = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    };

    const startInactivityTimer = () => {
        if (inactivityTimerId.current) {
            window.clearTimeout(inactivityTimerId.current);
        }
        inactivityTimerId.current = window.setTimeout(() => {
            // Auto logout karena idle
            clearAuthStorage();
            setCurrentUser(null);
        }, INACTIVITY_LIMIT_MS);
    };

    const resetInactivityTimer = () => {
        if (!currentUser) return; // hanya jika sudah login
        startInactivityTimer();
    };

    // Setup auto-logout saat idle dan saat tab ditutup
    useEffect(() => {
        if (!currentUser) {
            if (inactivityTimerId.current) {
                window.clearTimeout(inactivityTimerId.current);
                inactivityTimerId.current = null;
            }
            return;
        }

        startInactivityTimer();

        const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
        const onVisibility = () => { if (document.visibilityState === 'visible') resetInactivityTimer(); };
        document.addEventListener('visibilitychange', onVisibility);

        // Jangan bersihkan session saat refresh. Tidak menambahkan handler beforeunload.

        const onStorage = (e: StorageEvent) => {
            if (e.key === 'authToken' && e.newValue === null) {
                // Sinkron keluar di tab lain
                setCurrentUser(null);
            }
        };
        window.addEventListener('storage', onStorage);

        return () => {
            activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('storage', onStorage);
            if (inactivityTimerId.current) {
                window.clearTimeout(inactivityTimerId.current);
                inactivityTimerId.current = null;
            }
        };
    }, [currentUser]);

    const handleLoginSuccess = (token: string, user: User) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        // Mulai hitung idle setelah login
        startInactivityTimer();
    };

    const handleLogout = () => {
        clearAuthStorage();
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