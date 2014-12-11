var nimbus = {
    client_software: 'screens_chrome',
    user_session_id: '',
    user_email: '',
    user_auth: '',
    user_temp_pass: '',
    can_upload: true,
    img_size: 0,
    user_authorized: function() {
        return !!(nimbus.user_email && nimbus.user_session_id && nimbus.user_auth)
    },
    init: function() {

    },
    send: function(data, success) {

        self.port.once("everhelperrequest"+data.action, function(message){
            success(message);
        });
        self.port.emit("sendtoeverhelper", data);

//        $.ajax({
//            type: 'POST',
//            url: 'https://sync.everhelper.me',
//            data: JSON.stringify(data),
//            dataType: 'json',
//            async: true,
//            success: success,
//            error: error
//        });

    },
    userReadCookies: function(cb) {

        self.port.once("getcookiesrequest", function(message){

            var cookies = {
                auth_login: '',
                eversessionid: '',
                auth: ''
            };

            try {
                var list = message.cookies.split("; ");
                for(var i = 0; i < list.length; i++) {
                    var cookie = list[i];
                    var p = cookie.indexOf("=");
                    var name = cookie.substring(0,p);
                    var value = cookie.substring(p+1);
                    value = decodeURIComponent(value);
                    cookies[name] = value;
                }
            } catch (e) {
                console.log(e);
            }
            nimbus.user_email = cookies['auth_login'] ;
            nimbus.user_session_id = cookies['eversessionid'];
            nimbus.user_auth = cookies['auth'];

//            var s = message.cookies;
//            nimbus.user_email = s.match(/auth_login=([^\;|$]+)/i)[1];
//            nimbus.user_session_id = s.match(/eversessionid=([^\;|$]+)/i)[1];
//            nimbus.user_auth = s.match(/auth=([^\;|$]+)/i)[1];

//            console.log(nimbus.user_email,nimbus.user_session_id,nimbus.user_auth);
            if (typeof cb === 'function') cb();
        });
        self.port.emit("send", {type: 'getcookies'} );

    },
    userReadSessionId: function() {
        return localStorage['screens_session_id'];
    },
    userSetSessionId: function(id) {
        nimbus.user_session_id = id;
        localStorage['screens_session_id'] = id;
    },
    userReadEmail: function() {
        return localStorage['screens_email'];
    },
    userSetEmail: function(email) {
        nimbus.user_email = email;
        localStorage['screens_email'] = email;
    },
    uploadReadFolder: function() {
        var obj = {};
        try {
            obj = JSON.parse(localStorage['screens_upload_folder_'+nimbus.user_email]);
        } catch (e) {
            obj = {id: 'default', title: 'My Notes'};
        }
        return obj;
    },
    uploadUpdateAndShowFolder: function() {
        var folder = nimbus.uploadReadFolder();
        var isset = false;
        nimbus.notesGetFolders(function(res) {
            res = JSON.parse(res);
            if (res.errorCode === 0) {
                var l = res.body.notes.length;
                for (var i = l-1; i >= 0; i--) {
                    if(res.body.notes[i].global_id == folder.id) {
                        isset = true;
                        break;
                    }
                }
                if (!isset) {
                    nimbus.uploadSetFolder({id: 'default', title: 'My Notes'});
                }
            } else {
                console.log('error');
            }
            nimbus.userShowFolder();
        });
    },
    uploadSetFolder: function(f) {
        localStorage['screens_upload_folder_'+nimbus.user_email] = JSON.stringify(f);
    },
    userAuth: function(email, password, callback) {

        this.send({
            "action": "user:auth",
            "body": {
                "email": email,
                "password": password
            },
            "_client_software": nimbus.client_software
        }, callback);

    },
    userExistsCookies: function(callback) {
        var user = nimbus.user_auth,
            id = nimbus.user_session_id;
        nimbus.userReadCookies(function() {
            if (user === nimbus.user_auth && id === nimbus.user_session_id) {
                callback();
            } else {
                nimbus.show();
            }
        });

    },
    userRegister: function(email, password, callback) {

        this.send({
            "action": "user_register",
            "email": email,
            "password": password,
            "_client_software": nimbus.client_software
        }, callback);

    },
    userRemindPassword: function(email, callback) {

        this.send({
            "action": "remind_password",
            "email": email,
            "_client_software": nimbus.client_software
        }, callback);

    },
    userAuthState: function(callback) {
        this.send({
            "action": "user:authstate",
            "_client_software": nimbus.client_software
        }, callback);

    },
    userLogin: function(email,pass, callback) {
        nimbus.userAuth(email, pass, function(res) {
            res = JSON.parse(res);
            if (res.errorCode === 0) {
                nimbus.userSetEmail(email);
                nimbus.userReadCookies();
                nimbus.showLimit();
                nimbus.hideAllPanel();
                nimbus.userShowEmail();
                nimbus.uploadUpdateAndShowFolder();
                nimbus.slide($('#nimbus-panel'));

//                    $('#choose-nimbus-share').show();
                $('#choose-nimbus-share').show();
                $('#save-nimbus').attr('original-title', '');
//                    $('#save-nimbus').attr('original-title', 'Upload to: ' + nimbus.uploadReadFolder().title);
            } else {
                callback();
                $.ambiance({message: window.l10n.notificationLoginFail, type: "error", timeout: 5});
            }
        });
    },
    userLogout: function() {
        nimbus.user_session_id = '';
        nimbus.user_email = '';
        nimbus.user_auth = '';
        delete localStorage['screens_session_id'];
        delete localStorage['screens_email'];

        self.port.emit("send", {type: 'removecookies'});

    },
    userInfo: function(callback) {
        this.send({
            "action": "user:info",
            "_client_software": nimbus.client_software
        }, callback);
    },
    startUpload: function (imgnewdata) {
        if (nimbus.can_upload) {
            nimbus.userExistsCookies(function() {
                nimbus.uploadFile(imgnewdata);
                $('#user-panel').fadeOut('fast');
            });
        } else {
            $.ambiance({message: window.l10n.notificationReachedLimit, timeout: 5});
        }
    },
    screenSave: function(tempname) {
        var share = nimbus.notesIsShared();

        this.send({
            "action": "screenshots:save",
            "body": {
                "screen": {
                    "commentText": nimbus.notesGetComment(),
                    "tempname": tempname,
                    "parent_id": nimbus.uploadReadFolder().id
                },
                "share": share
            },
            "_client_software": nimbus.client_software
        }, function(msg) {
            msg = JSON.parse(msg);
            if (msg.errorCode == '0') {
                $.ambiance({message: window.l10n.notificationUploaded, timeout: 2});
                if (share) {
                    $('#linked').show();
                    $('#url_button').show();
                    $('#linked input').val(msg.body.location);
                    copyUrlToClipboard(msg.body.location);
                } else {
                    $('#message')
                        .html('<a href="https://nimbus.everhelper.me/client/" target="_blank"  data-l10n-id="nimbusViewUploads">View my Nimbus uploads</a>')
                        .show();
                }
            } else {
                if (msg.errorCode == '-20') {
                    $.ambiance({message: window.l10n.notificationReachedLimit, type: "error", timeout: 5});
                } else {
                    $.ambiance({message: window.l10n.notificationWrong, type: "error", timeout: 2});
                    $.ambiance({message: msg.body['_errorDesc'], type: "error", timeout: 2});
                }
            }
        });

    },
    setScreenSize: function(s){
        nimbus.img_size = s;
    },
    notesGenerateId: function() {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var string = '';
        var min = 0;
        var max = chars.length;

        for (var i = 0; i < 3; i++) {
            var n = Math.floor(Math.random() * (max - min)) + min;
            string += chars[n];
        }

        return string + (new Date()).getTime();
    },
    notesIsShared: function() {
        return !$("input#nimbus-share").prop('checked');
    },
    notesShare: function(id) {

//        this.send({
//            "action": "notes:share",
//            "body": {
//                "global_id": id
//            }
//        }, function(msg) {
//            $('#linked').show();
//            $('#url_button').show();
//            $('#linked input').val(msg.body[id[0]]);
//
//        }, function(error) {
//            console.log(error);
//        });

    },
    notesGet: function() {

//        this.send({
//            "action": "notes:get",
//            "body": {
//                "last_update_time": 1366090275 // время в формате UNIX timestamp в секундах
//            }
//        }, function(msg) {
//            console.log(msg);
//        }, function(error) {
//            console.log(error);
//        });

    },
    notesGetComment: function() {
          return $('#nimbus-panel textarea').val();
    },
    uploadFile: function(data) {

        $('#message').hide();
        $('#linked').hide();
        $('#uploadimg').show();

        self.port.once("uploadfilerequest", function(res) {
            res = JSON.parse(res);
            if (res.errorCode === 0) {
                nimbus.screenSave(res.body.files["screens"]);
            } else {
                $.ambiance({message: window.l10n.notificationWrong, type: "error", timeout: 2});
            }
            $('#uploadimg').hide();
        });
        self.port.emit("nimbusuploadfile", data);

    },
    notesGetFolders: function(callback) {

        this.send({
            "action": "notes:getFolders",
            "body": {
            }
        }, callback);

    },
    foldersManagerAddFolder: function(folder) {
        var f = $('<li>', {
            'html': '<img src="images/icon_folder.png"> ' + folder.title,
            'data-id': folder.global_id
        }).appendTo('#nimbus_folders .folders');
        f.bind('click', function() {
            var cur = {id: folder.global_id, title: folder.title};
            nimbus.uploadSetFolder(cur);
            nimbus.userShowFolder();
        });
    },
    foldersManagerShowCurrent: function(cur) {
        $('#nimbus-future-folder')
            .data('f-title', cur.title)
            .data('f-id', cur.id)
            .find('.ff').text(cur.title);
    },
    foldersHideManager: function() {
        $('#nimbus_folders').fadeOut('fast');
        $('body').unbind('click', nimbus.foldersHideManager);
        return false;
    },
    foldersShowManager: function() {
        nimbus.userExistsCookies(function() {
            var nf = $('#nimbus_folders');
            if (nf.is(':visible')) {
                nimbus.foldersHideManager()
            } else {
                nf.fadeIn('fast').find('.folders').html('').addClass('loading_folders');
                setTimeout(function() {
                    $('body').bind('click', nimbus.foldersHideManager);
                }, 10);
                nimbus.notesGetFolders(function(res) {
                    res = JSON.parse(res);
                    if (res.errorCode === 0) {
                        var l = res.body.notes.length;
                        var h = l*23 + 4;
                        nf.animate({height: (h < 117 ? h : 117)+"px"}, 300);
                        for (var i = l-1; i >= 0; i--) {
                            nimbus.foldersManagerAddFolder(res.body.notes[i]);
                        }
                        var cur = nf.find('li[data-id='+nimbus.uploadReadFolder().id+']');
                        if(cur.length == 0) {
                            nimbus.uploadSetFolder({id: 'default', title: 'My Notes'});
                            nimbus.userShowFolder();
                            nf.find('li[data-id=default]').addClass('active');
                        } else {
                            cur.addClass('active');
                        }
                        nf.find('.folders').removeClass('loading_folders');
                    } else {
                        console.log('error');
                    }
                });
            }
        });
    },
    hideAllPanel: function() {
        $('#user-panel').find('.popup_content').hide();
    },
    userShowEmail: function() {
        $('span#user-email').text(decodeURIComponent(nimbus.user_email));
    },
    userShowFolder: function() {
        var folder =  nimbus.uploadReadFolder().title;
        $('#nimbus-folder').html(folder);
        nimbus.foldersManagerShowCurrent(nimbus.uploadReadFolder());
    },
    slide: function (element) {
        element.css({top: -440}).show();

        element.animate({
            top: 140
        }, 300);
    },
    showLimit: function () {
        function toMB(size, n) {
            return ((size) / 1024 / 1024).toFixed(n || 0) + ' MB';
        }

        nimbus.userInfo(function(msg) {
            msg = JSON.parse(msg);
            if (msg.errorCode !== 0) return;

            var premium = !!msg.body.premium.active;
            var current = +msg.body.usage.notes.current;
            var max = +msg.body.usage.notes.max;
            var limitdiv = $('#nimbus-limit');

            limitdiv.find('progress').attr('value', current).attr('max', max);

            limitdiv.find('span').text(window.l10n.limitUsage + ' ' + toMB(current, 1) + ' ' + window.l10n.limitOf + ' ' + toMB(max));
            nimbus.can_upload = (current + nimbus.img_size) < max;

            if (nimbus.can_upload) {
                if (premium) {
                    $('#to-nimbus-pro').hide();
                } else {
                    $('#to-nimbus-pro').show();
                }
                $('#nimbus-pro').fadeOut('fast');
            } else {
                $('#nimbus-pro').fadeIn('fast');
            }
        });
    },
    show: function() {

        $('#nimbus-panel textarea').val($('#nimbus-comment').find('textarea').val());

        nimbus.hideAllPanel();

        nimbus.showLimit();
        nimbus.userAuthState(function(res) {
            res = JSON.parse(res);
            if (res.errorCode === 0) {
                if(res.body && res.body.authorized) {

                    nimbus.userShowEmail();
                    nimbus.userShowFolder();
                    nimbus.uploadUpdateAndShowFolder();
                    $('#nimbus-panel').show();

                } else {
                    $('#login-panel').show();
                }
            } else {
                $('#login-panel').show();
            }
        });

//
//        if (nimbus.user_authorized()) {
//            nimbus.userShowEmail();
//            nimbus.uploadUpdateAndShowFolder();
////            $('#authorized-panel').show();
//            $('#nimbus-panel').show();
//        } else {
//            $('#login-panel').show();
//        }

        $('#user-panel').fadeIn('fast');
    }
};

$(document).ready(function() {
    nimbus.userReadCookies();

    var formLogin = $('#form-login');
    formLogin.find('input').bind('keyup', function() {
        if ($(this).val().length < 1) {
            $(this).addClass('wrong');
        } else {
            $(this).removeClass('wrong');
            if ($(this).attr('name') === 'email') {
                $(this).attr('original-title', '').tipsy('hide');
                if (!/\S+@\S+\.\S+/.test($(this).val())) {
                    $(this).addClass('wrong');
                } else {
                    $(this).removeClass('wrong');
                }
            }

        }
    });
    formLogin.bind("submit", function() {
        var wrong = false;
        var email = this.elements['email'];
        var pass = this.elements['pass'];

        if (pass.value.length < 1) {
            $(pass).addClass('wrong').focus();
            wrong = true;
        }

        if (!/\S+@\S+\.\S+/.test(email.value)) {
            $(email).addClass('wrong').focus().attr('original-title', window.l10n.tooltipWrongEmail).tipsy('show');
            wrong = true;
        }

        if (!wrong) {
            nimbus.userLogin(email.value, pass.value, function() {

            });
        }

        return false;
    });

    var formRegister = $('#form-register');
    formRegister.find('input').bind('keyup',function(){

        if($(this).val().length < 8){
            $(this).addClass('wrong').attr('original-title', window.l10n.tooltipPassInfo).tipsy('show');
        } else {
            $(this).removeClass('wrong').attr('original-title', '').tipsy('hide');

            if($(this).attr('name') === 'pass-repeat'){
                if($(this).val() !== $('#form-register').find("[name='pass']").val()){
                    $(this).addClass('wrong').attr('original-title', window.l10n.tooltipPassMatch).tipsy('show');
                } else {
                    $(this).removeClass('wrong').attr('original-title', '').tipsy('hide');
                }
            }
        }

        if ($(this).attr('name') === 'email') {
            $(this).attr('original-title', '').tipsy('hide');
            if (!/\S+@\S+\.\S+/.test($(this).val())) {
                $(this).addClass('wrong');
            } else {
                $(this).removeClass('wrong');
            }
        }
    });
    formRegister.bind("submit", function() {
        var wrong = false;
        var email = this.elements['email'];
        var pass = this.elements['pass'];
        var passRepeat = this.elements['pass-repeat'];

        if (pass.value !== passRepeat.value) {
            $(pass).addClass('wrong');
            $(passRepeat).addClass('wrong').focus();
            wrong = true;
        }
        if (pass.value.length < 8) {
            $(pass).addClass('wrong').focus();
            wrong = true;
        }

        if (!/\S+@\S+\.\S+/.test(email.value)) {
            $(email).addClass('wrong').focus().attr('original-title', window.l10n.tooltipWrongEmail).tipsy('show');
            wrong = true;
        }

        if (!wrong) {
            nimbus.userRegister(email.value, pass.value, function(res) {
                res = JSON.parse(res);
                if (res.errorCode === 0) {
                    nimbus.userLogin(email.value, pass.value, function() {
                        nimbus.hideAllPanel();
                        nimbus.slide($('#login-panel'));
                    });
                } else if (res.errorCode === -4) {
                    $.ambiance({message: window.l10n.notificationEmailFail, type: "error", timeout: 2});
                } else {
                    $.ambiance({message: window.l10n.notificationRegisterFail, type: "error", timeout: 2});
                }
            });
        }
        return false;
    });

    var remindPassword = $('#remind-password');
    remindPassword.find('input').bind('keyup', function() {
        if ($(this).val().length < 1) {
            $(this).addClass('wrong');
        } else {
            $(this).attr('original-title', '').tipsy('hide');
            if (!/\S+@\S+\.\S+/.test($(this).val())) {
                $(this).addClass('wrong');
            } else {
                $(this).removeClass('wrong');
            }
        }
    });
    remindPassword.bind("submit", function() {
        var wrong = false;
        var email = this.elements['email'];

        if (!/\S+@\S+\.\S+/.test(email.value)) {
            $(email).addClass('wrong').focus().attr('original-title', window.l10n.tooltipWrongEmail).tipsy('show');
            wrong = true;
        }

        if (!wrong) {
            nimbus.userRemindPassword(email.value, function(res) {
                res = JSON.parse(res);
                if (res.errorCode === 0) {
                    $.ambiance({message: window.l10n.notificationRestoreSent, timeout: 5});
                    nimbus.hideAllPanel();
                    var lp = $('#login-panel');
                    lp.find('input[name="email"]').val(email.value);
                    lp.find('input[name="pass"]').val('');
                    nimbus.slide(lp);
                    lp.find('input[name="pass"]').focus();
                } else {
                    $.ambiance({message: window.l10n.notificationEmailIncorrect, type: "error", timeout: 5});
                }
            });
        }
        return false;
    });

    $('#user-logout').bind('click', function(e) {
        nimbus.userLogout();
//        $('#login-panel').show();
//        $('#authorized-panel').hide();
        $('#nimbus-panel').hide();
        nimbus.slide($('#login-panel'));

        $('#choose-nimbus-share').hide();
        $('#save-nimbus').attr('original-title', window.l10n.tooltipNotAuthorized);
        e.preventDefault();
    });

    $('#user-flip-r, #user-flip-l').bind("click", function() {

        if ($('#login-panel').is(':visible')) {
            $('#login-panel').fadeOut("fast");
            nimbus.slide($('#register-panel'));
        } else {
            $('#register-panel').fadeOut("fast");
            nimbus.slide($('#login-panel'));
        }
        return false;
    });

    $('#change-pass').bind('click', function() {
        nimbus.hideAllPanel();
        nimbus.slide($('#change-pass-panel'));
        return false;
    });

    $('#back-to-authorized').bind('click', function() {
        nimbus.hideAllPanel();
        nimbus.slide($('#authorized-panel'));
        return false;
    });

    $('#forgot-pass').bind('click', function() {
        nimbus.hideAllPanel();
        nimbus.slide($('#remind-password-panel'));
        return false;
    });

    $('#back-to-login').bind('click', function() {
        nimbus.hideAllPanel();
        nimbus.slide($('#login-panel'));
        return false;
    });

    $('#remind-flip-login').bind('click', function() {
        nimbus.hideAllPanel();
        nimbus.slide($('#login-panel'));
        return false;
    });

    $('#remind-flip-register').bind('click', function() {
        nimbus.hideAllPanel();
        nimbus.slide($('#register-panel'));
        return false;
    });

//    $('#user-panel input').bind('keydown', function() {
//        $(this).removeClass('wrong')
//    });

});

