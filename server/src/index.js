import express from 'express'
import cors from 'cors'
import expressWs from 'express-ws';
import { log } from './log.js'
import { op, dblog } from './persist.js'

import config from '../config.js'
const { PORT } = config()

// http server
const app = expressWs(express()).app
app.use(cors())
app.use(express.json());

app.use(express.static('../client/dist'))

// websocket server
const wslog = (...r) => log('ws', ...r)
const clientSends = new Set()
const sendAllClients = msg => {
    for (let clientSend of clientSends) {
        clientSend(msg)
    }
}
const massBunkSend = async () => {
    const result = await op.dump()
    if (result.rows) {
        sendAllClients({ type: 'downloads', downloads: result.rows })
    }
}

app.ws('/ws', async (ws, req) => {
    const send = msg => ws.send(JSON.stringify(msg))
    clientSends.add(send)
    wslog('client connected')
    ws.on('message', async data => {
        wslog('received client message', data)
        const msg = JSON.parse(data)
        if (msg.type === 'get-downloads') {
            wslog('client requires dumps')
            const result = await op.dump()
            if (result.rows.length) {
                send({ type: 'downloads', downloads: result.rows })
            }
        } else if (msg.type === 'add-url') {
            wslog('client adds url', msg.url)
            const result = await op.addURL(msg.url)
            if (result.changes) {
                await massBunkSend()
                await treat()
            }
        } else if (msg.type === 'retry-url') {
            wslog('client wants retry', msg.url)
            const result = await op.retry(msg.url)
            if (result.changes) {
                await massBunkSend()
                await treat()
            }
        } else if (msg.type === 'purge') {
            wslog('client wants purge')
            const result = await op.purge()
            if (result.changes) {
                await massBunkSend()
                await treat()
            }
        }
    })
    ws.on('close', () => {
        wslog('WebSocket was closed')
        clientSends.delete(send)
    })
})


import { download } from './ytdlp.js'
const ytdllog = (...r) => log('YTDL', ...r)

const treat = async () => {

    {
        const result = await op.getByStatus('downloading')
        if (result.rows.length) {
            ytdllog(`already downloading ${result.rows.length} file(s)`)
            return;
        }
    }
    {
        const result = await op.getByStatus('waiting')
        if (result.rows.length === 0) {
            ytdllog('nobody is waiting')
            return;
        }

        const [oneWaiting] = result.rows
        {
            ytdllog(`an url is waiting : ${oneWaiting.url}`)
            const result = await op.updateStatus(oneWaiting.url, "downloading")
            if (result.changes) {
                await massBunkSend()
            }
        }
        {
            const finalDownloadState = await download(oneWaiting.url, (...p) => {
                const progressMsg = {
                    type: 'progress',
                    progress: p[1].progress,
                    url: oneWaiting.url
                }
                wslog('progress message', progressMsg)
                sendAllClients(progressMsg)
            })
            const newStatus = (finalDownloadState.code === 0) ? 'downloaded' : 'error'

            const result = await op.updateStatus(oneWaiting.url, newStatus)
            if (result.changes) {
                await massBunkSend()
            }
            treat()
        }

    }



}
const main = async () => {
    {
        // create db if not exist
        const result = await op.create()
        dblog(result)
    }
    {
        // downloading -> waiting
        const result = await op.resumeStatus()
        dblog(`resume ${result.changes} download(s)`)
    }
    {
        // start downloading
        treat()
    }
    {
        // start websocket webserver
        app.listen(PORT, err => {
            if (err) wslog("Cannot start server", err);
            wslog("Server listening on PORT", PORT);
        });
    }
}

//app.get('/naze', (req, res) => res.json({poupuou:'flouflou'}))
//app.post('/', (req, res) => addURL(req.body.url, (error) => res.json({ url, error })))
main()