const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const UserModel = require('./userModel')
require('dotenv').config('./config.env')


const DB_URI = process.env.DB_URI || 'mongodb+srv://srini:NqQcATU2TGQ3WR94@cluster0.wgb4u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
// console.log(DB_URI)
const ConnectDb = () => {
  mongoose.connect(DB_URI, { maxPoolSize: 12 })
    .then((res) => { console.log(`Connected to MongoDB successfully  -->  ${res}`) })
    .catch((err) => { console.log(`Error while connecting to MongoDB  -->  ${err}`) });
}
ConnectDb();

mongoose.connection.on('connected', () => { console.log('Connected to DB...') })
mongoose.connection.on('error', (err) => { console.log(`Error in MongoDB connection  -->  ${err}`) })
mongoose.connection.on('disconnected', () => { console.log('MongoDB is disconnected & attempting to reconnect...'); ConnectDb(); })


app.use('/' ,cors({
  origin:['https://www.freecodecamp.org'],
  methods:['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials:true,
  allowedHeaders:['*']
}))
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})


app.post('/api/users', async (req, res) => {
  // console.log(req.url)
  const body = req.body
  body.count = 0

  try {
    const r = await UserModel.create(body)
    // console.log('success')
    return res.status(201).json({ 'username': r.username, '_id': r._id })
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({ 'ValidationError: ': error })
  }
})

app.get('/api/users', async (req, res) => {
  // console.log(req.url)
  try {
    const r = await UserModel.find({}).lean()
    const re = r.map((r1)=>{
      return {
        '_id':r1._id,
        'username':r1.username,
        '__v':r1.__v
      }
    })
    // console.log('success')
    return res.status(200).send(re)
  }
  catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user_id = req.params._id
  const body = req.body
  // console.log(req.url)

  if (!body.description || !body.duration) {
    console.log('empty')
    return res.send(body)
  }
  body.duration = Number(body.duration)
  // if(!body.date){
  //   body.date = new Date()
  // }

  try {
    const user = await UserModel.findById(user_id)
    user.log.push(body)
    user.count++
    await user.save()

    const r = {
      _id: user_id,
      username: user.username,
      date: new Date().toDateString(),
      duration: Number(body.duration),
      description: body.description,
    }
    // console.log('success')
    return res.status(201).send(r)
  }
  catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const user_id = req.params._id
  // Extract the query part of the URL
  const queryString = req.originalUrl.split('?')[1]
  
  // Parse the query string
  const params = {};
  queryString.split('][&').forEach(pair => {
    const [key, value] = pair.replace(/[\[\]]/g, '').split('=');
    if (key) params[key] = value;
  })
  params.limit = Number(params.limit)

  // Extract parsed parameters
  let { from, to, limit } = params
  if(from===to){
    to=null
  }

  try {
    const user = await UserModel.findById(user_id)

    let filteredLogs = user.log.filter(logs => {
      // console.log(new Date(logs.date))
      return (!from || new Date(logs.date) >= new Date(from)) && (!to || new Date(logs.date) <= new Date(to));
    })

    if (limit) {
      filteredLogs = filteredLogs.slice(0, Number(limit));
    }

    filteredLogs = filteredLogs.map(log => ({
      description: log.description,
      duration: Number(log.duration),
      date: new Date(log.date).toDateString(),
    }))

    // console.log('success')
    return res.status(200).send({
      _id: user._id,
      username: user.username,
      count: Number(filteredLogs.length),
      log: filteredLogs
    })
  }
  catch(error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

app.use('*', (req, res)=>{
  return res.status(404).send('[object Object]')
})

const PORT = process.env.PORT || 3000
const listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT)
})
