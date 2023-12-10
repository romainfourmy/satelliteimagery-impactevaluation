# ------------------------------------------------------------------------------
# Use satellite imagery in impact evaluation - Project LIVE in Rwanda
# Author: Romain Fourmy (www.romain-fourmy.eu)

# -- Data cleaning --

# This script cleans the data exported from Google Earth Engine. All the datasets exported
# are cleaned and merged together in a single dataset (df_ndvi_cov.csv).

# ------------------------------------------------------------------------------
library(reshape2)
library(dplyr)

### 1. NDVI
# import file
df_ndvi <- read.csv("Data/Source files/NDVI_S2.csv")

# keep relevant columns only
df_ndvi <- df_ndvi[c(1:12)]

# merge with the cloud cover dataframe
df_cloud <- read.csv("Data/Source files/TimeSeries_CloudCover_yearly.csv")
df_cloud$ref <- substr(df_cloud$system.index, 15, 52)
df_ndvi$ref <- substr(df_ndvi$system.index, 1, 38)
df_ndvi <- merge(df_ndvi, df_cloud, by.x = "ref", by.y = "ref", all.x = TRUE)

# create year column
df_ndvi$Year <- substr(df_ndvi$ref, 1,4)

# scale down the dataset to one observation per year for each village
df_ndvi$date <- substr(df_ndvi$ref, 1, 8)
df_ndvi$image_side <- substr(df_ndvi$ref, 36, 39)

# compute the mean per image
df_ndvi <- df_ndvi %>% 
  group_by(.dots=c("Village_ID", "ref")) %>% 
  mutate(avg=mean(mean, na.rm=T)) 
# compute the max average per year
df_ndvi <- df_ndvi %>% 
  group_by(.dots=c("Village_ID", "Year")) %>% 
  filter(any(complete.cases(avg))) %>%
  mutate(ndvi = max(avg, na.rm = TRUE))
# keep the maximum value per village
df_ndvi <- df_ndvi %>% 
  group_by(.dots=c("Village_ID","Year")) %>% 
  slice(which.max(ndvi))
# clean NA values
df_ndvi$ndvi[df_ndvi$ndvi=="-Inf"] <- NA

# keep relevant columns and column cleaning
df_ndvi <- df_ndvi[c(3:20)]
df_ndvi <- subset(df_ndvi, select=-c(mean,system.index.y,date,image_side,avg))
names(df_ndvi)[names(df_ndvi) == "CLOUD_COVERAGE_ASSESSMENT"] <- "cloud"

# save as csv
#write.csv(df_ndvi, "Data/df_ndvi.csv")

### 2. Rainfall
# import file
df_rain <- read.csv("Data/Source files/Rainfall.csv")
# note: the estimates are calculated in mm/day
# keep relevant columns only
df_rain <- df_rain[c(2:72)]

# compute sum of rain over March to June (incl.)
df_rain$rain_2016 <- df_rain$X0_2_03_01_2016
df_rain$rain_2017 <- df_rain$X1_2_03_01_2017
df_rain$rain_2018 <- df_rain$X2_2_03_01_2018
df_rain$rain_2019 <- df_rain$X3_2_03_01_2019
df_rain$rain_2020 <- df_rain$X4_2_03_01_2020

# keep relevant columns only
df_rain <- df_rain[c(62:76)]

# melt the dataframe to convert to long format
df_rain <- melt(df_rain, id=c(1:10))
df_rain$Year <- substr(df_rain$variable, 6,9)
df_rain <- subset(df_rain, select=-c(variable))
names(df_rain)[names(df_rain) == "value"] <- "rain"

# save csv 
#write.csv(df_rain, "Data/df_rain.csv")

### 3. Impact evaluation programme intervention information
# this file gives the information on the treatment of villages: 1 being for treated villages, 0 for control villages

# import file
df_treat <- read.csv("Data/Source files/villages_treatment.csv")

# keep relevant columns only
df_treat <- df_treat[c(8:9)]


### 4.  Merge all datasets together
df_ndvi_cov <- merge(df_treat, df_ndvi, by.x = "ID_Village_SHP", by.y="Village_ID", all.x = T, all.y = T)

df_rain_merge <- df_rain %>% dplyr:: select("rain", "Year", "Village_ID")
df_ndvi_cov <- merge(df_ndvi_cov, df_rain_merge, by.x = c("ID_Village_SHP", "Year"), by.y= c("Village_ID", "Year"), all.x = T, all.y = T)

# save csv
write.csv(df_ndvi_cov, "Data/df_ndvi_cov.csv")
