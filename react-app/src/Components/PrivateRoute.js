import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function PrivateRoute() {
    const token = sessionStorage.getItem('token'); // Get the token from session storage
    return token ? <Outlet /> : <Navigate to="/login" replace />; // Redirect to login if no token
}

export default PrivateRoute;
