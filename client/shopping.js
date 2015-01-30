var StateFlow = require('stateflow').StateFlow;
var Page = require('./Page');
var Shop = require('./Shop');
var angular = require('angular');

module.exports = function() {
    'use strict';

    function shoppingFlowFactory($rootScope, shop, page) {
        var shopping = new StateFlow({
            home: {
                type: 'begin',
                action: function (complete) {
                    this.get('page').setPage('pages/home.html'); // maybe a use case to have custom StateObjects?

                    this.listenTo('page', 'details', function(id){
                        this.parent.set('currentProduct', id);
                        complete('details');
                    });
                },
                on: {
                    'page.list': 'list',
                    'details': 'details',
                    'page.checkout': 'checkout'
                }
            },
            list: {
                action: function (complete) {
                    this.get('page').setPage('pages/list.html');
                    this.get('shop').updateProducts(); // update products

                    this.listenTo('page', 'addItems', function (id,count) {
                        // current item
                        console.log('addItems',id,count);
                        this.get('shop').addBasketItem(id, count);
                    });
                    this.listenTo('page', 'removeItems', function (id,count) {
                        console.log('removeItems',id,count);
                        this.get('shop').removeBasketItem(id, count);
                    });

                    this.installTimeout(10000, function() {
                        complete('timeout');
                        $rootScope.$apply();
                    });

                    this.listenTo('page', 'activity', function() {
                        this.installTimeout(); // keep the page alive
                    });

                },
                on: {
                    'page.details': 'details',
                    'page.checkout': 'checkout',
                    'page.home': 'home',
                    'timeout': 'home'
                }
            },
            details: {
                action: function (complete) {
                    if(!this.get('currentProduct')) {
                        console.error('details:', 'no currentProduct defined!');
                        complete('page.home');
                    } else {
                        this.get('page').setPage('pages/details.html');
                        this.listenTo('page', 'addItem', function (id, count) {
                            this.get('shop').addBasketItem(id, count, function () {
                                // ignored!
                            });
                        });
                    }
                },
                on: {
                    'page.checkout': 'checkout',
                    'page.home': 'home',
                    'page.list': 'list',
                    'timeout': 'home'
                }
            },
            checkout: {
                action: { // aka subflow
                    overview: {
                        type:'begin',
                        action: function (complete) {
                            this.get('page').setPage('pages/orderDetails.html'); // still can add remove items
                            this.listenTo('page','removeItem', function(id,count) {
                                this.get('shop').removeBasketItem(id,count);
                            });
                            this.listenTo('page','addItem', function(id,count) {
                                this.get('shop').addBasketItem(id,count);
                            });
                        },
                        on: {
                            'page.cancel': 'cancelOrder',
                            'page.more': 'continueShopping',
                            'page.proceed':'enterDetails'
                        }
                    },
                    enterDetails: {
                        action: function (cb) {
                            this.get('page').setPage('pages/orderCustomerDetails.html'); // address, credit card, etc.
                        },
                        on: {
                            'page.back':'overview',
                            'page.proceed': 'confirm',
                            'page.cancel': 'cancelOrder',
                            'page.more': 'continueShopping'
                        }
                    },
                    confirm: {
                        action: function (cb) {
                            this.get('page').setPage('pages/orderConfirm.html');
                        },
                        on: {
                            'page.back':'enterDetails',
                            'page.confirm': 'showResults', // todo process order, then showResults
                            'page.cancel': 'cancelOrder'
                        }
                    }, // TODO: process order: validate card etc.
                    showResults: {
                        action: function (cb) {
                            this.get('page').setPage('pages/orderResult.html');

                            //cb('finish');
                        },
                        on: {
                            'page.finish': 'finish'
                        }
                    },
                    continueShopping: { // customer want's to continue
                        type: 'end',
                        action: function (cb) {
                            cb('continue');
                        }
                    },
                    cancelOrder: { // customer want's clear the basket.
                        type: 'end',
                        action: function (cb) {
                            this.get('page').setPage('pages/cancelOrder.html');

                            cb('cancel');
                        }
                    },
                    finish: {
                        type: 'end',
                        action: function (cb) {
                            cb('finish');
                        }
                    }
                },
                on: {
                    cancel: 'home',
                    'continue': 'list',
                    finish: 'home'
                }
            }
        });
        shopping.set('page', page); // replace with dependenc
        shopping.set('shop', shop);

        return shopping;
    }
    // StateController?
    var appModule = angular.module('shop',[]);
    appModule.factory('shop', ['$rootScope',
        function ($rootScope) {
            $rootScope.shop = new Shop();
            return $rootScope.shop;
        }
    ]);
    appModule.factory('page', ['$rootScope',
        function ($rootScope) {
            return new Page($rootScope);
        }
    ]);

    appModule.factory('shopping', ['$rootScope','shop','page', shoppingFlowFactory]);
    appModule.controller('PageController', ['$scope','page', function($scope, page){
        $scope.send = function(event, data) {
            page.emit.apply(page,arguments);
        }
    }]);
    appModule.controller('OrderDetailsController', [
        '$scope',
        'shop',
        function ($scope,shop) {
            shop.listBasketItems(function(list) {
                $scope.basketItems = list;
            });
        }
    ]);

    appModule.run( ['shopping',function(shopping) {
        shopping.start(function() {

        });
    }]);
};





