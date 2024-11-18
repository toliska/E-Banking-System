import React, { useState, useEffect } from "react";
import Header from "./Header";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Transfers() {
  const [userData, setUserData] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ IBAN2: "", Description: "", amount: "" });
  const [state, setState] = useState({
    loading: true,
    error: null,
    message: "",
    recipient: "",
    transferSuccess: false,
    checkingRecipient: false,
    transferInProgress: false,
  });

  useEffect(() => {
    // Decode token and set user data
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
    // Initialize socket connection
    const socket = io("http://192.168.1.130:5000");

    socket.on("new_transaction", (transaction) => {
      if (transaction.IBAN_receiver === userData?.IBAN) {
        toast.info(`Λάβατε Χρήματα από ${transaction.sender}`,{
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true
        });
      setTransfers((prevTransfers) => [transaction, ...prevTransfers]);
        
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => socket.disconnect(); // Clean up on unmount
  }, [userData]);

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!userData) return;

      try {
        const response = await fetch("http://192.168.1.130:5000/api/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ IBAN: userData.IBAN }),
        });

        const data = await response.json();
        if (response.ok) setTransfers(data);
        else setState((prev) => ({ ...prev, error: data.message || "Error fetching transfers" }));
      } catch (err) {
        setState((prev) => ({ ...prev, error: err.message }));
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchTransfers();
  }, [userData]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const checkRecipient = async (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, checkingRecipient: true, message: "" }));

    try {
      const response = await fetch("http://192.168.1.130:5000/api/hname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IBAN2: form.IBAN2 }),
      });

      const data = await response.json();
      if (response.ok) {
        setState((prev) => ({ ...prev, recipient: data.message, checkingRecipient: false }));
      } else {
        setState((prev) => ({ ...prev, message: data.message || "Error finding recipient.", checkingRecipient: false }));
      }
    } catch (err) {
      setState((prev) => ({ ...prev, message: "Error: " + err.message, checkingRecipient: false }));
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Επεξεργασία μεταφοράς...', {
      position: "top-right",
      autoClose: false, // Keep the toast until the transfer completes
      closeOnClick: false,
    });

    setState((prev) => ({ ...prev, transferInProgress: true, message: "" }));

    const { IBAN2, Description, amount } = form;

    if (!IBAN2 || !Description || !amount) {
      setState((prev) => ({ ...prev, message: "Please fill in all fields.", transferInProgress: false }));
      toast.error("Συμπληρώστε όλα τα πεδία!", { position: "top-left" });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setState((prev) => ({ ...prev, message: "Invalid amount entered.", transferInProgress: false }));
      toast.error("Συμπληρώστε όλα τα πεδία!", { position: "top-left" });
      return;
    }

    try {
      const response = await fetch("http://192.168.1.130:5000/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IBAN: userData.IBAN, IBAN2, Description, amount }),
      });

      const data = await response.json();
      if (response.ok) {
        setState((prev) => ({
          ...prev,
          transferSuccess: true,
          message: "Η μεταφορά ολοκληρώθηκε!",
          transferInProgress: false,
        }));
        toast.update(loadingToast, {
          render: "Η μεταφορά ολοκληρώθηκε!",
          type: "success",
          isLoading: false,
          closeOnClick: true,
          autoClose: 5000,
        });
      } else {
        setState((prev) => ({
          ...prev,
          message: data.message || "Η μεταφορά απέτυχε",
          transferInProgress: false,
        }));
        toast.update(loadingToast, {
          render: data.message || "Η μεταφορά απέτυχε",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        message: "Παρουσιάστηκε πρόβλημα. Δοκιμάστε αργότερα.",
        transferInProgress: false,
      }));
      toast.update(loadingToast, {
        render: "Παρουσιάστηκε πρόβλημα. Δοκιμάστε αργότερα",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  if (state.loading) return <div>Loading...</div>;
  if (state.error) return <div className="text-red-500">{state.error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ToastContainer />
      <div className="p-4 md:p-6 flex flex-col items-center justify-center">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">Μεταφορά Χρημάτων</h1>

        <div className="w-full max-w-md bg-white p-4 md:p-6 rounded-lg shadow-md">
          <form onSubmit={checkRecipient} className="space-y-4 md:space-y-6">
            <div>
              <label htmlFor="IBAN2" className="block text-gray-700 font-medium mb-1">IBAN Παραλήπτη</label>
              <input
                id="IBAN2"
                type="text"
                value={form.IBAN2}
                onChange={handleInputChange}
                placeholder="Πληκτρ. IBAN"
                required
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-gray-700 font-medium mb-1">Ποσό</label>
              <input
                id="amount"
                type="number"
                value={form.amount}
                onChange={handleInputChange}
                placeholder="Πληκτρ. Ποσό"
                required
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="Description" className="block text-gray-700 font-medium mb-1">Αιτιολογία</label>
              <input
                id="Description"
                type="text"
                value={form.Description}
                onChange={handleInputChange}
                placeholder="Πληκτρ. Αιτιολογία"
                maxLength="90"
                required
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral transition duration-200"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2 rounded-md font-semibold text-white bg-coral transition duration-300 ${state.checkingRecipient ? "opacity-70 cursor-not-allowed" : "hover:bg-light-salmon"}`}
              disabled={state.checkingRecipient}
            >
              {state.checkingRecipient ? "Επιβεβαίωση..." : "Επιβεβαίωση Παραλήπτη"}
            </button>
          </form>

          {state.recipient && (
            <div className="mt-4">
              <p className="text-gray-700 font-semibold">{state.recipient}</p>
              <button
                onClick={handleTransfer}
                className={`w-full mt-4 py-2 rounded-md font-semibold text-white bg-green-500 transition duration-300 ${state.transferInProgress ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"}`}
                disabled={state.transferInProgress}
              >
                {state.transferInProgress ? "Επεξεργασία Μεταφοράς..." : "Επιβεβαίωση Μεταφοράς"}
              </button>
              
            </div>
          )}

          {state.message && (
            <div className="mt-4 text-center text-gray-700 font-semibold">{state.message}</div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-center mb-4 md:mb-6">Ιστορικό Μεταφορών</h1>

        <div className="space-y-4">
          {transfers.length === 0 ? (
            <p>No transaction history available.</p>
          ) : (
            transfers.map((transfer, index) => (
              <div key={index} className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-800">
                    {transfer.IBAN_receiver === userData.IBAN ? `Από: ${transfer.sender}` : `Προς: ${transfer.receiver}`}
                  </p>
                  <p className="text-xs text-gray-500 text-right">{transfer.Date?.slice(11, 16)}</p>
                </div>
                <p className="text-gray-500">
                  Ποσό:{" "}
                  <span
                    className={`font-medium ${transfer.IBAN_receiver === userData.IBAN ? "text-green-600" : "text-red-600"}`}
                  >
                    {transfer.IBAN_receiver === userData.IBAN ? "+" : "-"}
                    {transfer.amount} {transfer.currency || userData.currency}
                  </span>
                </p>
                <p className="text-gray-700">Αιτιολογία: {transfer.Description}</p>
                <p className="text-gray-500 text-sm">Ημερομηνία: {transfer.Date?.slice(0, 10).replace("T", " ")}</p>
                <p className="text-gray-500 text-sm text-right">Id: {transfer.transaction_id}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Transfers;
