import React, { useState, useEffect } from 'react';
import { api, ssoApi } from '../../../services';
import Cookies from 'js-cookie';
import { DamiseUserResponse } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';

import login from '../../../assets/images/login.png';

interface AdminLoginProps {
    redirectPath?: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ redirectPath = '/admin-panel/launch-list' }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);  // loading durumu eklendi
    const [autoLoginAttempted, setAutoLoginAttempted] = useState<boolean>(false);
    const navigate = useNavigate();

    // Sayfa yüklendiğinde damise_auth cookie'sini kontrol et
    useEffect(() => {
        const checkAutoLogin = async () => {
            if (autoLoginAttempted) return;

            // Logout flag kontrolü - eğer yeni logout yapıldıysa auto-login yapma
            const logoutFlag = sessionStorage.getItem('justLoggedOut');
            const logoutTime = sessionStorage.getItem('logoutTime');

            if (logoutFlag === 'true' && logoutTime) {
                const timeSinceLogout = Date.now() - parseInt(logoutTime);
                if (timeSinceLogout < 3000) { // 3 saniye
                    setAutoLoginAttempted(true);
                    return; // Auto-login yapmadan çık
                } else {
                    // Eski flag'i temizle
                    sessionStorage.removeItem('justLoggedOut');
                    sessionStorage.removeItem('logoutTime');
                }
            }

            const damiseAuthCookie = getCookie('damise_auth');
            const adminToken = Cookies.get('adminToken');

            // Eğer adminToken varsa zaten giriş yapmış, direkt yönlendir
            if (adminToken) {
                navigate(redirectPath);
                return;
            }

            // Eğer damise_auth cookie'si varsa otomatik giriş yapmaya çalış
            if (damiseAuthCookie) {
                const autoLoginSuccess = await attemptAutoLogin(damiseAuthCookie);

                // Eğer auto login başarısız olursa SSO check dene
                if (!autoLoginSuccess) {
                    await attemptSSOCheck();
                }
            } else {
                // SSO check - backend'e /users/getme isteği gönder
                await attemptSSOCheck();
            }

            setAutoLoginAttempted(true);
        };

        checkAutoLogin();
    }, [navigate, autoLoginAttempted]);

    // damise_auth cookie'si ile otomatik giriş
    const attemptAutoLogin = async (damiseAuthToken: string): Promise<boolean> => {
        try {
            setLoading(true);

            // damise_auth token'ı ile backend'e validate isteği at
            // Önce endpoint'in var olup olmadığını kontrol et
            try {
                const response = await api.post<{ token: string, user: any }>('/api/auth/validate-damise-token', {
                    damiseAuthToken
                });

                if (response.data.token) {
                    // Başarılı ise adminToken'ı cookie'ye kaydet (lokal)
                    Cookies.set('adminToken', response.data.token, {
                        expires: 1,
                        sameSite: 'lax'
                    });

                    navigate(redirectPath);
                    return true;
                }
            } catch (apiError: any) {
                // Eğer 404 ise, token'ı direkt kullanmayı dene (geçici çözüm)
                if (apiError.response?.status === 404) {

                    // JWT token'ı decode etmeye çalış (basit validation)
                    try {
                        const tokenParts = damiseAuthToken.split('.');
                        if (tokenParts.length === 3) {
                            const payload = JSON.parse(atob(tokenParts[1]));
                            const currentTime = Math.floor(Date.now() / 1000);

                            // Token'ın expire olmadığını kontrol et
                            if (payload.exp && payload.exp > currentTime) {
                                // adminToken'ı ayarla
                                Cookies.set('adminToken', damiseAuthToken, {
                                    expires: 1,
                                    sameSite: 'lax'
                                });

                                navigate(redirectPath);
                                return true;
                            } else {
                                console.error('Token expired');
                            }
                        }
                    } catch (parseError) {
                        console.error('Token parse error:', parseError);
                    }
                }

                throw apiError; // Diğer hatalar için normal flow'a devam et
            }
        } catch (error) {
            console.error('Auto login failed:', error);
            // Otomatik giriş başarısız olursa damise_auth cookie'sini silme (SSO check için saklayalım)
            // deleteCookie('damise_auth');
        } finally {
            setLoading(false);
        }
        return false;
    };

    // SSO check fonksiyonu - HttpOnly cookie'ler için API check
    const attemptSSOCheck = async () => {
        try {
            setLoading(true);

            // Ecosystem API'sine direkt istek gönder (damise_auth HttpOnly cookie ile)
            // Local development için local API'yi kullan
            const hostname = window.location.hostname;
            let ecosystemApiUrl = 'https://api-ekosistem.damise.com/users/getme'; // default

            if (hostname.includes('damise.local')) {
                ecosystemApiUrl = 'http://api.damise.local:8000/users/getme';
            } else if (hostname.includes('serverdms.com')) {
                ecosystemApiUrl = 'https://ekosistem-backend.serverdms.com/users/getme';
            }


            const ecosystemResponse = await fetch(ecosystemApiUrl, {
                method: 'GET',
                credentials: 'include', // HttpOnly cookie'leri gönder
                headers: {
                    'Content-Type': 'application/json',
                    'x-project-type': 'dl' // Lansman panel için project type
                }
            });

            if (ecosystemResponse.ok) {
                const data = await ecosystemResponse.json();

                // Backend'den gelen token'ı kontrol et
                // x-auth header'ından veya response body'den token'ı al
                const authToken = ecosystemResponse.headers.get('x-auth') || data.token;

                if (authToken) {
                    // Backend'den gelen gerçek token'ı kullan
                    Cookies.set('adminToken', authToken, {
                        expires: 1,
                        sameSite: 'lax'
                    });
                } else {
                    // Token yoksa fallback olarak HttpOnly cookie marker kullan
                    const marker = `httponly_session_${Date.now()}`;
                    Cookies.set('adminToken', marker, {
                        expires: 1,
                        sameSite: 'lax'
                    });
                }

                navigate(redirectPath);
                return;
            } else {
                console.error('Ecosystem API SSO check failed:', ecosystemResponse.status);
            }
        } catch (error: any) {
            console.error('SSO check failed:', error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    // Ecosystem API'ye authentication yapmak için
    const setEcosystemAuthentication = async (email: string, password: string) => {
        try {
            // Local development için local API'yi kullan
            const hostname = window.location.hostname;
            let ecosystemApiUrl = 'https://api-ekosistem.damise.com/users/login'; // ✅ DOĞRU ENDPOINT

            if (hostname.includes('damise.local')) {
                ecosystemApiUrl = 'http://api.damise.local:8000/users/login';
            } else if (hostname.includes('serverdms.com')) {
                ecosystemApiUrl = 'https://ekosistem-backend.serverdms.com/users/login';
            }

            const ecosystemResponse = await fetch(ecosystemApiUrl, {
                method: 'POST',
                credentials: 'include', // ✅ Cookie'leri browser'a set et
                headers: {
                    'Content-Type': 'application/json',
                    'x-project-type': 'dl' // Lansman panel için project type
                },
                body: JSON.stringify({ email, password })
            });

        } catch (error: any) {
            console.error('Ecosystem API authentication error:', error?.message || error);
        }
    };

    const handleLogin = async () => {
        setLoading(true); // Giriş işlemi başladığında loading true yapılır
        try {
            // Ecosystem API'ye direkt login yap (multi-login detection için)
            const response = await ssoApi.post<DamiseUserResponse>(`/users/login?platform=panel&projectType=dl`, { email, password });
            // Öncelikle header'dan x-auth token almayı dene
            const headerToken = (response.headers as any)?.["x-auth"] || (response.headers as any)?.["X-Auth"];
            // Geliştirme için okunabilir cookie'den token almayı dene
            const cookieToken = Cookies.get('damise_auth_js');
            const token = headerToken || cookieToken || response.data?.token;

            if (token) {
                // adminToken'ı lokal olarak kaydet (client-side token)
                Cookies.set('adminToken', token, { expires: 1, sameSite: 'lax' });

            }

            navigate(redirectPath);
        } catch (err: any) {
            console.error('Login error:', err);

            const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Giriş bilgileri hatalı veya yetkiniz yok';
            setError(errorMessage);
        } finally {
            setLoading(false); // İşlem tamamlandığında loading false yapılır
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen flex">
            <div
                className="w-full md:w-1/2 h-screen bg-cover"
                style={{
                    backgroundImage: `url(${login})`,
                    backgroundPosition: 'center left',  // Sola kaydırmak için
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
                <div className="max-w-md w-full">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-4">Hoşgeldiniz</h2>
                    <p className="text-gray-600 mb-6">Hesabınıza giriş yapın</p>
                    {error && <p className="text-red-600 mb-4">{error}</p>}
                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-between items-center">
                            <a href="#" className="text-sm text-red-500">Şifremi Unuttum</a>
                            <div>
                                <input type="checkbox" id="remember" className="mr-2" />
                                <label htmlFor="remember" className="text-sm text-gray-600">Beni Hatırla</label>
                            </div>
                        </div>
                        <button
                            onClick={handleLogin}
                            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-300"
                            disabled={loading} // loading sırasında buton devre dışı bırakılır
                        >
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
