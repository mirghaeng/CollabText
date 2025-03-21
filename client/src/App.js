import React, { useRef, useState, useEffect } from 'react';
import './App.css';

function App() {
    const userIdRef = useRef(null);
    const socketRef = useRef(null);
    const textareaRef = useRef(null);
    const mirrorRef = useRef(null);

    const [text, setText] = useState("");
    const [remoteCursors, setRemoteCursors] = useState({});
    const [lastCursorPos, setLastCursorPos] = useState(0);

    useEffect(() => {

        // Prevent double initialization
        if (socketRef.current) return;

        const newSocket = new WebSocket('ws://localhost:5000');
        socketRef.current = newSocket;

        newSocket.onopen = () => {
            console.log('WebSocket connection established');
        };

        newSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'userId') {
                    userIdRef.current = message.userId;
                } else if (message.type === 'init') {
                    setText(message.data);
                } else if (message.type === 'update') {
                    setText(message.data);
                } else if (message.type === 'cursor' && message.userId !== userIdRef.current) {
                    console.log(`Updating cursor: User ${message.userId} at ${message.cursor}, Name: ${message.name}`);
                    setRemoteCursor(message.userId, message.cursor, message.name);
                }
            } catch (error) {
                console.error('Error parsing message', error);
            }
        };

        newSocket.onclose = () => {
            console.log('WebSocket connection closed.');
        };

        newSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (mirrorRef.current && textareaRef.current) {
                mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
                mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        };
    
        const textarea = textareaRef.current;
        textarea?.addEventListener('scroll', handleScroll);
    
        return () => {
            textarea?.removeEventListener('scroll', handleScroll);
        };
    }, []);    

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'update',
                data: newText,
                userId: userIdRef.current
            }));
        }
    };

    //  Consideration: throttle cursor sending
    const handleSelect = (e) => {
        const cursorPos = e.target.selectionStart;
        setLastCursorPos(cursorPos);

        if (socketRef.current?.readyState === WebSocket.OPEN && userIdRef.current) {
            socketRef.current.send(JSON.stringify({
                type: 'cursor',
                cursor: cursorPos,
                userId: userIdRef.current
            }))
        }
    };

    const getCursorCoordinates = (cursorIndex, userId) => {
        const caretSpan = document.getElementById(`caret-marker-${userId}`);
        if (!caretSpan) return null;

        const rect = caretSpan.getBoundingClientRect();
        const parentRect = mirrorRef.current?.getBoundingClientRect();
        if (!parentRect) return null;

        return {
            left: `${rect.left - parentRect.left}px`,
            top: `${rect.top - parentRect.top}px`,
        };
    };

    const setRemoteCursor = (userId, cursorPos, name = "Anonymous") => {
        setRemoteCursors((prev = {}) => ({
            ...prev,
            [userId]: { cursor: cursorPos, name }
        }));
    };

    return (
        <div className="editor-wrapper" style={{ position: 'relative' }}>
            <h1>CollabText: A Collaborative Text Editor</h1>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleChange}
                    onSelect={handleSelect}
                    rows="20"
                    cols="80"
                    className="textarea"
                />

                {/* Invisible "mirror" div to track cursor position */}
                <div
                    ref={mirrorRef}
                    className="textarea-mirror"
                    aria-hidden="true"
                >
                    {text.split('').map((char, index) => {
                        const caretSpans = [];

                        // Render remote caret markers
                        Object.entries(remoteCursors || {}).forEach(([uid, { cursor }]) => {
                            if (cursor === index) {
                                caretSpans.push(
                                    <span key={`caret-${uid}`} id={`caret-marker-${uid}`}>|</span>
                                );
                            }
                        });

                        // Render local caret marker
                        if (index === lastCursorPos) {
                            caretSpans.push(<span key="caret-local" id="caret-marker">|</span>);
                        }

                        return (
                            <span key={index}>
                                {caretSpans}
                                {char}
                            </span>
                        );
                    })}

                    {/* Remote carets at end of text */}
                    {Object.entries(remoteCursors || {}).map(([uid, { cursor, name }]) =>
                        cursor === text.length ? (
                            <span key={`end-${uid}`} id={`caret-marker-${uid}`}>|</span>
                        ) : null
                    )}

                    {/* Local caret at end of text */}
                    {lastCursorPos === text.length && (
                        <span key="caret-local-end" id="caret-marker">|</span>
                    )}
                </div>

                {/* Overlayed remote cursors */}
                {Object.entries(remoteCursors || {}).map(([uid, { cursor, name }]) => {
                    const position = getCursorCoordinates(cursor, uid);
                    return position ? (
                        <div
                            key={uid}
                            className="remote-cursor"
                            style={{
                                position: 'absolute',
                                left: position.left,
                                top: position.top,
                            }}
                        >
                            <div className="cursor-bar" />
                            <div className="cursor-label">{name}</div>
                        </div>
                    ) : null;
                })}
            </div>
        </div>
    );
}

export default App;
