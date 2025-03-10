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
  methods:['*'],
  // credentials:true,
  allowedHeaders:['*']
}))
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})


const errHtml1 = `<!DOCTYPE html>
                <html lang="en">
                  <head>
                    <meta charset="utf-8">
                    <title>Error</title>
                  </head>
                    <body>
                    <pre>[object Object]</pre>
                  </body>
                </html>`
const errHtml2 = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Error</title>
    </head>
    <body>
        <pre>
            CastError: Cast to ObjectId failed for value &quot;67845ec4374612001327576l &quot;(type string) at path &quot;_id &quot;for model &quot;Users &quot;<br>
            &nbsp;&nbsp;at model.Query.exec (/app/node_modules/mongoose/lib/query.js:4498:21)<br>
            &nbsp;&nbsp;at Query.findOne (/app/node_modules/mongoose/lib/query.js:2329:8)<br>
            &nbsp;&nbsp;at Function.findOne (/app/node_modules/mongoose/lib/model.js:2275:13)<br>
            &nbsp;&nbsp;at Function.findById (/app/node_modules/mongoose/lib/model.js:2215:15)<br>
            &nbsp;&nbsp;at /app/routes/api.js:37:9<br>
            &nbsp;&nbsp;at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)<br>
            &nbsp;&nbsp;at next (/app/node_modules/express/lib/router/route.js:149:13)<br>
            &nbsp;&nbsp;at Route.dispatch (/app/node_modules/express/lib/router/route.js:119:3)<br>
            &nbsp;&nbsp;at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)<br>
            &nbsp;&nbsp;at /app/node_modules/express/lib/router/index.js:284:15<br>
            &nbsp;&nbsp;at param (/app/node_modules/express/lib/router/index.js:365:14)<br>
            &nbsp;&nbsp;at param (/app/node_modules/express/lib/router/index.js:376:14)<br>
            &nbsp;&nbsp;at Function.process_params (/app/node_modules/express/lib/router/index.js:421:3)<br>
            &nbsp;&nbsp;at next (/app/node_modules/express/lib/router/index.js:280:10)<br>
            &nbsp;&nbsp;at Function.handle (/app/node_modules/express/lib/router/index.js:175:3)<br>&nbsp;&nbsp;at router (/app/node_modules/express/lib/router/index.js:47:12)
        </pre>
    </body>
</html>
`

app.post('/api/users', async (req, res) => {
  // console.log(req.url)
  const body = req.body
  body.count = 0

  try {
    const r = await UserModel.create(body)
    // console.log('success')
    return res.status(200).send({ 'username': r.username, '_id': r._id })
  }
  catch (error) {
    console.log(error)
    return res.status(500).send(errHtml1)
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
    return res.status(500).send(errHtml1)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user_id = req.params._id
  const body = req.body
  // console.log(req.url)

  if (!body.description || !body.duration) {
    // console.log('empty')
    return res.status(404).send(errHtml1)
  }
  body.duration = Number(body.duration)
  if(body.date){
    body.date = new Date(body.date).toDateString()
  }   //67c547b8daa33a875fbea8e3
  else{
    body.date = new Date().toDateString()
  }

  try {
    const user = await UserModel.findById(user_id)
    if(!user){
      return res.status(500).send(errHtml2)
    }
    user.log.push(body)
    user.count++
    await user.save()

    const r = {
      _id: user_id,
      username: user.username,
      // date: new Date().toDateString(),
      date: body.date,
      duration: Number(body.duration),
      description: body.description,
    }
    // console.log('success')
    return res.status(200).send(r)
  }
  catch (error) {
    console.log(error)
    return res.status(500).send(errHtml1)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const user_id = req.params._id
  // Extract the query part of the URL
  // const queryString = req.originalUrl.split('?')[1]
  let {from, to, limit} = req.query
  
  // Parse the query string
  // const params = {};
  // if(queryString){
  //   queryString.split('][&').forEach(pair => {
  //     const [key, value] = pair.replace(/[\[\]]/g, '').split('=');
  //     if (key) params[key] = value;
  //   })
  //   params.limit = Number(params.limit)
  // }
  //   // Extract parsed parameters
  //   let { from, to, limit } = params
    if(from===to){
      to=null
    }
    // console.log(req.url+'\t'+from+'\t'+to+'\t'+limit)

  try {
    const user = await UserModel.findById(user_id)
    // console.log(user)

    if(!user){
      return res.status(500).send(errHtml2)
    }

    let filteredLogs = user.log.filter(logs => {
      // console.log(new Date(logs.date))
      return (!from || new Date(logs.date) >= new Date(from)) && (!to || new Date(logs.date) <= new Date(to));
    })
    // console.log('filtered')

    if (limit) {
      filteredLogs = filteredLogs.slice(0, Number(limit));
    }
    // console.log('limited')

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
    return res.status(500).send(errHtml1)
  }
})

app.use((err, req, res, next)=>{
  return res.status(404).send(errHtml1)
})

app.use('*', (req, res)=>{
  return res.status(404).send(errHtml1)
})

const PORT = process.env.PORT || 3000
const listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT)
})
