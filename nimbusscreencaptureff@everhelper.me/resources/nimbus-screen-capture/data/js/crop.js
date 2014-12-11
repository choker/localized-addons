;//jQuery.noConflict();
(function($) {

    var imgdata = null;
    var positionLoupe = {x: 0, y: 0};
    var parameters;
    var ws = document.documentElement.scrollWidth;
    var hs = document.documentElement.scrollHeight;
    var loc = {};
    var cancelscroll = function(e) {
        e.preventDefault();
    };

    function destroyCrop() {
        $('#areafon').remove();
//        document.removeEventListener('DOMMouseScroll', cancelscroll, false);
        removeClass();
    }

    //add class
    function addClass() {
        document.getElementsByTagName('body')[0].className += " nimbuscapturearea";
    }

    //remove class
    function removeClass() {
        var obj = document.getElementsByTagName('body')[0];
        obj.className = obj.className.replace('nimbuscapturearea', ' ');
    }

    var candraw = true;
    var drawing = function(callback) {
        if (candraw) {
            candraw = false;
            mozRequestAnimationFrame(function() {
                callback();
                candraw = true;
            });
        }
    };

    function showLoupe(e) {
        var loupe = $("#theloupe");

        if (loupe.is(":hidden")) return;

        var img = document.getElementById('areaimage');

        var canvas = document.getElementById('theloupecanvas');
        var context = canvas.getContext('2d');

        var wi = document.documentElement.clientWidth;
        var hi = document.documentElement.clientHeight;

        var x = e.pageX - 15;
        var y = e.pageY - 15;
        var h = 30;
        var w = 30;
        var x2 = 0;
        var y2 = 0;

        var lh = loupe.height() + 20;
        var lw = loupe.width() + 20;

        if (e.clientX < lw + 5 && e.clientY < lh + 5) {
            positionLoupe = {x: wi - lw - 10, y: hi - lh - 10};
        }
        if (e.clientX > (wi - lw - 5) && e.clientY > (hi - lh - 5)) {
            positionLoupe = {x: 0, y: 0};
        }

        loupe.css({top: positionLoupe.y + 10, left: positionLoupe.x + 10});

        var s = loupe.find('span');
        $(s[0]).text('X = ' + e.pageX);
        $(s[1]).text('Y = ' + e.pageY);

        context.canvas.width = 240;
        context.canvas.height = 240;

        if (x < 0) {
            x2 = (-8) * x;
            x = 0;
        }
        if (y < 0) {
            y2 = (-8) * y;
            y = 0;
        }

        if ((e.pageX + 15) > ws) {
            w = ws - e.pageX + 14;
        }
        if ((e.pageY + 15) > hs) {
            h = hs - e.pageY + 14;
        }

        var zoom = 8;
        var offctx = document.createElement('canvas').getContext('2d');
        offctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        var imgDt = offctx.getImageData(0, 0, w, h).data;

        for (var xx = 0; xx < w; ++xx) {
            for (var yy = 0; yy < h; ++yy) {
                var i = (yy * w + xx) * 4;
                var r = imgDt[i];
                var g = imgDt[i + 1];
                var b = imgDt[i + 2];
                var a = imgDt[i + 3];
                context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
                context.fillRect(x2 + xx * zoom, y2 + yy * zoom, zoom, zoom);
            }
        }

        context.lineWidth = 1;
        context.strokeStyle = "#FF6600";

        context.beginPath();

        context.moveTo(120, 0);
        context.lineTo(120, 240);

        context.moveTo(0, 120);
        context.lineTo(240, 120);

        context.stroke();

    }

    function cropImage(edit) {
        var c = parameters;
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        canvas.width = c.w;
        canvas.height = c.h;

        var img = document.getElementById('areaimage');

        context.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
        var data = canvas.toDataURL();

        self.port.emit(edit, data);

    }

    function createCoords(c) {
        parameters = c;
        saveCropPosition(c);
        if ($("div").is("#screenshotbutton") && $("div").is("#screenshotsize")) {
            showCoords(c);
            return;
        }

        var btne = $('<button/>', { 'class': 'edit_btn edit' })
            .append($("<i>", { class: "edit" }))
            .append($("<div>", { class: "name" })
                    .text(loc.cropBtnEdit||'Edit')
            );
        btne.css('border', 'medium none');

        var btns = $('<button/>', { 'class': 'edit_btn save' })
            .append($("<i>", { class: "save" }))
            .append($("<div>", { class: "name" })
                .text(loc.cropBtnSave||'Save')
            );
        btns.css('border', 'medium none');

        var btnc = $('<button/>', { 'class': 'edit_btn cancel' })
            .append($("<i>", { class: "cancel" }))
            .append($("<div>", { class: "name" })
                .text(loc.cropBtnCancel||'Cancel')
            );
        btnc.css('border', 'medium none');

        var btnss = $('<div/>', {
            'id': 'screenshotbutton',
            'class': 'nimbus_screenshot_buttons'
        });

        btnss.append(btne);
        btnss.append(btns);
        btnss.append(btnc);

        var drag = $('.jcrop-dragbar').first();
        drag.before($('<div/>', { 'id': 'screenshotsize' }).append($("<span>")));
        drag.before(btnss);

        var btnsdone = $('<div/>', {
            'id': 'screenshotbuttonsdone',
            'class': 'nimbus_screenshot_buttons'
        });
        var btncopy = $('<button/>', {
            'id': 'screenshotcopy',
            'class': 'edit_btn copy',
            'title': loc.cropBtnCopy || 'Copy to clipboard'
        }).append($("<i>", { class: "copy" }));
        btncopy.css('border', 'medium none');

        var btnnimbus = $('<button/>', {
            'id': 'screenshotnimbus',
            'class': 'edit_btn nimbus',
            'title': loc.cropBtnNimbus || 'Send to Nimbus'
        }).append($("<i>", { class: "nimbus" }));

        btnnimbus.css('border', 'medium none');
        btnsdone.append(btncopy);
        btnsdone.append(btnnimbus);
        drag.before(btnsdone);

        btncopy.bind('click', function() {
            cropImage('copytoclipboard');
            destroyCrop();
        });

        btnnimbus.bind('click', function() {
            cropImage('sendtonimbus');
            destroyCrop();
        });

        btnc.click(function() {
            destroyCrop();
        });

        btne.click(function() {
            cropImage('edit');
            destroyCrop();
        });

        btns.click(function() {
            cropImage('save');
            destroyCrop();
        });

        var loupe = $('#theloupe');
        var events = {
            'mouseenter': function(e) {
                loupe.show()
            },
            'mouseleave': function(e) {
                loupe.hide()
            }
        };

        $(".jcrop-handle").bind(events);
        $(".jcrop-dragbar").bind(events);
        $(".jcrop-tracker").last().bind(events);

        $('#areafon .edit_btn').hover(function() {
            $(".name", this).stop().animate({top: '35px', bottom: '0px'}, {queue: false, duration: 160});
        }, function() {
            $(".name", this).stop().animate({top: '47px', bottom: '0'}, {queue: false, duration: 160});
        });

        showCoords(c);
    }

    function saveCropPosition(c) {
        self.port.emit('saveCropPosition', c);
    }

    function showCoords(c) {
        $('#screenshotsize').find('span').text(c.w + ' x ' + c.h);

        if ((c.h + c.y + 55) > hs) {
            $('#screenshotbutton').css('bottom', '8px');
        } else {
            $('#screenshotbutton').css('bottom', '-55px');
        }

        if ((c.w + c.x + 54) > $(window).width()) {
            $('#screenshotbuttonsdone').css('right', '8px');
        } else {
            $('#screenshotbuttonsdone').css('right', '-53px');
        }

        if (c.y < 20) {
            $('#screenshotsize').css('top', '5px');
        } else {
            $('#screenshotsize').css('top', '-20px');
        }
    }

    var timer = {};
    var scrollPage = function(event) {
        if (event.clientX < 10) {
            document.documentElement.scrollLeft -= 8;
            clearTimeout(timer.left);
            timer.left = setTimeout(function() {
                document.documentElement.scrollLeft -= 5;
                timer.left = setTimeout(arguments.callee, 10);
            }, 10);
        } else {
            clearTimeout(timer.left);
        }

        if (event.clientY < 10) {
            document.documentElement.scrollTop -= 8;
            clearTimeout(timer.up);
            timer.up = setTimeout(function() {
                document.documentElement.scrollTop -= 5;
                timer.up = setTimeout(arguments.callee, 10);
            }, 10);
        } else {
            clearTimeout(timer.up);
        }

        if ($(window).width() - event.clientX < 10) {
            document.documentElement.scrollLeft += 8;
            clearTimeout(timer.right);
            timer.right = setTimeout(function() {
                document.documentElement.scrollLeft += 5;
                timer.right = setTimeout(arguments.callee, 10);
            }, 10);
        } else {
            clearTimeout(timer.right);
        }

        if ($(window).height() - event.clientY < 10) {
            document.documentElement.scrollTop += 8;
            clearTimeout(timer.bottom);
            timer.bottom = setTimeout(function() {
                document.documentElement.scrollTop += 5;
                timer.bottom = setTimeout(arguments.callee, 10);
            }, 10);
        } else {
            clearTimeout(timer.bottom);
        }
    };

    self.port.on('data', function(data) {
        var jcrop;

        addClass();

        imgdata = data;

        var areafon = $('<div/>', {
            id: 'areafon'
        }).appendTo('body');
        areafon.css({width: ws + 'px', height: hs + 'px'});

        var areaimage = $('<img>', {
            id: 'areaimage',
            src: data
        }).appendTo(areafon);

        $(areaimage).Jcrop({
            onSelect: createCoords,
            onChange: showCoords
        }, function() {
            jcrop = this;
        });

        self.port.on("setCropPosition", function(p) {
            if (typeof p === 'object') {
                if(p.x2 <= ws && p.y2 <= hs) {
                    jcrop.setSelect([p.x, p.y, p.x2, p.y2]);
                    $("html, body").animate({ scrollTop: p.y}, "slow");
                }
            }
        });

        var loupe = $('<div/>', {
            'id': 'theloupe'
        });
        var canvas = $('<canvas/>', {
            'id': 'theloupecanvas'
        });

        loupe.append(canvas);
        loupe.append($('<span/>'));
        loupe.append($('<span/>'));

        areafon.append(loupe);

        areafon.one({
            'mouseover': function(e) {
                $('#theloupe').show();
                showLoupe(e);
            }
        });
        areaimage.bind('load', function() {
            self.port.emit("getCropPosition");
            areafon.bind({
                'mouseenter': function(e) {
                    $('#theloupe').show();
                },
                'mouseleave': function(e) {
                    $('#theloupe').hide();
                },
                'mousemove ': function(e) {
                    drawing(function() {
                            showLoupe(e);
                        }
                    );
                    scrollPage(e);
                }
            });
        });

        self.port.on("setlocation", function(l) {
            loc = l;
        });
        self.port.emit("getlocation");

        areafon.bind("contextmenu", function() {
            destroyCrop();
            return false;
        });

        areafon.append('<div class="cropNotification">Drag and Capture Page (Press Esc to Exit)</div>');

        window.addEventListener('keydown', function (evt) {
            evt = evt || window.event;
            if (evt.keyCode == 27) {
                destroyCrop();
            }
            return true;
        }, false);

    });

}(jQuery));

