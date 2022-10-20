import express from 'express'
import cors from 'cors'
import expressWs from 'express-ws';
import { log } from './log.js'
import { op } from './persist.js'

const PORT = 61661;

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
app.ws('/ws', async (ws, req) => {
    const send = msg => ws.send(JSON.stringify(msg))
    clientSends.add(send)
    wslog('client connected')
    ws.on('message', async data => {
        wslog('received client message', data)
        const msg = JSON.parse(data)
        if (msg.get === 'downloads') {
            wslog('client requires dumps')
            const result = await op.dump()
            if (result.rows.length) {
                send({ type: 'downloads', downloads: result.rows })
            }
        } else if (msg.type === 'add-url') {
            wslog('client adds url', msg.url)
            const result = await op.addURL(msg.url)
            if (result.changes) {
                const result = await op.dump()
                if (result.rows.length) {
                    sendAllClients({ type: 'downloads', downloads: result.rows })
                }
                await treat()
            }
        } else if (msg.type === 'retry-url') {
            wslog('client wants retry', msg.url)
            const result = await op.retry(msg.url)
            if (result.changes) {
                const result = await op.dump()
                if (result.rows.length) {
                    sendAllClients({ type: 'downloads', downloads: result.rows })
                }
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
                const result = await op.dump()
                if (result.rows.length) {
                    sendAllClients({ type: 'downloads', downloads: result.rows })
                }
            }
        }
        {
            const finalDownloadState = await download(oneWaiting.url, (...p) => {
                const progressMsg = {
                    type: 'progress',
                    progress: p[1].progress,
                    url: oneWaiting.url
                }
                console.log('progress message', progressMsg)
                sendAllClients(progressMsg)
            })
            const newStatus = (finalDownloadState.code === 0) ? 'downloaded' : 'error'

            const result = await op.updateStatus(oneWaiting.url, newStatus)
            if (result.changes) {
                const result = await op.dump()
                if (result.rows.length) {
                    sendAllClients({ type: 'downloads', downloads: result.rows })
                }
            }
            treat()
        }

    }



}
const main = async () => {
    {
        // create db if not exist
        const result = await op.create()
        console.log(result)
    }
    {
        // downloading -> waiting
        const result = await op.resumeStatus()
        console.log(`resume ${result.changes} download(s)`)
    }
    {
        // start downloading
        treat()
    }
    {
        // start websocket webserver
        app.listen(PORT, err => {
            if (err) console.log(err);
            console.log("Server listening on PORT", PORT);
        });
    }
}

const testit = async () => {
    let result
    result = await op.create()
    console.log(result)
    result = await op.addURL("url1")
    console.log(result)
    result = await op.addURL("url2")
    console.log(result)
    result = await op.dump()
    console.log(result)
    result = await op.getByStatus('waiting')
    console.log(result)
    result = await op.updateStatus('url1', 'downloading')
    console.log(result)
    result = await op.getByStatus('waiting')
    console.log(result)
    result = await op.getByStatus('downloading')
    console.log(result)
    result = await op.resumeStatus()
    console.log('RESUME', result)
    result = await op.getByStatus('waiting')
    console.log(result)
    result = await op.getByStatus('downloading')
    console.log(result)
    result = await op.updateStatus('url1', 'error')
    console.log(result)
    result = await op.updateStatus('url2', 'error')
    console.log(result)
    result = await op.retry('url1')
    console.log(result)
    result = await op.getByStatus('waiting')
    console.log(result)
    result = await op.updateStatus('url2', 'downloading')
    console.log(result)
    result = await op.getByStatus('not-existing-status')
    console.log(result)

}
//testit()
main()
/*
db.serialize(() => {
    create()
    dump(all => console.log('all', all))
    app.listen(PORT, err => {
        if (err) console.log(err);
        console.log("Server listening on PORT", PORT);
    });
    resumeStatus(e => {
        console.log('resumed',e)
    })
    treat()
})
*/



//app.post('/', (req, res) => addURL(req.body.url, (error) => res.json({ url, error })))
//app.get('/', (req, res) => dump(rows => res.json(rows)))
