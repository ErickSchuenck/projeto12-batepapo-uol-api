import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import { text } from "express";

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

// para enviar o nome do participante
app.post('/participants', async (req, res) => {
  //para validar o objeto de usuários
  const userSchema = joi.string().required();
  const { name } = req.body;
  const { to } = req.body;
  const { text } = req.body;
  const { type } = req.body;
  const validation = userSchema.validate(name)

  //para enviar o nome do usuário

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

// app.post('/messages', async (req, res) => {

//   try {
//     if (text) {
//       await messages.insertOne({
//         to: to,
//         text: text,
//         type: type,
//       })
//       res.sendStatus(200)
//       console.log('a mensagem ', text, ' foi enviada')
//     }
//   }
//   catch (error) {
//     console.log(error, ' error ocurred')
//     if (validation.error) {
//       res.status(422).send(error)
//     }
//   }
// })