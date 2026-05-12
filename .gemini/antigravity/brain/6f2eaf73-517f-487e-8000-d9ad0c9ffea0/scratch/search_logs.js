const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\erfierro\\.gemini\\antigravity\\brain\\6f2eaf73-517f-487e-8000-d9ad0c9ffea0\\.system_generated\\logs\\overview.txt';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 623) {
        console.log(obj.content);
        break;
      }
    } catch (err) {}
  }
} catch (e) {
  console.error('Error reading/parsing file:', e);
}
