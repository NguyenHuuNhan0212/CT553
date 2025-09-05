import React, { useState } from 'react';
import PlannerForm from '../components/PlannerForm';
import ItineraryView from '../components/ItineraryView';
export default function Planner() {
  const [itinerary, setItinerary] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <h2>Tạo Lịch Trình</h2>
      <PlannerForm onResult={setItinerary} />
      {itinerary && <ItineraryView itinerary={itinerary} />}
    </div>
  );
}
