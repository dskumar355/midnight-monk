import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useMasterAuth } from '../context/MasterAuthContext.jsx';
import { useDeliveryAuth } from '../context/DeliveryAuthContext.jsx';

export default function PrivateRoute({ children, role }) {
    const location = useLocation();

    if (role === 'user') {
        const { user } = useUserAuth();
        return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (role === 'admin') {
        const { admin } = useAdminAuth();
        return admin ? children : <Navigate to="/kitchen-admin/login" replace />;
    }

    if (role === 'master') {
        const { master } = useMasterAuth();
        return master ? children : <Navigate to="/master-admin/login" replace />;
    }

    if (role === 'delivery') {
        const { partner } = useDeliveryAuth();
        return partner ? children : <Navigate to="/delivery/login" replace />;
    }

    return <Navigate to="/" replace />;
}
