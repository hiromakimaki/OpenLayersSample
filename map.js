/** Reference: https://openlayers.org/en/latest/examples/popup.html */

window.onload = function(){
    const map = createMap();
}

/** Create Map */
function createMap() {
    /** Layer: Open Street Map */
    const rasterLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    
    /** Map */
    let map = new ol.Map({
        layers: [rasterLayer],
        target: 'map',
        controls: ol.control.defaults({
            attributionOptions: {
                collapsible: false
            }
        }),
        view: new ol.View({
            center: transformCoordinate(135, 35),
            zoom: 6
        })
    });
    map = addRouteLayerToMap(map);
    map = addOverlaysToMap(map);
    return map;
}

/** Add route layer */
function addRouteLayerToMap(map){
    const btn_search = document.getElementById('btn_search');
    const start = document.getElementById('start');
    const goal = document.getElementById('goal');
    const distance = document.getElementById('distance');
    const time = document.getElementById('time');

    distance.style.visibility = 'hidden';
    time.style.visibility = 'hidden';

    btn_search.onclick = function(){
        const regexpLatLon = /^[0-9\.]+,[0-9\.]+$/; // 'lat,lon'
        if (!regexpLatLon.exec(start.innerHTML)) {
            alert('Not specified the start loc.');
        } else if (!regexpLatLon.exec(goal.innerHTML)){
            alert('Not specified the goal loc.');
        } else {
            distance.style.visibility = 'visible';
            time.style.visibility = 'visible';

            sloc = start.innerHTML.split(',', 2);
            slat = parseFloat(sloc[0].trim());
            slon = parseFloat(sloc[1].trim());

            gloc = goal.innerHTML.split(',', 2);
            glat = parseFloat(gloc[0].trim());
            glon = parseFloat(gloc[1].trim());

            const speed = 10; // m/s
            const d = calc_distance(slat, slon, glat, glon);
            const t = d / speed;

            distance.innerHTML = d + ' m,';
            time.innerHTML = t + ' min.';

            map.getLayers().forEach(function (layer) {
                if (layer !== undefined && layer.get('name') === 'Route Layer') {
                    map.removeLayer(layer);
                }
            });

            map.addLayer(
                new ol.layer.Vector({
                    name: "Route Layer",
                    source: new ol.source.Vector({
                        features: [
                            new ol.Feature({
                                geometry: new ol.geom.LineString([
                                    transformCoordinate(slat, slon),
                                    transformCoordinate(glat, glon)
                                ]),
                                name: "Route Line String"
                            })
                        ]
                    }),
                    style: [
                        new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#ffcc33',
                                width: 5
                            })
                        })
                    ]
                })
            );
        }
    };
    return map;
}

/** Add overlays to map */
function addOverlaysToMap(map) {
    /** popup layer (appeared when the map is clicked) */
    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');
    const inputData = document.getElementById('input_data');
    const overlay = new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    });
    closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
    };
    map.on('singleclick', function(evt) {
        const lonLat = ol.proj.toLonLat(evt.coordinate);      
        content.innerHTML = 'You clicked here: ' + lonLat;
        inputData.innerHTML = lonLat;
        overlay.setPosition(evt.coordinate);
    });
    map.addOverlay(overlay);
    map = setPopupActions(map);
    return map;
}

/** Set popup actions */
function setPopupActions(map){
    const startLayerName = 'Start Point Layer';
    const goalLayerName = 'Goal Point Layer';
    const start = document.getElementById('start');
    const goal = document.getElementById('goal');
    const buttonDep = document.getElementById('btn_popup_dep');
    const buttonArv = document.getElementById('btn_popup_arv');
    const inputData = document.getElementById('input_data');
    const regexpLatLon = /^[0-9\.]+,[0-9\.]+$/; // 'lat,lon'
    buttonDep.onclick = function(){
        if (!regexpLatLon.exec(inputData.innerHTML)) {
            return;
        }
        start.innerHTML = inputData.innerHTML;
        const loc = inputData.innerHTML.split(',', 2);
        const lat = parseFloat(loc[0].trim());
        const lon = parseFloat(loc[1].trim());
        map.getLayers().forEach(function (layer) {
            if (layer !== undefined && layer.get('name') === startLayerName) {
                map.removeLayer(layer);
            }
        });
        map.addLayer(
            new ol.layer.Vector({
                name: startLayerName,
                source: new ol.source.Vector({
                    features: [
                        new ol.Feature({
                            geometry: new ol.geom.Point(transformCoordinate(lat, lon))
                        })
                    ]
                }),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({
                            color: '#ff0000'
                        })
                    })
                })
            })
        );
    };
    buttonArv.onclick = function(){
        if (!regexpLatLon.exec(inputData.innerHTML)) {
            return;
        }
        goal.innerHTML = inputData.innerHTML;
        const loc = inputData.innerHTML.split(',', 2);
        const lat = parseFloat(loc[0].trim());
        const lon = parseFloat(loc[1].trim());
        map.getLayers().forEach(function (layer) {
            if (layer !== undefined && layer.get('name') === goalLayerName) {
                map.removeLayer(layer);
            }
        });
        map.addLayer(
            new ol.layer.Vector({
                name: goalLayerName,
                source: new ol.source.Vector({
                    features: [
                        new ol.Feature({
                            geometry: new ol.geom.Point(transformCoordinate(lat, lon))
                        })
                    ]
                }),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({
                            color: '#ff0000'
                        })
                    })
                })
            })
        );
    };
    return map;
}

/** Calculate distance between (st_lat, st_lon) and (gl_lat, gl_lon) (wgs84)*/
function calc_distance(st_lat, st_lon, gl_lat, gl_lon){
	const EARTH_RADIUS = 6378.137; // km
	// degree to radian
	const st_lat_rad = st_lat * (Math.PI / 180);
	const st_lon_rad = st_lon * (Math.PI / 180);
	const gl_lat_rad = gl_lat * (Math.PI / 180);
	const gl_lon_rad = gl_lon * (Math.PI / 180);
	// radian to euclidian(on unit sphere)
	const st_x = Math.cos(st_lat_rad) * Math.cos(st_lon_rad)
	const st_y = Math.cos(st_lat_rad) * Math.sin(st_lon_rad)
	const st_z = Math.sin(st_lat_rad)
	const gl_x = Math.cos(gl_lat_rad) * Math.cos(gl_lon_rad)
	const gl_y = Math.cos(gl_lat_rad) * Math.sin(gl_lon_rad)
	const gl_z = Math.sin(gl_lat_rad)
	// calc radian from inner product
	const r = Math.acos(st_x * gl_x + st_y * gl_y + st_z * gl_z)
	// distance (m)
	return r * EARTH_RADIUS * 1000
}

/** Transform wgs84 to ... */
function transformCoordinate(longitude, latitude) {
    return ol.proj.transform([longitude, latitude], "EPSG:4326","EPSG:900913");
}