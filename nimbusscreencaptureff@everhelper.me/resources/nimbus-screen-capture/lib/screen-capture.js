// screen-capture.js - ScreenShot's module
// author: Everhelper
var data = require('sdk/self').data;
var tabs = require('sdk/tabs');
var {Cc, Ci, Cu} = require("chrome");
var preferences = require("sdk/preferences/service");
var _ = require("sdk/l10n").get;
var download = require("download");

//TODO global
var captureData = {};

var mediator = Cc['@mozilla.org/appshell/window-mediator;1']
    .getService(Ci.nsIWindowMediator);
var t;

function capturepage(option) {
    var window = mediator.getMostRecentWindow("navigator:browser").gBrowser.contentWindow;
    var document = window.document;
    var html = document.documentElement;
    var info = {'url': window.location.href, 'title': document.title, 'time': getTimeStamp()};
    var remove = function(id) {
        return (elem = document.getElementById(id)).parentNode.removeChild(elem);
    };
    var w, h, x, y;
    switch (option) {
        case 'area':
            var pm = require("sdk/page-mod").PageMod({
                include: tabs.activeTab.url,
                attachTo: ["existing", "top"],
                contentStyleFile: [data.url("css/jquery.Jcrop.css"), data.url("css/stylecrop.css")]
            });
            t = tabs.activeTab.attach({
                contentScriptFile: [data.url("js/jquery-2.1.1.min.js"), data.url("js/jquery.Jcrop.js"), data.url("js/crop.js")]
            });
            t.port.on("save", function(imgdata) {
                convertToDownload(imgdata, getFileName(info));
                pm.destroy();
            });
            t.port.on("edit", function(imgdata) {
                openEditPage({data: imgdata, tabtitle: getFileName(info)});
                pm.destroy();
            });
            t.port.on("copytoclipboard", function(imgdata) {
                copyToClipboard(imgdata);
                pm.destroy();
            });
            t.port.on("sendtonimbus", function(imgdata) {
                openEditPage({data: imgdata, tabtitle: getFileName(info)}, 'nimbus');
                pm.destroy();
            });
            t.port.on("getlocation", function() {
                t.port.emit("setlocation", {
                    "cropBtnEdit": _("cropBtnEdit"),
                    "cropBtnSave": _("cropBtnSave"),
                    "cropBtnCancel": _("cropBtnCancel"),
                    "cropBtnCopy": _("cropBtnCopy"),
                    "cropBtnNimbus": _("cropBtnNimbus")
                });
            });
            t.port.on("getCropPosition", function() {
                t.port.emit("setCropPosition", preferences.get("extensions.nimbusScreenshot." + 'saveCropPosition') && JSON.parse(preferences.get("extensions.nimbusScreenshot." + 'cropPosition')));
            });
            t.port.on("saveCropPosition", function(p) {
                preferences.set("extensions.nimbusScreenshot." + 'cropPosition', JSON.stringify(p));
            });
        case 'entire':
            x = y = 0;
            w = html.scrollWidth;
            h = html.scrollHeight;
            break;
        case 'visible':
            x = 0;
            y = html.scrollTop;
            w = html.clientWidth;
            h = html.clientHeight;
            break;
        case 'blank':
            openEditPage({
                data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAMgCAYAAADbcAZoAAAQgklEQVR4nO3XMQEAMAyAsPo3vbpgRxMFvMwDAACIzO8AAADgDgMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJAxIAAAQMaAAAAAGQMCAABkDAgAAJBZvMM3xi/iLRgAAAAASUVORK5CYII=',
                tabtitle: 'new-blank'
            }, 'blank');
            return;
            break;
        case 'options':
            tabs.open(data.url("options.html"));
            return;
            break;
        case 'android':
            tabs.open('https://play.google.com/store/apps/details?id=com.fvd.nimbus');
            return;
            break;
        default :
            console.log('n0-n0');
            return;
    }

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.style.display = 'none';
    canvas.setAttribute('id', 'screen-from-nimbus');
    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    ctx.drawWindow(window, x, y, w, h, 'rgb(255, 255, 255)');
    remove('screen-from-nimbus');

    captureData = {
        data: canvas.toDataURL(),
        taburl: window.location.href,
        tabtitle: getFileName(info),
        w: w,
        h: h
    };
    if (option == 'area') {
        t.port.emit('data', captureData.data);
        return;
    }
    openEditPage(captureData);
}

function copyToClipboard (imgdata) {
    require("sdk/clipboard").set(imgdata);
    showNotification("Image has been copied to the clipboard.");
}
function showNotification(text) {
    var notifications = require("sdk/notifications");
    notifications.notify({
        title: "Nimbus Screenshot!",
        text: text,
        iconURL: data.url("images/favicon.png")
    });
}
function getFileName(pageinfo, format) {
    var s = preferences.get("extensions.nimbusScreenshot." + 'fileNamePattern');
    if (typeof pageinfo == 'object') {
        try {
            s = s.replace(/{url}/, pageinfo.url || '')
                .replace(/{title}/, pageinfo.title || '')
                .replace(/{domain}/, pageinfo.url.match(/^[^/]+\/\/([^/]+)/)[1] || '')
                .replace(/{date}/, pageinfo.time.split(' ')[0] || '')
                .replace(/{time}/, pageinfo.time.split(' ')[1] || '');
        } catch (e) {
            console.log(s);
        }
    }
    return s.replace(/[\*\|\\\:\"\<\>\?\/\.]+/ig, ' ') + (format ? ('.' + format) : '');
}
var getL10n = function() {
    return JSON.stringify({
        "notificationCopy": _("notificationCopy"),
        "notificationWrongEditor": _("notificationWrongEditor"),
        "notificationWrongInsert": _("notificationWrongInsert"),
        "notificationInsertInfo": _("notificationInsertInfo"),
        "notificationWrong": _("notificationWrong"),
        "notificationLoginFail": _("notificationLoginFail"),
        "notificationEmailFail": _("notificationEmailFail"),
        "notificationRegisterFail": _("notificationRegisterFail"),
        "notificationDataIncorrect": _("notificationDataIncorrect"),
        "notificationPassChanged": _("notificationPassChanged"),
        "notificationKeyIncorrect": _("notificationKeyIncorrect"),
        "notificationRestoreSent": _("notificationRestoreSent"),
        "notificationEmailIncorrect": _("notificationEmailIncorrect"),
        "notificationUrlCopied": _("notificationUrlCopied"),
        "notificationUploaded": _("notificationUploaded"),
        "notificationReachedLimit": _("notificationReachedLimit"),

        "tooltipZoomPlus": _("tooltipZoomPlus"),
        "tooltipZoomMinus": _("tooltipZoomMinus"),
        "tooltipResize": _("tooltipResize"),
        "tooltipCrop": _("tooltipCrop"),
        "tooltipPen": _("tooltipPen"),
        "tooltipRectangle": _("tooltipRectangle"),
        "tooltipText": _("tooltipText"),
        "tooltipUndo": _("tooltipUndo"),
        "tooltipRedo": _("tooltipRedo"),
        "tooltipUndoAll": _("tooltipUndoAll"),
        "tooltipShadow": _("tooltipShadow"),
        "tooltipNumbers": _("tooltipNumbers"),
        "tooltipZoom": _("tooltipZoom"),
        "tooltipEllipse": _("tooltipEllipse"),
        "tooltipLine": _("tooltipLine"),
        "tooltipArrow": _("tooltipArrow"),
        "tooltipLineWidth": _("tooltipLineWidth"),
        "tooltipColor": _("tooltipColor"),
        "tooltipBlur": _("tooltipBlur"),
        "tooltipNote": _("tooltipNote"),
        "tooltipCopy": _("tooltipCopy"),
        "tooltipShortUrl": _("tooltipShortUrl"),
        "tooltipNotAuthorized": _("tooltipNotAuthorized"),
        "tooltipLogout": _("tooltipLogout"),
        "tooltipUploadTo": _("tooltipUploadTo"),
        "tooltipWrongEmail": _("tooltipWrongEmail"),
        "tooltipPassInfo": _("tooltipPassInfo"),
        "tooltipPassMatch": _("tooltipPassMatch"),

        "limitUsage": _("limitUsage"),
        "limitOf": _("limitOf"),

        "gDriveMainFolder": _("gDriveMainFolder"),
        "gDriveNoItems": _("gDriveNoItems")
    });
};

function openEditPage(captureData, params) {
    var option = params || preferences.get("extensions.nimbusScreenshot." + 'doneType');

    getFileName();
    switch (option) {
        case 'copy':
            copyToClipboard(captureData.data);
            break;
        case 'save':
            convertToDownload(captureData.data, captureData.tabtitle);
            break;
        case 'edit':
        case 'done':
        default:
            tabs.open({
                url: data.url('edit.html' +((option == 'edit') ? '' : ('?' + option))),
                onReady: function(tab) {
                    worker = tab.attach({
                        contentScriptWhen: 'ready',
                        contentScriptFile: data.url("js/screen-init.js")
                    });
                    worker.port.emit("init", {
                        'src': captureData.data,
                        'title': captureData.tabtitle,
                        'l10n': getL10n()
                    });
                }
            });
            break;
    }
}

function convertToDownload (data, name) {

    var format = preferences.get("extensions.nimbusScreenshot." + 'format') || 'png';

    if (format === 'jpeg') {

        var window = mediator.getMostRecentWindow("navigator:browser").gBrowser.contentWindow;
        var document = window.document;
        var pic = document.createElement('img');
        pic.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = pic.width;
            canvas.height = pic.height;
            var context = canvas.getContext('2d');
            context.drawImage(pic, 0, 0);
            data = canvas.toDataURL( "image/jpeg", (preferences.get("extensions.nimbusScreenshot." + 'imageQuality') || '92')/100);
            saveScreen({title: name, dataURL: data, format: 'jpeg'});
        };
        pic.src = data;
    } else {
        saveScreen({title: name, dataURL: data, format: 'png'});
    }

}
function validTitle(title) {
    return title.replace(/[^a-zа-я0-9]/gi, '-').replace(/[-]+/gi, '-') + ' ' + getTimeStamp();
}
function saveScreen(data) {
    var dr, p;
    var format = data.format || 'png';
    var window = mediator.getMostRecentWindow("navigator:browser").gBrowser.contentWindow;
    var nsIFilePicker = Ci.nsIFilePicker;
    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window.parent, "Save Image To", nsIFilePicker.modeSave);
    fp.defaultString = (data.title || 'screen') + '.' + format;
    fp.appendFilter(format.toUpperCase() + ' Image', '*.' + format);

    var show = fp.show();
    if (show != nsIFilePicker.returnCancel) {
        dr = new download.get({});
        p = (new RegExp("\\."+format+'$')).test(fp.file.path) ? fp.file.path : fp.file.path + '.' + format;
        console.log(p);
        dr(data.dataURL, p, null, false);
    }
}
function getTimeStamp() {
    var y, m, d, h, M, s;
    var time = new Date();
    y = time.getFullYear();
    m = time.getMonth() + 1;
    d = time.getDate();
    h = time.getHours();
    M = time.getMinutes();
    s = time.getSeconds();
    if (m < 10) m = '0' + m;
    if (d < 10) d = '0' + d;
    if (h < 10) h = '0' + h;
    if (M < 10) M = '0' + M;
    if (s < 10) s = '0' + s;
    return    y + '-' + m + '-' + d + ' ' + h + '-' + M + '-' + s;
}

exports.capturepage = capturepage;
exports.saveScreen = saveScreen;