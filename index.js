const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors());
app.use(express.json());


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
        // const myFoodCollection = client.db('epicureFoods').collection('myFoods');
        const ordersCollection = client.db('epicureFoods').collection('orders');

        app.get('/gallery', async (req, res) => {
            let { page, limit } = req.query;
        
            page = parseInt(page) || 1; 
            limit = parseInt(limit) || 12; 
        
            const skip = (page - 1) * limit;
        
            try {
                const images = await foodsCollection.find({}, { projection: { image: 1 } })
                    .skip(skip)
                    .limit(limit)
                    .toArray();
        
                const totalCount = await foodsCollection.countDocuments();
        
                res.json({
                    images,
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount
                });
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch images", error });
            }
        });
        

        // my orders
        app.get("/orders", async (req, res) => {
            const { email } = req.query;
            if (!email) return res.status(400).json({ error: "Email is required" });

            const orders = await ordersCollection.find({ buyerEmail: email }).toArray();
            res.json(orders);
        });

        app.delete("/orders/:id", async (req, res) => {
            const { id } = req.params;

            try {
                const result = await ordersCollection.deleteOne({ _id: new ObjectId(id) });
                res.json({ success: result.deletedCount > 0 });
            } catch (error) {
                res.status(400).json({ error: "Invalid order ID" });
            }
            
        });

        app.get('/myFoods', async (req, res) => {
            const userEmail = req.query.email;

            if (!userEmail) {
                return res.status(400).json({ message: "Email is required" });
            }

            try {
                const userFoods = await foodsCollection.find({ addedBy: userEmail }).toArray();

                res.status(200).json(userFoods);
                
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch foods", error });
            }
        });

        app.put('/foods/:id', async (req, res) => {
            const { id } = req.params;
            const updatedFood = req.body;
        
            if (!id || !updatedFood) {
                return res.status(400).json({ error: "Invalid request. Missing ID or data." });
            }
        
            try {
                const result = await foodsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedFood }
                );
        
                if (result.modifiedCount > 0) {
                    res.json({ message: "Food updated successfully" });
                } else {
                    res.status(404).json({ error: "Food not found or no changes made." });
                }
            } catch (error) {
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
        

        app.get('/topSelling', async (req, res) => {
            try {
                const topSellingProducts = await foodsCollection.find({})
                    .sort({ salesCount: -1 }) 
                    .limit(6)
                    .toArray();
        
                res.json(topSellingProducts);
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch top-selling products", error });
            }
        });
        
        
        app.get('/gallery', async (req, res) => {
            let { page, limit } = req.query;
        
            page = parseInt(page) || 1; 
            limit = parseInt(limit) || 12; 
        
            const skip = (page - 1) * limit;
        
            try {
                const images = await foodsCollection.find({}, { projection: { image: 1 } })
                    .skip(skip)
                    .limit(limit)
                    .toArray();
        
                const totalCount = await foodsCollection.countDocuments();
        
                res.json({
                    images,
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount
                });
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch images", error });
            }
        });
        
        
        app.get('/foods', async (req, res) => {
            const cursor = foodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        });

        app.get("/foods", async (req, res) => {
            try {
                const sellerEmail = req.query.sellerEmail;
                if (!sellerEmail) {
                    return res.status(400).json({ success: false, message: "Seller email is required" });
                }
        
                const foods = await foodsCollection.find({ sellerEmail }).toArray();
                res.json(foods);
            } catch (error) {
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
        

        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const food = await foodsCollection.findOne(query);

            const purchaseCount = await purchaseCollection.countDocuments({ foodName: food.name });

            res.send({ ...food, purchaseCount });
        })


        app.post('/foods', async (req, res) => {
            const { name, image, category, quantity, price, addedBy, origin, description } = req.body;

            if (!name || !image || !category || !quantity || !price || !addedBy || !origin || !description) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            try {
                const newFood = {
                    name,
                    image,
                    category,
                    quantity: parseInt(quantity),
                    price: parseFloat(price),
                    addedBy,
                    origin,
                    description,
                    createdAt: new Date(),
                };

                const result = await foodsCollection.insertOne(newFood);
                res.status(201).json({ message: 'Food item added successfully!', food: newFood });
            } catch (error) {
                res.status(500).json({ message: 'Failed to add food item', error });
            }
        });


        // purchase api

        app.get('/purchases/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await purchaseCollection.findOne(query);
            res.send(result);
        });

        app.get("/purchases", async (req, res) => {
            try {
                const { email } = req.query; 
                if (!email) {
                    return res.status(400).json({ success: false, message: "Email is required" });
                }
        
                const purchases = await purchaseCollection.find({ buyerEmail: email }).toArray();
                res.json({ success: true, data: purchases });
            } catch (error) {
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
        

        app.post('/purchase', async (req, res) => {
            try {
                console.log("📩 Received purchase request:", req.body);
        
                const { foodId, foodName, price, quantity, buyerEmail, date } = req.body;
        
                if (!foodId || !foodName || !price || !quantity || !buyerEmail || !date) {
                    console.log("❌ Missing required fields:", req.body);
                    return res.status(400).json({ success: false, message: "All fields are required" });
                }
        
                if (isNaN(price) || isNaN(quantity)) {
                    console.log("❌ Invalid data types:", { price, quantity });
                    return res.status(400).json({ success: false, message: "Price and quantity must be numbers" });
                }
        
                const result = await purchaseCollection.insertOne(req.body);
                res.status(201).json({ success: true, message: "Purchase successful!", data: result });
        
            } catch (error) {
                console.error("🚨 Server Error:", error);
                res.status(500).json({ success: false, message: "Internal Server Error", error });
            }
        });
        
        
        
        // app.post('/foods/:id/purchase', async (req, res) => {
        //     const { id } = req.params;  // Food ID
        //     const { foodName, price, quantity, buyerName, buyerEmail, buyingDate } = req.body;

        //     // Validate input (you can add more validation)
        //     if (!foodName || !price || !quantity || !buyerName || !buyerEmail) {
        //         return res.status(400).json({ error: "Missing required fields" });
        //     }

        //     try {
        //         // Process the purchase (e.g., save purchase data to a database)
        //         const purchase = {
        //             foodId: id,
        //             foodName,
        //             price,
        //             quantity,
        //             buyerName,
        //             buyerEmail,
        //             buyingDate,
        //         };

        //         // Insert purchase into database (example)
        //         await purchaseCollection.create(purchase);  // Assuming you have a Purchase model

        //         // Optionally update food purchase count
        //         await foodsCollection.updateOne(
        //             { _id: new ObjectId(id) },
        //             { $inc: { purchaseCount: quantity, quantity: -quantity }  }
        //           );
                  

        //         res.status(200).json({ message: "Purchase successful!" });
        //     } catch (error) {
        //         console.error("Error processing purchase:", error);
        //         res.status(500).json({ error: "Failed to process purchase" });
        //     }
        // });


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