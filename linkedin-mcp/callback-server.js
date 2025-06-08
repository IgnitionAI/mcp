// Serveur simple pour gérer le callback OAuth de LinkedIn
import express from 'express';
import { createServer } from 'http';
import { URL } from 'url';

const app = express();
const port = 3000;

app.get('/callback', (req, res) => {
  const { code, state } = req.query;
  
  if (code && state) {
    res.send(`
      <html>
        <head>
          <title>LinkedIn OAuth Callback</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .success { color: #28a745; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .code-box { background: #f8f9fa; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">Authentification réussie!</h1>
            <p>Voici les informations à utiliser avec l'outil <code>linkedin_callback</code> :</p>
            
            <div class="code-box">
              <p><strong>Code:</strong> <code>${code}</code></p>
              <p><strong>State:</strong> <code>${state}</code></p>
            </div>
            
            <p>Copiez ces valeurs et utilisez-les avec l'outil MCP <code>linkedin_callback</code>.</p>
          </div>
        </body>
      </html>
    `);
  } else {
    res.status(400).send('Erreur: code ou state manquant dans la réponse de LinkedIn');
  }
});

const server = createServer(app);

server.listen(port, () => {
  console.log(`Serveur de callback en écoute sur http://localhost:${port}`);
  console.log(`URI de redirection: http://localhost:${port}/callback`);
});
