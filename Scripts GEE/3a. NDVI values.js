//-------------------------------------------------------------------------------------------------------//

// Use of satellite imagery in impact evaluation - Project LIVE in Rwanda
// Author: Romain Fourmy (www.romain-fourmy.eu)

// 3a. Extract NDVI values for villages over time
// This script extracts the NDVI values for villages over time. It will allow us to evaluate the NDVI level in 2020
// in comparison to previous years. The same reference period (early June) determined from the maximisation of NDVI and
// minimisation of cloud cover across years. This observation can be done based on the chart in
// "Charts/Outputs/TimeSeries_NDVI_CloudCover_weekly_mean.png"

//-------------------------------------------------------------------------------------------------------//

// 1) Import the region of interest feature collection
var roi_villages = ee.FeatureCollection('users/romainfourmy/LIVE_Villages');
var roi = roi_villages.geometry()
Map.centerObject(roi);
//Map.addLayer(roi_villages, {color: 'red'}, 'roi');

// 2) Import the land use image (from http://geoportal.rcmrd.org/layers/servir%3Arwanda_sentinel2_lulc2016)
var landuse_S2 = ee.Image('users/romainfourmy/Rwanda_LandUse_Sentinel2');
var palette = [
  '000000', // (0) no data
  '00A000', // (1) trees cover areas
  '966400', // (2) scrubs cover areas
  'FFB400', // (3) grass land
  'FFFF64', // (4) cropland
  '00DC82', // (5) vegetation aquatic or regularly flooded
  'FFEBAF', // (6) lichen mosses/ sparse vegetation
  'FFF5D7', // (7) bare areas
  'C31400', // (8) built up areas
  'FFFFFF', // (9) snow and/or ice
  '0046C8'  // (10) open water
];
//Map.addLayer(landuse_S2, {min:0, max: 10, palette: palette},'Land Cover S2');

// 3) Clip the land use image in the region of interest feature
var roi_landuse = landuse_S2.clip(roi);
//Map.addLayer(roi_landuse, {min:0, max: 10, palette: palette},'roi_landuse');

// 4) Filter the clipped image for crop lands only
var roi_landuse_crop = ee.Image(0);
roi_landuse_crop = roi_landuse_crop.where(roi_landuse.eq(4),1);
roi_landuse_crop = roi_landuse_crop.mask(roi_landuse_crop);
//Map.addLayer(roi_landuse_crop, {min:1, max: 1, palette: ['008000']}, 'roi_landuse_crop');

// 5) Convert the clipped image for crops to vector
var crop_vector = roi_landuse_crop.addBands(roi_landuse).reduceToVectors({
  geometry: roi,
  crs: roi.projection(),
  scale: 10,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'zone',
  reducer: ee.Reducer.mean()
});
//Map.addLayer(crop_vector, {color: 'blue'}, 'crop_vector');

// 6) Load the Sentinel 2 images and apply cloud mask

/**
 * Function to mask clouds using the Sentinel-2 QA band
 * @param {ee.Image} image Sentinel-2 image
 * @return {ee.Image} cloud masked Sentinel-2 image
 */
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

// Load Sentinel-2 TOA reflectance data.
var dataset = ee.ImageCollection('COPERNICUS/S2')
                  .filterBounds(roi)
                  .filter(ee.Filter.or(
                         ee.Filter.date('2016-06-11', '2016-06-13'),
                         ee.Filter.date('2017-06-06', '2017-06-08'),
                         ee.Filter.date('2018-06-11', '2018-06-13'),
                         ee.Filter.date('2019-06-11', '2019-06-13'),
                         ee.Filter.date('2020-06-05', '2020-06-07')))
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds);

// To obtain more precise results, atmospheric correction of L1C Sentinel 2 images should be applied.
// For simplicity, this step is skipped. This should not strongly bias the results (https://forum.step.esa.int/t/sentinel-2-level-1c-use-for-ndvi/10661/1).

// Set the NDVI calculation function
var addNDVI = function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
};

// Apply the NDVI function to dataset
var S2_NDVI = dataset.map(addNDVI);

// Set NDVI visualisation parameters
var NDVIpalette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901', '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01', '012E01', '011D01', '011301'];
//Map.addLayer(S2_NDVI.select('NDVI'), {palette: NDVIpalette}, 'Recent Sentinel NDVI');


// 7) Clip the NDVI  the crop vector
var roi_NDVI_crop = S2_NDVI.select('NDVI').map(function(image){return image.clip(crop_vector)});
Map.addLayer(roi_NDVI_crop, {palette: NDVIpalette}, 'roi_NDVI_crop');

// 8) Calculate zonal statistics for villages
var reduced = roi_NDVI_crop.select('NDVI').map(function(image){
  return image.reduceRegions({
    collection:roi_villages,
    reducer:ee.Reducer.mean(),
    scale: 10
  });
});
var table = reduced.flatten();

// 9) Export the table as .csv to Drive
Export.table.toDrive({
  collection: table,
  description: 'NDVI_S2',
  fileFormat: 'CSV'
});

// Download the CSV.
