// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { setupWSConnection, docs } = require('y-websocket/bin/utils');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Yjs-compatible WebSocket rooms — room name comes from URL path (e.g. /abc123)
wss.on('connection', setupWSConnection);

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url.split('?')[0];
  if (!pathname || pathname === '/') {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

app.get('/rooms', (_req, res) => {
  const activeRooms = Array.from(docs.keys()).map(name => ({
    name,
    clients: docs.get(name)?.conns?.size || 0
  }));
  res.json({ rooms: activeRooms, count: activeRooms.length });
});


app.post('/execute', (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Source code field cannot be empty.' });
  }

  const tempDir = path.join(__dirname, 'temp_runs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const uniqueId = Date.now();
  let filename = '';
  let command = '';

  switch (language) {
    case 'javascript':
      filename = `script_${uniqueId}.js`;
      command = `node ${path.join(tempDir, filename)}`;
      break;
    case 'python':
      filename = `script_${uniqueId}.py`;
      command = `python "${path.join(tempDir, filename)}" || python3 "${path.join(tempDir, filename)}"`;
      break;
    case 'cpp':
    case 'c':
      filename = `program_${uniqueId}.cpp`;
      const binaryPath = path.join(tempDir, `out_${uniqueId}`);
      command = `g++ "${path.join(tempDir, filename)}" -o "${binaryPath}" && "${binaryPath}"`;
      break;
    case 'java':
      filename = `Main_${uniqueId}.java`;
      const classCorrectedCode = code.replace(/public\s+class\s+\w+/, `public class Main_${uniqueId}`);
      fs.writeFileSync(path.join(tempDir, filename), classCorrectedCode);
      command = `javac "${path.join(tempDir, filename)}" && java -cp "${tempDir}" Main_${uniqueId}`;
      break;
    default:
      return res.status(400).json({ error: 'Unsupported language execution parameter.' });
  }

  if (language !== 'java') {
    fs.writeFileSync(path.join(tempDir, filename), code);
  }

  exec(command, { timeout: 8000 }, (err, stdout, stderr) => {
    try {
      if (fs.existsSync(path.join(tempDir, filename))) fs.unlinkSync(path.join(tempDir, filename));
      if (language === 'cpp' || language === 'c') {
        const binFile = path.join(tempDir, `out_${uniqueId}`);
        if (fs.existsSync(binFile)) fs.unlinkSync(binFile);
        if (fs.existsSync(`${binFile}.exe`)) fs.unlinkSync(`${binFile}.exe`);
      }
      if (language === 'java') {
        const classFile = path.join(tempDir, `Main_${uniqueId}.class`);
        if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
      }
    } catch (cleanupErr) {
      console.error('File cleanup error omitted:', cleanupErr);
    }

    if (err && err.killed) {
      return res.json({ error: 'Execution Terminated: Runtime exceeded safe execution limits (8 seconds max).' });
    }

    if (stderr) {
      let cleanError = stderr.trim();

      // 1. Drop trailing Windows execution installer logs completely
      if (cleanError.includes("Python was not found")) {
        cleanError = cleanError.split("Python was not found")[0].trim();
      }

      // 2. Split the error text cleanly by line breaks
      const lines = cleanError.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      
      let detectedLineNum = "";
      let finalErrorMessage = "";

      // 3. Scan the split array lines
      lines.forEach(line => {
        if (line.startsWith("Traceback")) return; // Explicitly drop the header line[cite: 4]
        
        // Extract line numbers from format strings like: line 1, in <module>[cite: 4]
        const lineMatch = line.match(/line\s+(\d+)/i);
        if (lineMatch && !detectedLineNum) {
          detectedLineNum = `Line ${lineMatch[1]}: `;
          return;
        }

        // Catch typical Python Error structures (e.g., NameError:, SyntaxError:)
        if (line.match(/^[A-Z][a-zA-Z]+Error:/) || line.match(/^[A-Z][a-zA-Z]+Exception:/)) {
          finalErrorMessage = line;
        }
      });

      // 4. Hard fallback: if no explicit Error class was matched, grab the absolute last line
      if (!finalErrorMessage && lines.length > 0) {
        finalErrorMessage = lines[lines.length - 1];
      }

      // Piece the components back together beautifully
      const outputError = `${detectedLineNum}${finalErrorMessage}`;

      return res.json({ error: outputError || 'Syntax/Runtime Error detected.' });
    }
    res.json({ output: stdout });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Collaboration server running at http://localhost:${PORT}`);
  console.log(`WebSocket rooms: ws://localhost:${PORT}/<room-id>`);
});