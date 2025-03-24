# CollabText
A GoogleDocs-inspired collaborative text editor.

```sh
# run client
npm start

# run server
node server.js
```

Commentary:
- I was able to get started with a plain text editor using `<textarea>`. I created mirroring cursor movement but implementation is rigirous and clunky. Creating the UI for a text editor was not my focus.
- So I decided to use [ProseMirror](https://github.com/prosemirror) and [Y.js](https://github.com/yjs/yjs), this works for a simple collaborative text editor. The editor looks good, and now I want all users to be able to edit the same document (e.g. `shared.txt`).
- To do this, I have to manually patch y-websocket's `getYDoc` function within `setupWSConnection` in `y-websocket/bin/utils.cjs`. This means forking/cloning the `y-websocket` repo into my project, this feels like overkill. I don't want to write a WebSocket server from the ground up for this only. Nor do I want yet another generic wrapper like [HocusPocus](https://github.com/ueberdosis/hocuspocus) for this.
- I want to try targeted tech like `y-leveldb` with `y-websocket`
