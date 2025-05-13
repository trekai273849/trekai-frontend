import React from 'react';
import './DayCard.css';

const DayCard = ({ day, title, trailhead, distance, elevation, difficulty, lunchStop, accommodation, tips }) => {
  return (
    <div className="day-card">
      <h2>{`Day ${day}: ${title}`}</h2>
      <ul>
        <li><strong>Trailhead:</strong> {trailhead}</li>
        <li><strong>Distance:</strong> {distance}</li>
        <li><strong>Elevation Gain:</strong> {elevation}</li>
        <li><strong>Difficulty:</strong> {difficulty}</li>
        <li><strong>Lunch Stop:</strong> {lunchStop}</li>
        <li><strong>Accommodation:</strong> {accommodation}</li>
        <li><strong>Tips:</strong> {tips}</li>
      </ul>
    </div>
  );
};

export default DayCard;
