import React, { useEffect, useState } from "react";
import Header from "../Components/Header";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import { Gauge } from '@mui/x-charts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVault } from '@fortawesome/free-solid-svg-icons';

const config = require("../config");
const API_URL = config.IP_BACKEND;

function Home() {
    const [userData, setUserData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(0);
    const [moneyboxValue, setMoneyboxValue] = useState(25); // Current Money Box Value
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [maxValue, setMaxValue] = useState("");

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
        
        const socket = io(`${API_URL}`);
        socket.emit("register", userData?.IBAN);

        socket.on("updateValue", (value) => {
            setBalance(value.balance ? parseFloat(value.balance) : parseFloat(value));
        });

        socket.on("new_transaction", (transaction) => {
            if (transaction.IBAN_receiver === userData.IBAN) {
                toast.info(`Λάβατε Χρήματα από ${transaction.sender}`, { position: "top-right", autoClose: 5000 });

                setBalance((prevBalance) => parseFloat(prevBalance) + parseFloat(transaction.amount));

                setTransactions((prevTransactions) => [transaction, ...prevTransactions]);
            }
        });
        // socket.on("moneybox_update", (data) => {
        //     setMoneybox({ amount: data.amount, limit: data.limit });
        // });

        return () => {
            socket.disconnect();
        };
    }, [userData]);

    useEffect(() => {
        if (!userData) return;
        const fetchBalance = async () => {
            try {
                const response = await fetch(`${API_URL}/api/fetchbalance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: userData.username }),
                });
                const data = await response.json();
                if (response.ok) {
                    setBalance(parseFloat(data.balance));
                } else {
                    setBalance("...");
                }
            } catch (err) {
                setError(err);
            }
        };
        fetchBalance();
    }, [userData]);

    useEffect(() => {
        if (!userData) return;

        let isMounted = true;

        const fetchTransactions = async () => {
            try {
                const response = await fetch(`${API_URL}/api/hometransactions`, {
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
    useEffect(() => {
        if (!userData) return;

        const fetchMoneybox = async () => {
            try {
                const response = await fetch(`${API_URL}/api/moneybox`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: userData.username }),
                });

                const data = await response.json();

                if (response.ok) {
                    // setMoneybox({ amount: data.amount, limit: data.limit });
                    setMoneyboxValue(parseFloat(data.amount));
                    setMaxValue(parseFloat(data.limit));
                }
            } catch (err) {
                console.error("Error fetching moneybox data:", err);
            }
        };

        fetchMoneybox();
    }, [userData]);
    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount <= 0) return toast.error("Λανθασμένη εισαγωγή.");
        if (amount > balance) return toast.error("Ανεπαρκή υπόλοιπο.");
        try {
            const response = await fetch(`${API_URL}/api/depositmoneybox`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: userData.username, amount }), 
            });

            const data = await response.json();

            if (response.ok) {
                setMoneyboxValue((prev) => prev + amount);
                setDepositAmount("");
                setBalance((prev) => prev - amount);
                toast.success("Επιτυχής κατάθεση στο χρηματοκιβώτιο!");
            } else {
                toast.error("Αποτυχία κατάθεσης.");
                alert(data.message);
            }
        } catch (err) {
            toast.error("Σφάλμα κατάθεσης.");
        }
    };
    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) return toast.error("Λανθασμένη εισαγωγή.");
        if (amount > moneyboxValue) return toast.error("Ανεπαρκή υπόλοιπο.");
    
        try {
            const response = await fetch(`${API_URL}/api/withdrawmoneybox`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: userData.username, amount }),
            });
    
            const data = await response.json();
            if (response.ok) {
                setMoneyboxValue((prev) => prev - amount); // Update locally
                setWithdrawAmount(""); // Clear input
                setBalance((prev) => prev + amount);
                toast.success("Επιτυχής ανάλληψη!")
            } else {
                alert(data.message);
                toast.error("Αποτυχία Συναλλαγής");
            }
        } catch (error) {
            console.error("Error withdrawing:", error);
        }
    };
    const handleSetMaxValue = async () => {
        const limit = parseFloat(maxValue);
        try {
            const response = await fetch(`${API_URL}/api/updatelimit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: userData.username, limit })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Επιτυχής αλλαγή του ορίου!");
                setMaxValue(parseFloat(limit));
            } else {
                alert(data.message);
                toast.error("Αποτυχία αλλαγής του ορίου.");
            }
        } catch (error) {
            toast.error("Σφάλμα αλλαγής του ορίου.");
        }
    }



    if (loading) return <div className="text-center text-lg">Loading...</div>;

    return (
        <div className="min-h-scree">
            <Header />
            <ToastContainer />

            {userData ? (
                <div className="flex flex-col items-center p-4 bg-soft-peach ">
                    <div className="w-full max-w-5xl bg-white shadow-lg rounded-lg p-6">

                        {/* Main Balance and Transactions Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Left Section (User Balance & Transactions) */}
                            <div className="md:col-span-2">
                                <h1 className="text-2xl font-bold text-gray-700">Γεια σου, {userData.name}!</h1>
                                <h2 className="text-4xl font-bold text-dark-slate-gray mt-2">
                                    {balance} {userData.currency}
                                </h2>
                                <p className="text-gray-600 text-sm">ΛΟΓ: {userData.IBAN}</p>

                                {/* Transactions */}
                                <div className="mt-6">
                                    <h2 className="text-lg font-semibold text-gray-700">Τελευταίες συναλλαγές</h2>
                                    {transactions.length > 0 ? (
                                        <div className="space-y-3 mt-2">
                                            {transactions.slice(0, 5).map((transaction, index) => {
                                                const formattedDate = new Date(transaction.Date)
                                                    .toISOString()
                                                    .slice(0, 16)
                                                    .replace("T", " ");
                                                return (
                                                    <div key={index} className="flex justify-between p-3 bg-gray-100 rounded-md shadow-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-700">
                                                                {transaction.transaction}{" "}
                                                                {transaction.IBAN_receiver === userData.IBAN
                                                                    ? `Από ${transaction.sender}`
                                                                    : `Προς ${transaction.receiver}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{formattedDate}</p>
                                                        </div>
                                                        <p className={`font-semibold text-xl ${transaction.IBAN_receiver === userData.IBAN ? "text-green-500" : "text-red-500"}`}>
                                                            {transaction.IBAN_receiver === userData.IBAN ? "+" : "-"}{" "}
                                                            {transaction.amount} {transaction.currency}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">Δεν υπάρχουν συναλλαγές.</p>
                                    )}
                                    <div className="text-right mt-2">
                                        <a href="/transactions" className="text-sm font-semibold text-blue-600 hover:underline">
                                            Όλες οι συναλλαγές →
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section (Savings Box) */}
                            <div className="bg-gray-100 p-6 shadow-md rounded-lg flex flex-col items-center">
                            <h2 className="text-xl font-semibold text-gray-700">Αποταμίευση <FontAwesomeIcon icon={faVault} /></h2>
                            <p className="text-gray-600">Χρηματοκιβώτιο</p>

                            {/* Gauge Display */}
                            <div className="flex mt-3">
                             <Gauge width={120} height={120} value={moneyboxValue} valueMax={maxValue} text={({ value, valueMax }) => `${value}€ / ${valueMax}€`} />
                            </div>

                            {/* Deposit Input */}
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="Κατάθεση ποσού"
                                className="mt-2 p-2 border rounded w-full text-center"
                            />
                            <button className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                                onClick={handleDeposit}>
                                Κατάθεση
                            </button>

                        {/* Withdraw Input */}
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Ανάληψη ποσού"
                            className="mt-2 p-2 border rounded w-full text-center"
                        />
                        <button className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            onClick={handleWithdraw}>
                            Ανάληψη
                        </button>

                        {/* Set Max Value */}
                        <input
                            type="number"
                            value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value)}
                            placeholder="Ορισμός ορίου"
                            className="mt-2 p-2 border rounded w-full text-center"
                        />
                        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            onClick={handleSetMaxValue}>
                            Ορισμός Ορίου
                        </button>
                        </div>
                   

                        </div>
                    </div>
                </div>
            ) : (
                <h1 className="text-center text-xl mt-10">Please log in to see your information. {error}</h1>
            )}
        </div>
    );
}

export default Home;
