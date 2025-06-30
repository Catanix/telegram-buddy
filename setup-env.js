import fs from 'fs';
import readline from 'readline';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for a value with a default
const prompt = (question, defaultValue) => {
  return new Promise((resolve) => {
    rl.question(`${question} (${defaultValue || 'leave empty for none'}): `, (answer) => {
      resolve(answer || defaultValue || '');
    });
  });
};

async function setupEnv() {
  console.log('🔧 Setting up environment variables for telegram buddy...');

  // Check if .env.example exists
  const envExamplePath = path.resolve('.env.example');
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example file not found. Cannot continue setup.');
    rl.close();
    return;
  }

  // Check if .env already exists
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await prompt('⚠️ .env file already exists. Overwrite? (yes/no)', 'no');
    if (overwrite.toLowerCase() !== 'yes') {
      console.log('✅ Setup cancelled. Existing .env file was not modified.');
      rl.close();
      return;
    }
  }

  // Read .env.example
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const envLines = envExample.split('\n');

  const newEnvLines = [];

  // Process each line
  for (const line of envLines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      newEnvLines.push(line);
      continue;
    }

    // Extract variable name and default value
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (match) {
      const [, varName, defaultValue] = match;
      const value = await prompt(`Enter value for ${varName}`, defaultValue);
      newEnvLines.push(`${varName}=${value}`);
    } else {
      newEnvLines.push(line);
    }
  }

  // Write to .env file
  fs.writeFileSync(envPath, newEnvLines.join('\n'));

  console.log('✅ .env file has been created successfully!');
  console.log('🐳 You can now run the application with Docker Compose:');
  console.log('   docker-compose up -d');

  rl.close();
}

setupEnv().catch(err => {
  console.error('❌ Error during setup:', err);
  rl.close();
});
