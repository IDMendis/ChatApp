import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE, WS_URL, TOPIC_PUBLIC, SEND_MESSAGE_DEST, ADD_USER_DEST, ChatMessage } from './api';

function linkify(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text))) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    const url = m[0];
    const isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
    parts.push(
      isImg ? (
        <span key={m.index} className="bubble-image">
          <img src={url} alt="shared" />
        </span>
      ) : (
        <a key={m.index} href={url} target="_blank" rel="noreferrer">{url}</a>
      )
    );
    lastIndex = m.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;
    const client = new Client({
      debug: () => {},
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS(WS_URL),
    });
    client.onConnect = () => {
      setConnected(true);
      client.subscribe(TOPIC_PUBLIC, (msg: IMessage) => {
        try { setMessages(prev => [...prev, JSON.parse(msg.body) as ChatMessage]); }
        catch { /* ignore parse errors */ }
      });
      client.publish({ destination: ADD_USER_DEST, body: JSON.stringify({ sender: user }) });
    };
    client.onStompError = () => {};
    client.onWebSocketClose = () => setConnected(false);
    client.activate();
    clientRef.current = client;
  }, [user]);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    setConnected(false);
  }, []);

  const send = useCallback(() => {
    if (!clientRef.current || !clientRef.current.connected) return;
    const body = JSON.stringify({ sender: user || 'user', content: input, type: 'CHAT' });
    clientRef.current.publish({ destination: SEND_MESSAGE_DEST, body });
    setInput('');
  }, [user, input]);

  const onUpload = useCallback(async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/api/files/upload`, { method: 'POST', body: form });
    const json = await res.json();
    const url = json.url as string;
    const msg = `Shared file: ${json.filename} (${url})`;
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination: SEND_MESSAGE_DEST, body: JSON.stringify({ sender: user || 'user', content: msg }) });
    }
  }, [user]);

  return (
    <div className="container">
      <header>
        <h2>Realtime Group Chat</h2>
        <div className="controls">
          <input placeholder="username" value={user} onChange={e => setUser(e.target.value)} />
          {!connected ? (
            <button onClick={connect} disabled={!user}>Connect</button>
          ) : (
            <button onClick={disconnect}>Disconnect</button>
          )}
        </div>
      </header>

      <main className="chat">
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.type?.toLowerCase() || 'chat'}`}>
              <span className="sender">{m.sender || 'anon'}:</span>
              <span className="content">{linkify(m.content || '')}</span>
            </div>
          ))}
        </div>
        <div className="composer">
          <input
            placeholder="Type a message"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={send} disabled={!connected || !input.trim()}>Send</button>
          <label className="upload">
            <input type="file" onChange={e => e.target.files && onUpload(e.target.files[0])} />
            Upload
          </label>
        </div>
      </main>
    </div>
  );
}
