write a `server/config.js` config file in `server/` dir (see `server/config.example.js`)

        export default () => ({
            YT_DLP_BIN: '/path/to/yt-dlp',
            BASE_DOWNLOAD_PATH: '/path/to/base/download/path',
            DB_FILENAME : 'database.db', // ':memory:'
            PORT:'61661',
        })

install and start server

       npm install
       npm start

point browser to http://localhost:61661
