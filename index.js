const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.anca8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // foods
        const foodsCollection = client.db('epicureFoods').collection('foods');
        const purchaseCollection = client.db('epicureFoods').collection('purchases');

        app.get('/foods', async (req, res) => {
            const cursor = foodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodsCollection.findOne(query);
            res.send(result);
        })

        app.post('/foods', async (req, res) => {
            const { name, image, category, quantity, price, addedBy, origin, description } = req.body;
        
            try {
                const newFood = new Item({
                    name,
                    image,
                    category,
                    quantity,
                    price,
                    addedBy, 
                    origin,
                    description,
                });
        
                const savedFood = await newFood.save();
                res.status(201).json(savedFood);
            } catch (error) {
                res.status(500).json({ message: 'Error adding food item', error });
            }
        });

        app.get('/purchases', async (req, res) => {
            const cursor = purchaseCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/purchases/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await purchaseCollection.findOne(query);
            res.send(result);
        })

        app.post('/purchases', async (req, res) => {
            const { foodName, price, quantity, buyerName, buyerEmail } = req.body;
            const purchaseData = {
                foodName,
                price,
                quantity,
                buyerName,
                buyerEmail,
                buyingDate: Date.now(),
              };
            const result = await purchaseCollection.insertOne(purchaseData);
            res.send(result);
            
        });


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Epicure server is running...')
})

app.listen(port, () => {
    console.log(`Epicure srever on port: ${port}`)
})