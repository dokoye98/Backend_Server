const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { spawn } = require('child_process');
const app = express();

app.use(cors());
const compiler = require('./Routes/Compiler')
app.use(bodyParser.json());

app.use('/compiler',compiler)


app.listen(3001, () => {
    console.log(`Server is running on port 3001`)
})
