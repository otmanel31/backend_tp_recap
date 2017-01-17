const express = require('express')
const app = express()
const path = require('path')
const db = require(path.join(__dirname,'models', 'index.js'))

const bodyParser = require('body-parser')
const env = process.env.NODE_ENV || 'development'
const inspect = require('util').inspect

const methodOverride = require('method-override')


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.use(methodOverride('_method', {methods: ['GET', 'POST']}))

// template engine configuration
app.set("views", require('path').join(__dirname, "views"))
app.set("view engine", "hbs")
// set hbs partials directory
require('hbs').registerPartials(path.join(__dirname, 'views', 'partials'))



// debug middleware
if (env === 'development')
  app.use((req, res, next) => {
    console.log(`req: ${req.method} ${req.url}`)
    next()
  })

// assets: css, images and other static files
// in directory assets
app.use(express.static('assets'))

app.get('/', (req, res) => res.render('index'))

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
