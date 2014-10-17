define(
    function () {
        return {
            regionQueryUrl: 'http://swdev34/ArcGIS/rest/services/AKDOT/test/MapServer/exts/RouteEventOverlaySOE/GetGeogAreaValues?AreaType=Region&f=pjson',
            districtQueryUrl: 'http://swdev34/ArcGIS/rest/services/AKDOT/test/MapServer/exts/RouteEventOverlaySOE/GetGeogAreaValues?AreaType=HouseDistrict&f=pjson',
            functionalClassQueryUrl: 'http://swdev34/ArcGIS/rest/services/AKDOT/test/MapServer/exts/RouteEventOverlaySOE/GetFilterValues?FilterType=FunctionalClass&f=pjson',
            //runQueryUrl: 'http://swdev34/ArcGIS/rest/services/AKDOT/test/MapServer/exts/RouteEventOverlaySOE/GetRouteListLinearData'
            runQueryUrl: 'http://localhost:30778/ArcGIS/rest/services/AKDOT/test/MapServer/exts/RouteEventOverlaySOE/GetRouteListLinearData'
        };
});
