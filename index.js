const express = require ('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middle war 
// Middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.gamza.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const jobCollection=client.db('job-portal').collection('jobs')
    const jobApplicationCollection=client.db('job-portal').collection('job_applications')
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

// all job get 
app.get('/jobs',async(req,res)=>{
  const email = req.query.email;
  let query = {}
  if(email){
    query = {hr_email:email}
  }
    const cursor = jobCollection.find(query)
    const result =await cursor.toArray()
    res.send(result)
})
//details
app.get('/jobs/:id',async(req,res)=>{
    const id = req.params.id;
    const query = {_id:new ObjectId(id)}
    const result = await jobCollection.findOne(query)
    res.send(result)
})
// jobs post
app.post('/jobs',async(req,res)=>{
  const job = req.body;
  const result = await jobCollection.insertOne(job)
  res.send(result)
})
// get all data ,get one data ,get some data ,[0,1,many]

app.get ('/job-application',async(req,res)=>{
  const email =req.query.email;
  const query ={ application_email:email}
  const result = await jobApplicationCollection.find(query).toArray()

  // fokira way to aggregate data
  for(const application of result){
    console.log(application.job_id)
    const query1 = {_id: new ObjectId(application.job_id)}
    const job =await jobCollection.findOne(query1);
    if(job){
      application.title= job.title
      application.location= job.location
      application.company = job.company;
      application.company_logo=job.company_logo
    }
  }

  res.send(result)
})
// app.get ('/job-appliactions/:id)===> get a specific job application by id
app.get('/job-applications/jobs/:job_id',async(req,res)=>{
  const jobId = req.params.job_id;
  const query = {job_id :jobId}
  const result = await jobApplicationCollection.find(query).toArray();
  res.send(result)
})
// job application apis
app.post('/job-applications',async(req,res)=>{
  const application = req.body
  const result = await  jobApplicationCollection.insertOne(application)
  // not the best way use aggregate
  const id = application.job_id;
  const query = {_id: new ObjectId(id)}
  const job = await jobCollection.findOne(query)
 if(job.applicationCount){
  count = job.applicationCount+1
 }
 else{
  count = 1;
 }
 // now update the job info
 const filter = {_id: new ObjectId(id)}
 const updateDoc = {
  $set:{
    applicationCount: count
  }
 }
 const updateResult = await jobCollection.updateOne(filter,updateDoc)
  res.send(result)
})

//patch
app.patch('/job-applications/:id',async(req,res)=>{
  const id = req.params.id;
  const data = req.body
  const filter = {_id:new ObjectId(id)}
  const updateDoc={
    $set:{
      status:data.status
    }
  }
  const result= await jobApplicationCollection.updateOne(filter,updateDoc)
  res.send(result)
})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send("job portal running in server")
})
app.listen(port,()=>{
    console.log(` job server is worked ${port}`)
})