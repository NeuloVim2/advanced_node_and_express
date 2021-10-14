const passport = require('passport')
const bcrypt = require('bcrypt');

module.exports = (app, myDataBase) => {
    app.route('/').get((req, res) => {
        res.render(`pug`, {
            title: 'Connected to database',
            message: 'Please login',
            showLogin: true,
            showRegistration: true,
            showSocialAuth: true
        });
    });

    app.route('/login').post(passport.authenticate("local", { failureRedirect: '/' }), (req, res) => {
        console.log(`User ${req.user} attempted to log in.`);
        res.redirect('/profile');
    })

    app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    })

    app.route('/chat').get(ensureAuthenticated, (req, res) => {
        res.render(`pug/chat`, {user: req.user})
    })

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render(`${process.cwd()}/views/pug/profile`, { username: req.user.username });
    })

    app.route('/register').post((req, res, next) => {
        console.log(`request obj in /register: ${req.body.username}`);
        const hash = bcrypt.hashSync(req.body.password, 12)
        myDataBase.findOne({ username: req.body.username }, (err, user) => {
            if (err) {
                console.log(`can not find a user. ${err}`)
                next(err)
            } else if (user) {
                console.log(`user exist ${user}`)
                res.redirect('/')
            } else {
                myDataBase.insertOne({
                    username: req.body.username,
                    password: hash
                }, (err, doc) => {
                    if (err) {
                        console.log(`can't create doc. ${err}`)
                        res.redirect('/');
                    } else {
                        console.log(`documeted saved to db ${doc}`);
                        next(null, doc.ops[0]);
                    }
                })
            }
        })
    }, passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            console.log(`authenticated user ${req.username}`);
            res.redirect('/profile');
        }
    )

    app.route('/auth/github').get(passport.authenticate('github'))

    app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
        console.log(`github auth successfull`)
        req.session.user_id = req.user.id
        res.redirect('/chat');
    })


    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });
}

const ensureAuthenticated = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/');