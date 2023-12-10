# Use of satellite imagery in impact evaluation - Project LIVE in Rwanda
## About the project
In impact evaluation, collecting data on the field through household surveys is often an essential process to assess the effects of an intervention.
Unfortunately, COVID-19 has introduced constraints in collecting data on the field. However, the use of satellite images has emerged over the last years, which can help to provide some insights from what is happening on the ground. This technique has revealed to be powerful in calculating proxies for some development indicators.

This project puts into practice the use of satellite imagery in an ongoing impact evaluation. This project looks at monitoring the evolution of a intervention's outcomes after the COVID-19 outbreak. Concerning the intervention studied, it has been implemented in rural Rwanda and aims to improve the well-being of vulnerable households, through support in agriculture and livestock production, as well as human development.

Although this project is based on common practices in the field of remote sensing, it remains exploratory and open to any feedback and comments.  

### Problem statement
- As it was impossible to collect data on the field during 2020, what happened to the intervention's outcomes in 2020?

### Objective
- Since agriculture is a strong factor to the intervention's objectives, we try to use satellite images to capture the agricultural outputs. This could then give us some insights about what happened on the ground in 2020.

### Methodology
- The methodology is based on the use of the [Normalized Vegetation Difference Index (NDVI)](https://gisgeography.com/ndvi-normalized-difference-vegetation-index/) that can be calculated from the satellite images.
- We calculate the NDVI for both beneficiary and control villages over time. This calculation is limited to crop areas, which can be determined based on a land use dataset.

## Slideshow
A slideshow presenting the project (introduction, methodology, results, extra analyses) is available through the following [link](https://netorgft11858548-my.sharepoint.com/:p:/g/personal/romain_fourmy_geo4eyes_com/ERuzsWL03fdDtn2hQOyQrJkBCge6HyLFmdeB8V01A7JhzQ?e=Zm84O0).

## Tools
- **Google Earth Engine**: is used to extract all the data from satellite images.
- **R**: is used to clean and plot the data, as well as running some econometrical analyses.
- **QGIS** (or other GIS softwares): is used to create some maps, by processing satellite images extracted from Google Earth Engine.

## Structure of the repository
The steps of this project are structured as follows: (1) data extraction of satellite images using Google Earth Engine; (2) cleaning of the extracted data using R; (3) data visualisation and analysis using R.

### Scripts GEE
This folder contains all the scripts used to extract the data from satellite images in Google Earth Engine (GEE). The data is extracted for our region of interest (villages where the programme has been implemented). This shapefile of our region of interest is available under the "Shapefiles" folder, that you need to import in GEE. Other sources of data not available through the GEE Data Catalog are made available under the "Rasters" folder, that you will also need to import in GEE.
### Data
This folder contains the data extracted from the scripts in "Scripts GEE". Each dataset exported from GEE is available in the "Source files" folder. The datasets are then cleaned using the "DataCleaning.R" f as Feel free to use the code for your own region of interest.ile, which produces the cleaned dataset "df_ndvi_cov.csv". 
### Charts
The folder contains all the charts created from the data cleaned. The code for plotting these charts can be found in "Charts.R", and the charts are saved in "Outputs". Our main chart of interest is "NDVI_bygroup.png", which compares the evolution of NDVI over time between the treated and control villages. Other charts are produced to understand whether external factors could help understanding the differences in NDVI between the two groups.
### Maps
This folder contains the NDVI maps that are extracted from GEE for our region of interest. These maps are under the .tif format and  can be imported in QGIS (or other GIS softwares) to process them. For example, some maps have been created under "Outputs PNG" to illustrate the methodology used to compare the evolution of NDVI in the context of the impact evaluation.

## Keywords
*Satellite imagery; remote sensing; impact evaluation; agriculture;Rwanda*

## Contact
Romain Fourmy - [Website](www.romain-fourmy.eu)
