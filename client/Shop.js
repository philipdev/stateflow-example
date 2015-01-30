/**
 * Created by Philip Van Bogaert on 30-1-2015.
 */
var util = require('util');
var EventEmitter = require('events').EventEmitter;


function Shop() {
    this.products = [
        {
            id:1,
            name:'Product1',
            price:50.0
        },
        {
            id:2,
            name:'Product2',
            price:50.0
        },
        {
            id:3,
            name:'Product3',
            price:50.0
        }
    ];
    this.basket = []; // item= {count:,product:}
}
util.inherits(Shop, EventEmitter);

Shop.prototype.findProduct = function (array, id) {
    var result = array.filter(function(e) {
        return e.id === id;
    });
    if(result.length > 0) {
        return result[0];
    }
};

Shop.prototype.addBasketItem = function (id, count, cb) {
    var product;
    product = this.findProduct(this.basket, id);
    if(product) {
        product.orderedItems+=count;
    } else {
        product = this.findProduct(this.products, id);
        if(product) {
            product.orderedItems = count;
            this.basket.push(product);
        }
    }
};

Shop.prototype.removeBasketItem = function (id, count, cb) {
    var index, product = this.findProduct(this.basket, id);

    if(product.orderedItems !== undefined && product.orderedItems > count) {
        product.orderedItems -=count;
    } else {
        product.orderedItems = 0;
        index = this.basket.indexOf(product);
        this.basket.splice(index,1);
    }
};

Shop.prototype.updateBasketItems = function (cb) {
};

Shop.prototype.updateProducts = function (cb) {

};

Shop.prototype.getProductById = function (id, cb) {
    cb(undefined,this.findProduct(this.products, id));
};

module.exports = Shop;