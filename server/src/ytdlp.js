import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'path'

import config from '../config.js'
const {
    YT_DLP_BIN,
    BASE_DOWNLOAD_PATH
} = config

const todayDirectory = () => {
    const date = new Date()
    return [
        date.getFullYear().toString(),
        (1 + date.getMonth()).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0')
    ].join('.')
}
const todayPath = () => {
    return path.join(BASE_DOWNLOAD_PATH, todayDirectory())
}

const parseProgression = (line) => {
    const $download = `[download]`
    const latest = line.lastIndexOf($download)
    const s = line.slice(latest + $download.length)
    .replace(/~/g,' ')
    .replace(/\s+/g, ' ')
    const [percent, of, size, at, speed, ETA, eta] = s.trim().split(' ')
    if ((of === 'of') && (at === 'at')) {
        return { s, percent, size, speed, eta }
    }

}
//parseProgression(`[download] 24.0% of  116.88MiB at  349.68KiB/s ETA 04:20`)

export const download = async (url, callback) => {

    const outputDirectory = todayPath()
    await mkdir(outputDirectory, { recursive: true })

    const outputs = new Promise((accept, reject) => {
        const outputs = {
            stdout: [],
            stderr: [],
            code: undefined,
            error: undefined
        }

        const proc = spawn(YT_DLP_BIN, ['-P', outputDirectory, url])
        proc.stdout.on('data', data => {
            callback({ outputs }, { stdout: data, progress: parseProgression(data.toString()) })
            outputs.stdout.push(data)
        })
        proc.stderr.on('data', data => {
            callback({ outputs }, { stderr: data })
            outputs.stderr.push(data)
        })
        proc.on('close', (code) => {
            callback({ outputs }, { code })
            outputs.code = code
            accept(outputs)
        });
        proc.on('error', error => {
            callback({ outputs }, { error })
            outputs.error = error
            accept(outputs)
        })

    })
    return await outputs
}
//console.log('go', todayPath())

/*
async function go() {
    //console.log(todayPath())
   const promiseResult = await download(url,(...p)=>{
        console.log('begin UPDATE==========')
        console.log(...p)
        console.log('end UPDATE==========')
        console.log(p[0].outputs.stdout.join("\n"))
        console.log('end more UPDATE==========')

    })
    console.log('==== OVER ====')
    console.log(promiseResult)

}
go()*/