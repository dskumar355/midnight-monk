import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useMasterAuth } from '../context/MasterAuthContext.jsx';
import { useDeliveryAuth } from '../context/DeliveryAuthContext.jsx';

export default function PrivateRoute({ children, role }) {
    const location = useLocation();
    const userAuth = useUserAuth();
    const adminAuth = useAdminAuth();
    const masterAuth = useMasterAuth();
    const deliveryAuth = useDeliveryAuth();

    if (role === 'user') {
        return userAuth.user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (role === 'admin') {
        return adminAuth.admin ? children : <Navigate to="/kitchen-admin/login" replace />;
    }

    if (role === 'master') {
        return masterAuth.master ? children : <Navigate to="/master-admin/login" replace />;
    }

    if (role === 'delivery') {
        return deliveryAuth.partner ? children : <Navigate to="/delivery/login" replace />;
    }

    return <Navigate to="/" replace />;
}
