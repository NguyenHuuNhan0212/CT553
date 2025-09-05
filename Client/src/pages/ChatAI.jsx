import React, { useState } from 'react';
import axios from 'axios';

export default function ChatAI() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');

  async function send() {
    if (!input) return;
    setMsgs((prev) => [...prev, { role: 'user', content: input }]);
    try {
      const res = await axios.post('http://localhost:3000/api/chat/ask', {
        question: input
      });
      setMsgs((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.answer }
      ]);
    } catch (e) {
      console.log(e);
      setMsgs((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lỗi: không thể trả lời' }
      ]);
    }
    setInput('');
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat với Trợ lý Du lịch</h2>
      <div
        style={{
          height: 300,
          overflowY: 'auto',
          border: '1px solid #ddd',
          padding: 10
        }}
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}
          >
            <b>{m.role}</b>: {m.content}
          </div>
        ))}
      </div>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: '70%' }}
        />
        <button onClick={send}>Gửi</button>
      </div>
    </div>
  );
}
