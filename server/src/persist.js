import sqlite3 from 'sqlite3'
import exitHook from 'async-exit-hook'
import { log } from './log.js'

export const dblog = (...r) => log('db', ...r)

exitHook((...a) => {
    dblog('exiting', ...a);
    db.close();
});

const DB_FILENAME = 'database.db' // ':memory:'
const db = new sqlite3.Database(DB_FILENAME);

const dbPromise = fName => (sql, ...p) => new Promise((accept, reject) => {
    dblog(sql, p)
    db[fName](sql, p, function (error, rows) {
        accept({ error, rows, lastId: this.lastId, changes: this.changes })
    })
})
const dbRunPromise = dbPromise('run')
const dbAllPromise = dbPromise('all')
const possibleStatus = ['waiting', 'downloading', 'downloaded', 'error']
export const op = {
    create: async () => dbRunPromise("CREATE TABLE IF NOT EXISTS downloads (url TEXT UNIQUE, status TEXT, date TEXT)"),
    addURL: async url => dbRunPromise(`INSERT INTO downloads VALUES ("${url}","waiting","${Date.now()}")`),
    dump: async () => dbAllPromise(`SELECT rowid AS id, url, status, date FROM downloads`),
    getByStatus: async status => dbAllPromise(`SELECT rowid AS id, url, status, date FROM downloads WHERE status="${status}"`),
    updateStatus: async (url, status) => {
        if (!possibleStatus.includes(status)) return { error: `wrongStatus:${status}` }
        return dbRunPromise(`UPDATE downloads SET status = "${status}" WHERE url="${url}"`)
    },
    resumeStatus: async () => dbRunPromise(`UPDATE downloads SET status = "waiting" WHERE status="downloading"`),
    retry: async url => dbRunPromise(`UPDATE downloads SET status = "waiting" WHERE status="error" AND url="${url}"`),
    purge: async () => dbRunPromise("DELETE from downloads"),
}



const testit = async () => {
    let result
    result = await op.create()
    dblog(result)
    result = await op.addURL("url1")
    dblog(result)
    result = await op.addURL("url2")
    dblog(result)
    result = await op.dump()
    dblog(result)
    result = await op.getByStatus('waiting')
    dblog(result)
    result = await op.updateStatus('url1', 'downloading')
    dblog(result)
    result = await op.getByStatus('waiting')
    dblog(result)
    result = await op.getByStatus('downloading')
    dblog(result)
    result = await op.resumeStatus()
    dblog('RESUME', result)
    result = await op.getByStatus('waiting')
    dblog(result)
    result = await op.getByStatus('downloading')
    dblog(result)
    result = await op.updateStatus('url1', 'error')
    dblog(result)
    result = await op.updateStatus('url2', 'error')
    dblog(result)
    result = await op.retry('url1')
    dblog(result)
    result = await op.getByStatus('waiting')
    dblog(result)
    result = await op.updateStatus('url2', 'downloading')
    dblog(result)
    result = await op.getByStatus('not-existing-status')
    dblog(result)

}
//testit()
