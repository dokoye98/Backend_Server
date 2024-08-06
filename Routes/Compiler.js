const compilerServiceUrl = 'http://maven:8080' // Ensure this matches the Docker Compose service name

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
