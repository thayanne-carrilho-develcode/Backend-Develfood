const jsonServer = require('json-server');
const auth = require('json-server-auth');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const allowedOrigins = [
  "https://develfood-thay.onrender.com",
  "https://develfood-thayanne.onrender.com"
];

server.db = router.db;

server.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(auth);
server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server rodando na porta ${PORT}`);
});
