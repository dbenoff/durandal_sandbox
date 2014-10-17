define(['plugins/http', 'durandal/app', 'knockout', 'bootstrap', 'jquery-ui', 'reportsbase', 'highcharts'],
    function (http, app, ko, bootstrap, jqueryui, reportsbase, highcharts) {

        this.reportsbase = reportsbase;

        return {

            charts: ko.observableArray([]),

            binding: function () {
                console.log('!!!binding charts');
                //return { cacheViews: false }; //cancels view caching for this module, allowing the triggering of the detached callback

                var that = this;
                $.get( "results.json",
                    function(queryData) {

                        var requests = [];
                        var featureData = queryData['RouteFeatureResults'];

                        var reportRequest = {
                            type: 'bar',
                            results:featureData,
                            headers: ['Jurisdiction', 'Functional Class', 'Miles', 'Lane Miles'],
                            fields: ['Jurisdiction', 'FunctionalClass', 'Length', 'LaneMiles'],
                            levels: ['Jurisdiction', 'FunctionalClass'],
                            sums: ['Length', 'LaneMiles'],
                            averages: [],
                            title: 'Roads'
                        };

                        requests.push(reportRequest);

                        var featureData = queryData['BridgeFeatureResults'];

                        var reportRequest = {
                            type: 'bar',
                            results:featureData,
                            headers: ['Jurisdiction', 'Functional Class', 'Miles', 'Lane Miles'],
                            fields: ['Jurisdiction', 'FunctionalClass', 'Length', 'LaneMiles'],
                            levels: ['Jurisdiction', 'FunctionalClass'],
                            sums: ['Length', 'LaneMiles'],
                            averages: [],
                            title: 'Bridges'
                        };

                        requests.push(reportRequest);

                        that.selectChart(requests);
                    });
            },
            bindingComplete: function () {
                console.log('!!!bindingComplete charts');
            },
            detached: function (view) {
                console.log('!!!detached charts');
            },
            compositionComplete: function (view, parent) {
                console.log('!!!compositionComplete charts');
            },


            attached: function (view, parent) {

                console.log('!!!attached charts');

                var charts = this.charts();
                //create charts
                $.each(charts, function( index, chartTabPanel ) {
                    var that = this;
                    that.chartTabPanel = chartTabPanel;
                   var chartElements = chartTabPanel.charts;
                   $.each(chartElements, function (index, chartElement) {

                       that.chartElement = chartElement;
                       that.categories = [];

                       $.each(chartElement.datapoints, function (index, datapoint) {
                           that.categories.push(datapoint.name);
                       });

                       //the first header that isn't a summary level is the metric we're graphing
                       that.axisTitle = (that.chartTabPanel.request.headers[that.chartTabPanel.request.levels.length]);
                       that.datapoints = $.map(chartElement.datapoints, function( datapoint ) {
                           return Number(datapoint.metric);
                       });

                       that.chartTitle = that.chartTabPanel.title
                           + ' By ' + chartElement.level
                           + ' For ' + chartElement.text;

                       $("#chart_" + chartElement.id).highcharts({
                           chart: {
                               type: 'column'
                           },
                           legend: {
                               enabled: false,
                           },
                           title: {
                               text: that.chartTitle
                           },
                          /* subtitle: {
                               text: 'Source: WorldClimate.com'
                           },*/
                           xAxis: {
                               categories: that.categories
                           },
                           yAxis: {
                               min: 0,
                               title: {
                                   text: that.axisTitle
                               }
                           },
                           tooltip: {
                               headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                               pointFormat: '<tr><td style="padding:0"><b>{point.y:.1f} ' + that.axisTitle + '</b></td></tr>',
                               footerFormat: '</table>',
                               shared: true,
                               useHTML: true
                           },
                           plotOptions: {
                               column: {
                                   pointPadding: 0.2,
                                   borderWidth: 0
                               }
                           },
                           series: [{
                               data: that.datapoints
                           }]
                       });
                   });
                });

                //create tabs

               $("#tabs").tabs();
            },


            selectChart: function(chartRequests) {

                if(!chartRequests instanceof Array){
                    var arr = [];
                    arr.push(chartRequests);
                    chartRequests = arr;
                }

                this.validateRequests(chartRequests);

                var chartTabSet = [];
                //each chartRequest in the array represents a tabbed panel containing a chart for each node in the tree of aggregated data
                $.each(chartRequests, function (index, chartRequest) {
                    var featureData = chartRequest.results;
                    var tree = reportsbase.buildHierarchy(featureData, chartRequest);  //create the tree based on the levels defined in request
                    var chartTabPanel = {};
                    chartTabPanel.request = chartRequest;
                    chartTabPanel.id = index;
                    chartTabPanel.title = chartRequest.title;
                    chartTabPanel.charts = [];
                    var outerIndex = index;
                    $.each(tree, function (index, root) {
                        var chart = {};
                        chart.datapoints = [];
                        chart.level = root.level;
                        chart.text = root.text;
                        $.each(root.children, function (index, child) {
                            var datapoint = {
                                name: child.text,
                                metric: Math.round(child.Length).toString()
                            }
                            chart.datapoints.push(datapoint);
                        });
                        chart.id = outerIndex + "_" + index;
                        chartTabPanel.charts.push(chart);
                    });
                    chartTabSet.push(chartTabPanel);
                });
                this.charts(chartTabSet);
            },


            validateRequests: function(chartRequests){
                $.each(chartRequests, function (index, chartRequest) {
                    if(chartRequest.levels.length > 2) {
                        throw new Error('Invalid chart configuration');
                    }
                    var featureData = chartRequest.results;
                    $.each(featureData, function (index, feature) {
                        if(feature['Length'] && feature['NumberOfLanes']){
                            feature.LaneMiles  = feature['Length'] * feature['NumberOfLanes']
                        }else{
                            feature.LaneMiles = 0;
                        }
                    });
                });
            },

        };


    });