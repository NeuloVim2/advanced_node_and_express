const passport = require('passport')
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github');
const bcrypt = require('bcrypt');

module.exports = (app, myDataBase) => {

    // Serialize\deserialize user's _id
    passport.serializeUser((user, done) => {
        done(null, user._id);
    })
    passport.deserializeUser((id, done) => {
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        })
    })
    passport.use(new LocalStrategy((username, password, done) => {
        myDataBase.findOne({ username: username }, (err, user) => {
            console.log('User ' + username + ' attempted to log in with local strategy');
            console.log(`password: ${user.password}`);
            console.log(`password: ${password}`);
            if (err) {
                console.log(`in err`);
                return done(err);
            }
            if (!user) {
                console.log(`in !user`);
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!bcrypt.compareSync(password, user.password)) {
                console.log(`in incorrect password`);
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        })
    }))

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:8080/auth/github/callback"
    },
        (accessToken, refreshToken, profile, cb) => {
            myDataBase.findOneAndUpdate(
                { id: profile.id },
                {
                    $setOnInsert: {
                        id: profile.id,
                        name: profile.displayName || 'John Doe',
                        photo: profile.photos[0].value || '',
                        email: Array.isArray(profile.emails)
                            ? profile.emails[0].value
                            : 'No public email',
                        created_on: new Date(),
                        provider: profile.provider || ''
                    },
                    $set: {
                        last_login: new Date()
                    },
                    $inc: {
                        login_count: 1
                    }
                },
                { upsert: true, new: true },
                (err, doc) => {
                    return cb(null, doc.value);
                }
            );
        }
    ));
}