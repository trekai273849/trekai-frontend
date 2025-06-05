// js/components/routeMap.js
import L from 'leaflet';

export class RouteMapManager {
  constructor() {
    this.map = null;
    this.markers = [];
  }

  async initializeMap(container, trekData) {
    // Initialize Leaflet map
    this.map = L.map(container).setView([0, 0], 10);
    
    // Add tile layer (OpenStreetMap or Mapbox)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Determine map type based on trek
    if (trekData.isPopularTrek && trekData.gpxFile) {
      await this.loadAccurateRoute(trekData.gpxFile);
    } else {
      await this.createApproximateMap(trekData);
    }
  }

  async createApproximateMap(trekData) {
    // Extract location data from itinerary
    const waypoints = this.extractWaypoints(trekData);
    
    if (waypoints.length > 0) {
      // Add markers for each day's start/end
      waypoints.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng])
          .addTo(this.map)
          .bindPopup(`Day ${index + 1}: ${point.name}`);
        this.markers.push(marker);
      });

      // Fit map to show all markers
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
      
      // Add disclaimer overlay
      this.addDisclaimerOverlay();
    } else {
      // Show region-level map
      await this.showRegionMap(trekData.location);
    }
  }

  extractWaypoints(trekData) {
    const waypoints = [];
    
    // Parse day information for location names
    trekData.days.forEach((day, index) => {
      if (day.start && day.end) {
        // Use geocoding service to get approximate coordinates
        // This is where you'd integrate with a geocoding API
        waypoints.push({
          name: day.start,
          day: index + 1,
          type: 'start'
        });
      }
    });
    
    return waypoints;
  }

  addDisclaimerOverlay() {
    const disclaimer = L.control({position: 'bottomleft'});
    
    disclaimer.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'map-disclaimer');
      div.innerHTML = `
        <div style="background: rgba(255,255,255,0.9); padding: 10px; border-radius: 5px; max-width: 300px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            <strong>⚠️ Important:</strong> This map shows approximate locations only. 
            Always use official trail maps and GPS devices for navigation. 
            Trail routes may vary based on conditions and local regulations.
          </p>
        </div>
      `;
      return div;
    };
    
    disclaimer.addTo(this.map);
  }

  async showRegionMap(location) {
    // Geocode the general location
    const coords = await this.geocodeLocation(location);
    
    if (coords) {
      this.map.setView([coords.lat, coords.lng], 8);
      
      // Add a circle to show general area
      L.circle([coords.lat, coords.lng], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.2,
        radius: 50000 // 50km radius
      }).addTo(this.map)
        .bindPopup(`General area: ${location}`);
    }
    
    this.addDisclaimerOverlay();
  }

  async geocodeLocation(location) {
    // Use Nominatim or similar service
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }
}