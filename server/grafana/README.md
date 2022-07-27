# An service to launch an easy to use high performant graphite + grafana service

## Requirements

- Docker-Compose
- NPM

## Installation

### Setup

Copy users.js.example to users.js and edit it to your needs.
For MMO change `password` to `token`
Include the correct information per user

### Running

Inside this folder

```bash
npm install
docker-compose up -d
```

## Usage

Go to `http://localhost:3000` and setup the dashboards you want

If the mod [screepsmod-server-stats](https://github.com/The-International-Screeps-Bot/screepsmod-server-stats) is installed on the private server then all server information will be available
