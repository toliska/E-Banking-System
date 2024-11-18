import React, { useEffect, useState } from 'react';
import Header from './Header';

function Transactions({ username }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch('http://192.168.1.130:5000/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username }),
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
    }, [username]);

    if (loading) return <div>Loading...</div>;
    // if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
        <Header/>
        <div className="min-h-screen bg-gray-100 p-4">
            <h1 className="text-2xl font-semibold text-center mb-4">Transaction History</h1>
            <div className="space-y-4">
                {transactions.map((transaction, index) => (
                    <TransactionCard key={index} transaction={transaction} />
                ))}
            </div>
        </div>
        </div>
    );
}

function TransactionCard({ transaction }) {
    const { transaction: transactionType, currency, old_balance, amount, new_balance, Date } = transaction;

    // Use conditional (ternary) operator to check if each balance value is a number, default to 0 if not
    const formattedOldBalance = parseFloat(transaction.old_balance).toFixed(2);
    const formattedAmount = parseFloat(transaction.amount).toFixed(2);
    const formattedNewBalance = parseFloat(transaction.new_balance).toFixed(2);
    let formatedDate = Date
    if (Date) {

        formatedDate = Date.slice(0, 16).replace('T', ' ')
    } else {
        formatedDate = " - ";
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 flex items-center justify-between border border-gray-200">
            <div className="flex flex-col space-y-1">
                <h2 className="text-lg font-semibold text-gray-800 capitalize">
                    {transactionType}
                </h2>
                <p className="text-sm text-gray-500">{currency}</p>
            </div>

            <div className="flex flex-col items-end text-sm">
                <p className="text-gray-500">Old Balance:</p>
                <p className="font-medium text-gray-700">{formattedOldBalance} {currency}</p>
            </div>

            <div className="flex flex-col items-end text-sm mx-6">
                <p className="text-gray-500">Amount:</p>
                <p className={`font-medium ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {amount > 0 ? '+' : ' '}{formattedAmount} {currency}
                </p>
            </div>

            <div className="flex flex-col items-end text-sm">
                <p className="text-gray-500">New Balance:</p>
                <p className="font-medium text-gray-700">{formattedNewBalance} {currency}</p>
            </div>
            <div className="flex flex-col items-end text-sm">
                <p className="text-gray-500">Date:</p>
                <p className="font-medium text-gray-700">{formatedDate} </p>
            </div>
        </div>
    );
}
export default Transactions;
