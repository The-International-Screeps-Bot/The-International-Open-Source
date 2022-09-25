const fs = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');
require("dotenv").config();

const options = { stdio: 'inherit' };
function Start() {
    const botPath = join(__dirname, 'dist/main.js');
    execSync('npm run build', options);
    execSync(`npx screeps-grafana private`, options);
    execSync(`npx screeps-performance-server ${process.argv[2]} ${botPath} ${process.env.STEAM_KEY}`, options);
}
Start();
