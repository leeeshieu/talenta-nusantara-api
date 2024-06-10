const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@talenta-nusantara.wqgth6n.mongodb.net/?retryWrites=true&w=majority&appName=Talenta-Nusantara`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    const db = client.db("jobPortal");
    const jobsCollection = db.collection("jobs");

    // Creating index for job sorting last job posted will show first
    const indexKeys = { title: 1, category: 1 };
    const indexOptions = { name: "titleCategory" };
    const result = await jobsCollection.createIndex(indexKeys, indexOptions);

    // post a job
    app.post("/jobs", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      const result = await jobsCollection.insertOne(body);
      if (result?.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "can not insert try again later",
          status: false,
        });
      }
    });

    // get all jobs
    app.get("/jobs", async (req, res) => {
      const jobs = await jobsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.send(jobs);
    });

    // get single job using id
    app.get("/jobs/:id", async (req, res) => {
      const jobs = await jobsCollection.findOne({
        id: new ObjectId(req.params.id),
      });
      res.send(jobs);
    });

    // get jobs based on email for my job listing
    app.get("/myJobs/:email", async (req, res) => {
      const jobs = await jobsCollection
        .find({
          postedBy: req.params.email,
        })
        .toArray();
      res.send(jobs);
    });

    // delete a job
    app.delete("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(filter);
      res.send(result);
    });

    // updata a job
    app.patch("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const filter = { id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...jobData,
        },
      };
      const options = { upsert: true };
      const result = await jobsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
