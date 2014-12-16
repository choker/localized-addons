jQuery(function() {

    $("button").focus(
        function() {
            this.blur();
        }
    );

    var imgdata;// = localStorage.imgdata;
    var screenname;// = localStorage.screenname;
    var imgnewdatapng = null;
    var imgnewdata = null;
    var image = $('#imageedit');
    var canvasManager;
    var jcrop;
    var tools = '#rectangle-styler';
    var authorized = false;
    var param = (function () {
        var p = window.location.href.match(/\?(\w+)$/);
        return (p && p[1]) || '';
    })();
    window.l10n = {};

    localStorage.fillColor = localStorage.fillColor || 'rgba(0,0,0,0)';
    localStorage.setting = localStorage.setting || JSON.stringify({width: '3', color: '#FF0000'});
    var setting = JSON.parse(localStorage.setting);
    $("#line-width").val(setting.width);
    $("#colortools").val(setting.color);
    $('#numbers').addClass((localStorage.enablenumbers === 'true')?'enable':'');
    $("#percent").val(1);

    (function(s){
        try {
            setting.shadow = JSON.parse(s)
        } catch (e) {
            setting.shadow = { enable: true, color: '#000000', blur: 5 };
        }
    })(localStorage.shadow);

    $('#editpanel select, .drop_panel input[type="checkbox"] ').styler();

    $("#fillcolor").spectrum({
        color: localStorage.fillColor,
        showAlpha: true,
        showButtons: false,
        move: function(color) {
            canvasManager.changeFillColor(color.toRgbString());
        }
    });

    function initPage() {

        window.l10n = JSON.parse(localStorage.l10n || '{}');

        $('#editcanva').width(image.width()).height(image.height());
        image.hide();

        canvasManager = $("#editcanva").canvasPaint();
        canvasManager.loadBackgroundImage(imgdata, function() {

            if ((param === 'done') || (param === 'nimbus')) {
                $("#done").click();
                if (param === 'nimbus') {
                    nimbus.show();
                }
            }

        });
        canvasManager.changeStrokeSize(setting.width);
        canvasManager.changeStrokeColor(setting.color);
        canvasManager.changeFillColor(localStorage.fillColor);
        canvasManager.changeShadow(setting.shadow);
        canvasManager.setEnableNumbers(localStorage.enablenumbers === 'true');
        $('#colortools-styler').find('.text').css('background-color', setting.color);
        if (param === 'blank') {
            $('#open-image').show();

            var d = document.createElement('div');
            $(d).attr('id','drop-file')
                .text('Drop Image Here')
                .appendTo('#editcanva')
                .one('mouseover', function () {
                    $(this).hide();
                });
        }

        setPanelTop();

        addEvents();

        $(window).resize(function() {
            setPanelTop();
        });

        (function () {

            self.port.on("readfromclipboardrequest", function(imgdata){
                if(!!imgdata) {
                    if (param === 'blank') {
                        canvasManager.undoAll();
                        canvasManager.loadBackgroundImage(imgdata);
                        $('#drop-file').hide();
                    }else {
                        canvasManager.loadImageObject(imgdata);
                    }
                }
            });

            window.addEventListener('keydown', function(e) {
                if (!!imgnewdata) return true;
                if (e.ctrlKey && e.keyCode == 86) {

                    self.port.emit("readfromclipboard");

                    e.preventDefault();
                    return false;
                }
                return true;
            }, false);

            function handleFileSelect(evt) {
                evt.stopPropagation();
                evt.preventDefault();

                var files = evt.target.files || (evt.dataTransfer && evt.dataTransfer.files);

                for (var i = 0, f; f = files[i]; i++) {

                    if (!f.type.match('image.*')) {
                        $.ambiance({message: window.l10n.notificationWrongInsert, timeout: 1});
                        continue;
                    }

                    var reader = new FileReader();

                    reader.onload = (function(theFile) {
                        return function(e) {
                            if (evt.type === "drop") {
                                canvasManager.loadImageObject(e.target.result, evt.pageX, evt.pageY);
                            } else {
                                canvasManager.undoAll();
                                canvasManager.loadBackgroundImage(e.target.result);
                                $('#drop-file').hide();
                            }
                        };
                    })(f);

                    reader.readAsDataURL(f);
                }
                return false;
            }


            function handleDragOver(evt) {
                evt.stopPropagation();
                evt.preventDefault();
//                evt.dataTransfer.dropEffect = 'copy';
                $(this).addClass('drop');
            }
            function handleDragEnd(evt) {
                $(this).removeClass('drop');
            }

            var dropZone = document.getElementById('editcanva');
            dropZone.addEventListener('dragover', handleDragOver, false);
            dropZone.addEventListener('drop', handleFileSelect, false);
            dropZone.addEventListener('drop', handleDragEnd, false);
            dropZone.addEventListener('dragleave', handleDragEnd, false);

            document.getElementById('file-open').addEventListener('change', handleFileSelect, false);

            $('#open-image').on('click', function () {
                $('#file-open').click();
            });

        })();

        window.copyUrlToClipboard = function(text) {
            self.port.emit("copytoclipboard", text || $('#linked input').val());
            $.ambiance({message: window.l10n.notificationUrlCopied});
        };
    }


    function setPanelTop() {
        var panel = $('#editpanel');
        var title = panel.find('h5');

        if ($('body').width() < 1500) {
            title.hide();
            $('.tools').css('max-width', '823px');
        } else {
            title.show();
            $('.tools').css('max-width', '1120px');
        }

        $('#photo').css('padding-top', (panel.height() + 10) + 'px');
        canvasManager.zoom(true);
    }

    var firstWidth = null;
    var firstHeight = null;

    function getSize() {
        var width = $('#editcanva').width();
        var height = $('#editcanva').height();
        if (firstWidth == null) {
            var firstWidth = width;
        }
        if (firstHeight == null) {
            var firstHeight = height;
        }

        return {w: width, h: height, fW: firstWidth, fH: firstHeight};
    }

    function destroyCrop() {
        if (jcrop) {
            jcrop.destroy();
            jcrop = undefined;

            if ($('#forcrop')) {
                $('#forcrop').remove()
            }
            $('#crop').removeClass('active');
            $(tools).addClass('active');
        }
    }

    function disableActive(btn) {
        $('#editpanel').find('button').removeClass('active');
        $('#editpanel').find('.jq-selectbox').removeClass('active');
        $(btn).addClass('active');
        if ($(btn).attr('id') !== 'crop') tools = btn;
        $("#resize").removeClass('active');
        $(".drop").removeClass('open');
    }

    function addEvents() {
        document.onkeydown = function(e) {
            var k = e.keyCode;

            if (k == 46) {
                canvasManager.delete();
            }

            if (e.ctrlKey) {
                if (k == 90) {
                    canvasManager.undo();
                    e.preventDefault();
                    return false;
                }
                if (k == 89) {
                    canvasManager.redo();
                    e.preventDefault();
                    return false;
                }
            }
            return true;
        };

        var saveimg = $("#save-img");
        var resizeimg = $(".drop.resize_image");
        var bg = $("#background");

        $('#back').click(function() {
            imgnewdatapng = null;
            imgnewdata = null;
            saveimg.hide();
            bg.css('z-index', '1000');
            $('html').css("overflow", "auto");
            return false;
        });

        $('#editpanel button').click(function() {
            destroyCrop()
        });

        $("#done").click(function() {
            canvasManager.done();

            var canvaFon = document.getElementById("canvasfon");
            var canvaBg = document.getElementById("canvasbg");

            var oCanvas = document.createElement('canvas');
            oCanvas.width = canvaFon.width;
            oCanvas.height = canvaFon.height;

            var ctx = oCanvas.getContext('2d');
            ctx.drawImage(canvaFon, 0, 0);
            ctx.drawImage(canvaBg, 0, 0);

            var previewImg = $('#preview');
            var imgfordw = $('#imgfordownload');
            var img;

            imgfordw.attr('href', screenname + '.' + localStorage.format);
            mozRequestAnimationFrame(function() {
                imgnewdata = oCanvas.toDataURL('image/'+localStorage.format, localStorage.imageQuality/100);
                imgnewdatapng = oCanvas.toDataURL();

                var k = (imgnewdata.length / 1.36 / 1000).toFixed(2);
                if (k < 1024) {
                    k = k.toString().replace(",", ".").replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, "$&,") + " KB";
                } else {
                    k = (k / 1024).toFixed(2);
                    k = k.toString().replace(",", ".").replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, "$&,") + " MB";
                }

                $('#indicator').find('.screensize').find('span').text(canvaFon.width + ' x ' + canvaFon.height);
                $('#indicator').find('.screenweight').find('span').text(k);
                previewImg.find('img').load(function() {
                    var w = previewImg.find('img').width();
                    $('#indicator').css('width', w + 'px');
                    $('#nimbus-comment').css('width', (w > 300 ? w : 680) + 'px');
                    resizeImagePreview();
                });

//                imgfordw.attr('href', imgnewdata);
                previewImg.find('img').attr('src', imgnewdata);
                nimbus.setScreenSize(imgnewdata.length);
            });

            saveimg.show();

            $('#message').hide();
            $('#linked').hide();
            bg.css('z-index', '1200');
            $('html').css("overflow", "hidden");

            //############## to remove ##############
            var data = localStorage['oauth2_google'] && JSON.parse(localStorage['oauth2_google']);
            if (data.apiScope !== 'https://www.googleapis.com/auth/drive.readonly.metadata https://www.googleapis.com/auth/drive.file') clearGdriveData();
            //############################
            if (googleAuth.get().accessToken) {
                authorized = true;
                $('#send-to-google').attr('original-title', window.l10n.tooltipUploadTo + ': ' + googleAuth.getUploadFolder().title);
            } else {
                $('#choose_folder').hide();
            }

            nimbusRate.showMessage();
            nimbusAccountPopup.init();
        });

        function resizeImagePreview() {
            var si = $('#save-img');
            var h = si.height() + 20;
            var hb = $('#background').height();
//            console.log(h,hb);
//            var z = 1;
            if (h > hb) {
//                z = hb / h;
//                if (z < 0.75) {
//                    z = 0.75;
//                }
                si.css('top','0px');
            } else {
                si.css('top','20px');
            }

//            var marginH = Math.round(-0.5 * (1 - z) * h);
//
//            si.css('-moz-transform', 'scale(' + z + ')')
//                .css('margin-top', marginH + 'px');
        }

        $("#resize").click(function() {
            if ($('#resize-img').is(':visible')) {
                $("#resize").removeClass('active');
                resizeimg.removeClass('open');
            } else {
                $("#resize").addClass('active');
                var size = getSize();
                $('#img-width').val(size.w);
                $('#img-height').val(size.h);
                resizeimg.addClass('open');
            }
        });

        $('#resize-cancel').click(function() {
            $("#resize").removeClass('active');
            resizeimg.removeClass('open');
            return false;
        });

        $("#resize-img").find('form').submit(function() {
            var w = this.width.value;
            var h = this.height.value;
            canvasManager.changeSize(w * 1, h * 1);
            $("#resize").removeClass('active');
            resizeimg.removeClass('open');
            return false;
        });

        $("#shadow").click(function() {
            function hide () {
                $("#shadow").removeClass('active');
                $('.drop.tools_shadow').removeClass('open');
            }
            if ($('#tools-shadow').is(':visible')) {
                hide();
            } else {
                $("#shadow").addClass('active');
                var s = canvasManager.getShadow();
                $('#shadow-width').val(s.blur);
                $('#enable-shadow').prop("checked", s.enable).trigger('refresh');
                $('#colorshadow').val(s.color).trigger('refresh');
                $('#colorshadow-styler').find('.text').css('background-color', s.color);
                $('.drop.tools_shadow').addClass('open');
                $('#editcanva').one('mousedown', function () {
                    hide();
                })
            }
        });

        function getShadowParam() {
            return {
                enable: $('#enable-shadow').prop("checked"),
                blur: $('#shadow-width').val(),
                color: $('#colorshadow').val()
            }
        }

        $('#shadow-width').on('change', function(){
            setting.shadow = getShadowParam();
            canvasManager.changeShadow(setting.shadow, 'blur');
        });

        $('#enable-shadow').on('change', function(){
            setting.shadow = getShadowParam();
            canvasManager.changeShadow(setting.shadow, 'enable');
        });

        $('#colorshadow').on('change', function(){
            setting.shadow = getShadowParam();
            canvasManager.changeShadow(setting.shadow, 'color');
            $('#colorshadow-styler').find('.text').css('background-color', setting.shadow.color);
        });

        $('.percent').change(function() {
            destroyCrop();
            var z = +this.value;
            canvasManager.zoom(z);
            return false;
        });

        $("#zoomminus").click(function() {
            var z = canvasManager.getZoom();
            if (z > 0.25) {
                z -= 0.25;
            }
            $(".percent").val(z);
            $(".percent").trigger('refresh');
            canvasManager.zoom(z);
        });

        $("#zoomplus").click(function() {
            var z = canvasManager.getZoom();
            if (z < 2) {
                z += 0.25;
            }
            $(".percent").val(z);
            $(".percent").trigger('refresh');
            canvasManager.zoom(z);
        });


        $('#img-width').on('input', function() {
            if ($('#proportional-styler').hasClass('checked')) {
                var size = getSize();
                $('#img-height').val(Math.round(this.value * size.h / size.w));
            }
        });

        $('#img-height').on('input', function() {
            if ($('#proportional-styler').hasClass('checked')) {
                var size = getSize();
                $('#img-width').val(Math.round(this.value * size.w / size.h));
            }
        });

        $('#proportional-styler').click(function() {

            if ($('#proportional-styler').hasClass('checked')) {
                var firstSize = getSize();
                $('#img-width').val(firstSize.fW);
                $('#img-height').val(firstSize.fH);
            }
        });

        $("#pen").click(function() {
            canvasManager.activatePen();
            disableActive(this);
        });

        $('#rectangle-styler').click(function() {
            if ($('#rectangle').val() === 'rectangle') {
                canvasManager.activateEmptyRectangle();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('rectangle');
            } else {
                canvasManager.activateRoundedRectangle();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('rounded_rectangle');
            }
            destroyCrop();
            disableActive(this);
        });

        $('#rectangle-styler .text').click(function() {
            if ($('#rectangle').val() === 'rectangle') {
                canvasManager.activateEmptyRectangle();
            } else {
                canvasManager.activateRoundedRectangle();
            }
            destroyCrop();
            disableActive($('#rectangle-styler'));
            return false;
        });

        $('#ellipse-styler').click(function() {
            if ($('#ellipse').val() === 'ellipse') {
                canvasManager.activateEllipse();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('ellipse');
            } else {
                canvasManager.activateEmptyCircle();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('sphere');
            }
            destroyCrop();
            disableActive(this);
        });

        $('#ellipse-styler .text').click(function() {
            if ($('#ellipse').val() === 'ellipse') {
                canvasManager.activateEllipse();
            } else {
                canvasManager.activateEmptyCircle();
            }
            destroyCrop();
            disableActive($('#ellipse-styler'));
            return false;
        });

        $('#line-styler').click(function() {
            if ($('#line').val() === 'line') {
                canvasManager.activateLine();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('line');
            } else {
                canvasManager.activateCurveLine();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('line_curve');
            }
            destroyCrop();
            disableActive(this);
        });

        $('#line-styler .text').click(function() {
            if ($('#line').val() === 'line') {
                canvasManager.activateLine();
            } else {
                canvasManager.activateCurveLine();
            }
            destroyCrop();
            disableActive($('#line-styler'));
            return false;
        });

        $('#arrow-styler').click(function() {
            if ($('#arrow').val() === 'arrow') {
                canvasManager.activateArrow();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('arrow1');
            } else {
                canvasManager.activateCurveArrow();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('arrow_curve');
            }
            destroyCrop();
            disableActive(this);
        });

        $('#arrow-styler .text').click(function() {
            if ($('#arrow').val() === 'arrow') {
                canvasManager.activateArrow();
            } else {
                canvasManager.activateCurveArrow();
            }
            destroyCrop();
            disableActive($('#arrow-styler'));
            return false;
        });

        $('#inscription-styler').click(function() {
            if ($('#inscription').val() === 'sticker') {
                canvasManager.sticker();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('sticker');
            } else {
                canvasManager.textArrow();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('text_arrow');
            }
            destroyCrop();
            disableActive(this);
        });

        $('#inscription-styler .text').click(function() {
            if ($('#inscription').val() === 'sticker') {
                canvasManager.sticker();
            } else {
                canvasManager.textArrow();
            }
            destroyCrop();
            disableActive($('#inscription-styler'));
            return false;
        });

//        $("#sticker").click(function() {
//            canvasManager.sticker();
//            disableActive(this);
//        });
//        $("#text-arrow").click(function() {
//            canvasManager.textArrow();
//            disableActive(this);
//        });

        $("#text").click(function() {
            canvasManager.text();
            disableActive(this);
        });

        $('#line-width-styler').click(function(e) {
            canvasManager.changeStrokeSize($('#line-width').val());
            var clas = $(e.target).attr('class');
            if (clas !== undefined) {
                clas = clas.replace('selected sel', '');
                $(this).find('.text').removeAttr('class').addClass('text').addClass(clas);
            }
        });

        $('#colortools').change(function() {
            var c = $('#colortools').val();
            canvasManager.changeStrokeColor(c);
            $('#colortools-styler').find('.text').css('background-color', c);
        });

        $("#eraser").click(function() {
            canvasManager.activateEraser();
            disableActive(this);
        });

        $('#blur-styler').click(function() {
            if ($('#blur').val() === 'blur') {
                canvasManager.activateBlur();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('blur');
            } else {
                canvasManager.activateBlurOther();
                $(this).find('.text').removeAttr('class').addClass('text').addClass('blur_all');
            }
            destroyCrop();
            disableActive(this);
        });

        $('#blur-styler .text').click(function() {
            if ($('#blur').val() === 'blur') {
                canvasManager.activateBlur();
            } else {
                canvasManager.activateBlurOther();
            }
            destroyCrop();
            disableActive($('#blur-styler'));
            return false;
        });

        $("#undo").click(function() {
            canvasManager.undo();
        });

        $("#undo-all").click(function() {
            canvasManager.undoAll();
            canvasManager.loadBackgroundImage(imgdata);
        });

        $("#redo").click(function() {
            canvasManager.redo();
        });

        $("#numbers").click(function() {
            if($(this).hasClass('enable')) {
                $(this).removeClass('enable');
                localStorage.enablenumbers = 'false';
                canvasManager.setEnableNumbers(false);
            } else {
                $(this).addClass('enable');
                localStorage.enablenumbers = 'true';
                canvasManager.setEnableNumbers(true);
            }

        });

        $("#crop").click(function() {

            disableActive(this);

            if (jcrop) {
                return true;
            }

            var pole = $('<div id="forcrop">').appendTo('#photo');
            var size = getSize();
            var zoom = canvasManager.getZoom();

            var position = $('#editcanva').offset();

            pole.css('width', size.w * zoom)
                .css('height', size.h * zoom)
                .css('position', 'absolute')
                .css('left', position.left + 'px')
                .css('top', position.top + 'px');

            var crop = $('<div>').appendTo(pole);

            crop.css('width', '100%')
                .css('height', '100%')
                .css('position', 'absolute')
                .css('left', '0px')
                .css('top', '0px');


            jcrop = $.Jcrop(crop, {
                keySupport: true,
                onSelect: createCoords,
                onChange: showCards,
                onMousemove: function (e) {
                    canvasManager.scrollPage(e);
                },
                onEnter: function (e) {
                    $("#crop-image").click();
                }
            });
        });

        $('#save-image, #imgfordownload').click(function() {
            self.port.emit("saveimage", {'data': imgnewdata, title: screenname, format: localStorage.format || 'png'});
            return false
        });

        $('#save-nimbus, #nimbus-comment-upload').click(function() {
            nimbus.userExistsCookies(function() {
                nimbus.show();
            });
        });

        $('#save-to-nimbus').click(function(){
            nimbus.startUpload(imgnewdata);
        });
        $('#my-uploads-nimbus').click(function(e){
            window.open('https://nimbus.everhelper.me/client/', '_blank');
            e.preventDefault();
        });

        $('#send-to-google').click(function() {
            saveToGdrive();
            hidePopup();
        });

        $('#copy-to-clipboard').click(function() {
            self.port.emit("copytoclipboard", imgnewdatapng);
            $.ambiance({message: window.l10n.notificationCopy});
        });

        $('#print-img').click(function() {

            $('iframe#print').remove();
            var iframe = document.createElement('IFRAME');

            var imagediv = $('<body>').append($('<div>', {style: "margin:0 auto;text-align:center"}).append($('<img>', {src: imgnewdatapng}))).prop('outerHTML');

            $(iframe).attr({
                style: 'position:absolute;width:0px;height:0px;left:-500px;top:-500px;',
                id: 'print',
                src: 'data:text/html;charset=utf-8,' + encodeURI(imagediv)
            });
            document.body.appendChild(iframe);

            var frameWindow = iframe.contentWindow;
            frameWindow.close();
            frameWindow.focus();
            window.setTimeout(function() {
                frameWindow.print();
            }, 500);

        });

        $('button.panel_btn').tipsy();
        (function () {
            $('#zoomplus').attr('original-title', window.l10n.tooltipZoomPlus);
            $('#zoomminus').attr('original-title', window.l10n.tooltipZoomMinus);
            $('#resize').attr('original-title', window.l10n.tooltipResize);
            $('#crop').attr('original-title', window.l10n.tooltipCrop);
            $('#pen').attr('original-title', window.l10n.tooltipPen);
            $('#text').attr('original-title', window.l10n.tooltipText);
            $('#undo').attr('original-title', window.l10n.tooltipUndo);
            $('#redo').attr('original-title', window.l10n.tooltipRedo);
            $('#undo-all').attr('original-title', window.l10n.tooltipUndoAll);
            $('#shadow').attr('original-title', window.l10n.tooltipShadow);
            $('#numbers').attr('original-title', window.l10n.tooltipNumbers);
        })();
        $('#percent-styler .select').attr('original-title', window.l10n.tooltipZoom || "change zoom").tipsy();
        $('#ellipse-styler .select').attr('original-title', window.l10n.tooltipEllipse || "draw ellipse").tipsy();
        $('#rectangle-styler .select').attr('original-title', window.l10n.tooltipRectangle || "draw rectangle").tipsy();
        $('#line-styler .select').attr('original-title', window.l10n.tooltipLine || "draw line").tipsy();
        $('#arrow-styler .select').attr('original-title', window.l10n.tooltipArrow || "draw arrow").tipsy();
        $('#line-width-styler .select').attr('original-title', window.l10n.tooltipLineWidth || "change line width").tipsy();
        $('#colortools-styler .select').attr('original-title', window.l10n.tooltipColor || "change color").tipsy();
        $('#blur-styler .select').attr('original-title', window.l10n.tooltipBlur || "blur").tipsy();
        $('#inscription-styler .select').attr('original-title', window.l10n.tooltipNote || "draw note").tipsy();
        $('#copy_URL').attr('original-title', window.l10n.tooltipCopy || "Copy to Clipboard").tipsy();
        $('#short_URL').attr('original-title', window.l10n.tooltipShortUrl || "Make short URL").tipsy();
        $('#send-to-google').attr('original-title', window.l10n.tooltipNotAuthorized || 'You are not authorized').tipsy();
        $('#user-logout').attr('original-title', window.l10n.tooltipLogout || 'logout').tipsy({gravity: 'w'});
        $('.drawing_tools .sp-replacer.sp-light').attr('original-title', window.l10n.tooltipFill || 'fill').tipsy();

        $('#form-login input').tipsy({trigger: 'focus', gravity: 'w'});
        $('#form-register input').tipsy({trigger: 'focus', gravity: 'w'});
        $('#remind-password input').tipsy({trigger: 'focus', gravity: 'w'});

        $('.select').bind('click', function() {
            $(this).tipsy('hide');
        });

        $('#linked').find('input').click(function() {
            $(this).select();
        });
    }


    var nimbusRate = {
        getRateInfo: function() {
            var obj = {};
            var time = Date.now();
            try {
                obj = JSON.parse(localStorage['nimbus_rate_info']);
            } catch (e) {
                obj = {install: time, show: true, lastshow: -Infinity};
                localStorage['nimbus_rate_info'] = JSON.stringify(obj);
            }
            return obj;
        },

        saveRateInfo: function(obj) {
            localStorage['nimbus_rate_info'] = JSON.stringify(obj);
        },

        disableRate: function() {
            var obj = this.getRateInfo();
            obj.show = false;
            this.saveRateInfo(obj);
        },

        showMessage: function () {
            var obj = this.getRateInfo();
            var day = 24 * 60 * 60* 1000;
            var now = Date.now();

            if (obj.show) {
                if (now > (+obj.install + 3 * day)) {
                    if (now > (+obj.lastshow + +day)) {
                        setTimeout(function(){
                            $('#nimbus-rate').fadeIn();
                        }, 500);
                        this.saveRateInfo({install: obj.install, show: true, lastshow: now});
                    }
                }
            }
        }
    };
    nimbusRate.getRateInfo();

    var nimbusAccountPopup = (function () {
        var popup = $('#nimbus-account-popup ');
        var bind = function () {
            popup.unbind();
            popup.find('button.create_account').on('click', function (){
                popup.hide();
                nimbus.show();
            })
        };
        this.init = function (){
            if (!localStorage['showAccountPopup']) {
                bind();
                nimbus.userAuthState(function(res) {
                    res = JSON.parse(res);
                    if (res.errorCode !== 0 || !res.body || !res.body.authorized) {
                        popup.show();
                    }
                });
                localStorage['showAccountPopup'] = 'false';
            }
        };
        return this;
    })();

    $('#nimbus-rate').bind('click', function() {
        $('#nimbus-rate').fadeOut();
    });
    $('#disable-rate-message').bind('click', function(e) {
        nimbusRate.disableRate();
        e.preventDefault();
    });


    var parameters = {};

    function cropImage() {
        canvasManager.cropImage(parameters);
    }

    function createCoords(c) {
        parameters = c;
        if ($("div").is("#screenshotbutton") && $("div").is("#screenshotsize")) {
            showCards(c);
            return;
        }

        var btncancel = $('<button/>', {
            'id': 'caancel-crop',
            'class': 'edit_btn cancel'
        }).append($("<i>", { class: "cancel" }))
            .append($("<div>", { class: "name" })
                .text('Cancel')
            );

        var btncrop = $('<button/>', {
            'id': 'crop-image',
            'class': 'edit_btn edit'
        }).append($("<i>", { class: "save" }))
            .append($("<div>", { class: "name" })
                .text('Crop')
            );

        var btnss = $('<div/>', {
            'id': 'screenshotbutton',
            'class': 'nimbus_screenshot_buttons crop_buttons'
        });

        btnss.append(btncrop).append(btncancel);

        var drag = $('.jcrop-dragbar').first();
        drag.before($('<div/>', { 'id': 'screenshotsize' }).append($("<span>")));
        drag.before(btnss);

        btncancel.click(function() {
            destroyCrop();
        });

        btncrop.click(function() {
            destroyCrop();
            cropImage();
        });

        $('.edit_btn').hover(function() {
            $(".name", this).stop().animate({top: '35px', bottom: '0px'}, {queue: false, duration: 160});
        }, function() {
            $(".name", this).stop().animate({top: '47px', bottom: '0'}, {queue: false, duration: 160});
        });

        showCards(c);
    }


    function showCards(c) {
        var zoom = canvasManager.getZoom();
        $('#screenshotsize').find('span').text(Math.round(c.w / zoom) + ' x ' + Math.round(c.h / zoom));
        var size = getSize();
        if ((c.h + c.y + 55) > size.h) {
            $('#screenshotbutton').css('bottom', '8px');
        } else {
            $('#screenshotbutton').css('bottom', '-55px');
        }
    }

    $("#copy_URL").click(function() {
        copyUrlToClipboard();
    });

    $("#short_URL").click(function() {

        self.port.once("shorturlrequest", function(res) {
            var obj = jQuery.parseJSON(res);
            if (obj.status == 'ok') {
                $('#linked input').val(obj.short_url);
                copyUrlToClipboard(obj.short_url);
            }
        });
        self.port.emit("shorturl", $('#linked input').val());

    });

    var gFolders = {
        gAccessToken: '',
        fList: {},
        fParents: {},
        fCurrent: 'root',
        setAccessToken: function(t) {
            gFolders.gAccessToken = t;
        },
        addFolder: function(folder) {
            var f = $('<li>', {
                'data-id': folder.id
            }).append($("<img>", { src: folder.iconLink }))
                .append($("<span>").text(folder.title))
                .appendTo('#file_manager .folders');
            f.bind('click', function() {
                var cur = $(this).data('id');
                gFolders.fParents[cur] = gFolders.fCurrent;
                gFolders.getFolders(cur);
            });
        },
        setParent: function(folder) {
            $('#parent').empty();
            var p = $('<div>', {
                'data-id': folder.id
            }).append($("<img>", { src: folder.iconLink }))
                .append($("<span>").text(folder.title))
                .appendTo('#parent');
            p.bind('click', function() {
                gFolders.getFolders($(this).data('id'));
            });
        },
        setCurrent: function(folder) {
            $('#current').empty();
            $('<div>', {
                'data-id': folder.id
            }).append($("<img>", { src: folder.iconLink }))
                .append($("<span>").text(folder.title))
                .appendTo('#current');
            $('#future_folder .ff').text(folder.title);
        },
        setRootFolder: function() {
            $('#parent').empty();
            var p = $('<div>', {
                'text': window.l10n.gDriveMainFolder,
                'data-id': 'root'
            }).appendTo('#parent');
            p.bind('click', function() {
                gFolders.getFolders($(this).data('id'));
            });
        },
        getFolderInfo: function(folderID, callback) {
            if (gFolders.fList[folderID] == undefined) {

                self.port.once(folderID, function (xhr){
                    console.log(folderID);
                    if (xhr.status == 200) {
                        var res = JSON.parse(xhr.body);
                        if (res.mimeType == "application/vnd.google-apps.folder") {
                            gFolders.fList[folderID] = res;
                            callback(res);
                        }
                    } else {
                        console.log('error');
                        clearGdriveData();
                    }
                });
                self.port.emit("send", {'type': 'getfolderinfo', 'target': folderID, 'token': googleAuth.getAccessToken(), 'folder': folderID});

            } else {
                callback(gFolders.fList[folderID]);
            }
        },
        getParentFolder: function(folder, callback) {
            if (gFolders.fParents[folder] == undefined) {

            self.port.once("getfolderparentrequest", function(xhr){
                if (xhr.status == 200) {
                    var res = JSON.parse(xhr.body);
                    if (res.items.length > 0) {
                        gFolders.fParents[folder] = res.items[0].id;
                        callback(res.items[0].id);
                    } else {
                        gFolders.setRootFolder();
                    }
                    $('#file_manager').show();
                } else {
                    console.log('error');
                }
                $('#uploadimg').hide();
            });
            self.port.emit("send", {'target': 'getfolderparent', 'type': 'getfolderparent', 'token': googleAuth.getAccessToken(), 'folder': folder});

            } else {
                callback(gFolders.fParents[folder]);
            }
        },
        getFolders: function(folder) {
            folder = folder || 'root';

            $('#file_manager').fadeIn("fast");
            $('#file_manager .folders').empty().addClass('loading_folders');

            gFolders.fCurrent = folder;
            gFolders.getParentFolder(folder, function(id) {
                gFolders.getFolderInfo(id, function(info) {
                    gFolders.setParent(info);
                });
            });
//
            gFolders.getFolderInfo(folder, function(info) {
                gFolders.setCurrent(info);
            });

            self.port.once("getfoldersrequest", function(xhr){
                if (xhr.status == 200) {
                    var res = JSON.parse(xhr.body);
                    var l = res.items.length;
                    if (l > 0) {
                        for (var i = l - 1; i >= 0; i--) {
                            gFolders.getFolderInfo(res.items[i].id, function(info) {
                                gFolders.addFolder(info);
                            })
                        }
                    } else {
                        $('#file_manager .folders').append($("<span>", { class:"noitem"}).text(window.l10n.gDriveNoItems));
                    }
                } else {
                    console.log('error');
                }
                $('#file_manager .folders').removeClass('loading_folders');
            });
            self.port.emit("send", {'target': 'getfolders', 'type': 'getfolders', 'token': googleAuth.getAccessToken(), 'folder': folder});

        }
    };

    function hidePopup() {
        $('#select_folder').hide();
        $('#send-to-google').removeClass('active');
        $('#choose_folder').removeClass('active');
        $('body').unbind('click', hidePopup);
        if(authorized) {
            $('#send-to-google').attr('original-title', window.l10n.tooltipUploadTo + ': ' + googleAuth.getUploadFolder().title);
        }
    }

    function setFolder(title) {
        $('#select_folder').find('p').text(' '+title);
    }

    $('#btn_select').bind('click', function() {
        var info = {id: $('#current').find('div').data('id'), title: $('#current').find('span').text()};
        googleAuth.setUploadFolder(info);
        $('#send-to-google').attr('original-title', window.l10n.tooltipUploadTo + ': ' + info.title);
        $('#file_manager').fadeOut("fast");
    });

    $('.btn_cancel').bind('click', function() {
        $('.popup_bg').fadeOut("fast");
    });

    $('.popup_bg').bind('click', function(e) {
        if (e.target == this) {
            $('.popup_bg').fadeOut("fast");
        }
    });

//    $('#folder_content').bind('click', function(e) {
//        e.preventDefault();
//        return false;
//    });

    $('#choose_folder').bind('click', function() {
        var s = $('#select_folder');
        if (!s.is(':visible')) {
            setFolder(googleAuth.getUploadFolder().title);
            $('#select_folder input[name=share]').prop('checked', localStorage['shareOnGoogle'] !== 'true');
            s.show();
            $('#send-to-google').addClass('active');
            $('#send-to-google').attr('original-title', '');
            $('#choose_folder').addClass('active');
            setTimeout(function() {
                $('body').bind('click', hidePopup);
            }, 10);
        }

    });

    $('#select_folder>div').bind('click', function(e) {
        e.stopPropagation();
    });

    $('#select_folder span.title').bind('click', function() {
        googleAuth.authorize(function() {
            gFolders.setAccessToken(googleAuth.getAccessToken());
            gFolders.getFolders(googleAuth.getUploadFolder().id);
            hidePopup();
        });
        return false;
    });

    $('#select_folder input[name=share]').on('change', function () {
        localStorage['shareOnGoogle'] = !$(this).prop('checked');
    });

    $('#nimbus_folder').click(function(e) {
        nimbus.foldersShowManager();
        e.preventDefault();
    });

    var gDriveConfig = {
        client_id: '330587763390.apps.googleusercontent.com',
        client_secret: 'Wh5_rPxGej6B7qmsVxvGolg8',
        api_scope: 'https://www.googleapis.com/auth/drive.readonly.metadata https://www.googleapis.com/auth/drive.file'
    };

    var googleAuth = new OAuth2('google', gDriveConfig);
//    googleAuth.clear();

    var setPublicGdrive = function(fileId) {
        googleAuth.authorize(function() {

            self.port.emit("send",{type: 'share', 'token': googleAuth.getAccessToken(), 'fileId': fileId});

        });

    };

    var clearGdriveData = function() {
        googleAuth.clear();
        googleAuth = new OAuth2('google', gDriveConfig);
    };

    var saveToGdrive = function() {
        if (!authorized) {
            googleAuth.authorize(function(error) {
                if(!error) {
                    $('#choose_folder').show();
                    authorized = true;
                    $('#send-to-google').attr('original-title', window.l10n.tooltipUploadTo + ': ' + googleAuth.getUploadFolder().title);
                }
            });
            return;
        }
        var data = imgnewdata.replace(/^data:image\/(png|jpeg|bmp);base64,/, "");

        googleAuth.authorize(function() {
            $('#message').hide();
            $('#linked').hide();
            $('#uploadimg').show();

            googleAuth.sendMessage({'type': 'sendimg', 'token': googleAuth.getAccessToken(), 'folderId': googleAuth.getUploadFolder().id, 'name': screenname, 'data': data}, function (message) {
                parseResponse(message);
            });

            function parseResponse(xhr) {
                $('#uploadimg').hide();
                switch (xhr.status) {
                    case 200:	// success
                        var res = JSON.parse(xhr.body);
                        if (res.alternateLink && res.ownerNames) {
                            if(localStorage['shareOnGoogle'] === 'true') setPublicGdrive(res.id);
                            $('#linked').show();
                            $('#url_button').show();
                            $('#linked input').val(res.alternateLink);
                            copyUrlToClipboard(res.alternateLink)
                        }
                        break;

                    case 401: // login fail
                        $.ambiance({message: window.l10n.notificationLoginFail, type: "error", timeout: 2});
                        clearGdriveData();
                        break;

                    default: // network error
                        $.ambiance({message: window.l10n.notificationWrong, type: "error", timeout: 2});
                        clearGdriveData();
                }
            }

        });

    };

    self.port.on("oauthcallback", function(data){
        window['oauth-callback'](data);
    });

    image.load(function() {
        imgdata = image.attr('src');
        screenname = image.attr('title');
        initPage();
    });
//    image.attr('src', imgdata);

});