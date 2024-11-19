import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Ensure jwtDecode is properly imported
import Header from "./Header";

function Transactions() {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(15);

  // Decode the token and set user data
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

  // Fetch transactions whenever userData or views change
  useEffect(() => {
    if (!userData) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://192.168.1.130:5000/api/transactionsall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userData.username, IBAN: userData.IBAN, views }),
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
  }, [userData, views]);

  // Handle dropdown change
  const handleViewsChange = async (e) => {
    const selectedValue = e.target.value;
    setViews(selectedValue);
  };

  // Loading and error states
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-6">{error}</div>;
  }

  // Main UI
  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Transaction History</h1>
        <div className="mb-4">
          <label htmlFor="views" className="text-gray-800 font-medium mr-2">
            Records Per Page:
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
        {transactions.length > 0 ? (
          <div className="space-y-4 rounded bg-gray-600 p-1 max-w-3xl w-full">
            {transactions.map((transaction, index) => (
              <TransactionCard key={index} transaction={transaction} IBAN={userData.IBAN} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No transactions available.</p>
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
              <strong>Sender Name:</strong> {sender}
            </p>
          )}
          {IBAN_sender && (
            <p>
              <strong>Sender IBAN:</strong> {IBAN_sender}
            </p>
          )}
          {receiver && (
            <p>
              <strong>Receiver Name:</strong> {receiver}
            </p>
          )}
          {IBAN_receiver && (
            <p>
              <strong>Receiver IBAN:</strong> {IBAN_receiver}
            </p>
          )}
          {Description && (
            <p>
              <strong>Description:</strong> {Description}
            </p>
          )}
          <p>
            <strong>Transaction ID:</strong> {transaction_id}
          </p>
        </div>
      )}
    </div>
  );
}

export default Transactions;
