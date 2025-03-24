// server/server.js
const fs = require('fs')
const http = require('http')
const WebSocket = require('ws')
const Y = require('yjs')
const utils = require('node_modules/y-websocket/bin/utils.cjs')
const setupWSConnection = utils.setupWSConnection

const FILE_PATH = './shared.txt'
const DOC_NAME = 'shared-doc'
const docs = new Map()

// Custom getYDoc in setupWSConnection
// (we can use this if we patch setupWSConnection)
const getYDoc = (docName) => {
  console.log('Creating or retrieving doc for:', docName)

  if (!docs.has(docName)) {
    const ydoc = new Y.Doc()
    docs.set(docName, ydoc)

    // Load from file
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, 'utf8')
      const yXmlFragment = ydoc.getXmlFragment('prosemirror')
      const paragraph = new Y.XmlElement('p')
      paragraph.insert(0, [new Y.XmlText(content)])
      yXmlFragment.insert(0, [paragraph])
      console.log('✅ Loaded content from shared.txt')
    }

    // Save on change
    const yXmlFragment = ydoc.getXmlFragment('prosemirror')
    yXmlFragment.observeDeep(() => {
      const text = yXmlFragment.toArray().map(node => node.toString()).join('\n')
      fs.writeFileSync(FILE_PATH, text, 'utf8')
      console.log('💾 Saved to shared.txt')
    })
  }

  return docs.get(docName)
}

const server = http.createServer()
const wss = new WebSocket.Server({ server })

wss.on('connection', (conn, req) => {
  console.log('📡 Incoming WebSocket connection:', req.url)

  try {
    setupWSConnection(conn, req, { docName: DOC_NAME })
    console.log('✅ setupWSConnection completed')
  } catch (err) {
    console.error('💥 setupWSConnection failed:', err)
    conn.close()
  }
})


const PORT = 1234
server.listen(PORT, () => {
  console.log(`🚀 y-websocket server running on ws://localhost:${1234}`)
})
