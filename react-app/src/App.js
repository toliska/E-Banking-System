import './output.css';
import Footer from './Components/Footer';
import Home from './Views/Home';
import About from './Views/About';
import Register from './Components/Register';
import EmailVerification from './Components/EmailVerification';
import Login from './Components/Login';
import PrivateRoute from './Components/PrivateRoute';
import Transactions from './Components/Transactions';
import Transfers from './Components/Transfers';
import Settings from './Components/Settings';
import Resetpassword from './Components/Resetpassword';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
function App() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            setUserData(decoded); // assuming your token contains user data
        } catch (error) {
            console.error("Failed to decode token:", error);
        }
    }
  }, []);

  return (
    
    <div>
      <Router>
    <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path='/resetpassword' element={<Resetpassword />} />
        
        <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path='/settings' element={<Settings />} />
            
            {/* Conditionally render the Transactions route based on userData */}
            {userData && (
                <><Route path="/transactions" element={<Transactions username={userData.username} />} /><Route path='/transfers' element={<Transfers username={userData.username} />} /></>
            )}
        </Route>

        <Route path="/EmailVerification" element={<EmailVerification />} />
    </Routes>
    <Footer />
</Router>
     
      
      
      
      
    </div>
  );
}

export default App;
