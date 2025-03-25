const jsonServer = require('json-server');
const auth = require('json-server-auth');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const allowedOrigins = [
  "http://localhost:5174",
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

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

let tokens = {}; 

server.post('/restaurant/create', (req, res) => {
  const { cnpj, name, phone, email, password, types, address } = req.body;

  const existingRestaurant = router.db.get('restaurants').find({ email }).value();
  if (existingRestaurant) {
    return res.status(400).json({ error: 'Usuário já existente!' });
  }

  const newRestaurant = {
    cnpj,
    name,
    phone,
    email,
    password,
    types,
    address,
  };

  router.db.get('restaurants').push(newRestaurant).write();

  return res.status(201).json({ message: 'Cadastro concluído com sucesso!' });
});

//LOGIN
server.post('/restaurant/auth', (req, res) => {
  const { email, password } = req.body;
  
  const restaurant = router.db.get('restaurants').find({ email, password }).value();
  
  if (!restaurant) {
    return res.status(400).json({ error: 'E-mail ou senha inválidos.' });
  }

  const token = jwt.sign({ email }, 'secreta-chave', { expiresIn: '1h' });

  return res.status(200).json({ token });
});

server.get('/restaurants', (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'E-mail não fornecido.' });
  }

  const restaurant = router.db.get('restaurants').find({ email }).value();

  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurante não encontrado.' });
  }

  const token = crypto.randomInt(1000, 9999).toString();
  tokens[email] = { token, expiresAt: Date.now() + 5 * 60 * 1000 };

  const templatePath = path.join(__dirname, 'email-template.html');
  fs.readFile(templatePath, 'utf8', (err, htmlTemplate) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao carregar template de e-mail.' });
    }

    const emailHtml = htmlTemplate.replace('{{TOKEN}}', token);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Código de redefinição de senha',
      html: emailHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Erro ao enviar e-mail.' });
      }
      return res.json({ message: 'E-mail enviado com sucesso!', tokenSent: true });
    });
  });
});

server.post('/verify-token', (req, res) => {
  const { email, token } = req.body;
  
  const storedToken = tokens[email];
  
  if (!storedToken) {
    return res.status(404).json({ error: 'Nenhum código enviado para este e-mail.' });
  }

  if (Date.now() > storedToken.expiresAt) {
    delete tokens[email];
    return res.status(400).json({ error: 'Token expirado.' });
  }

  if (storedToken.token === token) {
    return res.status(200).json({ message: 'Token validado com sucesso.' });
  }

  return res.status(400).json({ error: 'Token inválido.' });
});

server.post('/restaurants/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;
  
  const storedToken = tokens[email];
  
  if (!storedToken) {
    return res.status(404).json({ error: 'Nenhum código enviado para este e-mail.' });
  }

  if (Date.now() > storedToken.expiresAt) {
    delete tokens[email];
    return res.status(400).json({ error: 'Token expirado.' });
  }

  if (storedToken.token === token) {
    const restaurant = router.db.get('restaurants').find({ email }).value();
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante não encontrado.' });
    }

    restaurant.password = newPassword;
    router.db.write();
    delete tokens[email];
    return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  }
  
  return res.status(400).json({ error: 'Token inválido.' });
});

server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server rodando na porta ${PORT}`);
});
