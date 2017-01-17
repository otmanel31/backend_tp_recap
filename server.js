const express = require('express')
const app = express()
const path = require('path')
const db = require(path.join(__dirname,'models', 'index.js'))
const env = process.env.NODE_ENV || 'development'
const inspect = require('util').inspect


const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const expressSession = require('express-session')
const cookieParser = require('cookie-parser')

// template engine configuration
app.set("views", require('path').join(__dirname, "views"))
app.set("view engine", "hbs")
// set hbs partials directory
require('hbs').registerPartials(path.join(__dirname, 'views', 'partials'))

// authentication with passport-local
// configuration
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

passport.use(new LocalStrategy(
  function(username, password, cb) {
    console.log(`search in db.User username=${username} password=*****`)
    db.User.findOne({
      attributes: ['id', 'login', 'email', 'password'],
      where: {
        login: username
      }
    })
      .then(user => {
        let userVals = user.get({plain: true})
        console.log(`user found: ${inspect(userVals)}`)
        return user
      })
      .then( user => {
        let userVals = user.get({plain: true})
        if (!userVals)
          return cb(null, false)
        if (user.password !== password)
          return cb(null, false)
        return cb(null, userVals)
      })
  }))

// store user Id into session
passport.serializeUser((user, cb) => {
  console.log(`store user.id=${user.id} into session`)
  cb(null, user.id)
})

// retreive user from session
passport.deserializeUser((id, cb) => {
  db.User.findById(id)
    .then(user => {
      let userVals = user.get({plain: true})
      console.log(`from id=${id} restore req.user to ${inspect(userVals)} `)
      cb(null, userVals)
    })
    .catch(e => cb(err))
})

// middleware to protect a route
// if not looged in, store requested url and redirect to login page
ensureLoogedIn = (req, res, next) => {
  if (!req.user) {
    console.log(`ensureLoogedIn: not connected, redirect to /session/new`)
    req.session.redirect_to = req.url
    res.redirect('/session/new')
  }
  
  next()
}

// middlewares
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.use(methodOverride('_method', {methods: ['GET', 'POST']}))
app.use(expressSession({ secret: 'miaou', resave: false, saveUninitialized: false }))

// Initialize Passport 
app.use(passport.initialize())
// restore authentication state from session
app.use(passport.session())


// debug middleware
if (env === 'development')
  app.use((req, res, next) => {
    console.log(`req: ${req.method} ${req.url}`)
//    if (req.session)
//      console.log(`session: ${inspect(req.session)}`)
    next()
  })

// assets: css, images and other static files
// in directory assets
app.use(express.static('assets'))


// routes definitions
app.get('/', (req, res) => res.render('index', {content: '<a href="/private" >zone privée</a>'}))

app.get('/private', ensureLoogedIn,
        (req, res, next) => {
          console.log(`authenticated with user=${inspect(req.user)}`)
          next()
        },
        (req, res) => res.render('index', {content: 'vous êtes dans la zone!'})
)


// session routes
app.get('/session/new', (req, res) => {
  res.render('session/new')
})

app.post('/session',
         (req, res, next) => {
           console.log(`just before passport.authenticate`)
           next()
         },
         passport.authenticate('local', { failureRedirect: '/session/new'}),
         (req, res) => {
           let redirection = '/'
           if (req.session.redirect_to) {

             redirection = req.session.redirect_to
             delete req.session.redirect_to
           }
           res.redirect(redirection)
         })

app.delete('/session', (req, res) => {
  req.logout()
  res.redirect('/')
})


// Users routes

// creation form
app.get('/users/new', (req, res) => {
  res.render('users/new')
})


// list
app.get('/users', (req, res) => {
  db.User.findAll({
    attributes: ['id', 'login', 'email']
  }).then(users => res.render('users/list', {users: users}))
})


// create
app.post('/users', (req, res) => {
  db.User.create(req.body.user)
    .then(user => res.redirect(`/users/${user.id}`))
    .catch(e => {
      console.log(inspect(e))
      const messages = e.errors.map(e => {
        return `${e.message}`
      })
      res.render('users/new', {user: req.body.user, messages: messages})
    })
})

// show
app.get('/users/:id', (req, res) => {
  db.User.findById(req.params.id)
    .then(user => res.render('users/show', {user: user}))
    .catch(e => res.status(404).send('no such user'))
})


// edit form
app.get('/users/:id/edit', (req, res) => {
  db.User.findById(req.params.id)
    .then(user => {
      res.render('users/edit', {user: user})
    })
    .catch(e => res.status(404).send('no such user'))
})


// update
app.put('/users/:id', (req, res) => {
  db.User.findById(req.params.id)
    .then(user => {
      user.update(req.body.user)
        .then(user => res.redirect(`/users/${user.id}`))
        .catch(e => {
          console.log(inspect(e))
          const messages = e.errors.map(e => {
            return `${e.path} ${e.message}`
          })
          res.render('users/edit', {user: user, messages: messages})
        })
    })
    .catch(e => res.status(404).send('no such user'))
})


// delete
app.delete('/users/:id', (req, res) => {
  db.User.findById(req.params.id)
    .then(user => {
      user.destroy()
      res.redirect('/users')
    })
    .catch(e => res.status(404).send('no such user'))
})


const server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
  
})
