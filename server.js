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

//para validar o objeto de usuários
const userSchema = joi.string().alphanum().required();

// para enviar o nome do participante
app.post('/participants', async (req, res) => {
  const { name } = req.body;
  const validation = userSchema.validate(name)

  try {
    if (!validation.error) {
      db.participants.insertOne(name)
      res.sendStatus(200)
      console.log('o nome' + name + 'foi enviado')
    }
  }
  catch (error) {
    if (validation.error)
      res.status(422).send(error)
    console.log('o nome' + name + 'não foi enviado')
  }
})




// db.collection("users").insertOne({
//   email: "joao@email.com",
//   password: "minha_super_senha"
// });

// db.collection("users").findOne({
//   email: "joao@email.com"
// }).then(user => {
//   console.log(user);
// });

// db.collection("users").find().toArray().then(users => {
//   console.log(users); // array de usuários
// });
