//-------------------------------------------------------------------------------------------------------//

// Use of satellite imagery in impact evaluation - Project LIVE in Rwanda
// Author: Romain Fourmy (www.romain-fourmy.eu)

// 1. Time series of NDVI
// This script analyses the evolution of NDVI within crop areas in the region of interest. This data will help us to
// determine the period of reference that we will compare over years.

//-------------------------------------------------------------------------------------------------------//

// 1) Import the region of interest feature collection
var roi = ee.FeatureCollection('users/romainfourmy/LIVE_Villages');
var roi = roi.geometry();
Map.centerObject(roi);
//Map.addLayer(roi, {color: 'red'}, 'roi');

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
  scale: 9,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'zone',
  reducer: ee.Reducer.mean()
});
//Map.addLayer(crop_vector, {color: 'blue'}, 'crop_vector');

// 6) Load the MODIS vegetation indices data and subset years 2016 to 2020.
var vegIndices = ee.ImageCollection('MODIS/006/MOD13A1')
                     .filter(ee.Filter.or(
                         ee.Filter.date('2016-01-01', '2017-01-01'),
                         ee.Filter.date('2017-01-01', '2018-01-01'),
                         ee.Filter.date('2018-01-01', '2019-01-01'),
                         ee.Filter.date('2019-01-01', '2020-01-01'),
                         ee.Filter.date('2020-01-01', '2021-01-01')))
                     .select('NDVI');

// 7) Print the daily NDVI by year chart
var chart = ui.Chart.image
                .doySeriesByYear({
                  imageCollection: vegIndices,
                  bandName: 'NDVI',
                  region: crop_vector,
                  regionReducer: ee.Reducer.mean(),
                  scale: 500,
                  sameDayReducer: ee.Reducer.mean(),
                  startDay: 1,
                  endDay: 365
                })
                .setOptions({
                  title: 'Yearly NDVI Value by Day of Year for Crop',
                  hAxis: {
                    title: 'Day of year',
                    titleTextStyle: {italic: false, bold: true}
                  },
                  vAxis: {
                    title: 'NDVI (x1e4)',
                    titleTextStyle: {italic: false, bold: true}
                  },
                  lineWidth: 5,
                  colors: ['FF9999', 'FFCC99', 'FFFF99', 'CCFF99', '99FF99'],
                });
print(chart);
// Download the CSV obtained from the chart. This will be used for creating more charts in R.

// 8) Print the average daily NDVI chart
var chart2 =
    ui.Chart.image
        .doySeries({
          imageCollection: vegIndices,
          region: crop_vector,
          regionReducer: ee.Reducer.mean(),
          scale: 500,
          yearReducer: ee.Reducer.mean(),
          startDay: 1,
          endDay: 365
        })
        .setSeriesNames(['NDVI'])
        .setOptions({
          title: 'Average NDVI by Day of Year for Crop',
          hAxis: {
            title: 'Day of year',
            titleTextStyle: {italic: false, bold: true}
          },
          vAxis: {
            title: 'NDVI (x1e4)',
            titleTextStyle: {italic: false, bold: true}
          },
          lineWidth: 5,
          colors: ['e37d05'],
        });
print(chart2);

// Download the CSV obtained from the chart. This will be used for creating charts in R.
