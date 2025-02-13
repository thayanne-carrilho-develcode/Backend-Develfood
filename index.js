const jsonServer = require('json-server')
const cors = require('cors')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

server.use(cors()) 
server.use(middlewares)
server.use(jsonServer.bodyParser)

server.use('/api', router)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`JSON Server rodando na porta ${PORT}`)
})
