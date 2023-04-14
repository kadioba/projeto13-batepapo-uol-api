import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"

// Criação do servidor
const app = express()

// Configurações
app.use(express.json())
app.use(cors())

// Setup do Banco de Dados
let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


app.listen(5000, () => {
    console.log('Server is litening on port 5000.');
});
