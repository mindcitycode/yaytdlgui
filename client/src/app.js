import React, { useEffect, useRef, useState } from 'react'

function Line(props) {
    const { url, status, date } = props
    const dateString = new Date(parseInt(date)).toLocaleString("fr-FR");
    const retry = () => props.retry(url)
    const retryButton = (status === 'error') ? (<button onClick={retry}>retry</button>) : ('');
    return <tr>
        <td className="download-status">{status}</td>
        <td className="download-retry">{retryButton}</td>
        <td className="download-date">{dateString}</td>
        <td className="download-url">{url}</td>
    </tr >
}
function AddBox(props) {
    const boxRef = useRef()
    const add = () => {
        const urls = boxRef.current.value.trim().split("\n").filter(x => x !== undefined).filter(x => x.length > 2)
        props.addDownloads(urls)
        boxRef.current.value = ''
    }
    return <div className="add-box">
        <textarea ref={boxRef} className="addBox"></textarea>
        <div>
            <button onClick={add}>Add</button>
        </div>
    </div>
}
function Progress(props) {
    const { progress, progressUrl } = props
    /*return <div className="download-progress">
        
        <pre>{progress.percent} {progress.size} {progress.speed} {progress.eta}</pre>
        <pre>{progressUrl}</pre>
        
    </div>
    */
    return <table className="download-progress">
        <thead><tr><th>%</th><th>size</th><th>speed</th><th>eta</th><th>url</th></tr></thead>
        <tbody>
            <tr>
                <td className="progress-percent">{progress.percent}</td>
                <td className="progress-size">{progress.size}</td>
                <td className="progress-speed">{progress.speed}</td>
                <td className="progress-eta">{progress.eta}</td>
                <td className="progress-url">{progressUrl}</td>
            </tr>
        </tbody>
    </table>

}
import { addDownload, listDownloads } from './api.js'

const ws = new WebSocket("ws://localhost:61661/ws")//, "protocolOne");
const send = msg => ws.send(JSON.stringify(msg))
const wsApi = {
    addUrl: url => send({ type: 'add-url', url }),
    retry: url => send({ type: 'retry-url', url }),
    getDownloads: () => send({ get: 'downloads' }),
    purge: () => send({ type : 'purge'}),    
}
ws.onopen = () => {
    wsApi.getDownloads()
    //console.log('opened ws')
    //send({ get: 'downloads' })
}
export const App = () => {

    const refreshInterval = 10000
    const [downloads, setDownloads] = useState([])
    const [progressDump, setProgressDump] = useState('')
    
    const [progress, setProgress] = useState('')
    const [progressUrl, setProgressUrl] = useState('')
    
    /*
    const progress = {
        eta: "00:00",
        percent: "78.8%",
        s: " 78.8% of 2.54MiB at 16.39MiB/s ETA 00:00",
        size: "2.54MiB",
        speed: "16.39MiB/s",
    }
    const progressUrl = "HTTP://eflkjdlfkjs.com"
    function setProgress() { }
    function setProgressUrl() { }
    */
    
    useEffect(() => {
        /*const*/ //send = msg => ws.send(JSON.stringify(msg))
        /*   ws.onopen = () => {
               console.log('opened ws')
               send({ get: 'downloads' })
           }*/
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            //console.log('received server message', msg)
            if (msg.type === 'downloads') {
                const same = (JSON.stringify(msg.downloads) === (JSON.stringify(downloads)))
                //if (!same) {
                // not good
                msg.downloads.sort((a, b) => {

                    return parseInt(b.date) - parseInt(a.date)

                })
                setDownloads(msg.downloads)
                //}
            } else if (msg.type === 'progress') {
                setProgressDump(JSON.stringify(msg))
                if (msg.progress?.percent) {
                    setProgress(msg.progress)
                    setProgressUrl(msg.url)
                }
                //    console.log('prog', msg)
            } else {
                wsApi.getDownloads()
                //send({ get: 'downloads' })
            }
        }
        return () => {
            ws.onmessage = null
            //  ws.close()
        }
    }, [])

    const addDownloads = async (urls) => {
        urls.forEach(url => wsApi.addUrl(url))
    }

    const refresh = async () => {
        wsApi.getDownloads()
    }
    const purge = async () => {
        wsApi.purge()
    }

    const retry = async (url) => {
        console.log('PLEASE RETRY', url)
        wsApi.retry(url)
    }
    const liste = downloads.map(line => <Line key={line.id} url={line.url} status={line.status} date={line.date} retry={retry} />)
    return <>
        <h1>paste URLs</h1>
        <AddBox addDownloads={addDownloads} />
        <h1>progress</h1>
        <Progress progress={progress} progressUrl={progressUrl} progressDump={progressDump} />
        <h1>downloads</h1>
        <button onClick={refresh}>refresh</button>
        <button onClick={purge}>purge</button>
        <table className="downloads">
            <thead><tr><th>status</th><th></th><th>date</th><th>url</th></tr></thead>
            <tbody>{liste}</tbody>
        </table>
    </>
}
function NON() {



}