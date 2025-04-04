import './output.css';
import Footer from './Components/Footer';
import Home from './Views/Home';
import Register from './Components/Register';
import EmailVerification from './Components/EmailVerification';
import Login from './Components/Login';
import PrivateRoute from './Components/PrivateRoute';
import Transactions from './Components/Transactions';
import Transfers from './Components/Transfers';
import Settings from './Components/Settings';
import Resetpassword from './Components/Resetpassword';
import PreventExit from './Components/PreventExit';
import HomePage from './Views/test';
import Admin from './Components/Admin';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import {
  // BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

function Appl() {
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

  const navigate = useNavigate();

  useEffect(() => {
    let backButtonListener;

    const setupBackButtonListener = async () => {
        backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                navigate(-1); 
            } else {
                App.exitApp(); 
            }
        });
    };

    setupBackButtonListener();

    return () => {
        if (backButtonListener && typeof backButtonListener.remove === 'function') {
            backButtonListener.remove(); 
        }
    };
}, [navigate]);

  return (
    
    <div>
      <PreventExit />
    <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/homepage" element={<HomePage />} />
        
        <Route path='/resetpassword' element={<Resetpassword />} />
        
        <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/admin' element={<Admin/>} />
            
            {/* Conditionally render the Transactions route based on userData */}
            {userData && (
                <><Route path="/transactions" element={<Transactions username={userData.username} />} /><Route path='/transfers' element={<Transfers username={userData.username} />} /></>
            )}
        </Route>

        <Route path="/EmailVerification" element={<EmailVerification />} />
    </Routes>
    <Footer />
     
      
      
      
      
    </div>
  );
}

export default Appl;
