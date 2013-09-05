The Natural Earth [Gray Earth](http://www.naturalearthdata.com/downloads/10m-raster-data/10m-gray-earth/) raster data set, reprojected to the [U.S. National Atlas projection](http://spatialreference.org/ref/epsg/2163/) (a rotated Lambert [azimuthal equal-area](http://bl.ocks.org/mbostock/3757101) projection) via [gdalwarp](http://www.gdal.org/gdalwarp.html).

```bash
gdalwarp \
  -r lanczos \
  -ts 960 0 \
  -t_srs EPSG:2163 \
  -te -2100000 -2200000 2600000 750000 \
  GRAY_HR_SR_OB_DR.tif \
  shaded-relief.tiff
```
