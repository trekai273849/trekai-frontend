// js/components/routeMap.js
// No import needed - Leaflet is loaded globally via CDN

export class RouteMapManager {
  constructor() {
    this.map = null;
    this.markers = [];
  }

  async initializeMap(container, trekData) {
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded. Make sure to include Leaflet CDN in your HTML.');
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
          <p>Unable to load map. Please refresh the page.</p>
        </div>
      `;
      return;
    }

    try {
      // Clear loading spinner
      container.innerHTML = '';
      
      // Initialize Leaflet map using the global L variable
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
    } catch (error) {
      console.error('Error initializing map:', error);
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
          <p>Error loading map. Please try again.</p>
        </div>
      `;
    }
  }

  async createApproximateMap(trekData) {
    // Extract location data from itinerary
    const waypoints = await this.extractWaypoints(trekData);
    
    if (waypoints.length > 0) {
      // Add markers for each day's start/end
      waypoints.forEach((point, index) => {
        if (point.lat && point.lng) {
          const marker = L.marker([point.lat, point.lng])
            .addTo(this.map)
            .bindPopup(`
              <div style="text-align: center;">
                <strong>Day ${point.day}</strong><br>
                ${point.name}
              </div>
            `);
          this.markers.push(marker);
        }
      });

      // Only fit bounds if we have markers
      if (this.markers.length > 0) {
        const group = new L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
        
        // Connect markers with a dotted line to show approximate route
        if (this.markers.length > 1) {
          const latlngs = this.markers.map(marker => marker.getLatLng());
          const polyline = L.polyline(latlngs, {
            color: '#ff6b6b',
            weight: 3,
            opacity: 0.6,
            dashArray: '10, 10',
            className: 'approximate-route'
          }).addTo(this.map);
        }
      }
      
      // Add disclaimer overlay
      this.addDisclaimerOverlay();
    } else {
      // Show region-level map
      await this.showRegionMap(trekData.location);
    }
  }

  async extractWaypoints(trekData) {
    const waypoints = [];
    const processedLocations = new Set(); // Avoid duplicate geocoding
    
    // Parse day information for location names
    if (trekData.days && trekData.days.length > 0) {
      for (const day of trekData.days) {
        // Extract unique locations from each day
        const locations = [];
        
        if (day.start && !processedLocations.has(day.start)) {
          locations.push({ name: day.start, type: 'start', day: day.dayNum });
          processedLocations.add(day.start);
        }
        
        if (day.end && !processedLocations.has(day.end)) {
          locations.push({ name: day.end, type: 'end', day: day.dayNum });
          processedLocations.add(day.end);
        }
        
        // Geocode each location
        for (const loc of locations) {
          const coords = await this.geocodeLocation(loc.name);
          if (coords) {
            waypoints.push({
              ...loc,
              lat: coords.lat,
              lng: coords.lng
            });
          }
        }
      }
    }
    
    return waypoints;
  }

  addDisclaimerOverlay() {
    const disclaimer = L.control({position: 'bottomleft'});
    
    disclaimer.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'map-disclaimer');
      div.innerHTML = `
        <div style="background: rgba(255,255,255,0.95); padding: 12px; border-radius: 8px; max-width: 300px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">
            <strong style="color: #ff6b6b;">⚠️ Important:</strong> This map shows approximate locations only. 
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
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        radius: 50000, // 50km radius
        weight: 2
      }).addTo(this.map)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>General area</strong><br>
            ${location}
          </div>
        `);
      
      // Add a marker at the center
      L.marker([coords.lat, coords.lng])
        .addTo(this.map)
        .bindPopup(`<strong>${location}</strong>`);
    } else {
      // If geocoding fails, show a world view
      this.map.setView([0, 0], 2);
      
      // Show message
      const messageControl = L.control({position: 'topright'});
      messageControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'map-message');
        div.innerHTML = `
          <div style="background: rgba(255,255,255,0.9); padding: 10px; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Unable to locate "${location}".<br>
              Showing world map.
            </p>
          </div>
        `;
        return div;
      };
      messageControl.addTo(this.map);
    }
    
    this.addDisclaimerOverlay();
  }

  async geocodeLocation(location) {
    // Clean the location string
    const cleanLocation = location.trim();
    
    // Skip geocoding for generic terms
    if (!cleanLocation || cleanLocation.toLowerCase() === 'not applicable' || 
        cleanLocation.toLowerCase() === 'n/a' || cleanLocation.length < 3) {
      return null;
    }
    
    // Use Nominatim API with better error handling
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanLocation)}&limit=1`,
        {
          headers: {
            'User-Agent': 'SmartTrails/1.0' // Good practice for Nominatim
          }
        }
      );
      
      if (!response.ok) {
        console.warn(`Geocoding failed for "${cleanLocation}": ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
    } catch (error) {
      console.error('Geocoding error for location:', cleanLocation, error);
    }
    
    return null;
  }

  // Method to load accurate GPX routes for popular treks (future enhancement)
  async loadAccurateRoute(gpxFile) {
    try {
      // This would load and parse a GPX file
      console.log('Loading GPX file:', gpxFile);
      // Implementation would go here when you have GPX data
      
      // For now, fall back to approximate map
      await this.createApproximateMap(trekData);
    } catch (error) {
      console.error('Error loading GPX:', error);
      await this.createApproximateMap(trekData);
    }
  }

  // Cleanup method
  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = [];
    }
  }
}