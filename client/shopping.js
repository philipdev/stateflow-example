var StateFlow = require('stateflow').StateFlow;


module.exports.create = function() {
    return new StateFlow({
        home: {
            type: 'begin',
            action: function () {
                this.get('page').setPage('pages/home.html'); // maybe a use case to have custom StateObjects?
                this.get('page').set('featuredProducts', this.get('shop').products); // actually would like to set this to the inner scope, if there is such thing
                this.onStateActive('page', 'details', function (id) {
                    this.parent.emit('selectProduct', id);
                    this.emit('details');
                });
            },
            on: {
                'page.list': 'list',
                'details': 'details',
                'page.checkout': 'checkout'
            }
        },
        
        list: {
            action: function () {
                this.get('page').setPage('pages/list.html');
                this.get('shop').updateProducts(); // update products

                this.onStateActive('page', 'addItems', function (id, count) {
                    // current item
                    console.log('addItems', id, count);
                    this.get('shop').addBasketItem(id, count);
                });
                this.onStateActive('page', 'removeItems', function (id, count) {
                    console.log('removeItems', id, count);
                    this.get('shop').removeBasketItem(id, count);
                });

                this.installTimeout(10000, function () {
                    this.emit('timeout');
                    this.get('scope').$apply();
                });

                this.onStateActive('page', 'activity', function () {
                    this.installTimeout(); // keep the page alive
                });

                this.onStateActive('page', 'details', function (id) {
                    console.log('details',id);
                    this.parent.emit('selectProduct', id);
                    this.emit('details');
                });
            },
            on: {
                'details':'details',
                'page.checkout': 'checkout',
                'page.home': 'home',
                'timeout': 'home'
            }
        },
        details: {
            initialize: function() {
                console.log('initialized!');
                this.onFlowActive('page','details', function(id) {
                    var self = this;
                    console.log('selected product', id);

                    this.get('shop').getProductById(id, function (e, product) {
                        if(product) {
                            self.selectedProduct = product;
                            self.get('page').set('product', product);
                            self.get('shop').emit('productAvailable', product);
                        }
                    });
                });
                this.on('exit', function() {
                    delete this.selectedProduct;
                    this.get('page').set('product', undefined);
                });
            },
            action: function (complete) { // TODO: allow array of action's.
                this.get('page').setPage('pages/details.html');
                if(!this.selectedProduct) { // double data with page.set('product'), must be avoided!
                    this.installTimeout(1000, function() {
                        complete('timeout');
                        this.get('scope').$apply();
                    });
                    this.onStateActive('shop', 'productAvailable', function () {
                        this.cancelTimeout();
                        console.log('product available!');
                        this.get('scope').$apply();
                    });
                }

                this.onStateActive('page', 'addItems', function (id, count) {
                    this.get('shop').addBasketItem(id, count, function () {
                        // ignored!
                    });
                });
                this.onStateActive('page', 'removeItems', function (id, count) {
                    this.get('shop').removeBasketItem(id, count, function () {
                        // ignored!
                    });
                });

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
                    type: 'begin',
                    action: function (complete) {
                        this.get('page').setPage('pages/orderDetails.html'); // still can add remove items
                        this.onStateActive('page', 'removeItem', function (id, count) {
                            this.get('shop').removeBasketItem(id, count);
                        });
                        this.onStateActive('page', 'addItem', function (id, count) {
                            this.get('shop').addBasketItem(id, count);
                        });
                    },
                    on: {
                        'page.cancel': 'cancelOrder',
                        'page.more': 'continueShopping',
                        'page.proceed': 'enterDetails'
                    }
                },
                enterDetails: {
                    page: 'pages/orderCustomerDetails.html',
                    action: 'setPage',
                    timeout: 10000,
                    on: {
                        'page.back': 'overview',
                        'page.proceed': 'confirm',
                        'page.cancel': 'cancelOrder',
                        'page.more': 'continueShopping',
                        'timeout': 'cancelOrder'
                    }
                },
                confirm: {
                    page: 'pages/orderConfirm.html',
                    action: 'setPage',
                    timeout: 10000,
                    on: {
                        'page.back': 'enterDetails',
                        'page.confirm': 'showResults', // todo process order, then showResults
                        'page.cancel': 'cancelOrder',
                        'timeout': 'cancelOrder'
                    }
                }, // TODO: process order: validate card etc.
                showResults: {
                    page: 'pages/orderResult.html',
                    action: 'setPage',
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
                    action: function () {
                        this.get('shop').cancelOrders();
                        this.get('page').setPage('pages/orderCancelled.html');
                        this.installTimeout(5000, function() {
                            this.emit('cancel');
                            this.get('scope').$apply();
                        });
                        this.onStateActive('page','home','cancel');

                        //cb('cancel');
                    }
                },
                finish: {
                    type: 'end',
                    action: function (complete) {
                        this.get('shop').cancelOrders();
                        complete('finish');
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
};








