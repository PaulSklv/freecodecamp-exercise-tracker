const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const Schema = mongoose.Schema;
const usersSchema = new Schema(
  {
    user_name: {
      type: String,
      requiered: true
    },
    description: String,
    duration: Number,
    date: String
  },
  { versionKey: false }
);

// const exerciseSchema = new Schema({
//   user_name: {
//     type: String,
//     required: true
//   },
//   count: Number,
//   log: [Object]
// })

const exerciseSchema = new Schema({
  user_name: String,
  id: String,
  description: String,
  duration: Number,
  date: Object
});

let Users = mongoose.model("Users", usersSchema);
let Exercises = mongoose.model("Exercises", exerciseSchema);

app.route("/api/exercise/new-user").post((req, res, next) => {
  let newUser = new Users({ user_name: req.body.username });
  newUser.save((err, data) => {
    if (err) res.send("there is error");
    res.json(data);
  });
});

app.route("/api/exercise/add").post((req, res) => {
  Users.findById(req.body.userId).exec((err, user) => {
    if (err) res.json({ error: err });
    if (user) {
      let newExercise = new Exercises({
        user_name: user.user_name,
        id: user._id.toString(),
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? new Date(req.body.date) : new Date()
      });
      newExercise.save((err, data) => {
        if (err) res.json({ error: err });

        res.send(data);
      });
    } else res.send("User doesn't exist in database.");
  });
});

// app.route("/api/exercise/add").post((req, res) => {
//   Users.findById(req.body.userId, (err, user) => {
//     if (err) res.json({error: err});
//     Exercises.findById(req.body.userId, (err, exercise) => {

//       if(!exercise) {
//         let newExercise = new Exercises({
//           _id: user._id,
//           user_name: user.user_name,
//           count: 1,
//           log: [{
//             description: req.body.description,
//             duration: req.body.duration,
//             date: req.body.date ? new Date().toDateString(req.body.date): new Date().toDateString()
//           }]
//         })
//         newExercise.save((err, data) => {
//           if(err) res.json({error: err});
//           res.json(data);
//         })
//       } else {
//         exercise.count = exercise.log.length + 1;
//         exercise.log = [...exercise.log, {
//           description: req.body.description,
//           duration: req.body.duration,
//           date: req.body.date ? new Date().toDateString(req.body.date): new Date().toDateString()
//         }]
//         exercise.save((err, data) => {
//           if(err) res.json({error: err});
//           res.send(data);
//         })
//       }
//     })
//   })
// })

app.route("/api/exercise/users").get((req, res) => {
  Users.find({}, (err, data) => {
    if (err) res.json({ error: err });
    res.send(data);
  });
});

app.get("/api/exercise/log", (req, res) => {
  Exercises.find({
    id: req.query.userId,
    date: { $gte: new Date(req.query.from), $lte: new Date(req.query.to) }
  })
    .limit(req.query.limit)
    .exec((err, data) => {
      if (!req.query.userId) res.json({ error: err });
      res.json({
        user_name: data[0].user_name,
        id: data[0].id,
        count: data.length,
        log: data.map(item => {
          return {
            description: item.description,
            duration: item.duration,
            date: item.date
          };
        })
      });
    });
});
// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
