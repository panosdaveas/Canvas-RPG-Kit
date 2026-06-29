import { exec } from 'child_process'

export default {
    plugins: [
        {
            name: 'open-browser-with-size',
            configureServer(server) {
                server.httpServer?.once('listening', () => {
                    const url = 'http://localhost:5173'
                    const width = 480*2
                    const height = 480*2

                    const platform = process.platform

                    if (platform === 'darwin') {
                        // macOS
                        exec(`osascript -e 'tell application "Google Chrome"
              make new window
              set bounds of front window to {0, 0, ${width}, ${height}}
              set URL of active tab of front window to "${url}"
            end tell'`)

                    } else if (platform === 'win32') {
                        // Windows
                        exec(`start chrome --new-window --window-size=${width},${height} ${url}`)

                    } else {
                        // Linux
                        exec(`google-chrome --new-window --window-size=${width},${height} ${url}`)
                    }
                })
            }
        }
    ]
}