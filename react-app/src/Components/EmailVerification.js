import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

function EmailVerification() {
  const [code, setCode] = useState(['', '', '', '', '', '']); 
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [timer, setTimer] = useState(120);  
  const [canResend, setCanResend] = useState(false);

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

  const handleInputChange = (e, index) => {
    const value = e.target.value;

    if (value === '' || /^[0-9]$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`code-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle backspace functionality
  const handleInputKeyDown = (e, index) => {
    if (e.key === 'Backspace' && code[index] === '') {
      if (index > 0) {
        const prevInput = document.getElementById(`code-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    }
  };

  const handleVerification = useCallback(
    async (e) => {
      e.preventDefault();
      setMessage("");
      const fullCode = code.join("");
      
      if (fullCode.length !== 6 || isNaN(fullCode)) {
        setInputError(true);
        setMessage("Please enter a valid 6-digit code.");
        return;
      }

      try {
        const response = await fetch("http://192.168.1.130:5000/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userData.username, fullCode }),
        });
        const data = await response.json();

        if (response.ok) {
          setIsVerified(true);
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setMessage(data.message || "Invalid code. Please try again.");
        }
      } catch (error) {
        setMessage("Error: " + error.message);
      }
    },
    [code, userData]
  );


  const handleResendEmail = async(e) => {
    setMessage('Verification email resent! Please check your inbox.');
    const response = await fetch("http://192.168.1.130:5000/api/verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userData.username }),
      });
    setTimer(120);  // Reset timer to 2 minutes
    setCanResend(false); // Disable button until timer expires
  };

  // Countdown for resend email button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);  // Enable the button when the timer reaches 0
    }
  }, [timer]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col space-y-6 w-full max-w-md p-8 bg-white shadow-xl rounded-lg">
        <h1 className="text-center text-2xl font-bold text-gray-800 border-b border-gray-300 pb-4">
          Email Verification
        </h1>

        <form onSubmit={handleVerification} className="flex flex-col space-y-6">
          <div className="flex justify-between space-x-2">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                id={`code-input-${index}`}
                value={digit}
                onChange={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleInputKeyDown(e, index)}
                className={`w-12 h-12 text-center text-2xl border-2 rounded-lg ${inputError ? 'border-red-500' : 'border-gray-300'} focus:outline-none`}
                maxLength={1}
                required
                autoFocus={index === 0}
              />
            ))}
          </div>

          {inputError && <p className="text-red-500 text-sm mt-2">Code must be 6 digits.</p>}

          <button
            type="submit"
            className="py-3 px-8 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none"
          >
            Verify
          </button>
        </form>

        {message && (
          <p
            className={`text-center text-sm mt-4 ${isVerified ? 'text-green-500' : 'text-red-500'}`}
          >
            {message}
          </p>
        )}

        <div className="text-center mt-4">
          <button
            onClick={handleResendEmail}
            className={`text-blue-500 text-sm hover:underline ${canResend ? '' : 'cursor-not-allowed opacity-50'}`}
            disabled={!canResend}
          >
            {canResend ? 'Resend Email' : `Resend Email in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;
