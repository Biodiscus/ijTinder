(function($) {
    var PLUGIN_NAME = "ijTinder";

    var _default_settings = {
        speed: "1.0",
        //minDragDistance: 250,
        minDragDistance: 150,
        returnAnimationTime: 100,
        lastAnimationSpeed: 500,
        lastAnimationForceDown: false // If you don't want the default tinder animation style and just want to force it to go down
    };

    // Private variables
    var start = {x: 0, y: 0};
    var mouse_down;

    var target;
    var target_bounds = {x: 0, y: 0};
    var self;
    var parent;
    var parent_height; // TODO: Can this be removed?

    function Plugin(element, settings) {
        this.element = element;
        this.settings = $.extend({}, _default_settings, settings); // Merge the settings and default settings
        this.name = PLUGIN_NAME;

        self = this;

        this.init(element);
    }

    Plugin.prototype = {
        init: function(element) {
            target = $(element).find("li");
            console.log(target);

            parent = target.parent();
            parent_height = parent.height();

            target_bounds = {
                x: cssToNumber(target.css("left")),
                y: cssToNumber(target.css("top")),
                w: cssToNumber(target.css("width")),
                h: cssToNumber(target.css("height"))
            };

            target.on("mousedown mouseup mousemove", this.mouseEvent);
            target.on("touchstart touchend touchmove", this.touchEvent);
        },
        like: function() {
            if(self.settings.like) {
                self.settings.like.call();
            }
        },
        dislike: function() {
            if(self.settings.dislike) {
                self.settings.dislike.call();
            }
        },
        remove: function(obj) {
            // How to remove the object, the default is the standard jQuery function
            if(self.settings.remove) {
                self.settings.remove.call(obj);
            } else {
                obj.remove();
            }
        },
        touchEvent: function(e) { // Create a fake Event object, send that object to the mouseEvent function
            e.preventDefault();

            var _touch = e.originalEvent.changedTouches[0];
            var _x = _touch.pageX;
            var _y = _touch.pageY;
            var _type = "mousemove";

            if (e.type === "touchstart") {
                _type = "mousedown";
            } else if (e.type === "touchend") {
                _type = "mouseup";
            }


            var _fake_event = new Object();
            _fake_event.type = _type;
            _fake_event.pageX = _x;
            _fake_event.pageY = _y;
            _fake_event.preventDefault = function () {};


            self.mouseEvent.call(this, _fake_event);
        },
        mouseEvent: function(e) {
            e.preventDefault();
            var _self = $(this);

            var _x = e.pageX;
            var _y = e.pageY;

            if(e.type === "mousedown") {
                mouse_down = true;
                start.x = _x;
                start.y = _y;
            }  else if(e.type === "mouseup") {
                mouse_down = false;

                // Calculate the distance from the starting point and now
                var _end = {
                    x: _x - start.x,
                    y: _y - start.y
                };

                var _distance = distance(target_bounds, _end);

                // Only if the target is in the given bounds
                if(_distance > self.settings.minDragDistance) {
                    var _dif_x = _end.x - target_bounds.x;
                    var _dif_y = _end.y - target_bounds.y;
                    var _angle = angle({x: 0, y: 0}, {x: _dif_x, y: _dif_y});

                    var _left = target_bounds.x - Math.cos(_angle) * (_distance + 200);
                    var _top = target_bounds.y - Math.sin(_angle) * (_distance + 200);


                    // Reset the position
                    if(self.settings.lastAnimationForceDown) {
                        _top = parent_height;
                        _left = 0;
                    }

                    _self.animate({left: _left+"px", top: _top+"px", opacity: 0}, self.settings.lastAnimationSpeed, function() {
                        // Check if it's a like or dislike
                        var _sign_x = Math.sign(_dif_x);

                        if(_sign_x === 1) {
                            self.like();
                        } else {
                            self.dislike();
                        }

                        self.remove(_self);
                    });
                } else {
                    // Reset the position
                    _self.animate({
                        transform: "rotate(0deg)",
                        left: "0px",
                        top: "0px"
                    }, self.settings.returnAnimationTime);
                }
            } else if(e.type === "mousemove") {
                if(mouse_down) {
                    var _dif = {
                        x: (_x - start.x),
                        y: (_y - start.y)
                    };

                    // Only if the user is in the distance bounds
                    _self.css("left", target_bounds.x + _dif.x);
                    _self.css("top", target_bounds.y + _dif.y);

                    var _distance = _dif.x / 30;

                    _self.css("transform", "rotate("+_distance+"deg)");
                }
            }
        }
    };

    function angle(start, end) {
        var _dx = start.x - end.x;
        var _dy = start.y - end.y;

        return Math.atan2(_dy, _dx);
    }

    function distance(start, end) {
        var _dx = start.x - end.x;
        var _dy = start.y - end.y;

        return Math.sqrt(_dx * _dx + _dy * _dy);
    }

    function cssToNumber(css) {
        css = css.replace("px", "");
        return parseFloat(css);
    }

    // Register the ijTinder function
    $.fn[PLUGIN_NAME] = function(settings) {
        this.each(function() {
            if(!$.data(this, "plugin_"+PLUGIN_NAME)) {
                $.data(this, "plugin_"+PLUGIN_NAME, new Plugin(this, settings));
            } else if(!$.isFunction(Plugin.prototype[settings])) {
                $.data(this, "plugin_"+PLUGIN_NAME[settings])();
            }
        });

        return this;
    };
}(jQuery));