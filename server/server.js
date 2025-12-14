// app.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('./dist/webauthn-app'));

app.listen(port, () => {
  console.log(`Angular app listening on port ${port}`);
});
