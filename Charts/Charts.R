# ------------------------------------------------------------------------------
# Use satellite imagery in impact evaluation - Project LIVE in Rwanda
# Author: Romain Fourmy (www.romain-fourmy.eu)

# -- Data analysis --

# This script creates charts for NDVI and precipitaiton obtained from GEE. 
# First, this scripts creates times series (weekly) charts for the NDVI (MODIS) and cloud cover, which will help to determine our reference period for NDVI across years. 
# It uses the data obtained from: "Scripts GEE/1. Time series NDVI.js" and "Scripts GEE/2. Time series cloud cover.js" (downloaded in .csv, as mentioned at the end of the code)
# Second, this scripts creates times series (yearly) charts of the NDVI (Sentinel 2) and other covariates. 
# It uses the data obtained all the other scripts, which were then cleaned to obtain the file: "Data/df_ndvi_cov.csv".

# ------------------------------------------------------------------------------
library(ggplot2)
library(reshape2)
library(tidyr)
library(dplyr)
library(lubridate)
library(stringr)
options(scipen = 999)

#### I. Times series (weekly) for NDVI (MODIS) and cloud cover

### clean the NDVI and cloud cover datasets
## NDVI data cleaning
# import the NDVI dataset
df_ndvi_year <- read.csv("Data/Source files/TimeSeries_NDVI_yearly.csv")

# clean the date column
df_ndvi_year$date <- as.Date(df_ndvi_year$doy, origin = "2016-01-01")

# clean the NDVI columns 
for(i in 2:6) {      
  df_ndvi_year[ , i] <- gsub(",", "", df_ndvi_year[ , i]) # to remove the commas for thousands
  df_ndvi_year[ , i] <- as.numeric(df_ndvi_year[ , i]) # to convert as numeric
  df_ndvi_year[ , i] <- (df_ndvi_year[ , i])*0.0001 # to bring it to standard scale [-1,1]
}

# melt the dataframe to obtain long format
df_ndvi_year_melt <- melt(df_ndvi_year, id=c("date","doy")) 

## cloud cover data cleaning
# import the cloud cover dataset
df_cloud_year <- read.csv("Data/Source files/TimeSeries_CloudCover_yearly.csv")

# clean date column
df_cloud_year$date <- substr(df_cloud_year$system.index, 15,22)
df_cloud_year$date <- as.Date(as.character(df_cloud_year$date), "%Y%m%d")

### plot the NDVI and cloud cover weekly average
# calculate the weekly average for ndvi
df_ndvi_cloud <- df_ndvi_year_melt %>% 
  group_by(week = week(date)) %>%
  mutate(NDVI.wk.average = mean(value))  
# keep unique rows only
df_ndvi_cloud <- df_ndvi_cloud %>% 
  distinct(week, .keep_all = TRUE)

# calculate the weekly average for cloud
df_cloud_week <- df_cloud_year %>% 
  group_by(week = week(date)) %>%
  mutate(Cloud.wk.average = mean(CLOUD_COVERAGE_ASSESSMENT))
# keep unique rows only
df_cloud_week <- df_cloud_week %>% 
  distinct(week, .keep_all = TRUE)

# merge the NDVI and cloud cover datasets
df_ndvi_cloud <- merge(df_ndvi_cloud, df_cloud_week, by="week", all.x=TRUE, all.y=FALSE )

# rescale cloud cover to NDVI
df_ndvi_cloud$Cloud.wk.average <- (df_ndvi_cloud$Cloud.wk.average)/100

# keep relevant columns only and change name
df_ndvi_cloud <- df_ndvi_cloud[c("date.x", "NDVI.wk.average", "Cloud.wk.average")]
names(df_ndvi_cloud)[2] <- "NDVI"
names(df_ndvi_cloud)[3] <- "Cloud cover"
df_ndvi_cloud <- melt(df_ndvi_cloud, id="date.x")

# plot the data
png(file="Charts/Outputs/TimeSeries_NDVI_CloudCover_weekly_mean.png", units ="in", width=7, height=5, res=300) # to save plot as png

ggplot(df_ndvi_cloud) + 
  geom_line(aes(x= date.x, y = value, colour = variable))+
  scale_y_continuous(sec.axis = sec_axis(~ .*100, name="Cloud coverage (%)"))+
  scale_x_date(date_breaks = "1 month", date_labels = "%b")+
  labs(title = "NDVI and cloud cover over the year (weekly average)",
     subtitle = "from 2016 to 2020",
     caption = "Data source: MODIS & Sentinel 2",
     x = "Date", y="NDVI", colour="")+
  theme(plot.title = element_text(hjust = 0.5), plot.subtitle = element_text(hjust = 0.5), 
        legend.position =  c(0.85, 0.95), legend.background = element_rect(fill=alpha('blue', 0.0)))

dev.off()

### 2. NDVI
# reduce the data to yearly average by group (treatment vs control)
df <- read.csv("Data/df_ndvi_cov.csv")

plot_data_ndvi <- df %>%  
  mutate(treat = factor(ID_BN, labels = c("Control", "Beneficiary")),
         variable = factor(Year, labels = c("2016", "2017","2018","2019","2020"))) %>% 
  group_by(ID_BN, Year) %>%   drop_na(ndvi) %>%
  summarize(mean = mean(ndvi, na.rm=TRUE),
            se_duration = sd(ndvi, na.rm=TRUE) / sqrt(n()),
            upper = mean + (-1.96 * se_duration),
            lower = mean + (1.96 * se_duration), 
            n = n())  %>% 
  drop_na() 
plot_data_ndvi$ID_BN <- as.factor(plot_data_ndvi$ID_BN)
plot_data_ndvi$treat <- ifelse(plot_data_ndvi$ID_BN==1, "Beneficiary","Control")

# plot the data
png(file="Charts/Outputs/NDVI_bygroup.png", units ="in", width=7, height=5, res=300) # to save plot as png
ggplot(plot_data_ndvi, aes(x = Year, y = mean, color = treat)) +
  geom_pointrange(aes(ymin = lower, ymax = upper), size = 0.6) + 
  geom_line(aes(group = treat)) +
  theme(legend.position="bottom", legend.title = element_blank())+
  scale_color_brewer(palette="Dark2")+
  labs(title = "Average NDVI by group",
       subtitle = "from 2016 to 2020",
       caption = "Data source: Sentinel 2",
       x = "Year", y="NDVI", colour="")+ 
  theme(plot.title = element_text(hjust = 0.5), plot.subtitle = element_text(hjust = 0.5), 
        legend.position =  "bottom")
dev.off()


### 3. Rainfall
# reduce the data to yearly average by group (treatment vs control)
plot_data_rain <- df %>%  
  mutate(treat = factor(ID_BN, labels = c("Control", "Beneficiary")),
         variable = factor(Year, labels = c("2016","2017","2018","2019","2020"))) %>% 
  group_by(ID_BN, Year) %>% drop_na(rain) %>% 
  summarize(mean = mean(rain, na.rm=TRUE),
            se_duration = sd(ndvi, na.rm=TRUE) / sqrt(n()),
            upper = mean + (-1.96 * se_duration),
            lower = mean + (1.96 * se_duration),
            n = n()) %>% 
  drop_na() 
plot_data_rain$ID_BN <- as.factor(plot_data_rain$ID_BN)
plot_data_rain$treat <- ifelse(plot_data_rain$ID_BN==1, "Beneficiary","Control")

# plot the data
png(file="Charts/Outputs/Rainfall_bygroup.png", units ="in", width=7, height=5, res=300) # to save the plot as png
ggplot(plot_data_rain, aes(x = Year, y = mean, color = treat)) +
  geom_pointrange(aes(ymin = lower, ymax = upper), size = 1) + 
  geom_line(aes(group = treat))+
  theme(legend.position="bottom", legend.title = element_blank())+
  scale_color_brewer(palette="Dark2")+
  labs(title = "Average rainfall by group",
       subtitle = "from 2016 to 2020 (captured in March)" ,
       caption = "Data source: CHIRPS Daily",
       x = "Year", y="Rainfall (mm)", colour="")+
  theme(plot.title = element_text(hjust = 0.5), plot.subtitle = element_text(hjust = 0.5), 
        legend.position =  "bottom")
dev.off()
  
