/* eslint-disable */
// Disables eslint warnings for this file

export const displayMap = locations => {
  // Sets the Mapbox access token for making requests to Mapbox services
  mapboxgl.accessToken =
    'pk.eyJ1Ijoiam9uYXNzY2htZWR0bWFubiIsImEiOiJjam54ZmM5N3gwNjAzM3dtZDNxYTVlMnd2In0.ytpI7V7w7cyT1Kq5rT9Z1A';

  // Creates a new Mapbox map object
  var map = new mapboxgl.Map({
    container: 'map', // Specifies the HTML element that will contain the map
    style: 'mapbox://styles/jonasschmedtmann/cjvi9q8jd04mi1cpgmg7ev3dy', // Specifies the map style
    scrollZoom: false // Disables scroll zooming on the map
    // center: [-118.113491, 34.111745], // Optionally sets the initial center coordinates of the map
    // zoom: 10, // Optionally sets the initial zoom level of the map
    // interactive: false // Optionally disables interactivity with the map
  });

  // Creates a new LatLngBounds object to store the geographical bounds of the map
  const bounds = new mapboxgl.LngLatBounds();

  // Iterates over each location in the 'locations' array
  locations.forEach(loc => {
    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker'; // Assigns a CSS class to the marker element

    // Add marker to the map
    new mapboxgl.Marker({
      element: el, // Specifies the DOM element to use as the marker
      anchor: 'bottom' // Specifies the position of the marker relative to its center
    })
      .setLngLat(loc.coordinates) // Sets the geographical coordinates of the marker
      .addTo(map); // Adds the marker to the map

    // Add popup to the marker
    new mapboxgl.Popup({
      offset: 30 // Specifies the pixel offset of the popup from the marker
    })
      .setLngLat(loc.coordinates) // Sets the geographical coordinates of the popup
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`) // Sets the HTML content of the popup
      .addTo(map); // Adds the popup to the map

    // Extend map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  // Fits the map to the bounds, with padding to ensure markers are fully visible
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
