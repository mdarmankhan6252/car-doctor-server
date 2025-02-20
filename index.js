const express = require('express');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors({
   origin: ['http://localhost:5173'],
   credentials: true
}))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ewhtdrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   }
});

const logger = (req, res, next) => {
   console.log('logger', req.method, req.url)
   next()
}

const verifyToken = (req, res, next) => {
   const token = req.cookies?.token;
   // console.log("token in the middleware", token);
   if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
   }
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
      if(error){
         return res.status(401).send({message:'unauthorized'})
      }
      req.user = decoded
      next()
   })
}


async function run() {
   try {

      const serviceCollection = client.db('carDoctorDB').collection('services');
      const checkoutsCollection = client.db('carDoctorDB').collection('checkouts');


      app.post('/jwt', logger, async (req, res) => {
         const user = req.body;
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1h'
         })
         res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
         })
         res.send({ success: true })
      })

      app.post('/logout', async (req, res) => {
         const user = req.body;
         res.clearCookie('token', { maxAge: 0 }).send({ success: true })
      })




      //services related api.

      app.get('/services', async (req, res) => {
         const result = await serviceCollection.find().toArray();
         res.send(result)
      })

      app.get('/services/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) }
         const options = {
            projection: { service_id: 1, title: 1, price: 1, img: 1 },
         };
         const result = await serviceCollection.findOne(query, options);
         res.send(result)
      })

      //checkouts
      app.post('/checkouts', async (req, res) => {
         const checkout = req.body;
         const result = await checkoutsCollection.insertOne(checkout)
         res.send(result)
      })

      app.get('/checkouts', logger, verifyToken, async (req, res) => {
         // console.log(req.query.email)
         // console.log('token owner : ', req.user);
         if(req.user.email !== req.query.email){
            return res.status(403).send({message:'forbidden access'})
         }

         let query = {}
         if (req.query.email) {
            query = { email: req.query.email }
         }
         const result = await checkoutsCollection.find(query).toArray();
         res.send(result)
      })

      app.delete('/checkouts/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) }
         const result = await checkoutsCollection.deleteOne(query)
         res.send(result)
      })

      app.patch('/checkouts/:id', async (req, res) => {
         const id = req.params.id;
         const filter = { _id: new ObjectId(id) }
         const updatedCheckout = req.body;
         // console.log(updatedCheckout)
         const updatedDoc = {
            $set: {
               status: updatedCheckout.status
            }
         }
         const result = await checkoutsCollection.updateOne(filter, updatedDoc)
         res.send(result)
      })


      await client.db("admin").command({ ping: 1 });
      console.log("You successfully connected to MongoDB!");
   } finally {
      //noting..
   }
}
run().catch(console.dir);





app.get('/', (req, res) => {
   res.send('My server is running....')
})

app.listen(port, () => {
   console.log("My server is running...", port);
})