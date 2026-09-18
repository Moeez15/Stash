import './config/dotenv.js'
import express from 'express'
import cors from 'cors'
import passport from 'passport'
import session from 'express-session'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import { prisma } from './lib/prisma.js'
import './config/auth.js'

const app = express();

// Middleware for parsing HTTP requests
app.use(express.json());
app.use(express.urlencoded({extended: true}))

const sessionStore = new PrismaSessionStore(prisma, {
    checkPeriod: 1000 * 60 * 60 * 2, // prune expired sessions every 2 hours
    dbRecordIdIsSessionId: true,
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: 'GET, POST, PUT, DELETE, PATCH',
    credentials: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', (req, res) => {
    res.status(200).json('<h1 style="text-align: center; margin-top: 50px;">Stash API</h1>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
    if (error) {
        throw error;
    }

    console.log(`Server listening on http://localhost:${PORT}`);
});