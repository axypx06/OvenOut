require('dotenv').config()
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000
const ejs = require('ejs')
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const Emitter = require('events')

// MongoDB connection
// const url = 'mongodb://localhost:27017/OvenOut'
mongoose.connect(process.env.MONGO_CONNECTION_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const connection = mongoose.connection
connection.once('open', () => {
  console.log('Database connected...')
})
connection.on('error', (err) => {
  console.error('Connection error:', err)
})

// Session store
let mongoStorage = new MongoStore({
  mongoUrl: process.env.MONGO_CONNECTION_URL,
  collectionName: 'sessions'
});

const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)





app.use(session({
  secret: process.env.SecretKey|| 'ardnev',
  resave: false,
  store: mongoStorage,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}))


const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())


app.use((req, res, next) => {
  res.locals.session = req.session
  res.locals.user = req.user
  next()
})

app.use(express.static('public'))
app.use(express.json())
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

require('./routes/web')(app)
app.use((req, res) => {
  res.status(404).render('errors/404')
})

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})

// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})