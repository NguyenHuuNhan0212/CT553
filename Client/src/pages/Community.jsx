import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Community() {
  const [list, setList] = useState([]);
  useEffect(() => {
    axios
      .get('http::localhost:3000/api/trips')
      .then((r) => setList(r.data))
      .catch(() => {});
  }, []);
  return (
    <div style={{ padding: 20 }}>
      <h2>Cộng đồng</h2>
      {list.map((it) => (
        <div
          key={it._id}
          style={{ border: '1px solid #eee', padding: 10, marginTop: 10 }}
        >
          <h4>{it.title}</h4>
          <div>
            Destination: {it.destination} | Days: {it.daysCount} | Total est:{' '}
            {it.costEstimate?.total || 0} VND
          </div>
        </div>
      ))}
    </div>
  );
}
