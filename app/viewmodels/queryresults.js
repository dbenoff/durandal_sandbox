define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'jquery-ui', 'datatables', 'jquery-ui'],
    function (http, app, ko, jstree, bootstrap, jqueryui, datatables, jqueryui) {

    return {
        displayName: 'Query Results',

        selectedGeographicType: ko.observable(),

        geographicTypes: ko.observableArray([]),
        useGeographicFilter: ko.observable(),
        geoFilters: ko.observableArray([]),

        assetTypes: ko.observableArray([]),
        useAssetFilter: ko.observable(),
        assetFilters: ko.observableArray([]),

        geoTreeNodes: null,
        assetTreeNodes: null,

        activate: function () {
        },

        blah: function () {
            console.log('blah');
        },

        attached: function (view, parent) {
            $.get( "results.json",
                function(data) {
                    var bridgeColumnNames = {};
                    $(data['BridgeFeatureResults']).each(function () {
                        $(Object.getOwnPropertyNames (this)).each(function () {
                            bridgeColumnNames[this] = this;
                        });
                    });
                    this.bridgeColumnDefs = [];
                    var that = this;
                    $(Object.getOwnPropertyNames(bridgeColumnNames)).each(function () {
                        that.bridgeColumnDefs.push({ "title" : this, "data" : this});
                    });

                    $("#tabs").tabs( {
                        "activate": function(event, ui) {
                            var table = $.fn.dataTable.fnTables(true);
                            if ( table.length > 0 ) {
                                $(table).dataTable().fnAdjustColumnSizing();
                            }
                        }
                    } );

                    $('#example1').on( 'processing.dt', function ( e, settings, processing ) {
                        $('#processingIndicator').css( 'display', processing ? 'block' : 'none' );
                    } ).dataTable( {
                        "processing": true,
                        "sScrollY": "600px",
                        "aoColumnDefs": [
                            { "sWidth": "10%", "aTargets": [ -1 ] }
                        ],
                        "data": data['BridgeFeatureResults'],
                        "columns": this.bridgeColumnDefs
                    } );

                    $('#example2').on( 'processing.dt', function ( e, settings, processing ) {
                        $('#processingIndicator').css( 'display', processing ? 'block' : 'none' );
                    } ).dataTable( {
                        "processing": true,
                        "sScrollY": "600px",
                        "aoColumnDefs": [
                            { "sWidth": "10%", "aTargets": [ -1 ] }
                        ],
                        "data": data['BridgeFeatureResults'],
                        "columns": this.bridgeColumnDefs
                    } );

                    $('#example1').click( function () {
                        var hidden = table.fnGetHiddenNodes();
                        alert( hidden.length +' nodes were returned' );
                    } );

                    $('#example1').on( 'draw.dt', function () {
                        console.log( 'example1 occurred at: '+new Date().getTime() );
                    } );

                    $('#example2').on( 'draw.dt', function () {
                        console.log( 'example2 occurred at: '+new Date().getTime() );
                    } );
                }
            );

        },

    };
});