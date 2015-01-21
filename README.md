Aldeainvisible.net files
==================
####Aldeainvisible.net is a one page website with a sound map using geotagging data.  

It uses:
 - CSS3 Media Queries for adaptive layout.
 - HTML5 WAI-ARIA for progressive enhancement.
 - HTML5 Session history management to minimize network trafic with _"onpopstate"_ event.

All the navigation is done changing the browser-URL without refreshing  
page (HTML5 _"onpopstate"_ event), the page contents are shown with Javascript.  

When the page loads for the first time it accesses [Freesound project API v2](http://www.freesound.org/docs/api/)  
we get a JSON with all sound data (sound titles, descriptions, uri...),  
we use all this stored data for the navigation without refreshing the page.  



__You must__ redirect all requests to the index file wich is in root /  
to do it add the following lines to your .htaccess file in your Apache server:  

> `RewriteEngine On`  
> `RewriteRule ^categoría/([^.]+)\.html$ / [L,QSA]`  
> `RewriteRule ^tag/([^.]+)\.html$ / [L,QSA]`  
> `RewriteRule ^acerca_de.html$ / [L,QSA]`  
> `RewriteRule ^participa.html$ / [L,QSA]`  

With the above all requests to `http://www.example.com/tags/WHATEVER.html`  
or `http://www.example.com/categoría/WHATEVER.html` will end up  
in index.html although they will have WHATEVER.html in the browser's location   

There are two files sidebar_about.html and sidebar_participa.html that will be loaded in the side bar if requested.

The script will check the location path and will filter the sound  
and markers data to display the selected markers in the map and  
a list of the filtered sounds in the right column.

All the sounds are from the [Freesound project](http://freesound.org)

External libraries: jQuery and jPlayer  
External APIs: Google maps API V3 and Freesound project API v2

It also uses the followong tile map services (TMS): OpenStreetMap, map1eu and komoot.

Licence GNU AGPL see /js/mapas.js.
