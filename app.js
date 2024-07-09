const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const app = express();

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'rezichka',
    
    database: 'EventBD'
});

app.use(session({
    secret: 'randomly generated secret',
    resave: false,
    saveUninitialized: true,
}));

app.use('/tickets', express.static(path.join(__dirname, 'public', 'tickets')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use('/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist/')));

function setCurrentUser(req, res, next) {
    if (req.session.loggedIn) {
        const sql = "SELECT * FROM User WHERE id = ?";
        const params = [req.session.userId];
        db.query(sql, params, (err, row) => {
            if (err) {
                console.error("Database error during setCurrentUser:", err);
                return next();
            }

            if (row.length > 0) {
                res.locals.currentUser = row[0];
                console.log("Current user set:", row[0]);
            }
            return next();
        });
    } else {
        return next();
    }
}

app.use(setCurrentUser);

function checkAuth(req, res, next) {
    if (req.session.loggedIn) {
        return next();
    } else {
        res.redirect('/login');
    }
}

app.get('/', (req, res) => {
    const search = req.query.search || '';
    const category = req.query.category || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';
    
    let sql = 'SELECT * FROM Event';
    const filters = [];
    const queryParams = [];

    if (search) {
        filters.push('(Category LIKE ? OR Description LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
        filters.push('Category = ?');
        queryParams.push(category);
    }
    if (dateFrom) {
        filters.push('Date >= ?');
        queryParams.push(dateFrom);
    }
    if (dateTo) {
        filters.push('Date <= ?');
        queryParams.push(dateTo);
    }

    if (filters.length > 0) {
        sql += ' WHERE ' + filters.join(' AND ');
    }

    db.query(sql, queryParams, (err, results) => {
        if (err) throw err;
        res.render('index', {
            events: results,
            search,
            category,
            dateFrom,
            dateTo
        });
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const sql = "SELECT * FROM User WHERE Email = ?";
    const params = [email];

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length > 0) {
            const user = results[0];

            bcrypt.compare(password, user.Password, (err, match) => {
                if (err) {
                    console.error("Password comparison error:", err);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                if (match) {
                    req.session.loggedIn = true;
                    req.session.userId = user.id;
                    res.redirect('/');
                } else {
                    res.render('login', { error: 'Invalid email or password' });
                }
            });
        } else {
            res.render('login', { error: 'Invalid email or password' });
        }
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    const hash = bcrypt.hashSync(password, 10);

    const sql = "INSERT INTO User (Name, Email, Password, Failed_logins) VALUES (?, ?, ?, 0)";
    const params = [name, email, hash];

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.redirect('/login');
    });
});

function generateTicketNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

app.get('/event/:id', (req, res) => {
    const eventId = req.params.id;
    const event = {
        id_Event: eventId,
        Category: 'Концерт',
        Date: '2024-08-01',
        Description: 'Великолепный концерт в центре города.'
    };
    
    const isBooked = req.session.bookedTickets && req.session.bookedTickets[eventId];
    const ticketNumber = isBooked ? req.session.bookedTickets[eventId] : '';

    res.render('event-details', { event, isBooked, ticketNumber });
});

app.post('/book/:id', (req, res) => {
    const eventId = req.params.id;

    const ticketNumber = generateTicketNumber();
    if (!req.session.bookedTickets) {
        req.session.bookedTickets = {};
    }
    req.session.bookedTickets[eventId] = ticketNumber;

    res.redirect(`/event/${eventId}`);
});

app.get('/profile', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }
    res.render('profile', { currentUser: res.locals.currentUser });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
