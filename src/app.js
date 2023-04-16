import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import joi from "joi"
import dayjs from "dayjs"
import dotenv from "dotenv";

// Criação do servidor
const app = express()

// Configurações
app.use(express.json())
app.use(cors())
dotenv.config();

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
        await db.collection("participants").insertOne({ name: name, lastStatus: time })
        await db.collection("messages").insertOne(
            {
                from: name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: dayjs(time).format("HH:mm:ss")
            }
        )
        res.sendStatus(201)
    }
    catch (err) {
        return res.status(500).send(err.message);
    }
})

app.get("/participants", async (req, res) => {

    try {
        const participants = await db.collection("participants").find().toArray()
        console.log(participants)
        res.send(participants)

    } catch (err) {
        console.log(err)
        return res.sendStatus(500)
    }
})

app.post("/messages", async (req, res) => {
    const user = req.headers.user;
    console.log(user)

    const messageSchema = joi.object({
        to: joi.string().required().min(1),
        text: joi.string().required().min(1),
        type: joi.string().required().valid('message', 'private_message')
    })

    const validation = messageSchema.validate(req.body, { abortEarly: false })
    console.log(validation.error)
    console.log(req.body)

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors);
    }

    try {
        debugger
        const userExists = await db.collection("participants").findOne({ name: user })
        console.log(userExists)
        if (!userExists) {
            return res.sendStatus(422)
        }

        const messageSaved = await db.collection("messages").insertOne({
            ...req.body,
            time: dayjs().format("HH:mm:ss"),
            from: user
        })
        console.log(messageSaved)
        res.status(201).send(messageSaved)
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

app.get("/messages", async (req, res) => {
    const user = req.headers.user;
    const limit = Number(req.query.limit)

    const limitSchema = joi.number().positive().greater(0)

    const validation = limitSchema.validate(limit, { abortEarly: false })

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors);
    }

    try {
        const allMessages = await db.collection("messages").find({
            $or: [
                { to: 'Todos' },
                { to: user },
                { from: user }
            ]
        }).toArray();

        if (limit) {
            const messages = allMessages.slice((allMessages.length - 1) - limit)
            return res.send(messages)
        }

        res.send(allMessages)

    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }


})

app.listen(5000, () => {
    console.log('Server is litening on port 5000.');
});
