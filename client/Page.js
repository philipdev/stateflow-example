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

    scope.userActivity = function() {
        self.emit('activity');
    };

    scope.removeListener = function (name, listener) {
        var namedListeners = this.$$listeners[name];
        if (namedListeners) {
            // Loop through the array of named listeners and remove them from the array.
            for (var i = 0; i < namedListeners.length; i++) {
                if (namedListeners[i] === listener) {
                    return namedListeners.splice(i, 1);
                }
            }
        }
    };

    this.on('addListener', function(event, listener) {
        scope.$on(event,listener);
    });


    this.on('removeListener', function(event, listener) {
        scope.removeListener(event,listener);
    });
}

util.inherits(Page, EventEmitter);

Page.prototype.setPage = function (url) {
    this.scope.pageTemplateUrl = url;
};

Page.prototype.set = function (key, value) {
  this.scope[key] = value;
};

module.exports = Page;
