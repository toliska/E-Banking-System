import React, { useEffect, useState } from "react";
import Header from "../Components/Header";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';

function Home() {
    const [userData, setUserData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
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
        // setBalance(userData?.balance);
        const socket = io("http://192.168.1.130:5000");
        socket.emit("register", userData?.IBAN);

        socket.on("updateValue", (value) => {
            setBalance(value.balance ? parseFloat(value.balance) : parseFloat(value));
        });

        socket.on("new_transaction", (transaction) => {
            if (transaction.IBAN_receiver === userData.IBAN) {
                toast.info(`Λάβατε Χρήματα από ${transaction.sender}`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                });

                setBalance((prevBalance) => parseFloat(prevBalance) + parseFloat(transaction.amount));

                setTransactions((prevTransactions) => [transaction, ...prevTransactions]);
            }
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });

        return () => {
            socket.disconnect();
        };
    }, [userData]);

    useEffect(() => {
        if (!userData) return;
        const fetchbalance = async () => {
            try {
                const responce = await fetch("http://192.168.1.130:5000/api/fetchbalance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify( {username: userData.username} ),
                });
                const data = await responce.json();
                if (responce.ok){
                    setBalance(parseFloat(data.balance));
                } else {
                    setBalance("...");
                }
            } catch (err) {
                setError(err);
            }
        };
        fetchbalance();
    }, [userData]);

    

    useEffect(() => {
        if (!userData) return;

        let isMounted = true;

        const fetchTransactions = async () => {
            try {
                const response = await fetch("http://192.168.1.130:5000/api/hometransactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: userData.username, IBAN: userData.IBAN }),
                });
            

                const data = await response.json();

                if (response.ok && isMounted) {
                    setTransactions(data);
                } else if (!response.ok && isMounted) {
                    setError(data.message || "Error fetching transactions");
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTransactions();

        return () => {
            isMounted = false;
        };
    }, [userData]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <Header />
            <ToastContainer />
            {userData ? (
                <div className="flex flex-col min-h-screen p-3 bg-soft-peach">
                    <div className="flex flex-col space-y-6 w-full max-w-3xl mx-auto p-4 rounded-md bg-light-cream shadow-lg">
                        <div className="w-full">
                            <h1 className="text-lg font-semibold mb-1 text-gray-700">
                                Γεια σου, {userData.name}!
                            </h1>
                            <h1 className="text-3xl font-bold text-dark-slate-gray">
                                {balance} {userData.currency}
                            </h1>
                            <h2 className="font-medium text-sm text-gray-600">ΛΟΓ: {userData.IBAN}</h2>
                        </div>

                        <div className="flex flex-col space-y-2 mt-4">
                            <h2 className="text-lg font-semibold text-gray-700">Τελευταίες συναλλαγές</h2>
                            {transactions.length > 0 ? (
                                <div className="space-y-2 w-full">
                                    {transactions.map((transaction, index) => {
                                        const formatedDate = new Date(transaction.Date)
                                            .toISOString()
                                            .slice(0, 16)
                                            .replace("T", " ");
                                        return (
                                            <div
                                                key={index}
                                                className="flex justify-between p-3 bg-white rounded-md shadow-md"
                                            >
                                                <div>
                                                    <p className="font-medium uppercase text-gray-700">
                                                        {transaction.transaction}{" "}
                                                        {transaction.IBAN_receiver === userData.IBAN
                                                            ? `Απo ${transaction.sender}`
                                                            : `Πρoς ${transaction.receiver}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{formatedDate}</p>
                                                </div>
                                                <div>
                                                    <p
                                                        className={`font-semibold text-xl ${
                                                            transaction.IBAN_receiver === userData.IBAN
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                        }`}
                                                    >
                                                        {transaction.IBAN_receiver === userData.IBAN ? "+" : "-"}{" "}
                                                        {transaction.amount} {transaction.currency}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Id: {transaction.transaction_id}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }).slice(0, 5)}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Δεν υπάρχουν συναλλαγές.</p>
                            )}
                            <div>
                                <a
                                    className="flex flex-col justify-end items-end"
                                    href="/transactions"
                                >
                                    <h1 className="text-sm border-b border-gray-700 text-gray-700 font-semibold">
                                        Όλες οι συναλλαγές
                                    </h1>
                                </a>
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
