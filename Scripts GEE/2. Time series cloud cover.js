//-------------------------------------------------------------------------------------------------------//

// Use of satellite imagery in impact evaluation - Project LIVE in Rwanda
// Author: Romain Fourmy (www.romain-fourmy.eu)

// 2. Time series of cloud cover
// This script analyses the evolution of cloud cover in the region of interest. This data will help us to
// determine the period of reference that we will compare over years.

//-------------------------------------------------------------------------------------------------------//

// 1) Import the region of interest feature collection
var roi = ee.FeatureCollection('users/romainfourmy/LIVE_Villages');
var roi = roi.geometry();
Map.centerObject(roi);
//Map.addLayer(roi, {color: 'red'}, 'roi');

// 2) Import the Sentinel 2 image collection from 2016 to 2020
var sentinel2 = ee.ImageCollection("COPERNICUS/S2")
  .filterBounds(roi)
  .filterDate('2016-01-01', '2021-01-01');
print(sentinel2);

// 3) Print the chart of cloud cover over time
var chart = ui.Chart.feature.byFeature({
    features: sentinel2,
    yProperties: ['CLOUD_COVERAGE_ASSESSMENT']
  })
  .setChartType('LineChart')
  .setOptions({
    title: 'Cloud cover',
    hAxis: {title: 'Date'},
    vAxis: {title: 'Clouds'},
    lineWidth: 1,
    pointSize: 0
  })
print(chart)

// Download the CSV obtained from the chart. This will be used for creating charts in R.
