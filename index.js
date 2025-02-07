import express from 'express';
import postgres from 'postgres';
import cors from 'cors';

const app = express();

const sql = postgres({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: 'require',
});

app.use(cors());
app.use(express.json());

let list2 = [
  {
    id: "1",
    item: "Testi",
  }
];


// Kauppalista valmiilla esimerkki datalla
let list = [
  {
    id: "1",
    item: "Porkkana",
  },
  {
    id: "2",
    item: "Peruna",
  },
  {
    id: "3",
    item: "Maito",
  }
]

app.get('/', (request, response) => {
  response.send('<h1>Kauppalistan Backend.</h1>')
})

// Hae koko kauppalista
app.get('/api/list', (request, response) => {
  response.json(list)
})

//  MOBIILI HARJOITUSTYÖN API
//------------------------------------------------------------
// Tyhjää koko lista
app.delete('/api/mobiili/clear', async (request, response) => {
  try {
    await sql`DELETE FROM list`;
    response.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/mobiili/:id', async (request, response) => {
  const { id } = request.params;

  try {
    // await sql`DELETE FROM list WHERE item = ${id}`;
    await sql`DELETE FROM list WHERE id = ${id}`;
    // reorder items by id
    const items = await sql`SELECT * FROM list`;
    for (let i = 0; i < items.length; i++) {
      await sql`UPDATE list SET id = ${i + 1} WHERE item = ${items[i].item}`;
    }
    
    response.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Database error' });
  }
});


// Hae lista mobiili harjoitustyötä varten
app.get('/api/mobiili', async (request, response) => {
  try {
    const items = await sql`SELECT * FROM list`;
    response.json(items);
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: 'Database error' });
  }
});


// Lisää uusi ostos kauppalistaan
app.post('/api/mobiili', async (request, response) => {
  const body = request.body;
  console.log(body);
  if (!body.item) {
    return response.status(400).json({ 
      error: 'item or amount missing' 
    });
  }

  try {
    // if db is clear reset primary key
    const maxId = await sql`SELECT MAX(id) FROM list`;
    if (maxId[0].max === null) {
      await sql`ALTER SEQUENCE list_id_seq RESTART WITH 1`;
    }
    
    // if item is already in list dont insert it
    const item = await sql`SELECT * FROM list WHERE item = ${body.item}`;
    if (item !== null && item.length > 0) {
      response.status(500).json({ error: 'item is already adde' });
      return;
    }

    await sql`INSERT INTO list (item) VALUES (${body.item})`;
    response.json(newItem);
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: 'Database error' });
  }
});
//------------------------------------------------------------


// Hae ostosta listasta
app.get('/api/list/:id', (request, response) => {
  const id = request.params.id
  const list = list.find(list => list.id === id)
  
  if (list) {
    response.json(list)
  } else {
    response.status(404).end()
  }
})

// Poista ostos kauppalistasta
app.delete('/api/list/:id', (request, response) => {
  const id = request.params.id
  list = list.filter(list => list.id !== id)
  response.status(204).end()

  // päivitetään listan id:t
  for (let i = 0; i < list.length; i++) {
    list[i].id = String(i + 1)
  }
})

// Lisää uusi ostos kauppalistaan
app.post('/api/list', (request, response) => {
  const body = request.body

  if (!body.item) {
    return response.status(400).json({ 
      error: 'item or amount missing' 
    })
  }


  // if item is already in list
  // edit its value instead adding new one
  if (list.map(list => list.item).includes(body.item)) {
    const item = list.find(list => list.item === body.item)
    response.json(item)
    return
  }

  const newItem = {
    id: generateId(),
    item: body.item,
  }
  // sql`INSERT INTO list (item) VALUES (${newItem.item})`.catch(error => {
  //   console.log(error)
  // })
  list = list.concat(newItem)
  response.json(newItem)
})

// ID:n generointi
const generateId = () => {
  const maxId = list.length > 0
    ? Math.max(...list.map(n => Number(n.id)))
    : 0
  return String(maxId + 1)
}

const PORT = 3001
app.listen(PORT, async () => {
  await sql`CREATE TABLE IF NOT EXISTS list (id SERIAL PRIMARY KEY, item TEXT NOT NULL)`.catch(error => {})
  console.log(`Server running on port ${PORT}`)
})
