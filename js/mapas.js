var markers = [];
var markersQuery = [];
var markersSelected = [];
var lat_long;
var map;
var allCategories = ["artesania","naturaleza","oficios","instrumentos","urbano","documental-sonoro","animales"];
var allTags = [];
var archivo;
var param;
var tagsDiv = '';
var tagsForCloud = [];
var sideBar;
var sideBarInicio;
var sideBarAbout;
var sideBarParticipa;
var markerCluster;
var clusterOps = {gridSize: 30,maxZoom: 13,ignoreHidden: true,averageCenter:true};
jQuery(document).ready(function($) {
 // sacamos donde estamos y llenamos varialbes archivo y param
    url = parseUri(window.location.href);
    archivo = decodeURIComponent(url.fileName);
    archivo = archivo.replace('.html','');
    path = decodeURIComponent(url.directoryPath);
    pathArr = path.split('/');
    pathArr.pop();
    param = pathArr[pathArr.length -1];

    var element = document.getElementById("mapa");
    lat_long = new google.maps.LatLng(40.321035,-4.680108);
    /*
    Build list of map types.
    You can also use var mapTypeIds = ["roadmap", "satellite", "hybrid", "terrain", "OSM"]
    but static lists sucks when google updates the default list of map types.
    */
    var mapTypeIds = ["Komoot","Map1.eu","OSM"];
    for(var type in google.maps.MapTypeId) {
        mapTypeIds.push(google.maps.MapTypeId[type]);
    }
	
    map = new google.maps.Map(element, {
        center: lat_long,
        zoom: 11,
        mapTypeId: "Komoot",
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

    map.mapTypes.set("OSM", new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
        },
        tileSize: new google.maps.Size(256, 256),
        name: "OpenStreetMap",
        maxZoom: 18,
        alt: "Open Street Map"
    }));
    map.mapTypes.set("Komoot", new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return "http://www.komoot.de/tiles/a/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
            
        },
        tileSize: new google.maps.Size(256, 256),
        name: "Komoot OSM",
        maxZoom: 18,
        alt: "komoot - Cycling and Hiking Maps"
    }));
    map.mapTypes.set("Map1.eu", new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return "http://beta.map1.eu/tiles/" + zoom + "/" + coord.x + "/" + coord.y + ".jpg";
            
        },
        tileSize: new google.maps.Size(256, 256),
        name: "Map1.eu",
        maxZoom: 15,
        alt: "Mapa de Europa"
    }));    

    $(document).keyup(function(e) {
		if (e.keyCode == 27) { infowindow.close(); $.jPlayer.stop();}   // esc
	});  
        

    $.getJSON("http://www.freesound.org/apiv2/search/text/?filter=geotag:%22Intersects%28-5.138%2040.125%20-4.223%2040.538%29%22&fields=id,url,created,name,tags,geotag,description,username,pack,download,previews&token=e330f1a7dedaba306af677f43839d216028755bf&format=json&page_size=150",
     function(json1) {
     	$.each(json1.results, function(key,data){
    		//Do something
    		geotag = data.geotag;
    		geotag = geotag.split(' ');
    		
  		  	data.description = data.description.replace(/\r\n/g, "<br />");
  		  	
  		  	//quitamos tags La-Aldea-Invisible y Spain
  		  	var quitamos1 = "La-Aldea-Invisible";
  		  	var quitamos2 = "Spain";
  		  	
  		  	data.tags = jQuery.grep(data.tags, function(value) {
				return value != quitamos1;
			});
  		  	data.tags = jQuery.grep(data.tags, function(value) {
				return value != quitamos2;
			});
  		  	
    		var latLng = new google.maps.LatLng(geotag[0],geotag[1]); 
            // Creating a marker and putting it on the map

            var marker = new google.maps.Marker({
                position: latLng,
                title: data.name,
                clickable : true,
                icon: ponPin('fff000'),
                optimized: false
           });
			
			marker.soundId = data.id;
            marker.tags = data.tags;
            marker.autor = data.username;
            markers.push(marker);

            google.maps.event.addListener(marker, 'click', function() {
                $('.gm-style-iw').next().click();
                infowindow.setContent('Cargando...');

                // para el jplayer
                contenido = cargaJP(data.tags,data.name,data.username,data.created,data.description,data.id,data.previews['preview-hq-mp3'],data.url);
                infowindow.setContent( contenido );
                infowindow.setOptions({maxWidth:280});
                infowindow.soundId  = data.id;
                infowindow.open(map, marker);

            });
                          
            google.maps.event.addListener(infowindow, 'domready', function() {
                $("#jquery_jplayer_" + data.id).jPlayer({
                    ready: function(event) {
                        $(this).jPlayer("setMedia", {
                            title: data.name,
                            mp3: data.previews['preview-hq-mp3']
                         //   ,oga: "http://guardarcomofilms.net/mapasonidos/audios/" + data.audiourl + ".ogg"
                        }).jPlayer("play");
                    },
                    swfPath: "http://www.aldeainvisible.net/js",
                    supplied: "mp3"
                });
            });
            
            google.maps.event.addListener(map, "click", function(){
				infowindow.close();
			});
            
            marker.setMap(map);
            // guardamos los tags de cada marker para luego filtrarlos para la nube de tags
            llenaAllTags(data.tags);
        });  // end $.each
    		
     	llenaNubeTags(tagsForCloud);
     	
     	 // sacamos las categorias para el menu
        for (i = 0; i < allCategories.length; i++) { 
      	  $('#categorias').append('<li><a title="Ver categorí­a ' + allCategories[i] + '" data-categoria="'+ allCategories[i]  +'" href="http://www.aldeainvisible.net/categoría/'+ allCategories[i] +'.html">' + allCategories[i] + '</a></li>');
     	   $('#mcategorias').append('<li><a title="Ver categorí­a ' + allCategories[i] + '" data-categoria="'+ allCategories[i]  +'" href="http://www.aldeainvisible.net/categoría/'+ allCategories[i] +'.html">' + allCategories[i] + '</a></li>');
        }
		markerCluster = new MarkerClusterer(map, markers,clusterOps);
     	sideBarInicio = $('#dcha_content').html();
     	if (param=='categoría'){
            if ( allCategories.indexOf(archivo) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';}
            $('#categorias li a[data-categoria="'+ archivo +'"]').addClass('sel');
            $('#mcategorias li a[data-categoria="'+ archivo +'"]').addClass('selected');
            $('#nav li[data-menu="categorias"]').addClass('selected');
            $('#mmenu li[data-menu="categorias"] a.hsubs').addClass('selected');
            muestraCat(archivo);
            $('#dcha_content').show();
        } else 	if (param=='tag'){
            if ( allTags.indexOf(archivo) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';}
            $('#tagCloud span').each(function(){
            	if ( $(this).attr('data-tag') == archivo ){
            		$(this).addClass('selected');
            		return false;
            	}
            });
            muestraTag(archivo);
            $('#dcha_content').show();
        } else {
        	if ( archivo == '' && param == '') { // incio
	        	$('#nav li[data-menu="inicio"]').addClass('selected');
	        	$('#mmenu li[data-menu="inicio"] a').addClass('selected');
	        	$('#dcha_content').show();
			} else if ( archivo == 'acerca_de' ) {
				$('#nav li[data-menu="acerca_de"]').addClass('selected');
	        	$('#mmenu li[data-menu="acerca_de"] a').addClass('selected');
	        	if(!sideBarAbout){
			    	$.get( "sidebar_about.html", function( data ) {
			    		sideBarAbout = data;
						$( "#dcha_content" ).html( sideBarAbout );
						$('#dcha_content').show();
					});
				} else {
					$( "#dcha_content" ).html( sideBarAbout );
					$('#dcha_content').show();
				}
			} else if ( archivo == 'participa' ){
				$('#nav li[data-menu="participa"]').addClass('selected');
	        	$('#mmenu li[data-menu="participa"] a').addClass('selected');
	        	if(!sideBarParticipa){
			    	$.get( "sidebar_participa.html", function( data ) {
			    		sideBarParticipa = data;
						$( "#dcha_content" ).html( sideBarParticipa );
						$('#dcha_content').show();
					});
				} else {
					$( "#dcha_content" ).html( sideBarParticipa );
					$('#dcha_content').show();
				}
			}
        }		
		
	

    }); // FIN getJSON
    
    //mobime menu
	$("#mmenu").hide();
    $(".mtoggle").click(function() {
        $("#mmenu").fadeToggle(500);
    });
    //animacion markers
	$('#dcha_content').on('mouseenter', 'ul li', function(){
		markerId = $(this).attr('data-id');
		markers[markerId].setAnimation(google.maps.Animation.BOUNCE);
	});
	$('#dcha_content').on('mouseleave', 'ul li', function(){
		markerId = $(this).attr('data-id');
		markers[markerId].setAnimation(null);
	});
	
	
	$('body').on('click','a[href*=".html"],a[data-menu="inicio"]',function (e) {
		e.preventDefault();
		
		if ( $('#mmenu').css('display') == 'block' ) $("#mmenu").fadeToggle(500);
		
	  // Detect if pushState is available
		if(history.pushState) {
			history.pushState(null, null, $(this).attr('href'));
			archivo = location.pathname.replace(/^.*[\\\/]/, '');
			archivo = decodeURIComponent(archivo);
			archivo = archivo.replace('.html','');
			 
			path = decodeURIComponent(location.pathname);
			pathArr = path.split('/');
			pathArr.pop();
			param = pathArr[pathArr.length -1];
			 
			muestraTagoCat(param,archivo);
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

		archivo = location.pathname.replace(/^.*[\\\/]/, '');
		archivo = decodeURIComponent(archivo);
		archivo = archivo.replace('.html','');
		 
		path = decodeURIComponent(location.pathname);
		pathArr = path.split('/');
		pathArr.pop();
		param = pathArr[pathArr.length -1];
		
		muestraTagoCat(param,archivo);
	});
	
	/*
	 * Validacion
	 */
	$("#buscador").validate({
		rules: {
			query: {
				minlength: 2
			}
		},
		messages: {
			query: {
				minlength: "Introduzca una búsqueda más larga"
			}
		},
		submitHandler: function(form) {
			var busqueda = $('#query').val();
			busqueda = busqueda.trim();
			if (busqueda=='') return;
		//	alert('submited: '+busqueda)
			doQuery(busqueda);
	   		// form.submit();
		}
	});
	
	
	
	
}); // FIN doc ready

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
    controlUI.id = "fullscreen"
    controlDiv.appendChild(controlUI);

    // Setup the click event listeners: simply set the map to Chicago.
    google.maps.event.addDomListener(controlUI, 'click', function() {
        jQuery("#mapa_container").toggleClass('mapa-fullscreen');
	    google.maps.event.trigger(map, 'resize');
	    map.panTo(lat_long);
    });
}

function ponPin (color){
    pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + color,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34)
    );
    return pinImage;
}

function cargaJP(infoTags,infoTitulo,infoAutor,infoFecha,infoDescripcion,infoId,infoAudiourl,infoUrl){
    if (infoTags){
		var tagsHTML = '<li>Tags : ' + listTags(infoTags) + '</li>';
	} else {
	    var tagsHTML = '';
	}
	var date = new Date(infoFecha);
	var day = date.getDate();
	var year = date.getFullYear();
	var month = date.getMonth()+1;
	var dateStr = day+"/"+month+"/"+year;

	$('#fecha').val(dateStr)

    var infoHTML = '<div class="infowindow"> \
<div class="marker type-marker">\
    <div class="post-title"><h3>' + infoTitulo +'</h3></div> \
    <div class="post-content"> \
        <hr /> \
        <p>Autor: ' + infoAutor + '<br /> \
          Fecha: ' +  dateStr + ' \
        </p> \
        <p>' + infoDescripcion + ' </p> \
        <hr /> \
        <div id="jquery_jplayer_' + infoId + '" class="jp-jplayer"></div> \
        <div id="jp_container_1" class="jp-audio"> \
            <div class="jp-type-single"> \
                <div class="jp-gui jp-interface"> \
                    <ul class="jp-controls"> \
                        <li><a href="javascript:\;" class="jp-play" tabindex="1">play</a></li> \
                        <li><a href="javascript:\;" class="jp-pause" tabindex="1">pause</a></li> \
                        <li><a href="javascript:\;" class="jp-stop" tabindex="1">stop</a></li> \
                        <li><a href="javascript:\;" class="jp-mute" tabindex="1" title="mute">mute</a></li> \
                        <li><a href="javascript:\;" class="jp-unmute" tabindex="1" title="unmute">unmute</a></li> \
                        <li><a href="javascript:\;" class="jp-volume-max" tabindex="1" title="max volume">max volume</a></li> \
                    </ul> \
                    <div class="jp-progress"> \
                        <div class="jp-seek-bar"> \
                            <div class="jp-play-bar"></div> \
                        </div> \
                    </div> \
                    <div class="jp-volume-bar"> \
                        <div class="jp-volume-bar-value"></div> \
                    </div> \
                    <div class="jp-current-time"></div> \
                    <div class="jp-duration"></div> \
                </div> \
                <div class="jp-no-solution"> \
                    <span>Update Required</span> \
                    To play the media you will need to either update your browser to a recent version or update your <a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>. \
                </div> \
            </div> \
            <span class="download-link"><a onclick="pauseJPlayer()" tabindex="1" href="' + infoUrl + '" target="_blank">Download at freesound.org</a></span> \
        </div> \
        <hr class="clear" /> \
        <div class="marker-info"> \
            <div id="etiquetas-marker"> \
                <ul> ' + tagsHTML + '  </ul> \
            </div> \
        </div> \
    </div> \
</div> \
</div>'

return infoHTML;
}

function llenaAllTags(tagsArr){
 //   tagsArr = infoTags.split(',');
    for (i = 0; i < tagsArr.length; i++) {
        // quitamos espacios en blanco
        tagsArr[i] = tagsArr[i].trim();
        //miramos que no este ya en el array
        if (allTags.indexOf( tagsArr[i] ) < 0){
            allTags.push(tagsArr[i])
        }
        tagsForCloud.push(tagsArr[i]);
    }
}
function listTags(tagsArr){
    var tags = '';
    for (i = 0; i < tagsArr.length; i++) {
        // quitamos espacios en blanco
        tagsArr[i] = tagsArr[i].trim();
        tags += '<a href="http://www.aldeainvisible.net/tag/'+ tagsArr[i] +'.html" title="Ver solo tag ' + tagsArr[i] + '" >' + tagsArr[i] + '</a> ';
    }
    return tags;
}
function pauseJPlayer(){ $.jPlayer.pause();}
function stopJPlayer(){ $('.jp-jplayer').jPlayer('stop');}
function llenaNubeTags(arr) {
    var  tags = [], frecuencia = [],prev;
    
	arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            tags.push(arr[i]);
            frecuencia.push(1);
        } else {
            frecuencia[frecuencia.length-1]++;
        }
        prev = arr[i];
    }
    for ( var i = 0; i < tags.length; i++ ) {
    	if ( i < tags.length -1 ) {
			tagsDiv += '<span class="freq_'+frecuencia[i]+'" data-tag="'+tags[i]+'"><a href="http://www.aldeainvisible.net/tag/'+tags[i]+'.html">'+tags[i]+' <span>(' +frecuencia[i] + ')</span>,</a></span> ';
		} else {
			tagsDiv += '<span class="freq_'+frecuencia[i]+'" data-tag="'+tags[i]+'"><a href="http://www.aldeainvisible.net/tag/'+tags[i]+'.html">'+tags[i]+' <span>(' +frecuencia[i] + ')</span>.</a></span>';
		}
		
	}
   $('#tagCloud').append(tagsDiv);
}

// segun la url mostramos categoria seleccionada o tag seleccionado
function muestraTagoCat(param,archivo){
	// reload all markers to markerCluster if needed
	if( markers.length != markerCluster.getTotalMarkers() ){
		markerCluster.clearMarkers();
		markerCluster.addMarkers(markers);
	}
	//empty search box
	$('input#query').val('');
	
	//cerramos globos si los hay
		infowindow.close();
    if (param=='categoría'){
        if ( allCategories.indexOf(archivo) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';}
        $('li[data-menu], li[data-menu] a').removeClass('selected');
        $('#categorias li a[data-categoria]').removeClass('sel');
        $('#categorias li a[data-categoria="'+ archivo +'"]').addClass('sel');
        $('#mcategorias li a[data-categoria="'+ archivo +'"]').addClass('selected');
        $('#nav li[data-menu="categorias"]').addClass('selected');
        $('#mmenu li[data-menu="categorias"] a.hsubs').addClass('selected');
		
		//TODO: el desplegable no se rocoje al seleccionau una categoria (ver en chrome)
		$('#categorias').css({
			'transform': 'scaleY(0)',
			'left': '-9999px',
			'top': '-9999px'
			
		});
       
       
         setTimeout(function(){
         	$('#categorias').removeAttr('style');
         	
         	}, 1000);
			
        
     //   $('#mmenu li[data-menu="inicio"]').addClass('selected');
        muestraCat(archivo);
    } else if (param=='tag'){
        if ( allTags.indexOf(archivo) == -1 ) {window.location.href = 'http://www.aldeainvisible.net/';}
        $('li[data-menu], li[data-menu] a').removeClass('selected');
        $('#categorias li a[data-categoria]').removeClass('sel');
        $('#tagCloud span').each(function(){
        	if ( $(this).attr('data-tag') == archivo ){
        		$(this).addClass('selected');
        		return false;
        	}
        });
    //    $('#tagActivo').append('Mostrando tag: <span>'+ archivo +'</span>');
        muestraTag(archivo);
    } else if (param == ''){  
    	$('li[data-menu], li[data-menu] a').removeClass('selected');
    	$('#categorias li a[data-categoria]').removeClass('sel');
    	if(archivo == 'index' || archivo == ''){ // index
	    	$('#nav li[data-menu="inicio"]').addClass('selected');
	    	$('#mmenu li[data-menu="inicio"] a').addClass('selected');
	    	mapaAInicio();
	    	$('#dcha_content').html(sideBarInicio);		   
    	} else if(archivo=='acerca_de'){
    		$('#nav li[data-menu="acerca_de"]').addClass('selected');
	    	$('#mmenu li[data-menu="acerca_de"] a').addClass('selected');
	    	if(!sideBarAbout){
		    	$.get( "sidebar_about.html", function( data ) {
		    		sideBarAbout = data;
		    		$( "#dcha_content" ).html( sideBarAbout );			
				});
			} else {
				$( "#dcha_content" ).html( sideBarAbout );
			}
			mapaAInicio();
    	} else if(archivo=='participa'){
    		$('#nav li[data-menu="participa"]').addClass('selected');
	    	$('#mmenu li[data-menu="participa"] a').addClass('selected');
	    	if(!sideBarParticipa){
		    	$.get( "sidebar_participa.html", function( data ) {
		    		sideBarParticipa = data;
		    		$( "#dcha_content" ).html( sideBarParticipa );			
				});
			} else {
				$( "#dcha_content" ).html( sideBarParticipa );
			}
			mapaAInicio();
		}
    }
}

function muestraTag(tag) {
    var i;
    var count = 0;
    sideBar = "<h5>Tag " + tag.toUpperCase() +" <span>(__COUNT__)</span><\/h5>";
    sideBar += "<ul>";
    for (i = 0; i < markers.length; i++) {
        if ( markers[i].tags.indexOf(tag) > -1 ) {
            markers[i].setVisible(true);
            count = count + 1;
        	sideBar += '<li data-id="'+ i +'" onclick="return myclick(' + i + ')"><a href="javascript:void(0)">' + markers[i].title + '</a><\/li>';
        } else {
            markers[i].setVisible(false);
        }
    }
    sideBar += "</ul>";
    $('#dcha_content').html(sideBar.replace('__COUNT__',count));
    if (markerCluster) {
    	markerCluster.repaint();
	}
}

function myclick(i) {
	google.maps.event.trigger(markers[i], "click");
}

function muestraCat(category) {
    var i;
    var count = 0;
    sideBar = "<h5>Categorí­a " + category.toUpperCase() +" <span>(__COUNT__)</span><\/h5>";
    sideBar += "<ul>";
    for (i = 0; i < markers.length; i++) {
        if ( markers[i].tags.indexOf(category) > -1 ) {
            markers[i].setVisible(true);
            count = count + 1;
            sideBar += '<li data-id="'+ i +'" onclick="myclick(' + i + ')"><a href="javascript:void(0)">' + markers[i].title + '</a><\/li>';
        }
        else {
            markers[i].setVisible(false);
        }
    }
    sideBar += "</ul>";
    $('#dcha_content').html(sideBar.replace('__COUNT__', count));

	if (markerCluster) {
    	markerCluster.repaint();
	}
} 

function mapaAInicio(){
	//Hacemos todos los markets visibles
	for (i = 0; i < markers.length; i++) {
		markers[i].setVisible(true);
	}
	
	//	Reiniciamos mapa
	map.panTo(lat_long);
	map.setZoom(11);
	if (markerCluster) {
		markerCluster.repaint();
	}
	//vaciamos el buscador
	$('input#query').val('');
}

/*
 * Buscador
 */
function doQuery(busqueda){
	$.getJSON('http://www.freesound.org/apiv2/search/text/?filter=geotag:%22Intersects%28-5.138%2040.125%20-4.223%2040.538%29%22&fields=id&token=e330f1a7dedaba306af677f43839d216028755bf&format=json&page_size=150&query='+busqueda, function (json1) {

		//TODO: comprobar que hay al menos 1 resultado
		markerCluster.clearMarkers();
		//	Reiniciamos mapa

 		map.panTo(lat_long);
		map.setZoom(11);
		sideBar = "<h5>Resultados búsqueda " + busqueda +" <span>("+json1.results.length+")</span><\/h5>";
		sideBar += "<ul>";
		$.each(json1.results, function (key, data) {
		/*
		    for (var i = 0; i < markers.length; i++) {
		        if (data.id == markers[i].soundId) {
		        	markers[i].setVisible(true);
		          	sideBar += '<li data-id="'+ i +'" onclick="myclick(' + i + ')"><a href="javascript:void(0)">' + markers[i].title + '</a><\/li>';	          
		        } else {
		        	 markers[i].setVisible(false);
		        }
		    }
		 */ 
		
		for (var i = 0; i < markers.length; i++) {
			if (data.id == markers[i].soundId) {
		    	markerCluster.addMarker(markers[i]);
		        sideBar += '<li data-id="'+ i +'" onclick="myclick(' + i + ')"><a href="javascript:void(0)">' + markers[i].title + '</a><\/li>';	          
		    }
		}
		 
		 
		  	
	   		
		}); // end $.each
		sideBar += "</ul>";
		$('#dcha_content').html(sideBar);
		
		//	Reiniciamos mapa
/*
 		map.panTo(lat_long);
		map.setZoom(11);
*/
		if (markerCluster) {
		//	markerCluster.repaint();
		}

	}); // FIN getJSON
}









/* parseUri JS v0.1.1, by Steven Levithan <http://stevenlevithan.com>
Splits any well-formed URI into the following parts (all are optional):
----------------------
- source (since the exec method returns the entire match as key 0, we might as well use it)
- protocol (i.e., scheme)
- authority (includes both the domain and port)
  - domain (i.e., host; can be an IP address)
  - port
- path (includes both the directory path and filename)
  - directoryPath (supports directories with periods, and without a trailing backslash)
  - fileName
- query (does not include the leading question mark)
- anchor (i.e., fragment) */
function parseUri(sourceUri){
	var uriPartNames = ["source","protocol","authority","domain","port","path","directoryPath","fileName","query","anchor"],
		uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri),
		uri = {};
	
	for(var i = 0; i < 10; i++){
		uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
	}
	
	/* Always end directoryPath with a trailing backslash if a path was present in the source URI
	Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key */
	if(uri.directoryPath.length > 0){
		uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
	}
	
	return uri;
}