const express = require('express')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const uuid = require('uuid')
const axios = require('axios')

const outputDir = path.join(__dirname, '..', 'outputs')
const idsFilePath = path.join(outputDir, 'compiledIds.json')

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
}

if (!fs.existsSync(idsFilePath)) {
    fs.writeFileSync(idsFilePath, JSON.stringify([]))
}

const compilerServiceUrl = 'http://maven:8080' 

router.post('/compile', async (req, res) => {
    const { input } = req.body
    console.log('Received code:', input)
    try {
        const response = await axios.post(`${compilerServiceUrl}/compile`, { input })
        const output = response.data

        const formattedOutput = output.replace(/;\s/, ';\n')
        const outputId = uuid.v4()
        const outputFilePath = path.join(outputDir, `${outputId}.txt`)

        fs.writeFileSync(outputFilePath, formattedOutput)

        let compiledIds = JSON.parse(fs.readFileSync(idsFilePath))
        compiledIds.unshift(outputId)
        if (compiledIds.length > 5) compiledIds = compiledIds.slice(0, 5)
        fs.writeFileSync(idsFilePath, JSON.stringify(compiledIds))

        res.json({ outputId })
    } catch (error) {
        console.error('Axios POST request failed:', error)
        res.status(500).json({ error: 'Compilation failed' })
    }
})

router.get('/output/:id', (req, res) => {
    const outputId = req.params.id
    const outputFilePath = path.join(outputDir, `${outputId}.txt`)
    if (fs.existsSync(outputFilePath)) {
        const output = fs.readFileSync(outputFilePath, 'utf-8')
        res.json({ output })
    } else {
        res.status(404).json({ error: 'Output not found' })
    }
})

router.post('/tester', (req, res) => {
    const { input } = req.body
    res.json({ received: input })
})

router.get('/compiled-ids', (req, res) => {
    try {
        const compiledIds = JSON.parse(fs.readFileSync(idsFilePath))
        res.json({ compiledIds })
    } catch (error) {
        console.error('Error reading compiled IDs:', error)
        res.status(500).json({ error: 'Failed to retrieve compiled IDs' })
    }
})

router.post('/clear-compiled-ids', (req, res) => {
    fs.writeFileSync(idsFilePath, JSON.stringify([]))
    res.json({ message: 'Compiled IDs cleared' })
})

module.exports = router
