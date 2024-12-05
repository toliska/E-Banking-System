import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; 
import Header from "./Header";

function Transactions() {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(15);
  const [type, setType] = useState("ANY");


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

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null); 
      try {
        const response = await fetch("http://192.168.1.130:5000/api/transactionsall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userData.username, IBAN: userData.IBAN, views, type }),
        });

        const data = await response.json();

        if (response.ok) {
          setTransactions(data); 
        } else {
          setError(data.message || "Error fetching transactions");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userData, views, type]);

  // Handle dropdown changes
  const handleViewsChange = (e) => {
    setViews(parseInt(e.target.value, 10));
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
  };

  // Loading and error states
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-6">Error: {error}</div>;
  }

  const noTransactionsMessage = `Δεν ${type === "ANY" ? "" : type.toLowerCase()} βρέθηκε μεταφορά στις τελευταίες  ${views} συναλλαγές.`;
  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Ιστορικό συναλλαγών</h1>
        <div className="flex flex-col">
          <div className="mb-4 flex flex-col">
            <label htmlFor="views" className="text-gray-800 font-medium mr-2">
              Τελευταίες συν/γες:
            </label>
            <select
              id="views"
              value={views}
              onChange={handleViewsChange}
              className="border-b-2 bg-white border-gray-300 rounded-md py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="mb-4 flex flex-col space-y-3">
            <label htmlFor="type" className="text-gray-800 font-medium mr-2">
              Είδος συν/γης:
            </label>
            <select
              id="type"
              value={type}
              onChange={handleTypeChange}
              className="border-b-2 bg-white border-gray-300 rounded-md py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="ANY">Ολά</option>
              <option value="transfer">Μεταφορές</option>
              <option value="Deposit">Καταθέσεις</option>
              <option value="Withdrawl">Αναλήψεις</option>
              <option value="Purchase">Αγορές</option>
            </select>
          </div>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-4 rounded bg-gray-600 p-1 max-w-3xl w-full">
            {transactions.map((transaction, index) => (
              <TransactionCard key={index} transaction={transaction} IBAN={userData.IBAN} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">{noTransactionsMessage}</p>
        )}
      </div>
    </div>
  );
}

function TransactionCard({ transaction, IBAN }) {
  const {
    transaction: transactionType,
    IBAN_receiver,
    IBAN_sender,
    sender,
    receiver,
    amount,
    currency,
    Date,
    Description,
    transaction_id,
  } = transaction;
  const [isClicked, setIsClicked] = useState(false);

  // Format the date
  const formattedDate = Date ? Date.slice(0, 16).replace("T", " ") : " - ";

  // Format the amount
  const formattedAmount = parseFloat(amount).toFixed(2);

  const transactionTypeClass =
    transactionType.toLowerCase() === "deposit" || IBAN_receiver === IBAN
      ? "text-green-600 bg-green-100"
      : "text-red-600 bg-red-100";

  return (
    <div
      className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 cursor-pointer transition-transform transform hover:scale-105"
      onClick={() => setIsClicked(!isClicked)}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span
            className={`px-2 py-1 rounded-full text-lg font-medium ${transactionTypeClass}`}
          >
            {transactionType}
          </span>
          <p className="text-sm text-gray-500">{currency}</p>
        </div>
        <div className="flex flex-col items-end text-sm">
          <p
            className={`font-medium text-lg ${
              IBAN_receiver === IBAN ? "text-green-600" : "text-red-600"
            }`}
          >
            {IBAN_receiver === IBAN ? "+" : "-"}{formattedAmount} {currency}
          </p>
          <p className="text-xs text-gray-400">{formattedDate}</p>
        </div>
      </div>

      {isClicked && (
        <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-2">
          {sender && (
            <p>
              <strong>Επωνυμία αποστολέα:</strong> {sender}
            </p>
          )}
          {IBAN_sender && (
            <p>
              <strong>IBAN αποστολέα:</strong> {IBAN_sender}
            </p>
          )}
          {receiver && (
            <p>
              <strong>Επωνυμία παραλήπτη:</strong> {receiver}
            </p>
          )}
          {IBAN_receiver && (
            <p>
              <strong>IBAN παραλήπτη:</strong> {IBAN_receiver}
            </p>
          )}
          {Description && (
            <p>
              <strong>Αιτιολογία:</strong> {Description}
            </p>
          )}
          <p>
            <strong>ID συναλλαγής:</strong> {transaction_id}
          </p>
        </div>
      )}
    </div>
  );
}

export default Transactions;
