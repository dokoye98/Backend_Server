const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const uuid = require('uuid');

const outputDir = path.join(__dirname, '..', 'outputs');
const idsFilePath = path.join(outputDir, 'compiledIds.json');


if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

if (!fs.existsSync(idsFilePath)) {
    fs.writeFileSync(idsFilePath, JSON.stringify([]));
}

router.post('/compile', (req, res) => {
    const { input } = req.body;
    console.log('Received code:', input);
    const stringCode = String(input);

    const jarPath = path.join('C:', 'Users', 'dwayn', 'OneDrive', 'Desktop', 'WebApp', 'server', 'target', 'CompilerWebCloud-1.0-SNAPSHOT.jar');
    const compiler = spawn('java', ['-jar', jarPath]);

    let output = '';
    compiler.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
    });

    compiler.stderr.on('data', (data) => {
        console.error('Compilation Error:', data.toString());
        res.status(500).json({ error: 'Invalid code' });
    });

    compiler.on('close', (code) => {
        if (code !== 0) {
            console.error(`Compiler exited with code ${code}`);
            res.status(500).json({ error: 'Compilation failed' });
        } else {
            const formattedOutput = output.replace(/;\s/, ';\n');
            const outputId = uuid.v4();
            const outputFilePath = path.join(outputDir, `${outputId}.txt`);

            fs.writeFileSync(outputFilePath, formattedOutput);

            
            let compiledIds = JSON.parse(fs.readFileSync(idsFilePath));
            compiledIds.unshift(outputId);
            if (compiledIds.length > 6) compiledIds = compiledIds.slice(0, 6);
            fs.writeFileSync(idsFilePath, JSON.stringify(compiledIds));

            res.json({ outputId });
        }
    });

    compiler.stdin.write(stringCode + '\nexit\n');
    compiler.stdin.end();
});

router.get('/output/:id', (req, res) => {
    const outputId = req.params.id;
    const outputFilePath = path.join(outputDir, `${outputId}.txt`);
    if (fs.existsSync(outputFilePath)) {
        const output = fs.readFileSync(outputFilePath, 'utf-8');
        res.json({ output });
    } else {
        res.status(404).json({ error: 'Output not found' });
    }
});

router.get('/compiled-ids', (req, res) => {
    const compiledIds = JSON.parse(fs.readFileSync(idsFilePath));
    res.json({ compiledIds });
});

module.exports = router;
