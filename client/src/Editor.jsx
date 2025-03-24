import React, { useEffect, useRef, useState } from 'react'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { schema } from 'prosemirror-schema-basic'
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

import 'prosemirror-view/style/prosemirror.css'
import './styles.css';

const Editor = () => {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const [ready, setReady] = useState(false)

  const ydoc = useRef(new Y.Doc()).current
  const providerRef = useRef(null)
  const yXmlFragment = ydoc.getXmlFragment('prosemirror')

  useEffect(() => {
    // const provider = new WebsocketProvider('wss://demos.yjs.dev', 'my-room-name', ydoc)
    const provider = new WebsocketProvider('ws://localhost:1234', 'shared-doc', ydoc)
    providerRef.current = provider

    provider.on('status', ({ status }) => {
      console.log(`Yjs WebSocket status: ${status}`)
    })

    provider.on('connection-close', () => {
      console.log('Connection closed')
    })

    provider.on('connection-error', () => {
      console.log('Connection error')
    })

    provider.on('synced', () => {
      console.log('Y.js synced with server')
      setReady(true)
    })

    return () => {
      provider.destroy()
      ydoc.destroy()
    }
  }, [ydoc])

  useEffect(() => {
    if (!ready || !editorRef.current || !providerRef.current.awareness) return

    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        schema,
        plugins: [
          ySyncPlugin(yXmlFragment),
          yCursorPlugin(providerRef.current.awareness),
          yUndoPlugin()
        ]
      })
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [ready, editorRef, yXmlFragment])

  return (
    <div>
      <div ref={editorRef} />
    </div>
  )
}

export default Editor
