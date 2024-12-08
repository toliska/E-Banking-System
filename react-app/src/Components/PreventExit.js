import { useEffect } from "react";
import React from "react";

function PreventExit() {
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "" ;
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        }
    }, []);

    return (
        <div className="hidden">
            {/* <h1 className="text-xl font-bold">Προσοχή πρίν την έξοδο</h1>
            <p>Η εφαρμογή θα σας προιδοποιήσει πρίν την αποχώρηση</p> */}

        </div>
    );
}
export default PreventExit;