const jsonServer = require('json-server');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(cors({
  origin: 'https://develfood-thay.onrender.com'
}));

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.use(router); // Remove o '/api', mantendo as rotas diretas

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server rodando na porta ${PORT}`);
});
