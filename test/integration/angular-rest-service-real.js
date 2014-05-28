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

        //provide $LogProvider
        var passIt = function(url) {
            console.log('pass it received, ', url);
            return true;
        };

        //HOLY CRAP - I REALLY DO WANT TO CALL THE REMOTE!!!!
        console.log('configuring http backend', $httpBackend);

        /* console.log('generic method', $httpBackend.when('GET', passIt));
        $httpBackend.when('GET', passIt).passThrough();
        var expectations = $httpBackend.whenGET(passIt);
        console.log('GET expect', expectations);
        expectations.passThrough();
        $httpBackend.whenPUT(passIt).passThrough();
        $httpBackend.whenPOST(passIt).passThrough();
        $httpBackend.whenDELETE(passIt).passThrough();
        console.log('http backend configured for passthrough');
        // $httpBackend: $HttpBackendProvider
        // $provide('$httpBackend', ng.$httpBackend);
        */
    }));

    afterEach(function() {
        //scope.$destroy();
    });

    it('should correctly go a GET on a getAll', inject(function() {

        //check that injection works
        expect(this.nameServiceReal).toBeDefined();

        //setup expectations
        /*
        this.$httpBackend.whenGET('/names').respond([{
            id: 1,
            name: 'banana'
        }]);
        */

        //fetch the default log level
        var realValues = this.nameServiceReal.getAll({ /*no params*/ });

        console.log('real values', realValues);
        expect(realValues).toEqual([]);

        /*
        waitsFor(function() {
            return realValues.$resolved;
        }, 'promise to be resolved', 8000);
        */

        //put a value
        var name = {
            name: 'hello'
        };
        var response = this.nameServiceReal.save(name, {});

        if (!response.$resolved) {
            waitsFor(function() {
                return response.$resolved;
            }, 'promise to be resolved', 8000);
        }
        console.log('response from save', response);
    }));

    /*
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
*/
});
