const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken'); // JWT for token-based authentication
const bcrypt = require('bcrypt'); 
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;
let connection;

function connectToDB() {
    connection = mysql.createConnection({
        host: 'localhost', 
        user: 'root', 
        password: '', 
        database: 'atm' 
    });
  
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting: ' + err.stack);
            return;
        }
        console.log('Connected to the database.');
    });
  
    connection.on('error', (err) => {
        console.log('Database error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connectToDB(); // Attempt to reconnect
        } else {
            throw err;
        }
    });
}

connectToDB();
app.use(cors());
app.use(express.json());

app.get('/api/username', (req, res) => {
    connection.execute('SELECT username FROM users WHERE age = 18', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

function generateRandomId(){
    return new Promise((resolve, reject) => {
        async function checkId() {
            let DI = '';
            let county = '1';
            for (let i = 0; i < 14; i++) {
                DI += Math.floor(Math.random() * 10);
            }
            let id = county.concat(DI);
            
            const query = `SELECT id FROM user_transfers WHERE transaction_id = ?`;
            connection.execute(query, [id], (err, results) => {
                if (err) {
                    console.log("There was an error trying to generate id. Please contact the developer.");
                    return reject(err); 
                }
                if (results.length === 0) {
                    resolve(id);
                } else {
                    checkId(); 
                }
            });
        }
        checkId(); 
    });
}

async function insertTransaction(sender, IBAN_Sender, receiver, IBAN_Receiver, amount, currency, Description) {
    const query = `
        INSERT INTO user_transfers 
        (sender, IBAN_Sender, receiver, IBAN_Receiver, amount, currency, Description, transaction_id, Date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const today = new Date();
    const transaction_id = await generateRandomId();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const time = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    const formattedDateTime = `${date} ${time}`;

    const parameters = [
        sender ?? null,
        IBAN_Sender ?? null,
        receiver ?? null,
        IBAN_Receiver ?? null,
        amount ?? 0,
        currency ?? 'USD',
        Description ?? 'No description',
        transaction_id,
        formattedDateTime,
    ];

    try {
        // Execute the query and store the result in a variable without destructuring
        const result = await connection.execute(query, parameters);

        console.log("Transaction inserted successfully:", result); // Log the entire result to verify structure
        return result;
    } catch (error) {
        console.error("Error creating transaction:", error.stack);
        throw error;
    }
}


async function generateRandomIban() {
    let DIG = '';
    for (let i = 0; i < 24; i++) {
        DIG += Math.floor(Math.random() * 10);
    }
    let country = 'GR';
    let IBAN = country.concat(DIG);
    
    const query = `SELECT username FROM users WHERE IBAN = ?`;
    
    return new Promise((resolve, reject) => {
        connection.execute(query, [IBAN], (err, results) => {
            if (err) {
                console.log("There was an error trying to generate IBAN. Please contact the developer.");
                return reject(err); 
            }
            if (results.length === 0) {
                resolve(IBAN);
            } else {
                resolve(generateRandomIban()); // Recursively generate a new IBAN
            }
        });
    });
}

app.post('/api/register', async (req, res) => {
    const {name, surname, username, email, password, phone, age, afm, currency} = req.body;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/;


    try {
        const existingUsers = await new Promise((resolve, reject) => {
            connection.execute('SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?', [username, email, phone], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Username or email or phone already exists' });
        }
        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: 'Invalid email format. Please use the following format: \n example@email.com' });
        }
        if (age < 18) {
            return res.status(400).json({ message: 'You have to be at least 18 to open a bank account' });
        }
        if (afm.length != 9) {
            return res.status(400).json({ message: 'Invalid AFM. AFM must be 9 digits' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const IBAN = await generateRandomIban(); // Await the IBAN generation
        const query = `INSERT INTO users (username, password, name, surname, email, phone, age, afm, currency, IBAN) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        connection.execute(query, [username, hashedPassword, name, surname, email, phone, age, afm, currency, IBAN], (err, results) => {
            if (err) {
                console.log(`error ${err.message}`);
                return res.status(500).json({ message: err.message });
                
            }
            
            res.status(201).json({ message: 'User registered successfully' });
            console.log(`Succesfully Registered user ${username}`);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const {username, password} = req.body;
    const JWT_SECRET = process.env.JWT_SECRET || "oqVlgb^%GK|Ucs$NuuW68S#K/Wpl<8";
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    try {
        const query = `SELECT * FROM users WHERE username = ?`;
        connection.execute(query, [username], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: "No user found" });
            }
            const user = results[0];
            const auth = await bcrypt.compare(password, user.password);
            if (!auth) {
                return res.status(401).json({ message: "Incorrect credentials" });
            }
            const userPayload = { 
                username: user.username,
                name: user.name, 
                balance: user.balance, 
                currency: user.currency,
                IBAN: user.IBAN
            };
            const token = jwt.sign(userPayload, JWT_SECRET, {expiresIn: '2h'});
            res.status(200).json({
                message: 'Login successful',
                token: token,
                user: {
                    username: user.username,
                    name: user.name,
                    balance: user.balance,
                    currency: user.currency,
                    IBAN : user.IBAN
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { username } = req.body;
    try {
        const query = `
            SELECT transaction, currency, 
                   CAST(old_balance AS DECIMAL(10, 2)) as old_balance, 
                   CAST(amount AS DECIMAL(10, 2)) as amount, 
                   CAST(new_balance AS DECIMAL(10, 2)) as new_balance ,
                   Date
            FROM user_transactions 
            WHERE username = ? ORDER BY Date DESC;
        `;

        connection.execute(query, [username], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Log the results to check data structure and values
            console.log("Database results:", results);

            if (results.length === 0) {
                return res.status(401).json({ message: "No Transactions have been found" });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/hname', async (req, res) => {
    const { IBAN2 } = req.body;
    let hname = " ";
    let hsname = " ";
    try {
        const query = `SELECT name, surname FROM users WHERE IBAN = ?`
        connection.execute(query, [IBAN2], (err, results) => {
            if (err) {
                res.status(500).json({message: err});
            }
            if (results.length > 0) {
                const user = results[0];
                for (let i = 0; i <= (user.name.length + 1); i++) {
                    if (i <= 2) {
                        hname += user.name.charAt(i);
                        hsname += user.surname.charAt(i); 

                    } else {
                        hname += '*'
                        hsname += '*'
                    }
                    
                }  
                res.status(200).json({message: `Όνομα: ${hname} Επώνυμο: ${hsname}`});
            }
        })
    } catch (error) {
        res.status(500).json({message: error});
    }
});


app.post('/api/transfers', async (req, res) => {
    const { IBAN } = req.body;
    try {
        
        const query = `
            SELECT transaction_id, IBAN_sender, IBAN_receiver currency, receiver, amount, Description, Date
            FROM user_transfers 
            WHERE IBAN_sender = ? OR IBAN_receiver = ? ORDER BY Date DESC;
        `;

        connection.execute(query, [IBAN, IBAN], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Log the results to check data structure and values
            console.log("Database results:", results);

            if (results.length === 0) {
                return res.status(401).json({ message: "Δεν βρέθηκαν μεταφορές χρημάτων." });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/transfer', async (req, res) => {
    const { IBAN, IBAN2, amount, desc } = req.body;
    try {
        if (IBAN === IBAN2) {
            res.status(401).json({ message: "Δεν μπορειτε να μεταφέρεται χρήματα στον ίδιο λογαριασμό" });
        } else {
            const query = `SELECT username, name , surname FROM users WHERE IBAN = ?`
        connection.execute(query, [IBAN2], (err, results) => {
            if (err) {
                res.status(500).json({ message: err });
            }

            if (results.length > 0) {
                const receiver = results[0];
                const query2 = `SELECT username, name, surname, currency, balance FROM users WHERE IBAN = ?`
                connection.execute(query2, [IBAN], (err, results) => {
                    if (err) {
                        res.status(500).json({ message: err });
                    }
                    const sender = results[0];
                    if (sender.balance >= amount) {
                        const query3 = `UPDATE users SET balance = balance + ? WHERE IBAN = ?`
                        connection.execute(query3, [(amount * -1), IBAN], (err) => {
                            if (err) {
                                res.status(500).json({ message: err });
                            }
                        })
                        connection.execute(query3, [amount, IBAN2], (err, updateResults) => {
                            if (err) {
                                res.status(500).json({ message: err });
                            }
                            if (updateResults.affectedRows > 0) {
                                res.status(200).json({ message: `Όνομα: ${receiver.name} Επώνυμο: ${receiver.surname} `});
                                let  sendername = sender.name + ' ' + sender.surname;
                                let  receivername = receiver.name + ' ' + receiver.surname;

                                insertTransaction(sendername, IBAN, receivername, IBAN2, amount, sender.currency, desc);

                            }
                        } )
                    } else {
                        res.status(500).json({ message: "Insufficient Balance" });
                    }
                })
               
            } else {
                res.status(401).json({ message: "Δεν Βρέθηκε κάτοχος λογαριασμού", IBAN2 });
            }
        })
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

app.post('/api/hometransactions', async (req, res) => {
    const { username } = req.body;
    try {
        const query = `
            (SELECT transaction, currency, 
                   CAST(old_balance AS DECIMAL(10, 2)) as old_balance, 
                   CAST(amount AS DECIMAL(10, 2)) as amount, 
                   CAST(new_balance AS DECIMAL(10, 2)) as new_balance ,
                   Date
            FROM user_transactions 
            WHERE username = ? ORDER BY Date DESC LIMIT 5) ORDER BY Date DESC;
        `;

        connection.execute(query, [username], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Log the results to check data structure and values
            console.log("Database results:", results);

            if (results.length === 0) {
                return res.status(401).json({ message: "No Transactions have been found" });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
