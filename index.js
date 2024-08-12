const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
//o2siogtayJtOkHUw



const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.ewhtdrn.mongodb.net/?appName=Cluster0`;

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
    await client.connect();
    
    const serviceCollection = client.db('carDoctorClient').collection('services');
    const bookingCollection = client.db('carDoctorClient').collection('booking')

    app.get('/services', async(req, res) =>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/services/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const options = {
         projection: {title: 1, img: 1 , price: 1 , service_id : 1}
       };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    })

    app.get('/bookings', async(req, res) =>{
      console.log(req.query.email);
      let query = {};
      if(req.query?.email){
         query = {email:req.query.email}
      }
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/bookings', async(req, res) =>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
      console.log(booking);

    })

    app.put('/bookings/:id', async(req,res) =>{
      const updatedBooking = req.body;

    })

    app.delete('/bookings/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })



    
    




    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
   //  await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
   res.send('my server is running ')
})

app.listen(port, () =>{
   console.log('Car doctor server is running..', port);
})