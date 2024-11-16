import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check if the user is already logged in
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://192.168.1.130:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                sessionStorage.setItem('token', data.token);
                setIsLoggedIn(true); // Update the state to trigger redirect
            } else {
                setMessage(data.message || 'Login error');
            }
        } catch (error) {
            setMessage('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [username, password]);

    // Redirect to home if logged in
    if (isLoggedIn) {
        return <Navigate to="/home" replace />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-soft-peach">
            <div className="flex flex-col space-y-6 w-full max-w-3xl p-8 bg-light-cream shadow-md rounded-md">
                <h1 className="text-center text-2xl font-semibold border-b text-dark-slate-gray border-gray-300 pb-4">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <InputField
                        label="Username"
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                    />
                    <InputField
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                    />
                    <div className="flex flex-col items-center space-y-4 mt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`py-2 px-8 bg-coral text-white font-semibold rounded ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-light-salmon transition duration-300'}`}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                        {message && <p className={`mt-2 ${isLoggedIn ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
                        <p className="text-sm text-dark-slate-gray">
                            Do not have an account?{' '}
                            <a href="/register" className="text-coral hover:underline">
                            Create one
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

// InputField Component remains unchanged
function InputField({ label, id, type, value, onChange, placeholder }) {
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="text-dark-slate-gray font-medium">{label}:</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
            />
        </div>
    );
}

export default Login;
