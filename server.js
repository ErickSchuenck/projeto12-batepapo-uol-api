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
  let { to } = req.body;
  let { text } = req.body;
  let { type } = req.body;
  let currentTime = dayjs().format('HH:mm:ss');
  let user = req.headers.user;

  // const toSchema = joi.string().required();
  // const typeSchema = joi.string().required();
  // const fromSchema = joi.string().required();

  // const validation = userSchema.validate(name)

  try {
    await messages.insertOne({
      from: user,
      to: to,
      text: text,
      type: type,
      time: currentTime,
    })
    res.send(201)
  } catch (error) {
    res.sendStatus(500);
    console.log(error)
  }
})
