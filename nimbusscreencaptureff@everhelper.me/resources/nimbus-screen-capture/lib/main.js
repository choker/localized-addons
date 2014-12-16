var tabs = require('sdk/tabs');
var self = require("sdk/self");
var data = self.data;
var screen = require("screen-capture");
var pageMod = require('sdk/page-mod');
var cm = require("sdk/context-menu");
var { MenuButton } = require('menu-button');
var { Hotkey } = require("sdk/hotkeys");
var clipboard = require("sdk/clipboard");
var Request = require("sdk/request").Request;
var {XMLHttpRequest} = require("sdk/net/xhr");

var {Cc, Ci, Cu} = require("chrome");
var mediator = Cc['@mozilla.org/appshell/window-mediator;1']
    .getService(Ci.nsIWindowMediator);

var preferences = require("sdk/preferences/service");
var _ = require("sdk/l10n").get;

var button;
var hotkeys = {
    visible: null,
    selected: null,
    entire: null
};

var extensionsOptions = {
    extensionsname: "extensions.nimbusScreenshot.",
    init: function () {

        if (!preferences.has(this.extensionsname + 'format')) {
            preferences.set(this.extensionsname + 'format', 'png');
        } else if (preferences.get(this.extensionsname + 'format') == 'jpg') {
            preferences.set(this.extensionsname + 'format', 'jpeg');
        }
        if (!preferences.has(this.extensionsname + 'imageQuality')) {
            preferences.set(this.extensionsname + 'imageQuality', '92');
        }
        if (!preferences.has(this.extensionsname + 'toolbarbutton')) {
            preferences.set(this.extensionsname + 'toolbarbutton', true);
        }
        if (!preferences.has(this.extensionsname + 'addonbarbutton')) {
            preferences.set(this.extensionsname + 'addonbarbutton', false);
        }

        if (!preferences.has(this.extensionsname + 'shadow')) {
            preferences.set(this.extensionsname + 'shadow', true);
        }
        if (!preferences.has(this.extensionsname + 'enablenumber')) {
            preferences.set(this.extensionsname + 'enablenumber', false);
        }

        if (!preferences.has(this.extensionsname + 'enablehotkeys')) {
            preferences.set(this.extensionsname + 'enablehotkeys', true);
        }

        if (!preferences.has(this.extensionsname + 'visible')) {
            preferences.set(this.extensionsname + 'visible', '1');
        }
        if (!preferences.has(this.extensionsname + 'selected')) {
            preferences.set(this.extensionsname + 'selected', '2');
        }
        if (!preferences.has(this.extensionsname + 'entire')) {
            preferences.set(this.extensionsname + 'entire', '3');
        }
        if (!preferences.has(this.extensionsname + 'window')) {
            preferences.set(this.extensionsname + 'window', '99');
        }

        if (!preferences.has(this.extensionsname + 'doneType')) {
            preferences.set(this.extensionsname + 'doneType', 'edit');
        }

        if (!preferences.has(this.extensionsname + 'quickCapture')) {
            preferences.set(this.extensionsname + 'quickCapture', 'false');
        }

        if (!preferences.has(this.extensionsname + 'fileNamePattern')) {
            preferences.set(this.extensionsname + 'fileNamePattern', 'screenshot-{domain} {date} {time}');
        }

        if (!preferences.has(this.extensionsname + 'saveCropPosition')) {
            preferences.set(this.extensionsname + 'saveCropPosition', false);
        }

        if (!preferences.has(this.extensionsname + 'cropPosition')) {
            preferences.set(this.extensionsname + 'cropPosition', JSON.stringify({"x":50,"y":50,"x2":450,"y2":250,"w":400,"h":200}));
        }
    },
    setOptions: function (options) {

        preferences.set(this.extensionsname + 'format', options.format);
        preferences.set(this.extensionsname + 'imageQuality', options.imageQuality);

        preferences.set(this.extensionsname + 'toolbarbutton', options.toolbarbutton);
//        preferences.set(this.extensionsname + 'addonbarbutton', options.addonbarbutton);

        preferences.set(this.extensionsname + 'shadow', options.shadow);
        preferences.set(this.extensionsname + 'enablenumber', options.enablenumber);

        preferences.set(this.extensionsname + 'enablehotkeys', options.enablehotkeys);

        preferences.set(this.extensionsname + 'visible', options.hotkeys.visible);
        preferences.set(this.extensionsname + 'selected', options.hotkeys.selected);
        preferences.set(this.extensionsname + 'entire', options.hotkeys.entire);
        preferences.set(this.extensionsname + 'window', options.hotkeys.window);

    },
    setDoneType: function (e) {
        preferences.set(this.extensionsname + 'doneType', e);
    },
    getDoneType: function () {
        return preferences.get(this.extensionsname + 'doneType');
    },
    setQuickCapture: function (e) {
        preferences.set(this.extensionsname + 'quickCapture', e);
    },
    getQuickCapture: function () {
        return preferences.get(this.extensionsname + 'quickCapture');
    },
    setFileNamePattern: function (e) {
        preferences.set(this.extensionsname + 'fileNamePattern', e);
    },
    getFileNamePattern: function () {
        return preferences.get(this.extensionsname + 'fileNamePattern');
    },
    setSaveCropPosition: function (e) {
        preferences.set(this.extensionsname + 'saveCropPosition', e);
    },
    getSaveCropPosition: function () {
        return preferences.get(this.extensionsname + 'saveCropPosition');
    },
    setCropPosition: function (e) {
        preferences.set(this.extensionsname + 'cropPosition', e);
    },
    getCropPosition: function () {
        return preferences.get(this.extensionsname + 'cropPosition');
    },
    getOptions: function () {
        return {
            'format': preferences.get(this.extensionsname + 'format'),
            'imageQuality': preferences.get(this.extensionsname + 'imageQuality'),
            'toolbarbutton': preferences.get(this.extensionsname + 'toolbarbutton'),
            'addonbarbutton': preferences.get(this.extensionsname + 'addonbarbutton'),
            'shadow': preferences.get(this.extensionsname + 'shadow'),
            'enablenumber': preferences.get(this.extensionsname + 'enablenumber'),
            'enablehotkeys': preferences.get(this.extensionsname + 'enablehotkeys'),
            'hotkeys': {
                'visible': preferences.get(this.extensionsname + 'visible'),
                'selected': preferences.get(this.extensionsname + 'selected'),
                'entire': preferences.get(this.extensionsname + 'entire'),
                'window': preferences.get(this.extensionsname + 'window')
            }
        };
    }
};
extensionsOptions.init();


var panel = require("sdk/panel").Panel({
    width: 230,
    height: 280,
    onShow: function () {
        var currentpage = {'body': false, 'area': false};
        var window = mediator.getMostRecentWindow("navigator:browser").gBrowser.contentWindow;
        var document = window.document;
        if (typeof document.body !== 'undefined') {
            currentpage.body = true;
            if (/nimbuscapturearea/.test(document.getElementsByTagName('body')[0].className)) {
                currentpage.area = true;
            }
        }
        panel.port.emit("enable-button", currentpage);
        panel.port.emit("doneType", extensionsOptions.getDoneType());
    },
    contentURL: data.url("popup.html"),
    contentScriptFile: [data.url("js/jquery-2.1.1.min.js"), data.url("js/popup.js")]
});
panel.port.on("screen", function (option) {
    screen.capturepage(option);
    panel.hide();
});
panel.port.on("setDoneType", function (option) {
    extensionsOptions.setDoneType(option);
});


function createButton(options) {
    if (!!button) button.destroy();

    button = MenuButton({
        id: 'nimbus-screen-capture',
        label: 'Nimbus Screenshot',
        tooltiptext: "Nimbus Screenshot",
        type: (extensionsOptions.getQuickCapture() == 'false') ? 'button' : "menu-button",
        icon: {
            "16": "./images/icons/16x16.png",
            "32": "./images/icons/32x32.png",
            "64": "./images/icons/64x64.png"
        },
        onClick: function (state, isMenu) {
            var q = extensionsOptions.getQuickCapture();
            if (isMenu) {
                panel.show({
                    position: button
                });
            } else {
                if (q !== 'false') {
                    screen.capturepage(q);
                }
            }
        }
    });

}

exports.main = function (options) {

    var currentWorker = null;

    pageMod.PageMod({
        include: 'https://accounts.google.com/o/oauth2/approval*',
        contentScriptWhen: 'ready',
        contentScriptFile: data.url("oauth2/oauth2_inject.js"),
        onAttach: function (worker) {
            worker.port.on("openoauth", function (text) {
                tabs.open({
                    url: (data.url('oauth2/oauth2.html') + text)
                });
            });
        }
    });

    pageMod.PageMod({
        include: (data.url('oauth2/oauth2.html') + '*'),
        contentScriptWhen: 'ready',
        contentScriptFile: [data.url("oauth2/oauth2.js"), data.url("oauth2/oauth2_finish.js")],
        onAttach: function (worker) {
            worker.port.on("send", function (text) {

                if (text.type == 'access') {
                    Request({
                        url: "https://accounts.google.com/o/oauth2/token",
                        content: {"code": text.code, "client_id": "330587763390.apps.googleusercontent.com", "client_secret": "Wh5_rPxGej6B7qmsVxvGolg8", "redirect_uri": "urn:ietf:wg:oauth:2.0:oob", "grant_type": "authorization_code"},
                        onComplete: function (response) {
                            var obj = JSON.parse(response.text);
                            worker.port.emit("request", obj);
                        }
                    }).post();
                } else if (text.type == 'refresh') {
                    Request({
                        url: "https://accounts.google.com/o/oauth2/token",
                        content: {"client_id": "330587763390.apps.googleusercontent.com", "client_secret": "Wh5_rPxGej6B7qmsVxvGolg8", "refresh_token": text.token, "grant_type": "refresh_token"},
                        onComplete: function (response) {
                            var obj = JSON.parse(response.text);
                            worker.port.emit("request", obj);
                        }
                    }).post();
                } else {

                    var window = mediator.getMostRecentWindow("navigator:browser").gBrowser.contentWindow;
                    window.close();

                    for each (var tab in tabs) {
                        if(tab.url == data.url('edit.html')){
                            currentWorker.port.emit("oauthcallback", text.error);
                        }
                    }
                }

            });
        }
    });

    pageMod.PageMod({
        include: (data.url('edit.html') + '*'),
        contentScriptWhen: 'ready',
        contentScriptFile: [
            data.url("js/jquery-2.1.1.min.js"),
            data.url("js/jquery.Jcrop.js"),
            data.url("js/jquery.ambiance.js"),
            data.url("js/modernizr.js"),
            data.url("js/jquery.tipsy.js"),
            data.url("js/canvasPaint.js"),
            data.url("oauth2/oauth2.js"),
            data.url("js/nimbusShare.js"),
            data.url("js/jquery.formstyler.js"),
            data.url("js/spectrum.js"),
            data.url("js/screen.js")
        ],
        onAttach: function (worker) {
            worker.port.on("saveimage", function (text) {
                screen.saveScreen({title: text.title, dataURL: text.data, format: text.format});
            });
            worker.port.on("copytoclipboard", function (text) {
                clipboard.set(text);
            });
            worker.port.on("readfromclipboard", function (text) {
                var buff;
                if (clipboard.currentFlavors.indexOf("image") != -1) {
                    buff = clipboard.get()
                } else {
                    buff = '';
                }
                worker.port.emit("readfromclipboardrequest", buff);
            });
            worker.port.on("sendtoeverhelper", function (data) {
                Request({
                    url: 'https://sync.everhelper.me',
                    content: JSON.stringify(data),
                    onComplete: function (response) {
                        worker.port.emit("everhelperrequest" + data.action, response.text);
                    }
                }).post();
            });
            worker.port.on("nimbusuploadfile", function (data) {

                var format = extensionsOptions.getOptions().format || 'png';

                var win = require("sdk/deprecated/window-utils").windowIterator().next();
                var qi = win.QueryInterface(Ci.nsIDOMWindowInternal);
                var atob = qi.atob;
                var Blob = qi.Blob;
                var FormData = qi.FormData;

                function dataURLtoBlob(dataURL) {
                    var binary = atob(dataURL.split(',')[1]);
                    var array = [];
                    for (var i = 0; i < binary.length; i++) {
                        array.push(binary.charCodeAt(i));
                    }
                    return new Blob([new Uint8Array(array)], {type: 'image/' + format});
                }

                var file = dataURLtoBlob(data);
                var fd = new FormData();
                fd.append("screens", file, 'screen.' + format);

                var xhr = new XMLHttpRequest();
                xhr.open("POST", "https://sync.everhelper.me/files:preupload", true);
                xhr.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        worker.port.emit("uploadfilerequest", xhr.responseText);
                    }
                };
                xhr.send(fd);

            });
            worker.port.on("shorturl", function (url) {
                Request({
                    url: "http://nimb.ws/dantist_api.php",
                    content: {"url": url},
                    onComplete: function (response) {
                        worker.port.emit("shorturlrequest", response.text);
                    }
                }).post();
            });

            worker.port.on("send", function (text) {

                var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
                var cookieSvc = Cc["@mozilla.org/cookieService;1"].getService(Ci.nsICookieService);

                if (text.type == 'refresh') {
                    Request({
                        url: "https://accounts.google.com/o/oauth2/token",
                        content: {
                            "client_id": "330587763390.apps.googleusercontent.com",
                            "client_secret": "Wh5_rPxGej6B7qmsVxvGolg8",
                            "refresh_token": text.token,
                            "grant_type": "refresh_token"
                        },
                        onComplete: function (response) {
                            var obj = JSON.parse(response.text);
                            worker.port.emit("request", obj);
                        }
                    }).post();

                } else if (text.type == 'sendimg') {
                    var format = extensionsOptions.getOptions().format || 'png';
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart');
                    xhr.setRequestHeader('Authorization', 'OAuth ' + text.token);
                    xhr.setRequestHeader('Content-Type', 'multipart/mixed; boundary="--287032381131322"');

                    xhr.onreadystatechange = function () {
                        if (this.readyState == 4) {
                            worker.port.emit("request", {'status': xhr.status, 'body': xhr.responseText});
                            xhr = null;
                        }
                    };

                    const boundary = '--287032381131322';
                    const delimiter = "\r\n--" + boundary + "\r\n";
                    const close_delim = "\r\n--" + boundary + "--";

                    var metadata = {
                        "title": text.name + "." + format,
                        "mimeType": "image/" + format,
                        "description": "Uploaded by Nimbus Screen Capture",
                        "parents": [
                            {
                                "kind": "drive#fileLink",
                                "id": text.folderId
                            }
                        ]
                    };

                    var multipartRequestBody = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: ' + 'image/' + format + '\r\n' + 'Content-Transfer-Encoding: base64\r\n' + '\r\n' + text.data + close_delim;

                    xhr.send(multipartRequestBody);
                } else if (text.type == 'share') {
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', 'https://www.googleapis.com/drive/v2/files/' + text.fileId + '/permissions');
                    xhr.setRequestHeader('Authorization', 'OAuth ' + text.token);
                    xhr.setRequestHeader('Content-Type', 'application/json');

                    var permission = {
                        "role": "reader",
                        "type": "anyone"

                    };
                    var body = JSON.stringify(permission);

                    xhr.onreadystatechange = function () {
                        if (this.readyState == 4) {

                        }
                    };

                    xhr.send(body);
                } else if (text.type == 'getfolders') {

                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', "https://www.googleapis.com/drive/v2/files/" + text.folder + "/children?q=mimeType = 'application/vnd.google-apps.folder'");
                    xhr.setRequestHeader('Authorization', 'Bearer ' + text.token);
                    xhr.setRequestHeader('Content-Type', 'application/json');

                    xhr.onreadystatechange = function () {
                        if (this.readyState == 4) {
                            worker.port.emit("getfoldersrequest", {'status': xhr.status, 'body': xhr.responseText, 'target': text.target});
                            xhr = null;
                        }
                    };

                    xhr.send(null);

                } else if (text.type == 'getfolderinfo') {

                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', "https://www.googleapis.com/drive/v2/files/" + text.folder);
                    xhr.setRequestHeader('Authorization', 'Bearer ' + text.token);
                    xhr.setRequestHeader('Content-Type', 'application/json');

                    xhr.onreadystatechange = function () {
                        if (this.readyState == 4) {
                            worker.port.emit(text.folder, {'status': xhr.status, 'body': xhr.responseText, 'target': text.target});
                            xhr = null;
                        }
                    };

                    xhr.send(null);

                } else if (text.type == 'getfolderparent') {

                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', "https://www.googleapis.com/drive/v2/files/" + text.folder + "/parents");
                    xhr.setRequestHeader('Authorization', 'Bearer ' + text.token);
                    xhr.setRequestHeader('Content-Type', 'application/json');

                    xhr.onreadystatechange = function () {
                        if (this.readyState == 4) {
                            worker.port.emit("getfolderparentrequest", {'status': xhr.status, 'body': xhr.responseText, 'target': text.target});
                            xhr = null;
                        }
                    };

                    xhr.send(null);

                } else if (text.type == 'getcookies') {

                    var uri = ios.newURI("https://everhelper.me", null, null);
                    var cookie = cookieSvc.getCookieString(uri, null);

                    worker.port.emit("getcookiesrequest", {'cookies': cookie, 'target': text.target});

                } else if (text.type == 'removecookies') {

                    var uri = ios.newURI("https://everhelper.me", null, null);
                    cookieSvc.setCookieString(uri, null, "auth_login=;domain=.everhelper.me;expires=Thu, 1 Jan 2000 00:00:00 GMT", null);
                    cookieSvc.setCookieString(uri, null, "eversessionid=;domain=.everhelper.me;expires=Thu, 1 Jan 2000 00:00:00 GMT", null);
                    cookieSvc.setCookieString(uri, null, "auth=;domain=.everhelper.me;expires=Thu, 1 Jan 2000 00:00:00 GMT", null);

//                    worker.port.emit("request", 'complete');

                } else if (text.type == 'setworker') {
                    currentWorker = worker;
                }

            });
        }
    });

    if (extensionsOptions.getOptions().enablehotkeys) {
        addShortcuts();
    }

    pageMod.PageMod({
        include: data.url("options.html"),
        contentScriptWhen: 'ready',
        contentScriptFile: [data.url("js/jquery-2.1.1.min.js"), data.url("js/jquery.tipsy.js"), data.url("js/options.js")],
        onAttach: function (worker) {
            worker.port.on("saveoptions", function (text) {
                extensionsOptions.setOptions(text.options);
                switch (text.target) {
                    case 'format':
                        break;
                    case 'shadow':
                        break;
                    case 'number':
                        break;
                    case 'enablehotkeys':
                        if (!!extensionsOptions.getOptions().enablehotkeys) {
                            addShortcuts();
                        } else {
                            destroyShortcuts();
                        }
                        break;
                    case 'hotkeys':
                        destroyShortcuts();
                        addShortcuts();
                        break;
                }
            });
            worker.port.on("getoptions", function () {
                worker.port.emit("setoptions", extensionsOptions.getOptions());
            });

            worker.port.on("getDoneType", function () {
                worker.port.emit("setDoneType", extensionsOptions.getDoneType());
            });
            worker.port.on("saveDoneType", function (type) {
                extensionsOptions.setDoneType(type);
            });

            worker.port.on("getFileNamePattern", function () {
                worker.port.emit("setFileNamePattern", extensionsOptions.getFileNamePattern());
            });
            worker.port.on("saveFileNamePattern", function (type) {
                extensionsOptions.setFileNamePattern(type);
            });

            worker.port.on("getQuickCapture", function () {
                worker.port.emit("setQuickCapture", extensionsOptions.getQuickCapture());
            });
            worker.port.on("saveQuickCapture", function (type) {

                extensionsOptions.setQuickCapture(type);

                if (!!extensionsOptions.getOptions().toolbarbutton) {
                    createButton(options);
                }
            });

            worker.port.on("getSaveCropPosition", function () {
                worker.port.emit("setSaveCropPosition", extensionsOptions.getSaveCropPosition());
            });
            worker.port.on("saveSaveCropPosition", function (s) {
                extensionsOptions.setSaveCropPosition(s);
            });
            worker.port.on("getOptionsL10n", function () {
                worker.port.emit("setOptionsL10n", {
                    "popupBtnVisible": _("popupBtnVisible"),
                    "popupBtnArea": _("popupBtnArea"),
                    "popupBtnEntire": _("popupBtnEntire"),
                    "popupBtnBlank": _("popupBtnBlank"),

                    "popupBtnEnableEdit": _("popupBtnEnableEdit"),
                    "popupBtnEnableSave": _("popupBtnEnableSave"),
                    "popupBtnEnableDownload": _("popupBtnEnableDownload"),
                    "popupBtnEnableCopy": _("popupBtnEnableCopy")
                });
            });
        }
    });

    // ---- create menu
    cm.Menu({
        label: _("appName"),
        image: data.url("images/favicon.png"),
        context: cm.PageContext(),
        contentScript: 'self.on("click", function (node, data) {' +
            '  self.postMessage(data);' +
            '});',
        items: [
            cm.Item({ label: _("popupBtnVisible"), image: data.url("images/visible.png"), data: "visible" }),
            cm.Item({ label: _("popupBtnArea"), image: data.url("images/area.png"), data: "area" }),
            cm.Item({ label: _("popupBtnEntire"), image: data.url("images/entire.png"), data: "entire" }),
            cm.Separator(),
            cm.Item({ label: _("popupBtnOptions"), data: "options" })
        ],
        onMessage: function (date) {
            screen.capturepage(date);
        }
    });

    createButton(options);
};

function addShortcuts() {

    hotkeys.visible = Hotkey({
        combo: "accel-shift-" + extensionsOptions.getOptions().hotkeys.visible,
        onPress: function () {
            screen.capturepage('visible');
        }
    });

    hotkeys.selected = Hotkey({
        combo: "accel-shift-" + extensionsOptions.getOptions().hotkeys.selected,
        onPress: function () {
            screen.capturepage('area');
        }
    });

    hotkeys.entire = Hotkey({
        combo: "accel-shift-" + extensionsOptions.getOptions().hotkeys.entire,
        onPress: function () {
            screen.capturepage('entire');
        }
    });
}

function destroyShortcuts() {
    hotkeys.visible.destroy();
    hotkeys.entire.destroy();
    hotkeys.selected.destroy();
}