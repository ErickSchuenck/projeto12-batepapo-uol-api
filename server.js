import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import { text } from "express";
import dayjs from 'dayjs'

let db;
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

// para colocar a porta online
app.listen(5000, () => console.log('server ligado na porta 5000'));

// para se conectar ao mondodb
const mongoClient = new MongoClient(process.env.MONGO_URL);
await mongoClient.connect()
  .then(() => {
    db = mongoClient.db("projeto12-batepapo-uol-api");
  })
  .catch(error => console.log("Database conection problem", error));

// coleções


const participants = db.collection("participants");
const messages = db.collection("messages");


setInterval(() => {
  console.log('Removendo participante inativo')
  clearIdleUsers()
}, 1000)

async function clearIdleUsers() {
  let currentTime = dayjs().format('HH:MM:SS');
  let currentParticipants = await participants.find().toArray()
  console.log(currentParticipants)
  if (currentParticipants) {
    currentParticipants.forEach(async (user) => {
      if (Date.now() - user.lastStatus >= 10000)
        await messages.insertOne({
          from: user.name,
          to: 'Todos',
          text: 'sai da sala',
          type: 'status',
          time: currentTime,
        })
      await participants.deleteOne(user);
    })
  }
}

app.post('/participants', async (req, res) => {
  const userSchema = joi.string().required();
  const { name } = req.body;
  const validation = userSchema.validate(name)

  try {
    if (!validation.error) {
      let currentUser = await participants.findOne({ name: name });
      if (!currentUser) {
        await participants.insertOne({
          name: name,
          lastStatus: Date.now()
        });
        res.sendStatus(200)
      }
      if (currentUser) {
        res.sendStatus(409)
      }
    }
  }

  catch (error) {
    console.log(error, ' error ocurred')
    if (validation.error) {
      res.status(422).send(error)
    }
  }
})

app.get('/participants', async (req, res) => {
  try {
    const users = await participants
      .find()
      .toArray()
    res.send(users)
  } catch {
    res.sendStatus(500)
  }
})

app.post('/messages', async (req, res) => {
  let { to, text, type } = req.body;
  let currentTime = dayjs().format('HH:mm:ss');
  let user = req.headers.user;

  const messageSchema = joi.object({
    to: joi.string().min(1).required(),
    text: joi.string().min(1).required(),
    type: joi.valid('message', 'private_message')
  })

  try {
    const validation = messageSchema.validate(req.body);
    if (!validation.error) {
      await messages.insertOne({
        from: user,
        to: to,
        text: text,
        type: type,
        time: currentTime,
      })
      res.sendStatus(201)
    } else {
      res.send(validation.error)
    }

  } catch (error) {
    res.sendStatus(500);
    console.log(error)
  }
})

app.get('/messages', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100

  try {
    const messagesThatWillBeSent = await messages
      .find({ $or: [{ to: 'Todos' }, { to: req.header.user }, { from: req.header.user }] })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();
    res.send(messagesThatWillBeSent.reverse());
  }
  catch {
    res.sendStatus(500);
  }
})

app.post('/status', async (req, res) => {
  let user = req.headers.user;
  try {
    let loggedUser = await participants.findOne({ name: user })
    if (!loggedUser) {
      res.sendStatus(404);
      return;
    }

    if (loggedUser) {
      participants.updateOne(
        {
          name: user
        },
        { $set: { lastStatus: Date.now() } }
      )
    }
    res.sendStatus(200)
  } catch (error) {
    console.error('Could not post status', e);
    res.sendStatus(304)
  }
})
