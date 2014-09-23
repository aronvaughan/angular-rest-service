# angular-rest-service

angular lib for create typical rest service (create/read/readAll/update/delete),
allows for mocking for quick UI development, is similar to a BackBone model in how it binds to REST

## Getting Started

Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/aronvaughan/angular-rest-service/master/dist/angular-rest-service.min.js
[max]: https://raw.github.com/aronvaughan/angular-rest-service/master/dist/angular-rest-service.js

1. Include the `angular-rest-service.js` script provided by this component into your app's webpage.

In your web page:

```html
  <script src="../../bower_components/angular/angular.js"></script>
  <script src="../../bower_components/angular-logging/dist/angular-logging.min.js"></script>
  <script src="../../bower_components/lodash/dist/lodash.compat.js"></script>
  <script src="../../bower_components/angular-resource/angular-resource.js"></script>
  <!-- endbower -->
  <!-- endbuild -->

  <!-- build:js scripts/app.min.js -->
  <script src="../angular-rest-service.js"></script>
```
this project depends on lodash or underscore, angular-logging, angular and the angular-resource .js libraries

2. Develop your UI quickly - with mock services!


### Define your new service
In your app.js (or another service file):

```js
myApp.factory('nameService', function($rootScope, $resource, avLog) {
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
```

this code creates a service called nameService that can be injected into any angular code and does the following (see example app
and tests bundled with this bower component for full examples):

1. nameService.getAll({ }) - will GET /names/  will return a collection of all the names found (in the default case the 2 mock instances)
2. nameService.get({ id: <id> }) - will GET /names/:id and will return the name with the given id
3. nameService.save(newName, {})  - newName is defined as { name: 'myName' } - will do a POST /names and will create a new entry in the names mock list
4. nameService.save(updateName, {}) - updateName is defined as {id: 1, name: 'myNameUpdated'} - will do a PUT /names/1 and update the entry in the mock list
5. nameService.delete(id) - will do a DELETE /names/:id and remove the name from the mock list

### Use the service
```js
angular.module('myApp').controller('testController', ['$scope', 'nameService',
    function($scope, nameService) {

        $scope.mockNames = nameServiceMock.getAll({});

```

will set the 'mockNames' scope variable to be the set of mocked entries defined on the creation of your service

### Filtering

the getAll call will also filter in mock mode i.e.
```js
nameService.getAll({name: 'Charlie Brown'}) //will only return entries that have the name Charlie Brown
```
current it only supports full matching

3. When you have the backend ready - use the real remote service

In you app.js:

```js
myApp.factory('nameService', function($rootScope, $resource, avLog) {
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
    //remove mock mode so it uses real remote
    serviceContainerConfig.mockMode = false;
    return serviceContainerConfig.createService();
});
```

simply remove or set mockMode == false to make actual rest calls to remote service (see express/node server example included in this code)


## Documentation

## Examples
See getting started
See also tests in this github project
See example in source code

## Changelog

### v 0.0.2

* initial release

### v 0.0.3

* add custom init method for easy overriding

### v 0.0.4

* fix minification error where custom initialize wasn't being called on minified version

### v 0.0.5

* fix defect where events are only sent if you have a custom method defined
* events are now sent for EVERY action
* failure events are now sent for every unsuccessful action as well

### v 0.0.6

* debug log events before sending - make it easier for clients to pick up events
* send params on post ngResource calls

### v 0.0.7
* send params on delete and put ngResource calls

### v 0.0.8
* add successCallback and failureCallback to all remote calls

## TODO

* figure out integration tests (angular only allows unit or functional)

## Resources

initial grunt workspace generated by angular-component

* http://stackoverflow.com/questions/19614545/how-can-i-add-some-small-utility-functions-to-my-angularjs-application
* http://stackoverflow.com/questions/15666048/angular-js-service-vs-provider-vs-factory
* http://briantford.com/blog/angular-bower

## Contributing

download the full source....

1. install npm and grunt
2. cd to root of project checkout

to test

1. grunt test

to see the example app

1. grunt serve
2. make sure you have developer tools/firebug, etc.. open so you can see console logs

