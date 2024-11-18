const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');
const http = require("http");
const jwt = require('jsonwebtoken'); // JWT for token-based authentication
const bcrypt = require('bcrypt'); 
const app = express();
const socketIo = require("socket.io");
require('dotenv').config();

const PORT = process.env.PORT || 5000;
let connection;
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "http://192.168.1.130:3000", // Allow frontend origin
      methods: ["GET", "POST"],
    },
});
function broadcast(transaction) {
    io.emit("new_transaction", transaction);
}
  
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
    });
});



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
            
            const query = `SELECT id FROM user_transactions WHERE transaction_id = ?`;
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
    const query = `INSERT INTO user_transactions (transaction, sender, receiver, IBAN_sender, IBAN_receiver, amount, currency, Description, Date, transaction_id) 
                             VALUES ('transfer', ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
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
        currency ?? 'EUR',
        Description ?? 'Δεν υπάρχει αιτ.',
        transaction_id,
        formattedDateTime,
    ];

    try {
        // Execute the query and store the result in a variable without destructuring
        const result = await connection.execute(query, parameters);

        // console.log("Transaction inserted successfully:", result); // Log the entire result to verify structure
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
            // console.log("Database results:", results);

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
            SELECT transaction_id, IBAN_sender, IBAN_receiver, currency, receiver, sender, amount, Description, Date
            FROM user_transactions 
            WHERE transaction = 'transfer' AND (IBAN_sender = ? OR IBAN_receiver = ?)
            ORDER BY Date DESC;
        `;

        connection.execute(query, [IBAN, IBAN], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Log the results to check data structure and values
            // console.log("Database results:", results);

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
    const { IBAN, IBAN2, amount, Description } = req.body;
    try {
        if (IBAN === IBAN2) {
            return res.status(400).json({ message: "Cannot transfer money to the same account" });
        }
        const transaction_id = await generateRandomId();
        const query = `SELECT username, name, surname FROM users WHERE IBAN = ?`;
        connection.execute(query, [IBAN2], (err, results) => {
            if (err) return res.status(500).json({ message: err.message });

            if (results.length === 0) {
                return res.status(404).json({ message: "Account not found" });
            }
            const receiver = results[0];
            connection.execute(`SELECT username, name, surname, currency, balance FROM users WHERE IBAN = ?`, [IBAN], (err, results) => {
                if (err) return res.status(500).json({ message: err.message });

                const sender = results[0];
                if (!sender || sender.balance < amount) {
                    return res.status(400).json({ message: "Insufficient balance" });
                }
                connection.execute(`UPDATE users SET balance = balance - ? WHERE IBAN = ?`, [amount, IBAN], (err) => {
                    if (err) return res.status(500).json({ message: err.message });

                    connection.execute(`UPDATE users SET balance = balance + ? WHERE IBAN = ?`, [amount, IBAN2], (err) => {
                        if (err) return res.status(500).json({ message: err.message });
                        const transaction =  {
                            sender: `${sender.name} ${sender.surname}`,
                            receiver: `${receiver.name} ${receiver.surname}`,
                            IBAN_sender: IBAN,
                            IBAN_receiver: IBAN2,
                            amount,
                            currency: sender.currency,
                            Description,
                            Date: new Date(),
                            transaction_id
                        };
                        // console.log("Inserting transaction:", transaction);
                        connection.execute(
                            `INSERT INTO user_transactions (sender, receiver, IBAN_sender, IBAN_receiver, transaction, currency, amount, Description, Date, transaction_id) 
                             VALUES (?, ?, ?, ?, 'transfer', ?, ?, ?, ?, ?)`,
                            [
                                transaction.sender,
                                transaction.receiver,
                                transaction.IBAN_sender,
                                transaction.IBAN_receiver,
                                transaction.currency,
                                transaction.amount,
                                transaction.Description,
                                transaction.Date,
                                transaction.transaction_id
                            ],
                            (err) => {
                                if (err) return res.status(500).json({ message: err.message });
                                // broadcast(transaction);
                                console.log("Broadcasting transaction:", transaction);
                                io.emit("new_transaction", transaction);
                                res.status(200).json({ message: "Transfer successful", transaction });
                            }
                        );
                    });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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
            // console.log("Database results:", results);

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
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
