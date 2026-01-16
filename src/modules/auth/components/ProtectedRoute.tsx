import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

interface ProtectedRouteProps {
    element: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
    const token = Cookies.get('adminToken');

    if (!token) {
        // Eğer token yoksa AdminLogin sayfasına yönlendir
        return <Navigate to="/admin-login" replace />;
    }

    // Token varsa istenilen sayfayı render et
    return element;
};

export default ProtectedRoute;
