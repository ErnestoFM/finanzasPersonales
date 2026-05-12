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
      const str = JSON.stringify(obj).toLowerCase();
      if (str.includes('búsqueda') || str.includes('multimoneda') || str.includes('auditor') || str.includes('widget')) {
        if (obj.source === 'USER_EXPLICIT' && obj.type === 'USER_INPUT') {
          console.log(`=== STEP ${obj.step_index} USER_INPUT ===`);
          console.log(obj.content);
          console.log('============================');
        }
      }
    } catch (err) {}
  }
} catch (e) {
  console.error('Error reading/parsing file:', e);
}
