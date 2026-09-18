import passport from 'passport'
import LocalStrategy from 'passport-local'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

const verifyCallback = async (username, password, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return done(null, false, { message: 'Incorrect username' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return done(null, false, { message: 'Incorrect password' });
        }

        const { password: _password, ...safeUser } = user;
        return done(null, safeUser);
    }
    catch (err) {
        return done(err);
    }
}

const strategy = new LocalStrategy(verifyCallback);
passport.use(strategy);

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, firstName: true, lastName: true, username: true },
        });
        done(null, user);
    }
    catch (err) {
        done(err);
    }
})
