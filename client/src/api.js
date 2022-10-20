const SERVER = "http://localhost:8008"

// rest
const URL = (endPoint, path) => [SERVER, endPoint, path].filter(x => x !== undefined).join('/')
const GET = endPoint => async path => {
    const url = URL(endPoint, path)
    console.log('GET url', url)
    const response = await fetch(url)
    return await response.json()
}
const POST = endPoint => async body => {
    const url = URL(endPoint)
    console.log('POST url', url)
    const response = await fetch(URL(endPoint), {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
}

export const addDownload = POST()
export const listDownloads = GET()
/*
// websocket
const exampleSocket = new WebSocket("ws://localhost:8008/ws")//, "protocolOne");
exampleSocket.onopen = function (event) {
    console.log('SOCKET OPENED')
    exampleSocket.send(JSON.stringify({ msg: 'MESSAGE DU CLIENT1' }));
    setInterval(() => {
        exampleSocket.send(JSON.stringify({ msg: 'MESSAGE DU CLIENT' }));
        exampleSocket.close();
    }, 1000)
    exampleSocket.onmessage = function (event) {
        console.log('WS CLIENT RECEIVED', JSON.parse(event.data));
    }
    exampleSocket.onclose = function (event) {
        console.log('WS CLIENT CLOSING')
    }
}
          //exampleSocket.close();

}
*/
/*
const go = async () => {

    const r0 = await addDownload({ url: "MON URLa" })
    const r1 = await addDownload({ url: "MON URLb" })
    const r2 = await addDownload({ url: "MON URLc" })
    console.log("r", r0)
    console.log("r", r1)
    console.log("r", r2)
    setInterval(async () => {
        const s = await listAll()
        console.log('->', s)
    }, 10000)

}
go()



*/