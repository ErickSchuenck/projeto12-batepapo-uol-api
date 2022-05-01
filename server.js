import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

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
  const validation = userSchema.validate(name)

  // para checar se o nome está em uso meu médoto (deu errado)
  // let nameInUse = false;
  // if (await participants.find({ name })) {
  //   nameInUse = true;
  //   console.log('this name is already in use');
  // }
  // if (nameInUse == true) {
  //   res.sendStatus(409);
  //   return;
  // }

  //para enviar o nome do usuário

  try {
    if (!validation.error) {
      await participants.insertOne({ name: name })
      res.sendStatus(200)
    }
  }
  catch (error) {
    console.log(error, 'error')
    if (validation.error)
      res.status(422).send(error)
    console.log('o nome ' + name + ' não foi enviado devido ao erro:', validation.error)
  }
})
