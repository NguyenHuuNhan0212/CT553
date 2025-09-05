import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Planner from './pages/Planner';
import ChatAI from './pages/ChatAI';
import Community from './pages/Community';

export default function App() {
  return (
    <div>
      <nav style={{ padding: 10, borderBottom: '1px solid #ddd' }}>
        <Link to='/' style={{ marginRight: 10 }}>
          Home
        </Link>
        <Link to='/planner' style={{ marginRight: 10 }}>
          Planner
        </Link>
        <Link to='/chat' style={{ marginRight: 10 }}>
          Chat
        </Link>
        <Link to='/community'>Community</Link>
      </nav>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/planner' element={<Planner />} />
        <Route path='/chat' element={<ChatAI />} />
        <Route path='/community' element={<Community />} />
      </Routes>
    </div>
  );
}
