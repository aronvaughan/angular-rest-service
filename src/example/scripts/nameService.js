myApp.factory('nameServiceMock', function($rootScope, $resource, avLog) {
    // mock data to be used as the model
    var mockData = [{
        "id": 0,
        "name": "Charlie Brown"
    }, {
        "id": 1,
        "name": "Snoopy"
    }, ];
    //real rest url when not in mock mode - defines id 'finding' for mock mode
    var resourceUrl = "/names/:id";
    //wire up the config with the minimum necessary dependencies
    var serviceContainerConfig = new ServiceContainerConfig("nameServiceMock", resourceUrl, mockData, $rootScope, $resource, avLog);
    //put it in mock mode so it bypasses real rest calls
    serviceContainerConfig.mockMode = true;
    return serviceContainerConfig.createService();
});

myApp.factory('nameServiceReal', function($rootScope, $resource, avLog) {
    var mockData = [];
    var resourceUrl = "/names/:id";
    var serviceContainerConfig = new ServiceContainerConfig("nameServiceReal", resourceUrl, mockData, $rootScope, $resource, avLog);

    serviceContainerConfig.serviceExtend = {
        sayHello: function(name) {
            return "hello " + name + " !!!!!";
        }
    };
    return serviceContainerConfig.createService();
});
