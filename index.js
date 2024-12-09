const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.json())


// Kauppalista valmiilla esimerkki datalla
let list = [
  {
    id: "1",
    item: "Porkkana",
    amount: 1,
    unit: "ps"
  },
  {
    id: "2",
    item: "Peruna",
    amount: 1,
    unit: "ps"
  },
  {
    id: "3",
    item: "Maito",
    amount: 1,
    unit: "l"
  }
]

app.get('/', (request, response) => {
  response.send('<h1>Kauppalistan Backend. Selainohjelmoinnin harjoitustyö.</h1>')
})

// Hae koko kauppalista
app.get('/api/list', (request, response) => {
  response.json(list)
})

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

  if (!body.item || !body.amount) {
    return response.status(400).json({ 
      error: 'item or amount missing' 
    })
  }


  // if item is already in list
  // edit its value instead adding new one
  if (list.map(list => list.item).includes(body.item)) {
    const item = list.find(list => list.item === body.item)
    item.amount = body.amount
    item.unit = body.unit
    response.json(item)
    return
  }

  const newItem = {
    id: generateId(),
    item: body.item,
    amount: body.amount,
    unit: body.unit
  }

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
