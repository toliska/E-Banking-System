import React, { useState } from 'react'
import { Link, Navigate } from "react-router-dom"
import { faArrowRightFromBracket, faGear, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'


function NavigationMenu(props, test) {
    const [isLoggedOut, setIsLoggedOut] = useState(false);
    if (isLoggedOut) {
        
        sessionStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
    return (
        
        <div>
            
            
            <ul className='lg:flex lg:space-x-4'>
                <li>
                    <Link
                        to="/"
                        className="text-blue-500 py-3  border-t lg:border-t-0 lg:border-b-0 border-b block"
                        onClick={(props.closeMenu)}
                    >
                        <FontAwesomeIcon icon={faLayerGroup}/> Λογαριασμοί
                    </Link>
                </li>
                <li>
                    <Link
                        to="/transfers"
                        className="text-blue-500 py-3  border-t- lg:border-t-0 lg:border-b-0 border-b block"
                        onClick={(props.closeMenu)}
                    >
                    <FontAwesomeIcon icon={faUserGroup} /> Μεταφορές
                    </Link> 
                </li>
                <li>
                    <Link
                        to="/cards"
                        className="text-blue-500 py-3  border-t- lg:border-t-0 lg:border-b-0 border-b block"
                        onClick={(props.closeMenu)}
                    >
                    <FontAwesomeIcon icon={faCreditCard} /> Κάρτες
                    </Link> 
                </li>
                <li>
                    <Link
                        to="/transactions"
                        className="text-blue-500 py-3  border-t- lg:border-t-0 lg:border-b-0 border-b block"
                        onClick={(props.closeMenu)}
                    >
                    <FontAwesomeIcon icon={faHistory} /> Συναλλαγές
                    </Link> 
                </li>
                <div className='lg:pl-5 flex space-x-4 py-3 justify-end'>
                <li className='text-gray-600'>
                    <FontAwesomeIcon icon={faGear}/>
                </li>
                <li>
                    <button className='text-red-600' onClick={() => setIsLoggedOut(true)}><FontAwesomeIcon icon={faArrowRightFromBracket}/></button>
                </li>

                </div>
                
            </ul>   
        </div>
    )
}

export default NavigationMenu