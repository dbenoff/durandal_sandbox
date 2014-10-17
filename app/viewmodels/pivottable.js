define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'datatables', 'jquery-ui', 'reportsbase'],
    function (http, app, ko, jstree, bootstrap, datatables, jqueryui, reportsbase) {

        this.reportsbase = reportsbase;

    return {

        pivotTables: ko.observableArray([]),

        binding: function () {
            var that = this;
            $.get( "results.json",
                function(queryData) {

                    var requests = [];
                    var featureData = queryData['RouteFeatureResults'];

                    var reportRequest = {
                        type: 'bar',
                        results:featureData,
                        headers: ['Jurisdiction', 'Functional Class', 'Length', 'Lane Miles'],
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
                        headers: ['Jurisdiction', 'Functional Class', 'Length', 'Lane Miles'],
                        fields: ['Jurisdiction', 'FunctionalClass', 'Length', 'LaneMiles'],
                        levels: ['Jurisdiction', 'FunctionalClass'],
                        sums: ['Length', 'LaneMiles'],
                        averages: [],
                        title: 'Bridges'
                    };

                    requests.push(reportRequest);

                    that.selectReport(requests);
                });
        },

        compositionComplete: function (view, parent) {

            $("#tabs").tabs();
            $("#tabs").show();
        },

        selectReport: function (reportRequests) {

            if(typeof reportRequests.sort != 'function'){
                var arr = [];
                arr.push(reportRequests);
                reportRequests = arr;
            }
            var that = this;
            that.pivotTablesArray = [];
            $.each(reportRequests, function (index, reportRequest) {

                var featureData = reportRequest.results;

                $.each(featureData, function (index, feature) {
                    if(feature['Length'] && feature['NumberOfLanes']){
                        feature.LaneMiles  = feature['Length'] * feature['NumberOfLanes']
                    }else{
                        feature.LaneMiles = 0;
                    }
                });

                //get distinct values for each level
                var levelKeys = {};
                for(var i = 0; i < reportRequest.results.length; i++){
                    var row = reportRequest.results[i];
                    for (var j = 0; j < reportRequest.levels.length; j++){
                        var level = reportRequest.levels[j];
                        if (typeof(levelKeys[level]) == 'undefined'){
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
                that.buildReferenceTree(reportRequest, levelKeys, root, 0);

                for(var i = 0; i < reportRequest.results.length; i++) {
                    var row = reportRequest.results[i];
                    that.writeRowValuesToLeaf(reportRequest, root.children, row, 0);
                }

                var summaryGrid = {
                    cells: [],
                    add: function (cell) {
                        this.cells.push(cell);
                    }
                }


                var tree = root.children;
                //var tree = reportsbase.buildHierarchy(featureData, reportRequest);  //create the tree based on the levels defined in request
                that.buildTable(tree, summaryGrid, reportRequest);  //add the data to the table

                //now add a summary section below that aggregates by the second dimension
                var topLevel = reportRequest.levels.shift();
                tree = reportsbase.buildHierarchy(featureData, reportRequest);
                var summaryRoot = {};
                summaryRoot.level = topLevel;
                summaryRoot.text = "All " + topLevel + "s";
                summaryRoot.children = tree;

                that.buildTable(tree, summaryGrid, reportRequest);  //add the data to the table

                reportRequest.levels.unshift(topLevel);  //put the level back in so the column offsets are correct
                $.each(reportRequest.sums, function (index, sum) {
                    $.each(summaryRoot.children, function (index, child) {
                        if(!summaryRoot[sum]){
                            summaryRoot[sum] = 0;
                        }
                        summaryRoot[sum] = summaryRoot[sum] + child[sum];
                    });
                });

                that.buildTable(summaryRoot, summaryGrid, reportRequest);

                var columnCount = reportRequest.headers.length;
                var table = '<p class=\"reportheader\">ADOT&PF ' + reportRequest.title + ' By ' + reportRequest.headers[0] + ', Then By ' + reportRequest.headers[1];
                table = table.concat('<table class="gridtable"><tbody><tr>');
                var rowcount = 0;
                $.each(summaryGrid.cells, function (index, cell) {
                    table = table.concat('<td'
                        + (cell.cellCls ? ' class='+ cell.cellCls : '')
                        + (cell.colspan ? ' colspan='+ cell.colspan : '') + '>'
                        + (cell.html ? cell.html.toString() : '&nbsp;')+ '</td>');
                    rowcount = rowcount + (cell.colspan ? cell.colspan: 1);
                    if(rowcount % columnCount == 0){
                        table = table.concat('</tr><tr>');
                        rowcount = 0;
                    }
                });

                table.concat('</tr></tbody></table>');
                var pivotTable = {};
                pivotTable.html = table.toString()
                pivotTable.title = reportRequest.title;
                pivotTable.id = "pivotTable-" + index;
                that.pivotTablesArray.push(pivotTable);
            });

            this.pivotTables(this.pivotTablesArray);

        },

        buildReferenceTree: function(reportRequest, levelKeys, parentNode, depth){
            var levels = reportRequest.levels
            var thisLevelValues = Object.getOwnPropertyNames(levelKeys[levels[depth]]);
            thisLevelValues.sort();
            for(var i = 0; i < thisLevelValues.length; i++){
                var child = {};
                child.text = thisLevelValues[i];
                child.children = [];
                child.parent = parentNode;
                child.depth = depth;
                child.level = levels[depth];
                parentNode.children.push(child);
                if(depth + 1 < levels.length){
                    this.buildReferenceTree(reportRequest, levelKeys, child, depth + 1);
                }
            }
        },

        writeRowValuesToLeaf: function(reportRequest, tree, row, depth){
            var level = reportRequest.levels[depth];
            var levelValue = row[level];
            for(var i = 0; i < tree.length; i++){
                var child = tree[i];
                if(child.text == levelValue){
                    if(!child.children.length > 0){
                        for(var j = 0; j < reportRequest.sums.length; j++){
                            var sum = reportRequest.sums[j];
                            if(!child.hasOwnProperty(sum)){
                                child[sum] = 0;
                            }
                            this.addValue(child, sum, row);
                        }
                    }else{
                        this.writeRowValuesToLeaf(reportRequest, child.children, row, depth + 1);
                    }
                }
            }
        },

        addValue: function (child, sum, row) {
            if(!child.hasOwnProperty(sum)){
                child[sum] = 0;
            }
            child[sum] = Number(child[sum]) + Number(row[sum]);
            if(child.parent != null){
                this.addValue(child.parent, sum, row);
            }
        },

        buildTable: function (tree, table, reportRequest) {
            var that = this;
            $.each(tree, function (index, node) {
                var levelIndex = reportRequest.levels.indexOf(node.level);

                //pad the left level columns with empty cells
                for(i = 0; i < levelIndex; i++){
                    table.add({
                        html: "&nbsp;"
                    });
                }

                if(levelIndex < reportRequest.levels.length -1){
                    //add a level header row
                    table.add({
                        html: node.text,
                        cellCls: 'header',
                        colspan: reportRequest.fields.length - levelIndex
                    });
                }else{
                    //bottom level
                    table.add({
                        html: node.text
                    });
                    $.each(reportRequest.fields, function (index, field) {
                        if(reportRequest.levels.indexOf(field) == -1){


                            if(reportRequest.sums.indexOf(field) > -1 && node[field] == null){
                                value = 0;
                            }else{
                                var value = node[field] == null ? "&nbsp;" : node[field];
                            }

                            if(typeof value == 'number'){
                                value = Math.round(value);
                            }
                            table.add({
                                html: value.toString()
                            });
                        }

                    });
                }

                if(node.level && reportRequest.levels.indexOf(node.level) < reportRequest.levels.length - 1){
                    if (reportRequest.levels.indexOf(node.level) == reportRequest.levels.length - 2) {
                        //add subheader above detail rows
                        for (i = 0; i < levelIndex + 1; i++) {
                            table.add({
                                html: "&nbsp;"
                            });
                        }
                        table.add({
                            html: reportRequest.headers[levelIndex + 1],
                            colspan: reportRequest.levels.length - levelIndex - 1,
                            cellCls: 'header'
                        });
                        for (i = reportRequest.levels.length; i < reportRequest.headers.length; i++) {
                            table.add({
                                html: reportRequest.headers[i],
                                cellCls: 'header'
                            });
                        }

                        that.buildTable(node.children, table, reportRequest);

                        var parentText = node.text;
                        var parent = node.parent;
                        while(parent.text != null){
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
                        $.each(reportRequest.fields, function (index, field) {
                            if(reportRequest.levels.indexOf(field) == -1){

                                var value = node[field] == null ? "&nbsp;" : node[field];
                                if(typeof value == 'number'){
                                    value = Math.round(value);
                                }
                                table.add({
                                    html: value.toString(),
                                    cellCls: 'subtotal'
                                });
                            }
                        });
                    }else{
                        that.buildTable(node.children, table, reportRequest);
                    }
                }
            });
        }

    };


});