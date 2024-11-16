import React, { useState, useEffect } from 'react';
import Header from './Header';
import { jwtDecode } from 'jwt-decode'; // Remove the curly braces

function Transfers() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [IBAN2, setIBAN2] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [message2, setMessage2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSure, setIsSure] = useState(false);
  const [areTransfered, setAreTransfered] = useState(false);

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

  const handleTransfer = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAreTransfered(false);
    setMessage('');
    try {
      const response = await fetch('http://192.168.1.130:5000/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ IBAN: userData.IBAN, IBAN2, amount, desc }),
      });

      const data = await response.json();
      if (response.ok) {
        setAreTransfered(true);
        setMessage(data.message);
      } else {
        setMessage(data.message || 'Transfer error');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setIsLoading(false);
      setIsSure(false);
    }
  };

  const handleClick = async (event) => {
    event.preventDefault();
    setIsSure(false);
    setMessage('');
    setMessage2('');
    setIsSure(true);
    try {
      const response2 = await fetch("http://192.168.1.130:5000/api/hname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ IBAN2 }),
      });
      const data = await response2.json();
      if (response2.ok) {
        setMessage2(data.message);
      } else {
        setMessage2(data.message || "Account holder retrieval issue.");
      }
    } catch (error) {
      setMessage2('Error: ' + error.message);
    } finally {
      setIsSure(true);
    }
  };

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!userData) return;
        try {
            const response = await fetch('http://192.168.1.130:5000/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ IBAN: userData.IBAN }),
            });

            const data = await response.json();

            if (response.ok) {
                setTransfers(data);
            } else {
                setError(data.message || 'Error fetching transfers');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchTransfers();
}, [userData]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 md:p-6 flex flex-col items-center justify-center">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">
          Μεταφορά Χρημάτων
        </h1>

        <div className="w-full max-w-md bg-white p-4 md:p-6 rounded-lg shadow-md">
          <form onSubmit={handleClick} className="space-y-4 md:space-y-6">
            <div>
              <label htmlFor="IBAN2" className="block text-gray-700 font-medium mb-1">
                IBAN Παραλήπτη
              </label>
              <input
                id="IBAN2"
                type="text"
                value={IBAN2}
                onChange={(e) => setIBAN2(e.target.value)}
                placeholder="Πληκτρ. IBAN"
                required
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-gray-700 font-medium mb-1">
                Ποσό
              </label>
              <input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Πληκτρ. Ποσό"
                required
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="desc" className="block text-gray-700 font-medium mb-1">
                Αιτιολογία
              </label>
              <input
                id="desc"
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Πληκτρ. Αιτιολογία"
                maxLength="90"
                required
                className="w-full border-2 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral transition duration-200"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2 rounded-md font-semibold text-white bg-coral transition duration-300 ${isSure ? "hidden" : "block"} ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-light-salmon"}`}
            >
              {isLoading ? "Επιβεβαίωση..." : "Επιβεβαίωση Παραλήπτη"}
            </button>

            <div className={`flex flex-col ${isSure ? "block" : "hidden"}`}>
              {message2 && (
                <p className="text-gray-700 mt-2 font-semibold">
                  {message2} - Ποσό: {amount} {userData?.currency}
                </p>
              )}

              <button
                onClick={handleTransfer}
                disabled={!isSure}
                className={`w-full mt-4 py-2 rounded-md font-semibold text-white bg-green-500 transition duration-300 ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"}`}
              >
                {isLoading ? "Επεξεργάσια Μεταφοράς..." : "Επιβεβαίωση Μεταφοράς"}
              </button>
            </div>
            <div className={`${areTransfered ? "block" : "hidden"} mt-3`}>
              <p className="text-center font-semibold text-gray-700">
                Η μεταφορά ολοκληρώθηκε με επιτυχία!
              </p>
              <div className="mt-3">
                <p className="text-base font-semibold text-gray-700">
                  Στοιχεία Μεταφοράς:
                </p>
                <div className="p-1">
                  {message && (
                    <p className={`text-sm font-semibold text-gray-700`}>
                      {message}
                    </p>
                  )}
                  <p className="font-semibold text-sm text-gray-700">
                    Ποσό: {amount} {userData?.currency}
                  </p>
                  <p className="font-semibold text-sm text-gray-700">
                    Αιτιολογία: {desc}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-center mb-4 md:mb-6">
          Ιστορικό Συναλλαγών
        </h1>
        <div className="space-y-4">
          {transfers.map((transfer, index) => (
            <TransfersCard key={index} transfers={transfer} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransfersCard({ transfers }) {
  const [userData, setUserData] = useState(null);

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

  const { transaction_id, currency, IBAN_sender, IBAN_receiver, sender, receiver, amount, Description, Date } = transfers || {};
  let formattedDate = Date ? Date.slice(0, 16).replace('T', ' ') : " - ";

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center justify-between border border-gray-200">
      <div className="flex flex-col space-y-1 mb-4 items-center md:items-start md:mb-0">
        <h2 className="text-lg font-semibold text-gray-800 capitalize">Μεταφορά</h2>
        <p className="text-sm text-gray-500">{transaction_id}</p>
      </div>

      <div className="flex flex-col items-center text-sm mb-4 md:mb-0">
        <p className="text-gray-500">{IBAN_receiver === userData?.IBAN ? 'Από:' : 'Πρός:'}</p>
        <p className="font-medium text-gray-700">{receiver}</p>
      </div>

      <div className="flex flex-col items-center text-sm mx-4 mb-4 md:mb-0">
        <p className="text-gray-500">Ποσό:</p>
        <p className={`font-medium ${IBAN_receiver === userData?.IBAN ? 'text-green-600' : 'text-red-600'}`}>
         {IBAN_receiver === userData?.IBAN ? '+' : '-'}{amount}
        </p>
      </div>

      <div className="flex flex-col items-center text-sm mb-4 md:mb-0">
        <p className="text-gray-500">Αιτιολογία:</p>
        <p className="font-medium text-gray-700">{Description}</p>
      </div>

      <div className="flex flex-col items-center md:items-end text-sm">
        <p className="text-gray-500">Ημ/νια:</p>
        <p className="font-medium text-gray-700">{formattedDate}</p>
      </div>
    </div>
  );
}

export default Transfers;
