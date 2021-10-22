#!/usr/bin/env node
const { Command } = require('commander')
const { ScreepsAPI } = require('../')
const fs = require('fs')
const util = require('util')
const path = require('path')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

async function init(opts) {
  return ScreepsAPI.fromConfig(opts.server)
}

async function json(data) {
  process.stdout.write(JSON.stringify(data))
}

async function out(data, opts) {
  data = await data
  data = (data && data.data) || data
  if (process.stdout.isTTY) {
    console.log(data)
  } else {
    json(data)
  }
}

async function run() {
  const program = new Command()
  
  /** @param {string} name */
  const commandBase = (name, args = '') => {
    const command = new Command(name)
    command
      .arguments(args)
      .option('--server <server>', 'Server config to use', 'main')
    program.addCommand(command)
    return command
  }

  program
    .version(require('../package.json').version)

  commandBase('raw', '<cmd> [args...]')
    .description('Execute raw API call')
    .action(async function (cmd, args, opts) {
      try {
        const api = await init(opts)
        const path = cmd.split('.')
        /** @type {function} */
        let fn = api.raw
        for (const part of path) {
          fn = fn[part]
        }
        if (!fn || typeof fn !== 'function') {
          console.log('Invalid cmd')
          return
        }
        out(fn.apply(api, args))
      } catch (e) {
        console.error(e)
      }
    })

  commandBase('memory', '[path]')
    .description(`Get Memory contents`)
    .option('--set <file>', 'Sets the memory path to the contents of file')
    .option('--allow-root', 'Allows writing without path')
    .option('-s --shard <shard>', 'Shard to read from', 'shard0')
    .option('-f --file <file>', 'File to write data to')
    .action(async function (fpath, opts) {
      try {
        const api = await init(opts)
        if (opts.set) {
          if (!fpath && !opts.allowRoot) {
            throw new Error('Refusing to write to root! Use --allow-root if you really want this.')
          }
          const data = await readFile(opts.set, 'utf8')
          await api.memory.set(fpath, data, opts.shard)
          out('Memory written')
        } else {
          const data = api.memory.get(fpath, opts.shard)
          if (opts.file) {
            await writeFile(opts.file, data)
          } else {
            out(data)
          }
        }
      } catch (e) {
        console.error(e)
      }
    })

  commandBase('segment', '<segment>')
    .description(`Get segment contents. Use 'all' to get all)`)
    .option('--set <file>', 'Sets the segment content to the contents of file')
    .option('-s --shard <shard>', 'Shard to read from', 'shard0')
    .option('-d --dir <dir>', 'Directory to save in. Empty files are not written. (defaults to outputing in console)')
    .action(async function (segment, opts) {
      try {
        const api = await init(opts)
        if (opts.set) {
          const data = await readFile(opts.set, 'utf8')
          await api.memory.segment.set(segment, data, opts.shard)
          out('Segment Set')
        } else {
          if (segment === 'all') segment = Array.from({ length: 100 }, (v, k) => k).join(',')
          const { data } = await api.memory.segment.get(segment, opts.shard)
          const dir = opts.dir
          const segments = data
          if (dir) {
            if (Array.isArray(segments)) {
              await Promise.all(segments.map((d, i) => d && writeFile(path.join(dir, `segment_${i}`), d)))
            } else {
              await writeFile(path.join(dir, `segment_${segment}`), d)
            }
            out('Segments Saved')
          } else {
            out(segments)
          }
        }
      } catch (e) {
        console.error(e)
      }
    })

  commandBase('download')
    .description(`Download code`)
    .option('-b --branch <branch>', 'Code branch', 'default')
    .option('-d --dir <dir>', 'Directory to save in (defaults to outputing in console)')
    .action(async function (opts) {
      try {
        const api = await init(opts)
        const dir = opts.dir
        const { modules } = await api.code.get(opts.branch)
        if (dir) {
          await Promise.all(Object.keys(modules).map(async fn => {
            const data = modules[fn]
            if (data.binary) {
              await writeFile(path.join(dir, `${fn}.wasm`), Buffer.from(data.binary, 'base64'))
            } else {
              await writeFile(path.join(dir, `${fn}.js`), data)
            }
            console.log(`Saved ${fn}`)
          }))
        } else {
          out(modules)
        }
      } catch (e) {
        console.error(e)
      }
    })

  commandBase('upload', '<files...>')
    .description(`Upload code`)
    .option('-b --branch <branch>', 'Code branch', 'default')
    .action(async function (files, opts) {
      try {
        const api = await init(opts)
        const modules = {}
        const ps = []
        for (const file of files) {
          ps.push((async (file) => {
            const { name, ext } = path.parse(file)
            const data = await readFile(file)
            if (ext === '.js') {
              modules[name] = data.toString('utf8')
            }
            if (ext === '.wasm') {
              modules[name] = { binary: data.toString('base64') }
            }
          })(file))
        }
        await Promise.all(ps)
        out(api.code.set(opts.branch, modules))
      } catch (e) {
        console.error(e)
      }
    })

  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }

  await program.parseAsync()
}

run().then(data => {
  if (!data) return
  console.log(JSON.stringify(data.data || data, null, 2))
}).catch(console.error)
