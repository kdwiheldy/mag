#!/usr/bin/env node
/**
 * Portfolio Framer CLI Bridge (uses pt-kdwiheldy/dist-server/mcp.mjs over stdio JSON-RPC)
 *
 * Usage:
 *   node Posters/scripts/compose-device.mjs --list
 *   node Posters/scripts/compose-device.mjs --spec spec.json --out Posters/assets/framed.png
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const mcpEntry = path.join(repoRoot, 'pt-kdwiheldy/dist-server/mcp.mjs');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') args.list = true;
    else if (a === '--spec' && argv[i + 1]) args.spec = argv[++i];
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i];
  }
  return args;
}

async function callMcpTool(toolName, toolArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [mcpEntry], {
      cwd: path.join(repoRoot, 'pt-kdwiheldy'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buf = '';
    let stderr = '';
    let step = 'init';

    const send = (obj) => child.stdin.write(JSON.stringify(obj) + '\n');

    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (step === 'init' && msg.id === 1) {
          step = 'call';
          send({ jsonrpc: '2.0', method: 'notifications/initialized' });
          send({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: { name: toolName, arguments: toolArgs },
          });
        } else if (step === 'call' && msg.id === 2) {
          child.kill();
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });

    child.on('exit', (code) => {
      if (step !== 'call' && code !== 0) {
        reject(new Error(`portfolio-framer MCP exited (${code}): ${stderr}`));
      }
    });

    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'poster-deck-cli', version: '1.0.0' },
      },
    });
  });
}

const args = parseArgs(process.argv);
if (!fs.existsSync(mcpEntry)) {
  console.error(`Missing ${mcpEntry}. Run "npm run build:agent" inside pt-kdwiheldy/ first.`);
  process.exit(1);
}

if (args.list) {
  const res = await callMcpTool('list_layouts', {});
  console.log(res?.content?.[0]?.text || JSON.stringify(res, null, 2));
} else if (args.spec && args.out) {
  const spec = JSON.parse(fs.readFileSync(path.resolve(args.spec), 'utf8'));
  const out = path.resolve(args.out);
  const res = await callMcpTool('compose', { spec, out });
  console.log(res?.content?.[0]?.text || JSON.stringify(res, null, 2));
} else {
  console.error('Usage:\n  node Posters/scripts/compose-device.mjs --list\n  node Posters/scripts/compose-device.mjs --spec <spec.json> --out <out.png>');
  process.exit(1);
}
