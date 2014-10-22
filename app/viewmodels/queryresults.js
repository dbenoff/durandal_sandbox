define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'jquery-ui', 'datatables', 'jquery-ui', 'appstate', 'plugins/router', 'tabledefs'],
    function (http, app, ko, jstree, bootstrap, jqueryui, datatables, jqueryui, appstate, router, tabledefs) {

        return {
            displayName: 'Query Results',

            configuredTables: ko.observableArray([]),

            activate: function () {
                var data = appstate.queryResults;
                var queryName = appstate.queryName;
                var configuredTables = [];
                if(data && queryName){
                    var tabledef = tabledefs[queryName];
                    $(tabledef.tabs).each(function (index, tabname) {
                        var dataKey = tabledef.dataKeys[index];
                        if (data[dataKey] && data[dataKey].length > 0) {
                            var table = {};
                            table.title = tabname;
                            table.data = data[dataKey];
                            table.columnDefs = tabledefs[dataKey];
                            table.id = index;
                            configuredTables.push(table);
                        }
                    });
                }
                if (configuredTables.length < 1) {
                    app.showMessage('No results available to display, please execute a query.', 'Error').then(function(dialogResult){
                        router.navigate('queryconfig');
                    });
                    return;
                }
                this.configuredTables(configuredTables);

            },

            compositionComplete: function () {

                $("#tabs").show();

                $("#tabs").tabs({
                    "activate": function (event, ui) {
                        var table = $.fn.dataTable.fnTables(true);
                        if (table.length > 0) {
                            $(table).dataTable().fnAdjustColumnSizing();
                        }
                    }
                });

                $(this.configuredTables()).each(function (index, table) {

                    $('#' + table.id + '_table').dataTable({
                        "sScrollY": "600px",
                        "aoColumnDefs": [
                            { "sWidth": "10%", "aTargets": [ -1 ] }
                        ],
                        "data": table.data,
                        "columns": table.columnDefs
                    });
                });


                //$("#tabs").tabs({ active: 0 });

            },

            showWarning: function (message) {
                $("#div-dialog-warning-message").html(message)
                $("#div-dialog-warning").dialog({
                    buttons: {
                        "Ok": function () {
                            $(this).dialog("close");
                        }
                    },
                    dialogClass: "error",
                    modal: true,
                    resizable: false,
                    title: 'Error'
                });
            }
        };
    });