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
  duration: Number,
  date: String
}, {versionKey: false});

const exerciseSchema = new Schema({
  user_name: {
    type: String,
    required: true
  },
  count: Number,
  log: [Object]
})
let Users = mongoose.model("Users", usersSchema); 
let Exercises = mongoose.model("Exercises", exerciseSchema);

app.route("/api/exercise/new-user").post((req, res, next) => {
  let newUser = new Users({user_name: req.body.username})
  newUser.save((err, data) => {
    if(err) res.send("there is error");
    res.json(data);
  })
})

app.route("/api/exercise/add").post((req, res) => {
  Users.findById(req.body.userId, (err, data) => {
    if (err) res.json({error: err});
    Exercises.findById(req.body.userId, (err, data) => {
      if(!data) {
        let newExercise = new Exercises({
          _id: data._id,
          user_name: data.user_name,
          count: 1,
          log: [{
            description: req.body.description,
            duration: req.body.duration,
            date: req.body.date ? new Date().toDateString(req.body.date): new Date().toDateString()
          }]
        })
        newExercise.save((err, data) => {
          if(err) res.json({error: err})
        })
      } else {
        data.count = data.count.length + 1;
        data.log = [...data.log, {
          description: req.body.description,
          duration: req.body.duration,
          date: req.body.date ? new Date().toDateString(req.body.date): new Date().toDateString()
        }]
      }
    }) 
  })
})

app.route("/api/exercise/users").get((req, res) => {
  Users.find({}, (err, data) => {
    if(err) res.json({error: err})
    res.send(data);
  })  
})

app.get("/api/exercise/log", (req, res) => {
  Exercises.find({user_name: "userssss"}, (err, data) => {
    if(err) res.json({error: err});
    res.send(data);
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
