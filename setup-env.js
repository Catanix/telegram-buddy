import fs from 'fs';
import readline from 'readline';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility: prompt user with default
const prompt = (question, defaultValue) => {
  return new Promise((resolve) => {
    rl.question(`${question} (${defaultValue || 'leave empty for none'}): `, (answer) => {
      resolve(answer || defaultValue || '');
    });
  });
};

// Utility: prompt user to choose from list
const promptChoice = async (question, choices, defaultValue) => {
  const indexDefault = choices.indexOf(defaultValue);
  const displayChoices = choices.map((c, i) => `${i + 1}) ${c}`).join('\n');
  const promptText = `${question}\n${displayChoices}\nEnter number (default ${indexDefault + 1}): `;

  return new Promise((resolve) => {
    rl.question(promptText, (input) => {
      const index = parseInt(input.trim(), 10);
      if (!isNaN(index) && index >= 1 && index <= choices.length) {
        resolve(choices[index - 1]);
      } else {
        resolve(defaultValue);
      }
    });
  });
};

async function setupEnv() {
  console.log('🔧 Setting up environment variables for telegram buddy...');

  const envExamplePath = path.resolve('.env.example');
  const envPath = path.resolve('.env');

  // Check for .env.example
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example file not found. Cannot continue setup.');
    rl.close();
    return;
  }

  // Warn if .env exists
  if (fs.existsSync(envPath)) {
    const overwrite = await prompt('⚠️ .env file already exists. Overwrite?', 'no');
    if (overwrite.toLowerCase() !== 'yes') {
      console.log('✅ Setup cancelled. Existing .env file was not modified.');
      rl.close();
      return;
    }
  }

  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const envLines = envExample.split('\n');
  const newEnvLines = [];

  for (const line of envLines) {
    if (line.trim().startsWith('#') || line.trim() === '') {
      newEnvLines.push(line);
      continue;
    }

    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      newEnvLines.push(line);
      continue;
    }

    const [, varName, defaultValue] = match;

    switch (varName) {
      case 'TELEGRAM_TOKEN':
        newEnvLines.push(`${varName}=${await prompt('🔑 Enter your Telegram bot token', defaultValue)}`);
        break;

      case 'AUTHORIZED_USERNAME':
        newEnvLines.push(`${varName}=${await prompt('👤 Enter your Telegram username (without @)', defaultValue)}`);
        break;

      case 'LM_PROVIDER':
        newEnvLines.push(`${varName}=${await promptChoice('🤖 Choose Language Model Provider', ['OpenAi', 'Deepseek'], defaultValue.includes('Deep') ? 'Deepseek' : 'ChatGPT')}`);
        break;

      case 'LM_API_KEY':
        newEnvLines.push(`${varName}=${await prompt('🔐 Enter your LM API key (OpenAi or Deepseek)', defaultValue)}`);
        break;

      case 'TIME_ZONE':
        newEnvLines.push(`${varName}=${await prompt('🌍 Enter your time zone (e.g. Asia/Almaty)', defaultValue)}`);
        break;

      case 'TRANSFORMERS_VERBOSITY':
        // Always set to 'error'
        console.log(`⚙️ Setting ${varName} to 'error' (fixed value)`);
        newEnvLines.push(`${varName}=error`);
        break;

      default:
        // If any unexpected key is found, prompt normally
        newEnvLines.push(`${varName}=${await prompt(`Enter value for ${varName}`, defaultValue)}`);
    }
  }

  fs.writeFileSync(envPath, newEnvLines.join('\n'), 'utf8');
  console.log('\n✅ .env file has been created successfully!');
  console.log('🐳 You can now run the application with Docker Compose:');
  console.log('   docker compose up -d');

  rl.close();
}

setupEnv().catch((err) => {
  console.error('❌ Error during setup:', err);
  rl.close();
});

