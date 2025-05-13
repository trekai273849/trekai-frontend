import React from 'react';
import DayCard from './DayCard';

const Itinerary = ({ itineraryData }) => {
  return (
    <div>
      {itineraryData.map((day, index) => (
        <DayCard
          key={index}
          day={index + 1}
          title={day.title}
          trailhead={day.trailhead}
          distance={day.distance}
          elevation={day.elevation}
          difficulty={day.difficulty}
          lunchStop={day.lunchStop}
          accommodation={day.accommodation}
          tips={day.tips}
        />
      ))}
    </div>
  );
};

export default Itinerary;
