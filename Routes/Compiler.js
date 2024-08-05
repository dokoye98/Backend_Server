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

router.post('/compile', (req, res) => {
    const { input } = req.body
    console.log('Received code:', input)
    const stringCode = String(input)
    const jarPath = path.join('/usr/src/app', 'CompilerWebCloud-1.0-SNAPSHOT.jar')
    const compiler = spawn('java', ['-jar', jarPath])

    let output = ''
    compiler.stdout.on('data', (data) => {
        output += data.toString()
        console.log(data.toString())
    })

    compiler.stderr.on('data', (data) => {
        console.error('Compilation Error:', data.toString())
        res.status(500).json({ error: 'Invalid code' })
    })

    compiler.on('close', (code) => {
        if (code !== 0) {
            console.error(`Compiler exited with code ${code}`)
            res.status(500).json({ error: 'Compilation failed' })
        } else {
            const formattedOutput = output.replace(/;\s/, ';\n')
            const outputId = uuid.v4()
            const outputFilePath = path.join(outputDir, `${outputId}.txt`)

            fs.writeFileSync(outputFilePath, formattedOutput)

            let compiledIds = JSON.parse(fs.readFileSync(idsFilePath))
            compiledIds.unshift(outputId)
            if (compiledIds.length > 5) compiledIds = compiledIds.slice(0, 5)
            fs.writeFileSync(idsFilePath, JSON.stringify(compiledIds))

            res.json({ outputId })
        }
    })

    compiler.stdin.write(stringCode + '\nexit\n')
    compiler.stdin.end()
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
        console.error("Error reading compiled IDs:", error)
        res.status(500).json({ error: 'Failed to retrieve compiled IDs' })
    }
})

router.post('/clear-compiled-ids', (req, res) => {
    fs.writeFileSync(idsFilePath, JSON.stringify([]))
    res.json({ message: 'Compiled IDs cleared' })
})

router.post('/axios-test', async (req, res) => {
    try {
        const { url, data } = req.body
        const response = await axios.post(url, data)
        res.json({ response: response.data })
    } catch (error) {
        console.error('Axios POST request failed:', error)
        res.status(500).json({ error: 'Axios POST request failed' })
    }
})

module.exports = router
