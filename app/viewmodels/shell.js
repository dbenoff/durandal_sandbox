define(['plugins/router', "durandal/app"], function (router, app) {
    return {
        router: router,

        search: function() {
            app.showMessage("Not Implemented", "Error");
        },

        activate: function () {
            router.map([
                { route: '', moduleId: 'viewmodels/home', title: "Home", nav: true },
                { route: 'queryconfig', moduleId: 'viewmodels/queryconfig', nav: true, title: "Query launcher!" },
                { route: 'queryresults', moduleId: 'viewmodels/queryresults', nav: true, title: "Query results" },
                { route: 'pivottable', moduleId: 'viewmodels/pivottable', nav: true, title: "Reports" },
                { route: 'charts', moduleId: 'viewmodels/charts', nav: true, title: "Charts" },
                /*{durandal:routes}*/
            ]).buildNavigationModel();
            
            return router.activate();
        }
    };
});