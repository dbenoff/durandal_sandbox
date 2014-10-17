//define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'jquery-ui', 'config'], function (http, app, ko, jstree, bootstrap, jqueryui, config) {
define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'jquery-ui'], function (http, app, ko, jstree, bootstrap, jqueryui) {

    return {
        displayName: 'Query Configuration',

        selectedGeographicType: ko.observable(),

        geographicTypes: ko.observableArray([]),
        useGeographicFilter: ko.observable(),
        geoFilters: ko.observableArray([]),

        assetTypes: ko.observableArray([]),
        useAssetFilter: ko.observable(),
        assetFilters: ko.observableArray([]),

        geoTreeNodes: null,
        assetTreeNodes: ko.observableArray([]),

        activate: function () {
            this.areaTree = {};
            this.assetTree = {};
            var that = this;

            $.when(


                $.get( "district.json",
                    function(response) {
                        that.areaTree['Assembly Districts'] = response.AreaList;
                    }),

                $.get( "regionlist.json",
                    function(response) {
                        that.areaTree['Regions'] = response.AreaList;
                    }),

                $.get( "class.json",
                    function(response) {
                        var bridges = {};
                        var roads = {};
                        roads['types'] = response.FilterList;
                        bridges['types'] = response.FilterList;
                        that.assetTree['Road Assets'] = roads;
                        that.assetTree['Bridge Assets'] = bridges;
                    })



                /*$.ajax({
                    url: config.districtQueryUrl,
                    jsonp: "callback",
                    dataType: "jsonp",
                    success: function (response) {
                        that.areaTree['Assembly Districts'] = response.AreaList;
                    }
                }),

                $.ajax({
                    url: config.regionQueryUrl,
                    jsonp: "callback",
                    dataType: "jsonp",
                    success: function (response) {
                        that.areaTree['Regions'] = response.AreaList;
                    }
                }),

                $.ajax({
                    url: config.functionalClassQueryUrl,
                    jsonp: "callback",
                    dataType: "jsonp",
                    success: function (response) {
                        var bridges = {};
                        var roads = {};
                        roads['types'] = response.FilterList;
                        bridges['types'] = response.FilterList;
                        that.assetTree['Road Assets'] = roads;
                        that.assetTree['Bridge Assets'] = bridges;
                    }
                })*/
            ).then(function () {
                    var geographicTypes = [];
                    var geoTreeNodes = [];
                    $(Object.getOwnPropertyNames(that.areaTree)).each(function () {
                        var geoTypeName = this;
                        geographicTypes.push(geoTypeName);
                        var geoTreeNode = {};
                        geoTreeNode.children = [];
                        geoTreeNode.text = 'All ' + geoTypeName;
                        geoTreeNode.a_attr = {'selectionId' : geoTypeName},
                        geoTreeNode.state = { 'opened' : true, 'selected' : false };
                        geoTreeNode.selectionId = geoTypeName,
                        that.geoTreeNode = geoTreeNode;
                        $(that.areaTree[this]).each(function (index, childElement) {
                            var child = {};
                            child.text = childElement.Name;
                            geoTreeNode.selectionId = childElement.Value,
                            child.a_attr = {'selectionId' : childElement.Value},
                            child.state = { 'opened' : false, 'selected' : false };
                            child.parentId = that.geoTreeNode.text;
                            child.selectionId = childElement.Value;
                            that.geoTreeNode.children.push(child);
                        });
                        geoTreeNodes.push(geoTreeNode);
                        that.geographicTypes(geographicTypes);
                    });
                    that.geoTreeNodes = geoTreeNodes;

                    var assetTreeNodes = [];
                    $(Object.getOwnPropertyNames(that.assetTree)).each(function () {
                        var assetTypeName = this;
                        var assetTreeNode = that.assetTree[this];
                        assetTreeNode.children = [];
                        assetTreeNode.text = assetTypeName;
                        assetTreeNode.a_attr = {'selectionId' : assetTypeName},
                        assetTreeNode.selectionId = assetTypeName,
                        assetTreeNode.state = { 'opened' : false, 'selected' : false };
                        that.assetTreeNode = assetTreeNode;
                        $(assetTreeNode.types).each(function (index, childElement) {
                            var child = {};
                            child.text = childElement.Name;
                            child.a_attr = {'selectionId' : childElement.Value},
                            child.state = { 'opened' : false, 'selected' : false };
                            child.parentId = that.assetTreeNode.selectionId;
                            child.selectionId = childElement.Value;
                            that.assetTreeNode.children.push(child);
                        });
                        assetTreeNodes.push(assetTreeNode);
                    });
                    that.assetTreeNodes(assetTreeNodes);
                });
        },

        attached: function (view, parent) {

            var that =this;

            this.assetTreeNodes.subscribe(function(newValue) {
                $('#assetTree').jstree({'plugins':["checkbox"], 'core' : {
                    'data' : newValue
                }}).on('changed.jstree', function (e, data) {
                    that.updateAssetSelection(e, data)
                });
            });

            this.selectedGeographicType.subscribe(function(newValue) {

                var geoTreeData = [];
                $(that.geoTreeNodes).each(function (index, node) {
                    if(node.text.indexOf(newValue) > -1){
                        geoTreeData.push(node);
                    }
                });

                $('#geoTree').jstree("destroy");

                $('#geoTree').jstree({'plugins':["checkbox"], 'core' : {
                    'data' : geoTreeData
                }}).on('changed.jstree', function (e, data) {
                    that.updateGeoSelection(e, data)
                });
            });

            this.useGeographicFilter.subscribe(function(newValue) {
                if(newValue ){
                    $("#geoTree").jstree("uncheck_all",true);
                }
            });

            this.useAssetFilter.subscribe(function(newValue) {
                var oldValue = that.useAssetFilter();
                if(oldValue){
                    $("#assetTree").jstree("uncheck_all",true);
                }
            }, null, "beforeChange");


        },

        updateGeoSelection: function (e, data) {
            this.values = $("#geoTree").jstree("get_checked",{full:true},true) ;
            if(this.values.length > 0){
                var that = this;
                $(this.values).each(function (index, node) {
                    if(!node.original.parentId){
                        that.values.length = 0;
                        that.values.push(node);
                        return true;
                    }
                });
                this.geoFilters(this.values);
            }else{
                this.geoFilters([]);
            }
        },

        updateAssetSelection: function (e, data) {
            this.values = $("#assetTree").jstree("get_checked",{full:true},true) ;
            if(this.values.length > 0){
                this.parentNodeIds = [];
                this.filteredValues = [];
                var that = this;
                $(this.values).each(function (index, node) {
                    if(!node.original.parentId){
                        that.parentNodeIds.push(node.original.text);
                        that.filteredValues.push(node);
                    }
                });

                $(this.values).each(function (index, node) {
                    if(node.original.parentId){
                        if(that.parentNodeIds.indexOf(node.original.parentId) == -1){
                            that.filteredValues.push(node);
                        }
                    }
                });
                this.assetFilters(this.filteredValues);
            }else{
                this.assetFilters([]);
            }
        },

        executeQuery: function () {
//disconnect for demo
           return false;

            var geoFilterValues  =  {Regions : 'Region', AssemblyDistricts : 'HouseDistrict' };
            var bridgeLineAttributes =  '[{"Name":"FunctionalClass","Description":null,"IconUrl":null},{"Name":"NumberOfLane","Description":null,"IconUrl":null},{"Name":"Region","Description":null,"IconUrl":null},{"Name":"BridgeLine","Description":null,"IconUrl":null}]';
            var roadLineAttributes =  '[{"Name":"FunctionalClass","Description":null,"IconUrl":null},{"Name":"NumberOfLane","Description":null,"IconUrl":null},{"Name":"Region","Description":null,"IconUrl":null}]';

            var selectedGeographicType = this.selectedGeographicType();
            var useGeographicFilter = this.useGeographicFilter();
            var geoFilters = this.geoFilters();
            var useAssetFilter = this.useAssetFilter();
            var assetFilters = this.assetFilters();

            //only filter by geography if the user selected to use a filter AND the geo selection is not the 'All' option
            var geoValuesToSubmit = [];
            if(useGeographicFilter == "true"  && (geoFilters.length > 1 || geoFilters[0].original.parentId)){
                //user selected to filter by geo AND didn't select the 'All' option
                geoValuesToSubmit = $.map( geoFilters, function( geoFilter, index ) {
                    return {Value: geoFilter.original.selectionId, Name: geoFilter.original.text};
                });
            }

            this.queryForRoads = false;
            this.queryForBridges = false;
            this.bridgeAssetValuesToSubmit = [];
            this.roadAssetValuesToSubmit = [];
            var that = this;
            if(useAssetFilter == "true"){
                var that = this;
                $(this.assetFilters()).each(function (index, node) {
                    if(node.original.parentId){
                        var assetFilterNode = {Value: node.original.selectionId, Name: node.original.text};
                        if(node.original.parentId.indexOf('Road') > -1){
                            that.roadAssetValuesToSubmit.push(assetFilterNode);  //node is a child of All Roads
                            that.queryForRoads = true;
                        }else{
                            that.bridgeAssetValuesToSubmit.push(assetFilterNode);  //node is a child of All Bridges
                            that.queryForBridges = true;
                        }
                    }else{
                        if(node.original.text.indexOf('Road') > -1){
                            that.queryForRoads = true;  //user selected All Roads
                        }else{
                            that.queryForBridges = true; //user selected All Bridges
                        }
                    }
                });
            }else{
                this.queryForRoads = true;
                this.queryForBridges = true;
            }

            var geoParameter = {};
            geoParameter.Type = geoFilterValues[selectedGeographicType.replace(/ /g,'')];
            geoParameter.Description = "";
            geoParameter.Areas = [];
            geoParameter.Areas = geoValuesToSubmit;



            if(this.queryForRoads){

                var formData = {};
                formData.Routes = [];
                formData.f = 'pjson';
                formData.Areas = JSON.stringify(geoParameter);

                var roadAssetParameter = {
                    Type :"FunctionalClass",
                    Description :"Class",
                    Filters: this.roadAssetValuesToSubmit
                }
                formData.Filters= JSON.stringify(roadAssetParameter);
                formData.LineAttributes =  '[{"Name":"FunctionalClass","Description":null,"IconUrl":null},{"Name":"NumberOfLane","Description":null,"IconUrl":null},{"Name":"' + geoParameter.Type + '","Description":null,"IconUrl":null}]';

                $.ajax({
                    type: "POST",
                    crossDomain: true,
                    url: config.runQueryUrl,
                    data: formData,
                    success: function(data){
                        console.log(data);
                    },
                    error: function(data) {
                        console.log('error');
                    }

                });
            }

           /* if(this.queryForBridges){
                formData = {};
                formData.Routes = [];
                formData.f = 'pjson';
                formData.Areas = JSON.stringify(geoParameter);

                var bridgeAssetParameter = {
                    Type :"FunctionalClass",
                    Description :"Class",
                    Filters: this.bridgeAssetValuesToSubmit
                }
                formData.Filters= JSON.stringify(bridgeAssetParameter);
                formData.LineAttributes =  '[{"Name":"FunctionalClass","Description":null,"IconUrl":null},{"Name":"NumberOfLane","Description":null,"IconUrl":null},{"Name":"' + geoParameter.Type + '","Description":null,"IconUrl":null}],{"Name":"BridgeLine","Description":null,"IconUrl":null}]';

                $.ajax({
                    type: "POST",
                    url: config.runQueryUrl,
                    data: formData,
                    success: function(xhr,status,error) {
                        console.log('success');
                    },
                    error: function(xhr,status,error) {
                        console.log('error');
                    }

                });
            }*/
        }
    };
});