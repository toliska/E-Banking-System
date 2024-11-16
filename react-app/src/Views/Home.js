import React, { useEffect, useState } from "react";
import Header from "../Components/Header";
import {jwtDecode} from 'jwt-decode'; 

function Home() {
    const [userData, setUserData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
            } catch (error) {
                console.error("Failed to decode token:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (!userData) return;

        const fetchTransactions = async () => {
            try {
                const response = await fetch('http://192.168.1.130:5000/api/hometransactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: userData.username }), // pass username correctly
                });

                const data = await response.json();

                if (response.ok) {
                    setTransactions(data);
                } else {
                    setError(data.message || 'Error fetching transactions');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [userData]); // dependency on userData so fetches once userData is set

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <Header />
            {userData ? (
                <div className="flex flex-col min-h-screen p-3 bg-soft-peach">
                    <div className="flex flex-col space-y-6 w-full max-w-3xl mx-auto p-4 rounded-md bg-light-cream shadow-lg">
                        <div className="w-full">
                            <h1 className="text-lg font-semibold mb-1 text-gray-700">
                                Γεια σου, {userData.name}!
                            </h1>
                            <h1 className="text-3xl font-bold text-dark-slate-gray">
                                {userData.balance} {userData.currency}
                            </h1>
                            <h2 className="font-medium text-sm text-gray-600">ΛΟΓ: {userData.IBAN}</h2>
                        </div>

                        <div className="flex flex-col space-y-2 mt-4">
                            <h2 className="text-lg font-semibold text-gray-700">Τελευταίες συναλλαγές</h2>
                            {transactions.length > 0 ? (
                                <div className="space-y-2 w-full">
                                    {transactions.map((transaction, index) => {
                                        const formatedDate = new Date(transaction.Date).toISOString().slice(0, 16).replace('T', ' ');
                                        return (
                                            <div key={index} className="flex justify-between p-3 bg-white rounded-md shadow-md">
                                                <div>
                                                    <p className="font-medium text-gray-700">{transaction.transaction}</p>
                                                    <p className="text-xs text-gray-500">{formatedDate}</p>
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {transaction.amount} {transaction.currency}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Balance: {transaction.new_balance}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Δεν υπάρχουν συναλλαγές.</p>
                            )}
                            <div>
                                <a className="flex flex-col justify-end items-end" href="/transactions"><h1 className="text-sm border-b border-gray-700 text-gray-700 font-semibold">Όλες οι συναλλαγές</h1></a>

                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <h1> Please log in to see your information.</h1>
            )}
        </div>
    );
}

export default Home;
