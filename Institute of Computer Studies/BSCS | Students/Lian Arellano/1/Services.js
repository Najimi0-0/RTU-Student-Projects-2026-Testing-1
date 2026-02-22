// server.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to store accounts
const ACCOUNTS_FILE = path.join(
  'C:\\Users\\Lian Andrew\\OneDrive\\Desktop\\codes\\UPDATED_APPDATE\\Excel',
  'accounts.csv'
);

// Ensure folder exists
if (!fs.existsSync(path.dirname(ACCOUNTS_FILE))) {
  fs.mkdirSync(path.dirname(ACCOUNTS_FILE), { recursive: true });
}

// Default admin account (preloaded once)
const adminAccount = {
  name: 'admin',
  email: 'admin@rtu.edu.ph',
  dob: '2006-09-19',
  course: 'BSIT',
  password: 'admin1234'
};

// Load accounts from CSV
function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    saveAccounts([adminAccount]);
    return [adminAccount];
  }

  const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [adminAccount]; // Only headers

  return lines.slice(1).map(line => {
    const [name, email, dob, course, password] = line.split(',');
    return { name, email, dob, course, password };
  });
}

// Save accounts to CSV
function saveAccounts(accounts) {
  const headers = ['Name', 'Email', 'DateOfBirth', 'Course', 'Password'];
  const rows = accounts.map(a => [
    a.name,
    a.email,
    a.dob,
    a.course,
    a.password
  ].join(','));

  fs.writeFileSync(ACCOUNTS_FILE, [headers.join(','), ...rows].join('\r\n'), 'utf8');
}

// Validate RTU email
function isValidRtuEmail(email) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (e === 'admin@rtu.edu.ph') return true;

  const expectedDomain = '@rtu.edu.ph';
  if (!e.endsWith(expectedDomain)) return false;

  const prefix = e.split('@')[0];
  const parts = prefix.split('-');
  if (parts.length !== 2) return false;
  if (parts[0] !== '2024') return false;

  const numStr = parts[1];
  if (!/^\d{6}$/.test(numStr)) return false;

  const num = parseInt(numStr, 10);
  return num >= 200001 && num <= 200999;
}

// Simple CLI registration/login interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function main() {
  console.log('Welcome to APPDATE Registration/Login System');

  while (true) {
    const choice = await ask('Type "register" or "login" (or "exit"): ');

    if (choice.toLowerCase() === 'exit') {
      rl.close();
      break;
    }

    if (choice.toLowerCase() === 'register') {
      const name = await ask('Full Name: ');
      const email = await ask('Email: ');
      const dob = await ask('Date of Birth (YYYY-MM-DD): ');
      const course = await ask('Course: ');
      const password = await ask('Password: ');
      const confirm = await ask('Confirm Password: ');

      if (!name || !email || !dob || !course || !password || !confirm) {
        console.log('Please fill all fields.');
        continue;
      }

      if (password !== confirm) {
        console.log('Passwords do not match.');
        continue;
      }

      if (!isValidRtuEmail(email)) {
        console.log('Invalid RTU email.');
        continue;
      }

      const accounts = loadAccounts();
      if (accounts.some(a => a.email.toLowerCase() === email.toLowerCase())) {
        console.log('Email already exists.');
        continue;
      }

      const account = { name, email, dob, course, password };
      accounts.push(account);
      saveAccounts(accounts);

      console.log('Registration successful! Account saved to CSV.');
    }

    if (choice.toLowerCase() === 'login') {
      const email = await ask('Email: ');
      const password = await ask('Password: ');

      const accounts = loadAccounts();
      const user = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        console.log('No account found with that email.');
        continue;
      }

      if (user.password !== password) {
        console.log('Incorrect password.');
        continue;
      }

      console.log(`Welcome, ${user.name}! You are logged in.`);
    }
  }
}

main();
