import React from 'react';
import BudgetChart from './BudgetChart';

export default function ItineraryView({ itinerary }) {
  if (!itinerary) return null;
  return (
    <div>
      <h3>{itinerary.title}</h3>
      <div>
        Điểm đến: {itinerary.destination} | Ngày bắt đầu: {itinerary.startDate}{' '}
        | Số ngày: {itinerary.daysCount}
      </div>
      <BudgetChart costEstimate={itinerary.costEstimate} />
      {itinerary.days?.map((d, i) => (
        <div
          key={i}
          style={{ border: '1px solid #eee', padding: 10, marginTop: 10 }}
        >
          <h4>
            Ngày {i + 1} - {d.date}
          </h4>
          <ul>
            {d.schedule?.map((s, idx) => (
              <li key={idx}>
                {s.time}: {s.activity}{' '}
                {s.estimatedCost ? `- ${s.estimatedCost} VND` : ''}
              </li>
            ))}
          </ul>
          <div>Tổng ngày: {d.dailyCosts?.total || 0} VND</div>
        </div>
      ))}
    </div>
  );
}
