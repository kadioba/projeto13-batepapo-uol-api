import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import joi from "joi"
import dayjs from "dayjs"

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

app.post("/participants", async (req, res) => {

    const nameSchema = joi.object({
        name: joi.string().required().min(1)
    })

    const validation = nameSchema.validate(req.body, { abortEarly: false })

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors);
    }

    try {
        const resp = await db.collection("participants").findOne({ name: req.body.name })
        if (resp) return res.status(409).send("Usuario ja cadastrado")

        const name = req.body.name
        const time = Date.now()
        await db.collection("participants").insertOne({ name: nome, lastStatus: time })
        await db.collection("messages").insertOne(
            {
                from: name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: dayjs(time).format("HH:mm:ss")
            }
        )
    }
})

app.listen(5000, () => {
    console.log('Server is litening on port 5000.');
});
