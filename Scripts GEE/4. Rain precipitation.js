//-------------------------------------------------------------------------------------------------------//

// Use of satellite imagery in impact evaluation - Project LIVE in Rwanda
// Author: Romain Fourmy (www.romain-fourmy.eu)

// 4. Rain precipitation
// This script calculates the rain precipitation (monthly basis) for the villages in the region of interest. This variable can
// help us to understand whether precipitations influence the differences in NDVI across villages.

//-------------------------------------------------------------------------------------------------------//

// 1) Import the region of interest feature collection
var roi_villages = ee.FeatureCollection('users/romainfourmy/LIVE_Villages');
Map.centerObject(roi_villages);
//Map.addLayer(roi_villages, {color: 'red'}, 'roi_villages');

// 2) Compute the montlhly precipitation (mm)

// Set years and month of interest
var startYear = 2016;
var endYear = 2021;
var years = ee.List.sequence(startYear, endYear);
var months = ee.List.sequence(1,12);

// Load the image collection
var Daily = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY");

// Loop over the years and months to get sum of monthly images
var byMonth = ee.ImageCollection(ee.FeatureCollection(years.map(function(y){
  var yearCollection = Daily.filter(ee.Filter.calendarRange(y, y, 'year'));
  var byYear = ee.ImageCollection.fromImages(
    months.map(function(m) {
      var summedImage = yearCollection.filter(ee.Filter.calendarRange(m, m, 'month'))
                  .reduce(ee.Reducer.sum());
      var date = ee.Date.fromYMD(y, m, 1).format("MM_dd_YYYY");
      return summedImage.set('system:time_start', ee.Date.fromYMD(y, m, 1)).rename(date);
      //.set('month', m).set('year', y); // eventually set year and month
  }));
  return byYear;
})).flatten());

var outputMonthly = byMonth.filter(ee.Filter.listContains('system:band_names', 'constant').not())
                    .sort('system:time_start').toBands();
//print(outputMonthly);

// 3) Compute the zonal statistics for villages
var features = outputMonthly.reduceRegions(roi_villages, ee.Reducer.first(), 30);
print(features);

// 4) Export the table as .csv to Drive
Export.table.toDrive({
  collection: features,
  description: 'Rainfall',
  fileFormat: 'CSV'
});
