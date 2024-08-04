const express = require('express')
const bodyParser = require('body-parser')
const {restart} = require("nodeman")
const cors = require('cors')

const app = express()

app.use(cors())

const compiler = require('./Routes/Compiler')
app.use(bodyParser.json())

app.use('/compiler',compiler)

app.get('/', (req, res) => {
    console.log('Root URL accessed')
    res.send('Welcome to the Compiler API')
})

app.listen(3001, () => {
    console.log(`Server is running`)
})
