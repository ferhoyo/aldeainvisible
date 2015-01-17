/** @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *  
 *   Copyright (C) 2014  aldeainvisible.net
 *
 *   The JavaScript code in this page is free software: you can
 *   redistribute it and/or modify it under the terms of the GNU
 *   Affero General Public License (GNU AGPL) as published by the Free Software
 *   Foundation, either version 3 of the License, or (at your option)
 *   any later version.  The code is distributed WITHOUT ANY WARRANTY;
 *   without even the implied warranty of MERCHANTABILITY or FITNESS
 *   FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you
 *   may distribute non-source (e.g., minimized or compacted) forms of
 *   that code without the copy of the GNU AGPL normally required by
 *   section 4, provided you include this license notice and a URL
 *   through which recipients can access the Corresponding Source.
 *
 *  @licend  The above is the entire license notice
 *  for the JavaScript code in this page.
 * 
 *  mapas.js v0.8.0
 * 
 */

var markers = [];
var markersQuery = [];
var centerLatLong;
var map;
var allCategories = ['artesania', 'naturaleza', 'oficios', 'instrumentos', 'urbano', 'documental-sonoro', 'animales'];
var allTags = [];
var file;
var param;
var tagsForCloud = [];
var sideBarInicio;
var sideBarAbout;
var sideBarParticipa;
var clusterOps = {gridSize: 30, maxZoom: 13, ignoreHidden: true, averageCenter: true};
jQuery(document).ready(function ($) {
    // Finding the url we have and initializing param (e.g: tag, category...) and file (e.g: nature, birds...)
	file = getFile();
	param = getParam();
    
    var element = document.getElementById('mapa');
    centerLatLong = new google.maps.LatLng(40.321035, -4.680108);
    /*
    Build list of map types.
    You can also use var mapTypeIds = ['roadmap', 'satellite', 'hybrid', 'terrain', 'OSM']
    but static lists sucks when google updates the default list of map types.
    */
    var mapTypeIds = ['Komoot', 'Map1.eu', 'OSM'];
    for(var type in google.maps.MapTypeId) {
        mapTypeIds.push(google.maps.MapTypeId[type]);
    }
	
    map = new google.maps.Map(element, {
        center: centerLatLong,
        zoom: 11,
        mapTypeId: 'Komoot',
        mapTypeControlOptions: {
            mapTypeIds: mapTypeIds,
	        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        }
    });
	
    // Create the DIV to hold the control and call the FullScreenControl() constructor
    // passing in this DIV.
    var fsControlDiv = document.createElement('div');
    var fsControl = new FullScreenControl(fsControlDiv, map);
    fsControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(fsControlDiv);

    // create new info window for marker detail pop-up
    infowindow = new google.maps.InfoWindow();

    map.mapTypes.set('OSM', new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return 'http://tile.openstreetmap.org/' + zoom + '/' + coord.x + '/' + coord.y + '.png';
        },
        tileSize: new google.maps.Size(256, 256),
        name: 'OpenStreetMap',
        maxZoom: 18,
        alt: 'Open Street Map'
    }));
    map.mapTypes.set('Komoot', new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return 'http://www.komoot.de/tiles/a/' + zoom + '/' + coord.x + '/' + coord.y + '.png';
        },
        tileSize: new google.maps.Size(256, 256),
        name: 'Komoot OSM',
        maxZoom: 18,
        alt: 'komoot - Cycling and Hiking Maps'
    }));
    map.mapTypes.set('Map1.eu', new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return 'http://beta.map1.eu/tiles/' + zoom + '/' + coord.x + '/' + coord.y + '.jpg';
        },
        tileSize: new google.maps.Size(256, 256),
        name: 'Map1.eu',
        maxZoom: 15,
        alt: 'Mapa de Europa'
    }));    

    $(document).keyup(function(e) {
		if (e.keyCode == 27) { $.jPlayer.pause();infowindow.close();}   // esc
	});  
	
	$('#nav').find('li[data-menu="categorias"]').on('mouseenter', function(){
		//$('#categorias').addClass('subs');
		$('#categorias').addClass('subs');
	});        

    $.getJSON('http://www.freesound.org/apiv2/search/text/?'+
     'filter=geotag:%22Intersects%28-5.138%2040.125%20-4.223%2040.538%29%22&'+
     'fields=id,url,created,name,tags,geotag,description,username,pack,download,previews'+
     '&token=e330f1a7dedaba306af677f43839d216028755bf&'+
     'format=json&'+
     'page_size=150',
     function(json1) {
     	$.each(json1.results, function(key,data){
    		//process returned data
    		var geotag = data.geotag;
    		geotag = geotag.split(' ');
    		var latLng = new google.maps.LatLng(geotag[0],geotag[1]);
    		
  		  	data.description = data.description.replace(/\r\n/g, '<br />');
  		  	
  		  	// Removing tags La-Aldea-Invisible and Spain	
  		  	data.tags = jQuery.grep(data.tags, function(value) {
				return value != 'La-Aldea-Invisible';
			});
  		  	data.tags = jQuery.grep(data.tags, function(value) {
				return value != 'Spain';
			});
  		  	// Making all tags tolowercase
			data.tags = data.tags.map(function (x) {
				return x.toLowerCase();
			});
			
            // Creating a marker and putting it on the map
            var marker = new google.maps.Marker({
				position: latLng,
				title: data.name,
				clickable : true,
				icon: ponPin('fff000'),
				optimized: false
			});
			
			// Adding extra keys to marker in markers array
			marker.soundId = data.id;		
			marker.tags = data.tags;
            marker.autor = data.username;
            markers.push(marker);

            google.maps.event.addListener(marker, 'click', function() {
            	//TODO: do we need this?
           /*     $('.gm-style-iw').next().click();
                infowindow.setContent('Cargando...');
			*/
                // Loading infowindow content for the jplayer
                	// console.time('loadJP');

                infowindowHTML = loadJP(data.tags,data.name,data.username,data.created,data.description,data.id,data.previews['preview-hq-mp3'],data.url);
                // console.timeEnd('loadJP');

                infowindow.setContent( infowindowHTML );
                infowindow.setOptions({maxWidth:280});
                infowindow.soundId  = data.id;
                infowindow.open(map, marker);

            });
                          
            google.maps.event.addListener(infowindow, 'domready', function() {
                $('#jquery_jplayer_' + data.id).jPlayer({
                    ready: function(event) {
                        $(this).jPlayer('setMedia', {
                            title: data.name,
                            mp3: data.previews['preview-hq-mp3']
                         //   ,oga: 'http://guardarcomofilms.net/mapasonidos/audios/' + data.audiourl + '.ogg'
                        }).jPlayer('play');
                    },
                    swfPath: 'http://www.aldeainvisible.net/js',
                    supplied: 'mp3'
                });
            });
            
            google.maps.event.addListener(map, 'click', function(){
				infowindow.close();
			});
            marker.setMap(map);

            // Collecting all the tags from each marker into allTags[].
            llenaAllTags(data.tags);
        });  // end $.each

     	llenaNubeTags(tagsForCloud);
     	
     	 // Filling the categories in the menu for desktop and mobile
        for (var i = 0; i < allCategories.length; i++) { 
			$('#categorias').append('<li><a data-categoria="'+ allCategories[i]  +'" href="http://www.aldeainvisible.net/categoría/'+ allCategories[i] +'.html">' + allCategories[i] + '</a></li>');
			$('#mcategorias').append('<li><a data-categoria="'+ allCategories[i]  +'" href="http://www.aldeainvisible.net/categoría/'+ allCategories[i] +'.html">' + allCategories[i] + '</a></li>');
        }

		markerCluster = new MarkerClusterer(map, markers,clusterOps);
     	sideBarInicio = $('#dcha_content').html();
     	if (param=='categoría'){
            if ( allCategories.indexOf(file) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';}
        	// Adding class `selected` the menu (Desktop and mobile) 
       		$('#categorias a[data-categoria="'+ file +'"],\
				#mcategorias a[data-categoria="'+ file +'"],\
				#nav li[data-menu="categorias"],\
				#mmenu li[data-menu="categorias"] a.hsubs').addClass('selected');
       		
           	muestraCat(file);
            $('#dcha_content').show();
        } else 	if (param=='tag'){
            if ( allTags.indexOf(file) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';}
            // marking selected on tag cloud
            //TODO: do we need it?
            /*
            $('#tagCloud li').each(function(){
            	if ( $(this).attr('data-tag') == file ){
            		$(this).addClass('selected');
            		return false;
            	}
            });
            */
            muestraTag(file);
            $('#dcha_content').show();
        } else {
        	if ( file == '' || file == 'index' && param == '') { // home
	        	$('#nav li[data-menu="inicio"], #mmenu li[data-menu="inicio"] a').addClass('selected');
	        	$('#dcha_content').show();
			} else if ( file == 'acerca_de' ) {
				$('#nav li[data-menu="acerca_de"], #mmenu li[data-menu="acerca_de"] a').addClass('selected');
	        	if(!sideBarAbout){
			    	$.get( 'sidebar_about.html', function( data ) {
			    		sideBarAbout = data;
						$( '#dcha_content' ).html( sideBarAbout );
						$('#dcha_content').show();
					});
				} else {
					$( '#dcha_content' ).html( sideBarAbout );
					$('#dcha_content').show();
				}
				document.title = 'La Aldea Invisible - Acerca de';
			} else if ( file == 'participa' ){
				$('#nav li[data-menu="participa"], #mmenu li[data-menu="participa"] a').addClass('selected');
	        	if(!sideBarParticipa){
			    	$.get( 'sidebar_participa.html', function( data ) {
			    		sideBarParticipa = data;
						$( '#dcha_content' ).html( sideBarParticipa );
						$('#dcha_content').show();
					});
				} else {
					$( '#dcha_content' ).html( sideBarParticipa );
					$('#dcha_content').show();
				}
				document.title = 'La Aldea Invisible - Participa';
			}
        }		
		
	

    }); // END getJSON
    
    //mobime menu
	$('#mmenu').hide();
    $('.mtoggle').click(function() {
        $('#mmenu').fadeToggle(500);
    });
    // Animating the markers
	$('#dcha_content').on('mouseenter', 'ul#soundList li', function(){
		markerId = $(this).attr('data-id');
		markers[markerId].setAnimation(google.maps.Animation.BOUNCE);
	});
	$('#dcha_content').on('mouseleave', 'ul#soundList li', function(){
		markerId = $(this).attr('data-id');
		markers[markerId].setAnimation(null);
	});
	
	// Intercepting clicks in links with href=something.html, changing browser url and displaying page as required.
	$('body').on('click','a[href*=".html"],a[href="/"]',function (e) {
		e.preventDefault();
		
		if ( $('#mmenu').css('display') == 'block' ) $('#mmenu').fadeToggle(500);
		
	  // Detect if pushState is available
		if(history.pushState) {
			history.pushState(null, null, $(this).attr('href'));

			muestraTagoCat();
		} else {
	  		window.location.href = $(this).attr('href');
		}
		return false;
	});

	// Used to detect initial (useless) popstate.
	// If history.state exists, assume browser isn't going to fire initial popstate.
	var popped = ('state' in window.history && window.history.state !== null), initialURL = location.href;

	$(window).bind('popstate', function (event) {
	  // Ignore inital popstate that some browsers fire on page load
		var initialPop = !popped && location.href == initialURL
		popped = true; 
		if (initialPop) return;

		muestraTagoCat();
	});
    // Show infowindow from click on sound list li
    $('#dcha_content').on('click', 'ul#soundList li', function( ){
		var markerId = $(this).attr('data-id');
		google.maps.event.trigger(markers[markerId], 'click');
		
	});
}); // END doc ready

function FullScreenControl(controlDiv, map) {

    // Set CSS styles for the DIV containing the control
    // Setting padding to 5 px will offset the control
    // from the edge of the map.
    controlDiv.style.padding = '5px';

    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#ccc';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '0px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Fullscreen';
    controlUI.style.width = '40px';
    controlUI.style.height = '40px';
    controlUI.style.backgroundImage = 'url("http://www.aldeainvisible.net/iconos/fullscreen.png")';
    controlUI.id = 'fullscreen'
    controlDiv.appendChild(controlUI);

    // Setup the click event listeners: simply set the map to pan to center
    google.maps.event.addDomListener(controlUI, 'click', function() {
        jQuery('#mapa_container').toggleClass('mapa-fullscreen');
	    google.maps.event.trigger(map, 'resize');
	    map.panTo(centerLatLong);
    });
}

function ponPin (color){
    pinImage = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + color,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34)
    );
    return pinImage;
}

function loadJP(infoTags,infoTitulo,infoAutor,infoFecha,infoDescripcion,infoId,infoAudiourl,infoUrl){
	/*
	 * Prepates content of infowindow
	 */
	var tagsHTML = '<li>Tags : ' + listTags(infoTags) + '</li>';
	var date = new Date(infoFecha);
	var day = date.getDate();
	var year = date.getFullYear();
	var month = date.getMonth()+1;
	var dateStr = day+'/'+month+'/'+year;

	$('#fecha').val(dateStr)

    var infoWindowHTML = '<div class="infowindow">'  +
		'<div class="marker type-marker">' +
		'<div class="post-title"><h3>' + infoTitulo +'</h3></div>'  +
    	'<div class="post-content"><hr />'  +
        '<p>Autor: ' + infoAutor + '<br />Fecha: ' +  dateStr + '</p>'  +
        '<p>' + infoDescripcion + ' </p><hr />'  +
        '<div id="jquery_jplayer_' + infoId + '" class="jp-jplayer"></div>'  +
        '<div id="jp_container_1" class="jp-audio">'  +
        '<div class="jp-type-single">'  +
        '<div class="jp-gui jp-interface">'  +
        '<ul class="jp-controls">'  +
        '<li><a href="javascript:\;" class="jp-play" tabindex="1">play</a></li>'  +
        '<li><a href="javascript:\;" class="jp-pause" tabindex="1">pause</a></li>'  +
        '<li><a href="javascript:\;" class="jp-stop" tabindex="1">stop</a></li>'  +
        '<li><a href="javascript:\;" class="jp-mute" tabindex="1" title="mute">mute</a></li>'  +
        '<li><a href="javascript:\;" class="jp-unmute" tabindex="1" title="unmute">unmute</a></li>'  +
        '<li><a href="javascript:\;" class="jp-volume-max" tabindex="1" title="max volume">max volume</a></li>'  +
        '</ul>'  +
        '<div class="jp-progress">'  +
        '<div class="jp-seek-bar">'  +
        '<div class="jp-play-bar"></div>'  +
        '</div>'  +
        '</div>'  +
        '<div class="jp-volume-bar">'  +
        '<div class="jp-volume-bar-value"></div>'  +
        '</div>'  +
        '<div class="jp-current-time"></div>'  +
        '<div class="jp-duration"></div>'  +
        '</div>'  +
        '<div class="jp-no-solution">'  +
        '<span>Update Required</span>'  +
        'To play the media you will need to either update your browser' +
        'to a recent version or update your' + 
        '<a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.'  +
        '</div></div></div>'  +
        '<hr class="clear" />'  +
        '<div class="marker-info">'  +
        '<div id="etiquetas-marker">'  +
        '<ul> ' + tagsHTML + '  </ul>'  +
        '</div>'  +
        '<span class="download-link">' +
        '<a onclick="pauseJPlayer()" tabindex="1" href="' + infoUrl + '" target="_blank">' + 
        'Descargar en freesound.org</a></span>'  +
        '</div>'  +
        '</div>'  +
        '</div>'  +
        '</div>';

	return infoWindowHTML;
}

function llenaAllTags(tagsArr){
	/*
	 * Populate tagsForCloud array with unique array values
	 */
	var len = tagsArr.length;
    for (var i = 0; i < len; i++) {
        //miramos que no este ya en el array
        if (allTags.indexOf( tagsArr[i] ) < 0){
            allTags.push(tagsArr[i])
        }
        tagsForCloud.push(tagsArr[i]);
    }
}
function listTags(tagsArr){
	/*
	 * Populates the tags in the infowindow
	 */
    var tags = '';
    var len = tagsArr.length;
    for (var i = 0; i < len; i++) {
       tags += '<a href="http://www.aldeainvisible.net/tag/'+ tagsArr[i] +'.html">' + tagsArr[i] + '</a> ';
    }
    return tags;
}
function pauseJPlayer(){ $.jPlayer.pause();}
function llenaNubeTags(arr) {
	/*
	 * Populates the tag cloud
	 */
    var  tags = [], frecuencia = [],prev;
    // sort case insensitive
	arr.sort(function (a, b) {
    	return a.toLowerCase().localeCompare(b.toLowerCase());
	});
	var len = arr.length;
    for ( var i = 0; i < len; i++ ) {
        if ( arr[i] !== prev ) {
            tags.push(arr[i]);
            frecuencia.push(1);
        } else {
            frecuencia[frecuencia.length-1]++;
        }
        prev = arr[i];
    }
    console.time('llenaTags');
  
	var arrList = [];
	var tagsLen = tags.length;
	for(var i = 0; i < tagsLen; i++){
		if (frecuencia[i] > 1){
    		arrList[i] = '<li class="freq_'+frecuencia[i]+'" data-tag="'+tags[i]+'">'+
    		  '<a href="http://www.aldeainvisible.net/tag/'+tags[i]+'.html">'+tags[i]+
    		  ' <span>(' +frecuencia[i] + ')</span></a></li> ';
		}
	}
	$('#tagCloud').html(arrList.join(''));
  
   console.timeEnd('llenaTags');
}

function muestraTagoCat(){
	/*
	 * Show tag, category (param) or file depending on url 
	 */
	
	// Getting param and file from url
	param = getParam();
	file = getFile();
	// reload all markers to markerCluster if needed
	if( markers.length != markerCluster.getTotalMarkers() ){
		markerCluster.clearMarkers();
		markerCluster.addMarkers(markers);
	}
	// Clear search box
	$('#query').val('');
	
	// Close infowindow TODO: if any
	infowindow.close();
	
	// Clear class selected in the menu
	$('#mmenu .selected, #nav .selected').removeClass('selected');

    if (param=='categoría'){
        if ( allCategories.indexOf(file) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';} // if category does not existe back to home

		// Marking the menu
		$('#categorias a[data-categoria="'+ file +'"],\
			#mcategorias a[data-categoria="'+ file +'"],\
			#nav li[data-menu="categorias"],\
			#mmenu li[data-menu="categorias"] a.hsubs').addClass('selected');

  		/*
  		 *  Patch for Chrome (the ul#categorias stays after selection of category)
  		 *  Removings class 'subs' we also remove it's hover effect
  		 *  We add it again with mouseenter on li[data-menu="categorias"] 
  		 */
  		$('#categorias').removeClass('subs');
        /* end patch */
       
        muestraCat(file);
        
    } else if (param=='tag'){
        if ( allTags.indexOf(file) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';}
        $('#tagCloud li').each(function(){
        	if ( $(this).attr('data-tag') == file ){
        		$(this).addClass('selected');
        		return false;
        	}
        });
        muestraTag(file);
    } else if (param == ''){  
     	if(file == 'index' || file == ''){ // home
	    	$('#nav li[data-menu="inicio"],#mmenu li[data-menu="inicio"] a').addClass('selected');
	    	mapaAInicio();
	    	$('#dcha_content').html(sideBarInicio);
	    	document.title = 'La Aldea Invisible';	   
    	} else if(file=='acerca_de'){
    		$('#nav li[data-menu="acerca_de"],#mmenu li[data-menu="acerca_de"] a').addClass('selected');
	    	if(!sideBarAbout){
		    	$.get( 'sidebar_about.html', function( data ) {
		    		sideBarAbout = data;
		    		$( '#dcha_content' ).html( sideBarAbout );			
				});
			} else {
				$( '#dcha_content' ).html( sideBarAbout );
			}
			document.title = 'La Aldea Invisible - Acerca de';
			mapaAInicio();
    	} else if(file=='participa'){
    		$('#nav li[data-menu="participa"],#mmenu li[data-menu="participa"] a').addClass('selected');
	    	if(!sideBarParticipa){
		    	$.get( 'sidebar_participa.html', function( data ) {
		    		sideBarParticipa = data;
		    		$( '#dcha_content' ).html( sideBarParticipa );			
				});
			} else {
				$( '#dcha_content' ).html( sideBarParticipa );
			}
			document.title = 'La Aldea Invisible - Participa';
			mapaAInicio();
			
		}
    }
    $( '#dcha_content' ).show();

}

function muestraTag(tag) {
	/*
	 * Shows selected tag
	 */
    var count = 0;
    var sideBar = '<h3>Tag ' + tag +' <span>(__COUNT__)</span><\/h3>' +
                  '<ul id="soundList">';
    var len = markers.length;
    for (var i = 0; i < len; i++) {
        if ( markers[i].tags.indexOf(tag) > -1 ) {
            markers[i].setVisible(true);
            count++;
        	sideBar += '<li data-id="'+ i +'"><a href="javascript:void(0)">' + markers[i].title + '</a><\/li>';
        } else {
            markers[i].setVisible(false);
        }
    }
    sideBar += '</ul>';
    $('#dcha_content').html(sideBar.replace('__COUNT__',count));
    if (markerCluster) {
    	markerCluster.repaint();
	}
	document.title = 'La Aldea Invisible - Tag '+ tag;
}

function muestraCat(category) {
	/*
	 * Shows selected categoty
	 */
    var count = 0;
    var sideBar = '<h3>Categorí­a ' + category +' <span>(__COUNT__)</span><\/h3>' +
    		  '<ul id="soundList">';
    var len = markers.length;
    for (var i = 0; i < len; i++) {
        if ( markers[i].tags.indexOf(category) > -1 ) {
            markers[i].setVisible(true);
            count++;
            sideBar += '<li data-id="'+ i +'"><a href="javascript:void(0)">' + markers[i].title + '</a><\/li>';
        }
        else {
            markers[i].setVisible(false);
        }
    }
    sideBar += '</ul>';
    $('#dcha_content').html(sideBar.replace('__COUNT__', count));
	if (markerCluster) {
    	markerCluster.repaint();
	}
	document.title = 'La Aldea Invisible - Categoría '+ category;
} 


function mapaAInicio(){
	/*
	 * Resets map
	 */
	
	// Making all markers visible
	var len = markers.length;
	for (i = 0; i < len; i++) {
		markers[i].setVisible(true);
	}
	//	Setting initial center and zoom
	map.panTo(centerLatLong);
	map.setZoom(11);
	// Refreshing markercluster
	if (markerCluster) {
		markerCluster.repaint();
	}
	// Clearing the search box
	$('#query').val('');
}

/*
 * Search
 */
function doQuery(){
	/*
	 * Does the query and shows resuts
	 */
	var busqueda = $('#query').val();
	busqueda = busqueda.trim();
	if (busqueda=='') return false;
	infowindow.close();
	// Clear class selected in the menu
	$('#mmenu .selected, #nav .selected').removeClass('selected');
	$.getJSON('http://www.freesound.org/apiv2/search/text/?'+
	  'filter=geotag:%22Intersects%28-5.138%2040.125%20-4.223%2040.538%29%22&'+
	  'fields=id&'+
	  'token=e330f1a7dedaba306af677f43839d216028755bf&'+
	  'format=json&'+
	  'page_size=150&'+
	  'query='+busqueda, 
	  function (json1) {
		//	Resetting map
		markerCluster.clearMarkers();
 		map.panTo(centerLatLong);
		map.setZoom(11);

		var sideBar = '<h3>Resultados búsqueda ' + busqueda + 
		          ' <span> ('+json1.results.length+')</span><\/h3>' +
				  '<ul id="soundList">';
		var len = markers.length;		  
		$.each(json1.results, function (key, data) {
			for (var i = 0; i < len; i++) {
				if (data.id == markers[i].soundId) {
					markers[i].setVisible(true);
			    	markerCluster.addMarker(markers[i]);
			        sideBar += '<li data-id="'+ i +'"><a href="javascript:void(0)">' + markers[i].title + '</a><\/li>';
			        break;          
			    }
			}
		}); // end $.each
		sideBar += '</ul>';
		$('#dcha_content').html(sideBar);
		
	}); // END getJSON
	return false;
}

function getParam(){
	/*
	 * Gets the param (tag or category or "") from url
	 */
	path = decodeURIComponent( decodeURIComponent(location.pathname) );
	pathArr = path.split('/');
    pathArr.pop();
    param = pathArr[pathArr.length -1];
    return param;
}
function getFile(){
	/*
	 * Gets the file (nature or birds or whatever...) from url
	 */
    file = decodeURIComponent( location.pathname.replace(/^.*[\\\/]/, '') );
    file = file.replace('.html','');
    return file;
}