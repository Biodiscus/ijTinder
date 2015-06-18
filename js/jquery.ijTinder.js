(function($, body) {
    var PLUGIN_NAME = "ijTinder";

    var _default_settings = {
        likeIcon: null, // The icon that is displayed in the right top
        dislikeIcon: null, // The icon that is displayed in the left top
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
    var current_target;

    function Plugin(element, settings) {
        this.element = element;
        this.settings = $.extend({}, _default_settings, settings); // Merge the settings and default settings
        this.name = PLUGIN_NAME;

        self = this;

        this.init(element);
        this.setCurrentTarget();
    }

    Plugin.prototype = {
        setCurrentTarget: function() {
            target = $(self.element).find("li");

            current_target = $(target[target.length - 1]).last();

            self.like_button = current_target.find(self.settings.likeIcon);
            self.dislike_button = current_target.find(self.settings.dislikeIcon);

            target_bounds = {
                x: current_target.position().left,
                y: current_target.position().top,
                w: cssToNumber(current_target.css("width")),
                h: cssToNumber(current_target.css("height"))
            };

        },
        init: function(element) {
            target = $(element).find("li");

            parent = target.parent();

            //target.on("mousedown mouseup mousemove", this.mouseEvent);
            target.on("mousedown mousemove", this.mouseEvent);
            body.on("mouseup", this.mouseEvent);
            target.on("touchstart touchend touchmove", this.touchEvent);
        },
        animateAngle: function(obj, angle) {
            var _end = {x: obj.position().left, y: obj.position().top};
            var _angle = angle * (Math.PI / 180);

            var _distance = distance(target_bounds, _end);

            var _left = target_bounds.x - Math.cos(_angle) * (_distance + 500);
            var _top = target_bounds.y - Math.sin(_angle) * (_distance + 500);

            obj.animate({
                opacity: 0,
                left: _left+"px",
                top: _top+"px"
            }, self.settings.lastAnimationSpeed, function() {
                self.remove(obj);
            });
        },
        animate: function(obj) {
            var _end = {
                x: obj.position().left,
                y: obj.position().top
            };

            var _dif_x = _end.x - target_bounds.x;
            var _dif_y = _end.y - target_bounds.y;
            var _angle = angle({x: 0, y: 0}, {x: _dif_x, y: _dif_y});

            var _distance = distance(target_bounds, _end);

            var _left = target_bounds.x - Math.cos(_angle) * (_distance + 200);
            var _top = target_bounds.y - Math.sin(_angle) * (_distance + 200);


            // Reset the position
            if (self.settings.lastAnimationForceDown) {
                _top = parent.height();
                _left = _end.x;
            }

            obj.animate({
                opacity: 0,
                left: _left+"px",
                top: _top+"px"
            }, self.settings.lastAnimationSpeed, function() {
                self.remove(obj);
            });
        },
        like: function(obj) {
            if(self.settings.like) {
                self.settings.like.call(obj);
            }

            if(this !== self) {
                self.animateAngle(obj, 180);
            } else {
                self.animate(obj);
            }
        },
        dislike: function(obj) {
            if(self.settings.dislike) {
                self.settings.dislike.call(obj);
            }

            if(this !== self) {
                self.animateAngle(obj, 0);
            } else {
                self.animate(obj);
            }
        },
        remove: function(obj) {
            // How to remove the object, the default is the standard jQuery function
            if(self.settings.remove) {
                self.settings.remove.call(obj);
            } else {
                obj.remove();
            }

            this.setCurrentTarget();
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

            var _x = e.pageX;
            var _y = e.pageY;

            if(e.type === "mousedown") {
                mouse_down = true;
                start.x = _x;
                start.y = _y;

            }  else if(e.type === "mouseup") {
                if(mouse_down) {
                    mouse_down = false;

                    // Calculate the distance from the starting point and now
                    var _end = {
                        x: _x - start.x,
                        y: _y - start.y
                    };

                    var _distance = distance(target_bounds, _end);

                    // Only if the target is in the given bounds
                    if (_distance > self.settings.minDragDistance) {
                        var _dif_x = _end.x - target_bounds.x;

                        var _sign_x = Math.sign(_dif_x);

                        if (_sign_x === 1) {
                            self.like(current_target);
                        } else {
                            self.dislike(current_target);
                        }
                    } else {
                        self.like_button.animate({opacity: "0"}, self.settings.returnAnimationTime);
                        self.dislike_button.animate({opacity: "0"}, self.settings.returnAnimationTime);

                        // Reset the position
                        current_target.animate({
                            transform: "rotate(0deg)",
                            left: "0px",
                            top: "0px"
                        }, self.settings.returnAnimationTime);
                    }
                }
            } else if(e.type === "mousemove") {
                if(mouse_down) {
                    var _dif = {
                        x: (_x - start.x),
                        y: (_y - start.y)
                    };

                    var _sign_x = Math.sign(_dif.x);

                    // Only if the user is in the distance bounds
                    current_target.css("left", target_bounds.x + _dif.x);
                    current_target.css("top", target_bounds.y + _dif.y);

                    var _distance = distance(target_bounds, _dif);
                    var _percentage = _distance / self.settings.minDragDistance;
                    if(_percentage > 1) {
                        _percentage = 1;
                    }

                    if(_sign_x > 0) {
                        self.like_button.css("opacity", _percentage);
                        self.dislike_button.css("opacity", 0);
                    } else {
                        self.like_button.css("opacity", 0);
                        self.dislike_button.css("opacity", _percentage);
                    }

                    current_target.css("transform", "rotate("+(_dif.x/30)+"deg)");
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
            } else if($.isFunction(Plugin.prototype[settings])) {
                $.data(this, "plugin_"+PLUGIN_NAME)[settings].call(this, current_target);
            }
        });

        return this;
    };
}(jQuery, $("body")));