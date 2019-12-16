const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Schema = mongoose.Schema;
const usersSchema = new Schema({
  user_name: {
    type: String,
    requiered: true
  },
  description: String,
  duration: String,
  date: String
}, {versionKey: false});
let Users = mongoose.model("Users", usersSchema); 

app.route("/api/exercise/new-user").post((req, res) => {
  let newUser = new Users({user_name: req.body.username})
  newUser.save((err, data) => {
    if(err) res.send("there is error");
    res.json(data);
  })
})

app.route("/api/exercise/add").post((req, res) => {
  Users.findById(req.params.userId, (err, data) => {
    data.description = req.params.description;
    data.duration = req.params.duration;
    data.date = req.params.date;
  })
})
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
