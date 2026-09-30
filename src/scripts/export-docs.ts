/**
 * @file export-docs.ts
 * @description Script utilitaire pour generer les fichiers statiques de documentation
 * (openapi.json et documentation.html) dans le dossier public/docs/.
 */

import fs from 'fs';
import path from 'path';
import { swaggerDocument } from '../docs/swagger';

const OUTPUT_DIR = path.resolve(__dirname, '../../public/docs');

// Creation du dossier de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. Ecriture du fichier JSON statique
const jsonPath = path.join(OUTPUT_DIR, 'openapi.json');
fs.writeFileSync(jsonPath, JSON.stringify(swaggerDocument, null, 2), 'utf-8');
console.log(`Fichier OpenAPI JSON genere avec succes : ${jsonPath}`);

// 2. Ecriture de la page HTML Redoc autonome (standalone)
const htmlPath = path.join(OUTPUT_DIR, 'index.html');
const redocHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Documentation API - Infirmerie BCRG</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
      const spec = ${JSON.stringify(swaggerDocument)};
      Redoc.init(spec, {
        scrollYOffset: 50,
        theme: {
          colors: {
            primary: {
              main: '#0b6623'
            }
          }
        }
      }, document.getElementById('redoc-container'));
    </script>
  </body>
</html>`;

fs.writeFileSync(htmlPath, redocHtml, 'utf-8');
console.log(`Fichier HTML Redoc autonome genere avec succes : ${htmlPath}`);
