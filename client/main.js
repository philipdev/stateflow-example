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
    shopping.registerAction('setPage', function () {
        this.get('page').setPage(this.config.page);
    });
    return shopping;
}

appModule.controller('ShopController', ['$scope', 'shop',  function($scope, shop) {
    var flow, page = new Page($scope);

    flow = createShopFlow($scope, shop, page);
    flow.set('scope',$scope);
    flow.start(angular.noop);
}]);

