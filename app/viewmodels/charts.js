define(['durandal/system', 'plugins/http', 'durandal/app', 'knockout', 'bootstrap', 'jquery-ui', 'reportsbase', 'highcharts', 'appstate', 'reportdefs'],
    function (system, http, app, ko, bootstrap, jqueryui, reportsbase, highcharts, appstate, reportdefs) {


        this.reportsbase = reportsbase;

        return{

            chartDataArr: null,
            reportdef: null,
            charts: ko.observableArray([]),

            activate: function () {
                var data = appstate.queryResults;
                var queryName = appstate.queryName;
                var charts;
                if(data && queryName){
                    this.reportdef = reportdefs[queryName];
                    charts = this.prepareCharts(data, this.reportdef);
                }
                if (charts.length < 1) {
                    app.showMessage('No results available to display, please execute a query.', 'Error').then(function (dialogResult) {
                        router.navigate('queryconfig');
                    });
                    return;
                }
                this.charts(charts);
            },

            attached: function () {
                var charts = this.charts();

                //create charts
                $.each(charts, function (index, chartTabPanel) {
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
                        that.axisTitle = (that.reportdef.headers[that.reportdef.levels.length]);
                        that.datapoints = $.map(chartElement.datapoints, function (datapoint) {
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
                            series: [
                                {
                                    data: that.datapoints
                                }
                            ]
                        });
                    });
                });

                //create tabs

                $("#tabs").tabs();
            },


            prepareCharts: function (data, reportdef) {

                this.validateRequests(data, reportdef);

                var chartTabSet = [];
                //each chartRequest in the array represents a tabbed panel containing a chart for each node in the tree of aggregated data
                $.each(reportdef.tabs, function (index, tab) {
                    var featureData = data[reportdef.dataKeys[index]];
                    var tree = reportsbase.buildHierarchy(featureData, reportdef);  //create the tree based on the levels defined in request
                    var chartTabPanel = {};
                    chartTabPanel.reportdef = reportdef;
                    chartTabPanel.id = index;
                    chartTabPanel.title = tab
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
                return chartTabSet;
            },


            validateRequests: function (data, reportdef) {
                if (reportdef.levels.length > 2) {
                    throw new Error('Invalid chart configuration');
                }

                $.each(reportdef.dataKeys, function (index, dataKey) {

                    var featureData = data[dataKey];
                    $.each(featureData, function (index, feature) {
                        if (feature['Length'] && feature['NumberOfLanes']) {
                            feature.LaneMiles = feature['Length'] * feature['NumberOfLanes']
                        } else {
                            feature.LaneMiles = 0;
                        }
                    });
                });
            },

            print: function () {
                var printOutput = $('<div></div>');

                $('#tabs ul > li > a').each(function (index, tab) {
                    var tabTitle = $(tab).find('span').text();
                    printOutput.append('<div class="chart-printout">Charts For Tab: ' + tabTitle + '</div>');
                    var chartDivId = tab.href.split('#')[1];
                    $('#' + chartDivId).find('.chart-container').each(function (index, chartContainer) {
                        printOutput.append($(chartContainer).clone());
                    });
                });

                var popupWin = window.open('', '_blank', 'width=800,height=600');
                popupWin.document.open()
                popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + printOutput.html() + '</html>');
                popupWin.document.close();
            },

        };


    });