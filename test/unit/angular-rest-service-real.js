'use strict';

describe('Module: myApp', function() {
    this.nameServiceReal = undefined;
    this.$log = undefined;
    this.$httpBackend = undefined;

    // load the controller's module
    beforeEach(module('myApp'));
    //beforeEach(module('ngMockE2E'));

    beforeEach(inject(function(nameServiceReal, $httpBackend, $log) {
        this.nameServiceReal = nameServiceReal;
        this.$log = $log;
        this.$httpBackend = $httpBackend;
        console.log('real service injected', nameServiceReal.serviceName, $httpBackend);
    }));

    afterEach(function() {
        //scope.$destroy();
    });

    it('should correctly go a GET on a getAll', inject(function() {

        //check that injection works
        expect(this.nameServiceReal).toBeDefined();

        //setup expectations
        this.$httpBackend.whenGET('/names').respond([{
            id: 1,
            name: 'banana'
        }]);

        //fetch the default log level
        var realValues = this.nameServiceReal.getAll({ /*no params*/ });

        this.$httpBackend.flush();
    }));

    it('should correctly go a GET on a get', inject(function() {

        //check that injection works
        expect(this.nameServiceReal).toBeDefined();

        //setup expectations
        this.$httpBackend.whenGET('/names/1').respond({
            id: 1,
            name: 'banana'
        });

        //fetch the default log level
        var realValues = this.nameServiceReal.get({
            id: 1
        });

        this.$httpBackend.flush();
    }));

    it('should correctly handle a real create', inject(function() {

        var newValue = {
            name: 'Red'
        };

        //setup expectations
        this.$httpBackend.whenPOST('/names').respond(newValue);

        var returnedValue = this.nameServiceReal.save(newValue, {});
        console.log('$log.debug.logs', this.$log.debug.logs);

        this.$httpBackend.flush();

        /*
        waitsFor(function() {
            return returnedValue.$resolved;
        }, 'promise to be resolved', 8000);
        */
    }));

    it('should correctly handle a real update', inject(function() {

        var newValue = {
            id: 34,
            name: 'Red'
        };

        //setup expectations
        this.$httpBackend.whenPUT('/names/34').respond(newValue);

        var returnedValue = this.nameServiceReal.save(newValue, {});
        console.log('$log.debug.logs', this.$log.debug.logs);

        this.$httpBackend.flush();

        /*
         waitsFor(function() {
             return returnedValue.$resolved;
         }, 'promise to be resolved', 8000);
         */
    }));

    it('should correctly handle a real delete', inject(function() {

        //setup expectations
        this.$httpBackend.whenDELETE('/names/1').respond({
            id: 1
        });

        var returnedValue = this.nameServiceReal.delete(1);
        console.log('$log.debug.logs', this.$log.debug.logs);

        this.$httpBackend.flush();
    }));
});
