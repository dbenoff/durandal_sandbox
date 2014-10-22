﻿define(['plugins/router', "durandal/app"], function (router, app) {
    return {
        router: router,

        search: function () {
            app.showMessage("Not Implemented", "Error");
        },

        activate: function () {
            router.map([
                { route: '', moduleId: 'viewmodels/home', title: "Home", nav: true },
                { route: 'queryconfig', moduleId: 'viewmodels/queryconfig', nav: true, title: "Select" },
                { route: 'queryresults', moduleId: 'viewmodels/queryresults', nav: true, title: "Results" },
                { route: 'charts', moduleId: 'viewmodels/charts', nav: true, title: "Charts" },
                { route: 'pivottable', moduleId: 'viewmodels/pivottable', nav: true, title: "Reports" },
                /*{durandal:routes}*/
            ]).buildNavigationModel();

            return router.activate();
        }
    };
});