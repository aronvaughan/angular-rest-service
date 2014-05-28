angular.module('myApp').controller('testController', ['$scope', 'avLog', 'nameServiceReal', 'nameServiceMock', '$rootScope',
    function($scope, avLog, nameServiceReal, nameServiceMock, $rootScope) {

        var self = this;
        var logger = avLog.getLogger('testController');

        $scope.mockNames = nameServiceMock.getAll({});

        $scope.realNames = nameServiceReal.getAll({});

        $scope.name = "";

        $scope.addName = function() {
            logger.debug("add name called ", $scope.name);
            nameServiceMock.save({
                id: _.uniqueId(),
                name: $scope.name
            }, {});
            nameServiceReal.save({
                id: _.uniqueId(),
                name: $scope.name
            }, {});
        };

        //example of calling an extended service method
        $scope.sayHello = function(name) {
            logger.debug("say hello caled!", name);
            return nameServiceReal.sayHello(name);
        };

        //example of listening to events
        $rootScope.$on('SERVICE.NAMESERVICEREAL.SAVED', function(event, name) {
            logger.debug("updating list view for saved names", name);
            $scope.realNames.push(name);
        });

        $rootScope.$on('SERVICE.NAMESERVICEREAL.DELETED', function(event, id) {
            logger.debug("updating list view for deleted names", id);
            $scope.realNames = _.without($scope.realNames, _.findWhere($scope.realNames, {
                id: id
            }));
        });

        $scope.deleteName = function(id) {
            logger.debug("delete name called", id);
            nameServiceReal.delete(id);
            //nameServiceMock.delete(id);
            //$scope.realNames.splice(_.findIndex($scope.realNames, {id: id}),1);
        }

    }
]);
