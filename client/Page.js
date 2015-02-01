/**
 * Created by Philip Van Bogaert on 30-1-2015.
 */
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Page(scope) {
    var self = this;
    this.scope = scope;
    this.scope.page = this;
    scope.pageEvent = function (event,data) {
        self.emit.apply(self,arguments);
    };
}

util.inherits(Page, EventEmitter);

Page.prototype.setPage = function (url) {
    this.scope.pageTemplateUrl = url;
};

Page.prototype.set = function (key, value) {
  this.scope[key] = value;
};

module.exports = Page;
