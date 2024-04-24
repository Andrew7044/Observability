const tracer = require("./tracing")("todo-service");
const express = require("express");
const { MongoClient } = require("mongodb");
const { context } = require("@opentelemetry/api");
const app = express();
app.use(express.json());
const port = 3000;
let db;

const startServer = async () => {
   const client = await MongoClient.connect("mongodb://localhost:27017/");
   db = client.db("todo");
   await db.collection("todos").insertMany([
       { id: "1", title: "Buy groceries" },
       { id: "2", title: "Install Aspecto" },
       { id: "3", title: "buy my own name domain" },
   ]);
   app.listen(port, () => {
       console.log(`Example app listening on port ${port}`);
   });
};
startServer();

app.get("/todo", async (req, res) => {
   const span = tracer.startSpan("getTodoList");
   try {
       const todos = await db.collection("todos").find({}).toArray();
       res.send(todos);
       span.setStatus({ code: 200 });
   } catch (error) {
       console.error("Error fetching todos:", error);
       res.status(500).send("Internal Server Error");
       span.setStatus({ code: 500, message: error.message });
   } finally {
       span.end();
   }
});

app.get("/todo/:id", async (req, res) => {
   const span = tracer.startSpan("getTodoById");
   try {
       const todo = await db.collection("todos").findOne({ id: req.params.id });
       res.send(todo);
       span.setStatus({ code: 200 });
   } catch (error) {
       console.error("Error fetching todo:", error);//added error messaging/slight changes for debug purposes
       res.status(500).send("Internal Server Error");
       span.setStatus({ code: 500, message: error.message });
   } finally {
       span.end();
   }
});
