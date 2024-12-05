import React, { useCallback, useState } from "react";

function Resetpassword() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");

    const handlePassRecovery = useCallback(async (e) => {
        e.preventDefault();
        setMessage('');

        if (!username.trim()) {
            setMessage('Please enter a valid username.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('http://192.168.1.130:5000/api/request-recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
            } else {
                setMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [username]);

    const handleResetPassword = useCallback(async (e) => {
        e.preventDefault();
        setMessage('');

        if (!password.trim()) {
            setMessage('Εισαγωγή σωστού κωδικού');
            return;
        }
        if (!password2.trim()) {
            setMessage('Εισαγωγή σωστού κωδικού');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('http://192.168.1.130:5000/api/request-passreset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, password2 }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
            } else {
                setMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, password, password2]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-soft-peach">
            <div className={`flex flex-col space-y-6 w-full max-w-3xl p-8 bg-light-cream shadow-md rounded-md ${ token ? `hidden` : `block`}`}>
                <h1 className="font-semibold text-center text-xl text-gray-700">Ανάκτηση κωδικού</h1>
                <div className="flex flex-col space-y-4">
                    <form onSubmit={handlePassRecovery}>
                        <label htmlFor="username" className="text-dark-slate-gray font-medium">Username</label>
                        <input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="JohnDoe"
                            className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                        />
                        <button
                            type="submit"
                            className={`py-2 px-8 font-semibold rounded ${isLoading ? 'bg-gray-400' : 'bg-coral text-white'}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Ανάκτηση'}
                        </button>
                    </form>
                </div>
                {message && <p className="mt-2 text-center text-gray-600">{message}</p>}
            </div>
            <div className={`flex flex-col space-y-6 w-full max-w-3xl p-8 bg-light-cream shadow-md rounded-md ${ token ? `block` : `hidden`}`}>
                <h1 className="font-semibold text-center text-xl text-gray-700">Επαναφορά κωδικού</h1>
                <div className="flex flex-col space-y-4">
                <form onSubmit={handleResetPassword}> 
                        <label htmlFor="password" className="text-dark-slate-gray font-medium">Νέος κωδικός</label>
                        <input
                            id="password"
                            value={password}
                            type="password"
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="************"
                            className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                        />
                        <label htmlFor="password" className="text-dark-slate-gray font-medium">Επαν/ψη κωδικού</label>
                        <input
                            id="password2"
                            value={password2}
                            type="password"
                            onChange={(e) => setPassword2(e.target.value)}
                            placeholder="************"
                            className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                        />
                        <button
                            type="submit"
                            className={`py-2  px-8 font-semibold rounded ${isLoading ? 'bg-gray-400' : 'bg-coral text-white'}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Επεξεργασία...' : 'Επαναφορά'}
                        </button>
                    </form>
                    {message && <p className="mt-2 text-center text-gray-600">{message}</p>}
                </div>
            </div>
        </div>
    );
}

export default Resetpassword;
