// modify the user API using mongodb change stream using socket.io.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express()
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
    origin: ['http://localhost:5173', 'https://todo-a4bd8.web.app'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("ASSIGNMENT-10 SERVER RUNNING")
})

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.x6oak.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const ToDoCollections = client.db("ToDo").collection('todo');
        const LogsCollections = client.db("ToDo").collection('logs');

        // JWT SECTION
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.jwt_Secret, {
                expiresIn: '1h'
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: 'cookie created' })
        })

        app.post('/jwtlogout', async (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: 'cookie cleared' })
        })
        // TOKEN VERIFIER
        const verifyToken = (req, res, next) => {
            const token = req?.cookies?.token
            if (!token) {
                return res.status(401).send({ message: 'Token not found to verify' })
            }
            jwt.verify(token, process.env.jwt_Secret, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorization Error' })
                }
                req.user = decoded
                next()
            })
        }
        // Fetch tasks
        app.get('/addTask', async (req, res) => {
            const tasks = await ToDoCollections.find().toArray();
            res.send(tasks);
        });

        // Add task
        app.post('/addTask', async (req, res) => {
            const task = req.body;
            const result = await ToDoCollections.insertOne(task);
            res.send(result);
        });

        // Update task status 
        app.patch('/addTask/:id', async (req, res) => {
            const id = req.params.id;
            const { status, order } = req.body;

            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status, order }
            };

            const result = await ToDoCollections.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.put('/addTask/:id', async (req, res) => {
            const id = req.params.id; 
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: req.body
            }; 
            const result = await ToDoCollections.updateOne(filter, updateDoc);
            res.send(result);
        })

        // Delete task
        app.delete('/addTask/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const result = await ToDoCollections.deleteOne({ _id: new ObjectId(id) }); 
            res.send(result);
        });

        // Logs ADD:
        app.post('/logsEntry', async (req, res) => {
            const logs = req.body
            const result = await LogsCollections.insertOne(logs)
            res.send(result)
        })
        // Logs Get 
        app.get('/logsEntry', async (req, res) => {
            const result = await LogsCollections.find().toArray()
            res.send(result)
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});