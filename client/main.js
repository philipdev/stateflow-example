var Page = require('./Page');
var Shop = require('./Shop');

var angular = require('angular');

var appModule = angular.module('shop',[]);
appModule.factory('shop', ['$rootScope',
    function ($rootScope) {
        $rootScope.shop = new Shop();
        return $rootScope.shop;
    }
]);

function createShopFlow(scope, shop, page) {
    var shopping = require('./shopping').create();
    shopping.set('page', page); // replace with dependenc
    shopping.set('shop', shop);
    shopping.set('sync', {
        update: function() {
            scope.$apply();
        }
    });
    shopping.registerAction('setPage', function (complete) {

        this.get('page').setPage(this.config.page);
        if(this.config.timeout) {
            this.installTimeout(this.config.timeout, function() {
                complete('timeout');
                this.get('scope').$apply();
            });
            this.onStateActive('page', 'activity', function () {
                /// this.installTimeout(); // not working needs fixing
                this.installTimeout(this.config.timeout);
                console.log('activity extend timeout');
            });
        }
    });
    return shopping;
}

appModule.controller('ShopController', ['$scope', 'shop',  function($scope, shop) {
    var flow, page = new Page($scope);

    flow = createShopFlow($scope, shop, page);
    flow.set('scope',$scope);
    flow.start(angular.noop);
}]);

