import React, { useState } from 'react';
import axios from 'axios';

export default function PlannerForm({ onResult }) {
  const [destination, setDestination] = useState('Da Nang');
  const [startDate, setStartDate] = useState('2025-09-10');
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState(5000000);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/api/trips/generate', {
        destination,
        startDate,
        daysCount: Number(days),
        people: Number(people),
        budget: Number(budget)
      });
      onResult(res.data.itinerary);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginBottom: 20 }}>
      <div>
        <label>Điểm đến</label>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>
      <div>
        <label>Ngày bắt đầu</label>
        <input
          type='date'
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div>
        <label>Số ngày</label>
        <input
          type='number'
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
      </div>
      <div>
        <label>Số người</label>
        <input
          type='number'
          value={people}
          onChange={(e) => setPeople(e.target.value)}
        />
      </div>
      <div>
        <label>Ngân sách (VND)</label>
        <input
          type='number'
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>
      <button type='submit' disabled={loading}>
        {loading ? 'Đang tạo...' : 'Tạo lịch trình'}
      </button>
    </form>
  );
}
