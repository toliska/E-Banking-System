const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');
const http = require("http");
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcrypt'); 
const app = express();
const socketIo = require("socket.io");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const e = require('cors');
require('dotenv').config();

const PORT = process.env.PORT;
let connection;
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "http://192.168.1.130:3000", 
      methods: ["GET", "POST"],
    },
});
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, 
    port: process.env.SMTP_PORT, 
    secure: true, // true for port 465, false for port 587
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS, 
    },
});
const userSocketMap = {};
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("register", (username) => {
      userSocketMap[username] = socket.id;
      console.log(`${username} registered with socket ID: ${socket.id}`);
    });
    socket.on("disconnect", () => {
      for (const [username, id] of Object.entries(userSocketMap)) {
        if (id === socket.id) {
          delete userSocketMap[username];
          console.log(`${username} disconnected.`);
          break;
        }
      }
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
app.use(bodyParser.json());
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
async function generateVerificationCode(username) {
    return new Promise((resolve, reject) => {
        let code = '';
        const characters = '0123456789';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const query = `SELECT code FROM user_verification WHERE username = ?`;
        connection.execute(query, [username], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length === 0) {
                const queryInsert = `INSERT INTO user_verification (username, code) VALUES (?, ?)`;
                connection.execute(queryInsert, [username, code], (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(code); 
                });
            } else {
                const queryUpdate = `UPDATE user_verification SET code = ? WHERE username = ?`;
                connection.execute(queryUpdate, [code, username], (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(code); 
                });
            }
        });
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
        const result = await connection.execute(query, parameters);
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
                resolve(generateRandomIban()); 
            }
        });
    });
}

app.post('/api/fetchbalance', async (req, res) => {
    const { username } = req.body;
    try{
        connection.execute('SELECT balance FROM users WHERE username = ?', [username], (err, result) => {
            if (err) {
                res.status(501).json({ message: err });
                console.log(err);
            }
            const bal = result[0]
            res.status(200).json(bal);
            console.log(bal);
            console.log(typeof bal);
        })
    } catch (error) {
        res.status(501).json({ message: error });
        console.log(error);
    }
});
app.post('/api/verify-email', (req, res) => {
    console.log("1");
    const { username, fullCode } = req.body;

    const query = 'SELECT code FROM user_verification WHERE username = ?';
    connection.execute(query, [username], (err, results) => {
        if (err) {
            console.log("2");
            return res.status(500).json({ message: err.message });
        }

        if (results.length === 0) {
            console.log("3");
            return res.status(400).json({ message: 'Δοκιμάστε ξανά' });
        }

        if (results[0].code == fullCode) {

            const updateQuery = 'UPDATE users SET verified = 1 WHERE username = ?';
            connection.execute(updateQuery, [username], (err, updateResults) => {
                if (err) {
                    console.log("5");
                    return res.status(500).json({ message: err.message });
                }

    
                return res.status(200).json({ message: 'Επαλήθευση email με επιτυχία!' });
            });
        } else {
            console.log(fullCode);
            return res.status(200).json({ message: 'Λάθος κδωδικος' });
        }
    });
});



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
        const IBAN = await generateRandomIban(); 
        const query = `INSERT INTO users (username, password, name, surname, email, phone, age, afm, currency, IBAN, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        connection.execute(query, [username, hashedPassword, name, surname, email, phone, age, afm, currency, IBAN, '0'], (err, results) => {
            if (err) {
                console.log(`error ${err.message}`);
                return res.status(500).json({ message: err.message });
                
            }
            
            res.status(201).json({ message: 'User registered successfully' });
            console.log(`Succesfully Registered user ${username}`);
        });
        const tokenquery = `INSERT INTO user_pages (username, token) VALUES (?, ?)`;
        connection.execute(tokenquery, [username, '0']);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const {username, password} = req.body;
    const JWT_SECRET = process.env.JWT_SECRET || "";
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
                    currency: user.currency,
                    IBAN : user.IBAN
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/transactionsall', async (req, res) => {
    const { username, IBAN, views, type } = req.body;
    try {
        if (type === "ANY"){
            const query = `SELECT * FROM  user_transactions WHERE (transaction = ANY (SELECT transaction FROM user_transactions)) AND (username =? OR IBAN_sender = ? OR IBAN_receiver = ?) ORDER BY Date DESC LIMIT ?`;
            connection.execute(query, [username, IBAN, IBAN, views], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                if (results.length === 0) {
                    return res.status(401).json({ message: "No Transactions have been found" });
                }
                res.status(200).json(results);
            });
        } else {
            const query = `
                (SELECT *
                FROM user_transactions 
                WHERE (username = ? OR IBAN_receiver = ? OR IBAN_sender = ?) AND transaction = ? ORDER BY Date DESC LIMIT ?) ORDER BY Date DESC;
            `;
            connection.execute(query, [username, IBAN, IBAN, type, views], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                if (results.length === 0) {
                    return res.status(200).json({ message: "No Transactions have been found" });
                }
                res.status(200).json(results);
            });
        }
        
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
function generateRandomToken() {
    let count = 0;
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()?';
    const charslength = chars.length;
    while (count < 32) {
        result += chars.charAt(Math.floor(Math.random() * charslength));
        count += 1
    }
    return result;
}
app.post('/api/request-recovery', async (req, res) => {
    const { username } = req.body;
    try {
        const query = `SELECT token FROM user_pages WHERE username = ?`;
        connection.execute(query, [username], async (err, results) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            if (results.length === 0) {
                return res.status(200).json({message: "Σε περίπτωση που υπάρχει λογαριασμός συνδεμένος με το username θα σταλθεί email με οδηγίες."});
            }
    
            if (results[0].token != 0 ){
                res.status(200).json({message: "Έχει ήδη σταλθεί σύνδεσμος ανάκτησης λογαριασμού."});
            } else{
                res.status(200).json({message: "Σε περίπτωση που υπάρχει λογαριασμός συνδεμένος με το username θα σταλθεί email με οδηγίες."});
                const token = generateRandomToken();
                const querytoken = `INSERT INTO user_pages (username, token, expire_at, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
                const date = new Date();
                const expirationDate = new Date(date.getTime() + 60 * 60 * 1000);
                console.log("1");
                connection.execute(querytoken, [username, token, expirationDate.toISOString()], (err, results2) => {
                    console.log("2");
                    if (err) {
                        console.log("error" + err);
                    }
                    if (results2.affectedRows > 0) {
                        console.log("correct.");                      
                    }
                })
            
            }
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/request-passreset', async (req, res) => {
    console.log("1");
    const { token, password, password2 } = req.body;
    try {
        console.log("2");
        const query = `SELECT * FROM user_pages WHERE token = ?`;
        connection.execute(query, [token], (err, results) => {
            console.log("3");
            if (err) {
                console.log(err);
            }
            if (results.length > 0) {
                console.log("correct");
            }
        })
    } catch (error) {
        console.log(error);
    }
});


app.post('/api/verification-email', async (req, res) => {
     const { username } = req.body;
    try {
        const query = `SELECT email FROM users WHERE username = ? `;
        const verificationcode = await generateVerificationCode(username);
        connection.execute(query, [username], async (err, results) => {
            if (err) {
                res.status(500).send({ error: 'Failed to send email' });
            }
            const mailoptions = {
                from: process.env.GMAIL_USER,
                to: results[0].email,
                subject: 'Account verification',
                text: 'Your verification code is: ' + verificationcode + 'Please visit this link http://192.168.1.130:3000/EmailVerification to verify email',
            };
            const info = await transporter.sendMail(mailoptions);
            console.log("Email sent: " + info.response);
            res.status(200).send({ message: 'Email sent successfully!' });
        })

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send({ error: 'Failed to send email' });
    }
})

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
                connection.execute(`UPDATE users SET balance = balance - ? WHERE IBAN = ?`, [amount, IBAN], (err, resultstest) => {
                    if (err) return res.status(500).json({ message: err.message });
                    
                    if (resultstest.length > 0) {
                        console.log("correct");
                    }
                    connection.execute(`UPDATE users SET balance = balance + ? WHERE IBAN = ?`, [amount, IBAN2], (err) => {
                        if (err) return res.status(500).json({ message: err.message });
                        const transaction =  {
                            transaction: 'transfer',
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
                                console.log("Broadcasting transaction:", transaction);
                                io.emit("new_transaction", transaction);
                                res.status(200).json({ message: "Transfer successful", transaction });
                            }
                        );
                    });
                });
            });
        });
        const queryB = `SELECT balance FROM users WHERE IBAN = ?`;
        connection.execute(queryB, [IBAN2], (err, results) => {
            if (err) {
                console.log("error");
            }
            const bal = results[0];
            const targetScoketId = userSocketMap[IBAN2];
            if (targetScoketId) {
                io.to(targetScoketId).emit("updateValue", bal);
                console.log("correct");
            }
            console.log("wrong");
        })

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/hometransactions', async (req, res) => {
    const { username, IBAN } = req.body;
    try {
        const query = `SELECT * FROM user_transactions WHERE username = ? OR IBAN_sender = ? OR IBAN_receiver = ?  ORDER BY Date DESC LIMIT 5;
        `;

        connection.execute(query, [username, IBAN, IBAN], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: "No Transactions have been found" });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
