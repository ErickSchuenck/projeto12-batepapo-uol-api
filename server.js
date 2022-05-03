import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from 'dayjs'

let db;
const app = express();
const messageSchema = joi.object({
  to: joi.string().min(1).required(),
  text: joi.string().min(1).required(),
  type: joi.valid('message', 'private_message')
})
app.use(cors());
app.use(express.json());
dotenv.config();

app.listen(5000, () => console.log('server ligado na porta 5000'));

const mongoClient = new MongoClient(process.env.MONGO_URL);
await mongoClient.connect()
  .then(() => {
    db = mongoClient.db("projeto12-batepapo-uol-api");
  })
  .catch(error => console.log("Database conection problem", error));



const participants = db.collection("participants");
const messages = db.collection("messages");




setInterval(() => {
  console.log('Removendo participantes inativos')
  clearIdleUsers()
}, 15000)

async function clearIdleUsers() {
  const now = Date.now();
  const usersArr = await participants.find({}).toArray();
  const inativeUsers = usersArr.filter(user => now - user.lastStatus >= 10000);
  inativeUsers.forEach(element => {
    participants.deleteOne({ name: element.name })
    messages.insertOne({
      from: element.name,
      to: 'Todos',
      text: 'sai da sala',
      type: 'status',
      time: dayjs().format('HH:MM:ss')
    })
  })
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
        await messages.insertOne(
          {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:MM:ss')
          })
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

app.delete('/messages/:id', async (req, res) => {
  let user = req.headers.user
  let id = req.params.id
  try {
    const message = await messages.findOne({
      _id: ObjectId(id)
    })
    if (!message) {
      res.sendStatus(404)
      return
    }
    if (message.from !== user) {
      res.sendStatus(401)
      return
    } else {
      await messages.deleteOne({
        _id: ObjectId(id)
      })
    }
  }
  catch (error) {
    res.send(error)
  }
})

app.put('/messages/id', async (req, res) => {
  let message = req.body.text
  let user = req.headers.user
  let id = req.params.id
  try {
    const validation = messageSchema.validate(req.body);
    if (!validation.error) {
      const findMessage = messages.findOne({ _id: ObjectId(id) })
      if (!findMessage) {
        res.status(404);
        return;
      }
      if (findMessage.from !== user) {
        res.status(401);
        return;
      }
      if (findMessage) {
        await messages.updateOne({ _id: id }, { $set: { text: message } })
        res.sendStatus(200)
      }
    }
    if (validation.error) {
      res.sendStatus(422)
    }
  }
  catch (error) {
    res.send(error)
  }
})
