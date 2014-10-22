define(
    function () {
        return {
            'Assets' :{
                type: 'bar',
                headers: ['Jurisdiction', 'Functional Class', 'Miles', 'Lane Miles'],
                fields: ['Jurisdiction', 'FunctionalClass', 'Length', 'LaneMiles'],
                levels: ['Jurisdiction', 'FunctionalClass'],
                sums: ['Length', 'LaneMiles'],
                averages: [],
                tabs: ['Roads', 'Bridges'],
                dataKeys: ['RouteFeatureResults', 'BridgeFeatureResults'],
            }
        };
});
