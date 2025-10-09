GestorEscolar - versión final empaquetada

Instrucciones:
1) Crear variables de entorno en Render: GOOGLE_SERVICE_ACCOUNT (contenido JSON), DRIVE_ROOT_FOLDER_ID (opcional), JWT_SECRET
2) npm install
3) npm start

Demo users:
- director@demo.com / 1234
- profesor@demo.com / 1234


🔹 Estructura completa

GestorEscolar/
├── backend/
│   ├── models.js
│   ├── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── documents.js
│   │   └── users.js
│   └── uploads/   (vacía)
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── server.js
├── package.json
└── README.md
