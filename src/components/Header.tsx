import React from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { deleteCookie, triggerGlobalLogout } from '../utils/cookies';
import { ssoApi } from '../services/apiService';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Ecosystem API'ye logout isteği gönder (damise_auth cookie'sini siler)
      await ssoApi.post('/users/logout?platform=panel');
    } catch (error) {
      console.error('SSO Logout API call failed:', error);
    }
    
    // Global logout trigger - diğer tab/window/projeleri bilgilendir
    triggerGlobalLogout();
    
    // Lokal admin token'ı temizle
    Cookies.remove('adminToken');
    
    
    // Logout flag'ini sessionStorage'e kaydet (diğer projeler için)
    sessionStorage.setItem('justLoggedOut', 'true');
    sessionStorage.setItem('logoutTime', Date.now().toString());
    
    navigate('/admin-login');
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 flex items-center z-40 shadow-lg">
      {/* Sidebar genişliğinin bittiği yerden itibaren başlık başlar */}
      <h1 className="text-2xl font-bold ml-64">DAMISE ADMIN PANEL</h1>
      <div className="ml-auto">
        <button
          onClick={handleLogout}
          className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
};

export default Header;
