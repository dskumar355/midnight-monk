import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useMasterAuth } from '../context/MasterAuthContext.jsx';

export default function PrivateRoute({ children, role }) {
    if (role === 'user') {
        const { user } = useUserAuth();
        return user ? children : <Navigate to="/login" replace />;
    }

    if (role === 'admin') {
        const { admin } = useAdminAuth();
        return admin ? children : <Navigate to="/login/admin" replace />;
    }

    if (role === 'master') {
        const { master } = useMasterAuth();
        return master ? children : <Navigate to="/master/login" replace />;
    }

    return <Navigate to="/" replace />;
}
