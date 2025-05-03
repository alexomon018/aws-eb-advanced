const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT;
const pg = require("pg");

// Add JSON body parser middleware
app.use(express.json());

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client
  .connect()
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Error connecting to database", err);
  });

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/style.css", function (req, res) {
  res.sendFile(path.join(__dirname + "/style.css"));
});

app.put("/submit", async function (req, res) {
  const body = req.body;

  if (!body.question_index || !body.choice) {
    res.status(400).send({ error: "Missing question_index or choice" });
    return;
  }

  const correct_answer = await client.query(
    `
    SELECT correct_answer
    FROM questions
    WHERE uuid = $1
  `,
    [body.question_index]
  );

  const is_correct =
    body.choice.toLowerCase() ===
    correct_answer.rows[0].correct_answer.toLowerCase();

  const query = `
    INSERT INTO answers (question_uuid, choice, is_correct)
    VALUES ($1, $2, $3)
  `;

  try {
    await client.query(query, [body.question_index, body.choice, is_correct]);

    const data = await client.query(
      `
      SELECT  
        (
          SELECT COUNT(*)
          FROM answers
      ) AS answers_total,
      (
        SELECT COUNT(is_correct)
        FROM answers
        WHERE is_correct = true
      ) AS score,
      (
        SELECT q.uuid
        FROM questions q
        WHERE q.uuid NOT IN (
          SELECT question_uuid FROM answers
        )
        LIMIT 1
      ) AS question_index
      `
    );

    res.send(data.rows[0]);
  } catch (err) {
    console.error("Error submitting answer:", err);
    res.status(500).send({ error: "Database error" });
  }
});

app.get("/questions", async function (req, res) {
  const query = `
    SELECT
      (
        SELECT q.uuid
        FROM questions q
        WHERE q.uuid NOT IN (
          SELECT question_uuid FROM answers
        )
        LIMIT 1
      ) AS question_index,
      (
        SELECT COUNT(*)
        FROM answers
      ) AS answers_total,
      (
        SELECT COUNT(is_correct)
        FROM answers
        WHERE is_correct = true
      ) AS score,
      (
        SELECT COALESCE(
          array_to_json(array_agg(row_to_json(array_row))),
          '[]'::json
        )
        FROM (
          SELECT 
            uuid,
            question,
            option_a,
            option_b,
            option_c,
            option_d
          FROM questions
        ) array_row
      ) AS questions
  `;

  try {
    const result = await client.query(query);
    res.send(result.rows[0]);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).send({ error: "Database error" });
  }
});

app.put("/reset", async function (req, res) {
  try {
    await client.query("TRUNCATE TABLE answers");

    const result = await client.query(`
       SELECT  
        (
          SELECT COUNT(*)
          FROM answers
      ) AS answers_total,
      (
        SELECT COUNT(is_correct)
        FROM answers
        WHERE is_correct = true
      ) AS score,
      (
        SELECT q.uuid
        FROM questions q
        WHERE q.uuid NOT IN (
          SELECT question_uuid FROM answers
        )
        LIMIT 1
      ) AS question_index
      `);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).send({ error: "Database error" });
  }
});

app.get("/app.js", function (req, res) {
  res.sendFile(path.join(__dirname + "/app.js"));
});

console.log(`PLANNING TO USE PORT: ${port}`);
app.listen(port, "0.0.0.0", () => console.log(`Listening on port ${port}!`));
