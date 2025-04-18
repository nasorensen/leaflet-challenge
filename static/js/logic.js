// Create the 'basemap' tile layer that will be the background of our map.
let street = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 20
});

let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  maxZoom: 20
});

let satellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
  maxZoom: 20,
  subdomains:['mt0','mt1','mt2','mt3']
});


// Then add the 'basemap' tile layer to the map.
let baseMaps = {
  "Satellite": satellite,
  "Grayscale": street,
  "Outdoors": topo
};

let earthquakes_data = new L.LayerGroup();
let plates = new L.LayerGroup();

let overlayMaps = {
  "Earthquakes": earthquakes_data,
  "Fault Lines": plates,
};

let myMap = L.map("map", {
  center: [37.09, -95.71],
  zoom: 3,
  layers: [satellite, earthquakes_data, plates]
});

L.control.layers(baseMaps, overlayMaps, {
  collapsed: false
}).addTo(myMap);


// Make a request that retrieves the earthquake geoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

  // This function returns the style data for each of the earthquakes we plot on
  // the map. Pass the magnitude and depth of the earthquake into two separate functions
  // to calculate the color and radius.
  function styleInfo(feature) {
    return {
      color: "black",
      radius: getRadius(feature.properties.mag),
      fillColor: getColor(feature.geometry.coordinates[2]),
      fillOpacity: 1,
      weight: 0.5
    }
  }

  // This function determines the color of the marker based on the depth of the earthquake.
  function getColor(depth) {
    let color = "";
    if (depth >= -10 && depth <= 10) {
      return color = "#98ee00";
    }
    else if (depth > 10 && depth <= 30){
      return color = "#d4ee00";
    }
    else if (depth > 30 && depth <= 50){
      return color = "#eecc00"; 
    }
    else if (depth > 50 && depth <= 70){
      return color =  "#ee9c00";
    }
    else if (depth > 70 && depth <= 90){
      return color = "#ea822c";
    }
    else if (depth > 90){
      return color = "#ea2c2c";
    }
    else {
      return color = "black";
    }
  }

  // This function determines the radius of the earthquake marker based on its magnitude.
  function getRadius(magnitude) {
    return magnitude * 5;
  }

  // Add a GeoJSON layer to the map once the file is loaded.
  L.geoJson(data, {
    // Turn each feature into a circleMarker on the map.
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng).bindPopup(feature.id);
    },
    // Set the style for each circleMarker using our styleInfo function.
    style: styleInfo,
    // Create a popup for each marker to display the magnitude and location of the earthquake after the marker has been created and styled
    onEachFeature: function (feature, layer) {
      layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
    }
  // OPTIONAL: Step 2
  // Add the data to the earthquake layer instead of directly to the map.
  }).addTo(earthquakes_data);
  earthquakes_data.addTo(myMap);

  // Create a legend control object.
  let legend = L.control({
    position: "bottomright"
  });

  // Then add all the details for the legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    // Initialize depth intervals and colors for the legend
    let depth = [-10, 10, 30, 50, 70, 90];

    // Loop through our depth intervals to generate a label with a colored square for each interval.
    for (let i=0; i < depth.length; i++){
      div.innerHTML +=
      '<i style = "background:'  + getColor(depth[i] + 1) + '"></i> ' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
    };

    return div;
  };

  // Finally, add the legend to the map.
  legend.addTo(myMap);

  // OPTIONAL: Step 2
  // Make a request to get our Tectonic Plate geoJSON data.
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plate_data) {
    // Save the geoJSON data, along with style information, to the tectonic_plates layer.
    L.geoJson(plate_data, {
      color: "orange",
      weight: 3
    }).addTo(plates);
    plates.addTo(myMap);
    // Then add the tectonic_plates layer to the map.

  });
});
