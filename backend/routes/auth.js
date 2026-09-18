import express from 'express'
import passport from 'passport'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { prisma } from '../lib/prisma.js'

const router = express.Router();

router.get('/me', (req, res) => {
    res.status(200).json({ user: req.user ?? null });
});

const signUpValidation = [
    body('firstName').trim().notEmpty().withMessage('First name is required')
        .isLength({ max: 255 }).withMessage('First name is too long'),
    body('lastName').trim().notEmpty().withMessage('Last name is required')
        .isLength({ max: 255 }).withMessage('Last name is too long'),
    body('username').trim().notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 32 }).withMessage('Username must be 3-32 characters'),
    body('password').trim().notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
]

router.post('/sign-up', signUpValidation, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { firstName, lastName, username, password: hashedPassword },
            select: { id: true, firstName: true, lastName: true, username: true },
        });

        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            res.status(201).json({ user });
        });
    }
    catch (err) {
        // Duplicate-username handling. Prisma throws P2002 on a unique constraint violation.
        if (err.code === 'P2002') {
            return res.status(409).json({ message: 'Username already taken' });
        }
        console.error(err);
        next(err);
    }
});

router.post('/log-in', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({ message: info?.message ?? "Incorrect username or password" });
        }

        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            res.status(201).json({ user })
        })
    })(req, res, next)
})

// POST, not GET: logout mutates session state, and a GET route can be
// triggered by a stray <img>/prefetch on another page, silently logging users out.
router.post('/log-out', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        // Express-session's method. Deletes the session data from the store (your sessions table in Postgres) entirely.
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }

            // tells the browser to drop the session cookie. Without this, the browser still holds a cookie pointing at a session ID that no longer exists server-side — harmless, but the cookie lingers until it expires naturally.
            res.clearCookie('connect.sid');
            res.json({ user: null })
        })

    })
})

export default router;
