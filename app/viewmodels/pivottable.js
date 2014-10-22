define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'datatables', 'jquery-ui', 'reportsbase', 'reportdefs', 'appstate', 'plugins/router'],
    function (http, app, ko, jstree, bootstrap, datatables, jqueryui, reportsbase, reportdefs, appstate, router) {

        this.reportsbase = reportsbase;

        return {

            pivotTables: ko.observableArray([]),

            binding: function () {

                var data = appstate.queryResults;
                var queryName = appstate.queryName;
                var reportdef = $.extend({},reportdefs[queryName]); //make a local copy of the report def since we'll be modifying it
                var configuredReports = [];
                if (data && queryName) {
                    $(reportdef.tabs).each(function (index, tabname) {
                        var dataKey = reportdef.dataKeys[index];
                        if (data[dataKey] && data[dataKey].length > 0) {
                            var report = {};
                            report.title = tabname;
                            report.data = data[dataKey];
                            report.id = index;
                            configuredReports.push(report);
                        }
                    });
                }
                if (configuredReports.length < 1) {
                    app.showMessage('No results available to display, please execute a query.', 'Error').then(function (dialogResult) {
                        router.navigate('queryconfig');
                    });
                    return;
                }
                this.selectReport(configuredReports, reportdef)
            },

            compositionComplete: function (view, parent) {
                if(this.pivotTables().length > 0){
                    $("#tabs").tabs();
                    $("#tabs").show();
                }
            },

            selectReport: function (configuredReports, reportdef) {

                var that = this;
                that.pivotTablesArray = [];
                that.reportdef = reportdef;
                $.each(configuredReports, function (index, report) {

                    var featureData = report.data;

                    $.each(featureData, function (index, feature) {
                        if (feature['Length'] && feature['NumberOfLanes']) {
                            feature.LaneMiles = feature['Length'] * feature['NumberOfLanes']
                        } else {
                            feature.LaneMiles = 0;
                        }
                    });

                    //get distinct values for each level
                    var levelKeys = {};
                    for (var i = 0; i < featureData.length; i++) {
                        var row = featureData[i];
                        for (var j = 0; j < that.reportdef.levels.length; j++) {
                            var level = that.reportdef.levels[j];
                            if (typeof(levelKeys[level]) == 'undefined') {
                                levelKeys[level] = {};
                            }
                            var levelValues = levelKeys[level];
                            var rowValue = row[level];
                            levelValues[rowValue] = true;
                        }
                    }

                    //now make the hieararchy
                    var root = {};
                    root.children = [];
                    that.buildReferenceTree(featureData, that.reportdef, levelKeys, root, 0);

                    for (var i = 0; i < featureData.length; i++) {
                        var row = featureData[i];
                        that.writeRowValuesToLeaf(featureData, that.reportdef, root.children, row, 0);
                    }

                    var summaryGrid = {
                        cells: [],
                        add: function (cell) {
                            this.cells.push(cell);
                        }
                    }


                    var tree = root.children;
                    that.buildTable(tree, summaryGrid, reportdef);  //add the data to the table

                    //now add a summary section below that aggregates by the second dimension
                    var topLevel = reportdef.levels.shift();
                    tree = reportsbase.buildHierarchy(featureData, reportdef);
                    var summaryRoot = {};
                    summaryRoot.level = topLevel;
                    summaryRoot.text = "All " + topLevel + "s";
                    summaryRoot.children = tree;



                    reportdef.levels.unshift(topLevel);  //put the level back in so the column offsets are correct
                    $.each(reportdef.sums, function (index, sum) {
                        $.each(summaryRoot.children, function (index, child) {
                            if (!summaryRoot[sum]) {
                                summaryRoot[sum] = 0;
                            }
                            summaryRoot[sum] = summaryRoot[sum] + child[sum];
                        });
                    });

                    that.buildTable([summaryRoot], summaryGrid, reportdef);  //add the data to the table

                    var columnCount = reportdef.headers.length;
                    var table = '<p class=\"reportheader\">ADOT&PF ' + report.title + ' By ' + reportdef.headers[0] + ', Then By ' + reportdef.headers[1];
                    table = table.concat('<table class="gridtable"><tbody><tr>');
                    var rowcount = 0;
                    $.each(summaryGrid.cells, function (index, cell) {
                        table = table.concat('<td'
                            + (cell.cellCls ? ' class=' + cell.cellCls : '')
                            + (cell.colspan ? ' colspan=' + cell.colspan : '') + '>'
                            + (cell.html ? cell.html.toString() : '&nbsp;') + '</td>');
                        rowcount = rowcount + (cell.colspan ? cell.colspan : 1);
                        if (rowcount % columnCount == 0) {
                            table = table.concat('</tr><tr>');
                            rowcount = 0;
                        }
                    });

                    table.concat('</tr></tbody></table>');
                    var pivotTable = {};
                    pivotTable.html = table.toString()
                    pivotTable.title = reportdef.tabs[index];
                    pivotTable.id = "pivotTable-" + index;
                    that.pivotTablesArray.push(pivotTable);
                });

                this.pivotTables(this.pivotTablesArray);

            },

            buildReferenceTree: function (data, reportdef, levelKeys, parentNode, depth) {
                var levels = reportdef.levels
                var thisLevelValues = Object.getOwnPropertyNames(levelKeys[levels[depth]]);
                thisLevelValues.sort();
                for (var i = 0; i < thisLevelValues.length; i++) {
                    var child = {};
                    child.text = thisLevelValues[i];
                    child.children = [];
                    child.parent = parentNode;
                    child.depth = depth;
                    child.level = levels[depth];
                    parentNode.children.push(child);
                    if (depth + 1 < levels.length) {
                        this.buildReferenceTree(data, reportdef, levelKeys, child, depth + 1);
                    }
                }
            },

            writeRowValuesToLeaf: function (data, reportdef, tree, row, depth) {
                var level = reportdef.levels[depth];
                var levelValue = row[level];
                for (var i = 0; i < tree.length; i++) {
                    var child = tree[i];
                    if (child.text == levelValue) {
                        if (!child.children.length > 0) {
                            for (var j = 0; j < reportdef.sums.length; j++) {
                                var sum = reportdef.sums[j];
                                if (!child.hasOwnProperty(sum)) {
                                    child[sum] = 0;
                                }
                                this.addValue(child, sum, row);
                            }
                        } else {
                            this.writeRowValuesToLeaf(data, reportdef, child.children, row, depth + 1);
                        }
                    }
                }
            },

            addValue: function (child, sum, row) {
                if (!child.hasOwnProperty(sum)) {
                    child[sum] = 0;
                }
                child[sum] = Number(child[sum]) + Number(row[sum]);
                if (child.parent != null) {
                    this.addValue(child.parent, sum, row);
                }
            },

            buildTable: function (tree, table, reportdef) {
                var that = this;
                $.each(tree, function (index, node) {
                    if(!node.text){
                        console.log(node);
                    }
                    var levelIndex = reportdef.levels.indexOf(node.level);

                    //pad the left level columns with empty cells
                    for (i = 0; i < levelIndex; i++) {
                        table.add({
                            html: "&nbsp;"
                        });
                    }

                    if (levelIndex < reportdef.levels.length - 1) {
                        //add a level header row
                        table.add({
                            html: node.text,
                            cellCls: 'header',
                            colspan: reportdef.fields.length - levelIndex
                        });
                    } else {
                        //bottom level
                        table.add({
                            html: node.text
                        });
                        $.each(reportdef.fields, function (index, field) {
                            if (reportdef.levels.indexOf(field) == -1) {


                                if (reportdef.sums.indexOf(field) > -1 && node[field] == null) {
                                    value = 0;
                                } else {
                                    var value = node[field] == null ? "&nbsp;" : node[field];
                                }

                                if (typeof value == 'number') {
                                    value = Math.round(value);
                                }
                                table.add({
                                    html: value.toString()
                                });
                            }

                        });
                    }

                    if (node.level && reportdef.levels.indexOf(node.level) < reportdef.levels.length - 1) {
                        if (reportdef.levels.indexOf(node.level) == reportdef.levels.length - 2) {
                            //add subheader above detail rows
                            for (i = 0; i < levelIndex + 1; i++) {
                                table.add({
                                    html: "&nbsp;"
                                });
                            }
                            table.add({
                                html: reportdef.headers[levelIndex + 1],
                                colspan: reportdef.levels.length - levelIndex - 1,
                                cellCls: 'header'
                            });
                            for (i = reportdef.levels.length; i < reportdef.headers.length; i++) {
                                table.add({
                                    html: reportdef.headers[i],
                                    cellCls: 'header'
                                });
                            }

                            that.buildTable(node.children, table, reportdef);

                            var parentText = node.text;
                            var parent = node.parent;
                            while (parent != null && parent.text != null) {
                                parentText = parent.text;
                                parent = parent.parent;
                            }

                            //add subtotal row
                            for (i = 0; i < levelIndex + 1; i++) {
                                table.add({
                                    html: "&nbsp;"
                                });
                            }
                            table.add({
                                html: parentText.indexOf('All') == 0 ? "Total" : "Subtotal",
                                cellCls: 'subtotal'
                            });
                            $.each(reportdef.fields, function (index, field) {
                                if (reportdef.levels.indexOf(field) == -1) {

                                    var value = node[field] == null ? "&nbsp;" : node[field];
                                    if (typeof value == 'number') {
                                        value = Math.round(value);
                                    }
                                    table.add({
                                        html: value.toString(),
                                        cellCls: 'subtotal'
                                    });
                                }
                            });
                        } else {
                            that.buildTable(node.children, table, reportdef);
                        }
                    }
                });
            },

            print: function () {
                var printOutput = $('<div></div>');

                $('#tabs ul > li > a').each(function (index, tab) {
                    var tabTitle = $(tab).find('span').text();
                    var chartDivId = tab.href.split('#')[1];
                    var reportNode = $('#' + chartDivId).clone();
                    $(reportNode).show();
                    printOutput.append(reportNode);
                });

                var popupWin = window.open('', '_blank', 'width=800,height=600');
                popupWin.document.open()
                popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + printOutput.html() + '</html>');
                popupWin.document.close();
            },

        };


    });