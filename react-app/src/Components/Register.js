import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [age, setAge] = useState('');
  const [afm, setAfm] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Check if passwords match
    if (password !== repeatPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, surname, username, email, password, phone, age, afm, currency }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setIsRegistered(true);
      } else {
        setMessage(data.message || 'Registration error');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
    
  };

  if (isRegistered) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-soft-peach">
      <div className="flex flex-col space-y-4 w-full max-w-3xl p-6 bg-light-cream shadow-md rounded-md">
        <h1 className="text-center text-2xl font-semibold border-b text-dark-slate-gray border-gray-300 pb-4">Register</h1>
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="name" className="text-dark-slate-gray font-medium">Name:</label>
              <input
                id="name"
                type="text"
                value={name}
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setName(e.target.value)}
                placeholder="First Name"
                required
              />
            </div>
            <div>
              <label htmlFor="username" className="text-dark-slate-gray font-medium">Username:</label>
              <input
                id="username"
                type="text"
                value={username}
                className="w-full border-b-2 bg-transparent border-light-salmon  outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="JohnDoe"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-dark-slate-gray font-medium">Password:</label>
              <input
                id="password"
                type="password"
                value={password}
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-dark-slate-gray font-medium">Phone:</label>
              <input
                id="phone"
                type="text"
                value={phone}
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                required
              />
            </div>
            <div>
              <label htmlFor="afm" className="text-dark-slate-gray font-medium">AFM:</label>
              <input
                id="afm"
                type="text"
                value={afm}
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setAfm(e.target.value)}
                placeholder="AFM number"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="surname" className="text-dark-slate-gray font-medium">Surname:</label>
              <input
                id="surname"
                type="text"
                value={surname}
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Last Name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="text-dark-slate-gray font-medium">Email:</label>
              <input
                id="email"
                type="email"
                value={email}
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="repeatPassword" className="text-dark-slate-gray font-medium">Repeat Password:</label>
              <input
                id="repeatPassword"
                type="password"
                value={repeatPassword}
                className="w-full border-b-2 bg-transparent border-light-salmon outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <div>
              <label htmlFor="age" className="text-dark-slate-gray font-medium">Age:</label>
              <input
                id="age"
                type="number"
                value={age}
                min="1"
                className="w-full border-b-2 bg-transparent border-light-salmon  outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                required
              />
            </div>
            <div>
              <label htmlFor="currency" className="text-dark-slate-gray font-medium">Currency:</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border-b-2  bg-transparent border-light-salmon  outline-none py-3 px-2.5 text-dark-slate-gray font-medium"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
              <button
              type="submit"
              disabled={isLoading}
              className={`flex flex-col py-2 px-8 items-center mt-4 bg-coral text-white font-semibold rounded ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-light-salmon transition duration-300'}`}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
            </div>
            
          </div>
        </form>

        {/* Register Button */}
        <div className="flex flex-col items-center space-y-2 mt-4">
          
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-coral hover:underline">
              Log in
            </a>
          </p>
          {message && <p className="text-red-500">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Register;
