$(function() {
    var options = {
        'format': 'png',
        'imageQuality': '92',
        'toolbarbutton': true,
        'addonbarbutton': false,
        'shadow': true,
        'enablehotkeys': true,
        'enablenumber': true,
        'hotkeys': {
            'visible': '1',
            'selected': '2',
            'entire': '3',
            'window': '99'
        }
    };
    var blocker = $('#quick-capture .blocker');
    var qcType = $('#quick-capture #typeCapture');
    var qcEdit = $('#quick-capture #enableEdit');
    var last = 'visible';

    self.port.on("setoptions", function(option) {
        options = option;
        loadValue();
    });
    self.port.emit("getoptions");

    self.port.on("setDoneType", function(type) {
        setEnableEdit(type);
    });
    self.port.emit("getDoneType");

    self.port.on("setQuickCapture", function(type) {
        setTypeCapture(type);
        $("input#enablequickcapture").prop('checked', (type !== 'false'))
    });
    self.port.emit("getQuickCapture");

    self.port.on("setFileNamePattern", function(type) {
        $('#filenamepattern').val(type);
    });
    self.port.emit("getFileNamePattern");

    $('#filenamepattern').keyup(function(e){
        self.port.emit("saveFileNamePattern", this.value);
    });

    self.port.on("setSaveCropPosition", function(msg) {
        $("input#savecropposition").prop('checked', !!msg);
    });
    self.port.emit("getSaveCropPosition");

    $("input#savecropposition").bind("change", function() {
        self.port.emit("saveSaveCropPosition", $(this).prop("checked"));
    });

    $("input#enablequickcapture").bind("change", function () {
        setTypeCapture(($(this).prop("checked") ? last : 'false'), true);
    });

    function setTypeCapture(type, send) {
        if (type !== 'false') {
            last = type;
            blocker.hide();
            qcType.find('.active').removeClass('active');
            qcType.find('button[data-type="' + type + '"]').addClass('active');
        } else {
            blocker.show();
        }
        if(send) self.port.emit("saveQuickCapture", type);
    }
    qcType.find('button').click(function () {
        setTypeCapture($(this).data('type'), true);
    });

    function setEnableEdit(type, send) {
        qcEdit.find('.active').removeClass('active');
        qcEdit.find('button[data-type="' + type + '"]').addClass('active');
        if(send) self.port.emit("saveDoneType", type);
    }
    qcEdit.find('button').click(function () {
        setEnableEdit($(this).data('type'), true);
    });

    $('#format-setting').find('button').click(function() {
        $('#format-setting').find('.active').removeClass('active');
        $(this).addClass('active');

        options.format = $('#format-setting').find('.active').data('format');
        localStorage.format = options.format;
        changeFormat(options.format);
        self.port.emit("saveoptions", {'options': options, 'target': 'format'});
    });

    $("#button-position").find("input").bind("change", function() {
        options.toolbarbutton = $('#button-position input[name="main"]').prop("checked");

        self.port.emit("saveoptions", {'options': options, 'target': 'position'});
    });

    $("input#enablekey").bind("change click", function() {
        if ($(this).prop("checked")) {
            $('#mask').hide();
            options.enablehotkeys = true;
        } else {
            $('#mask').show();
            options.enablehotkeys = false;
        }

        self.port.emit("saveoptions", {'options': options, 'target': 'enablehotkeys'});
    });

    $("input#quality").bind("input change", function() {
        var q = String($(this).val());
        localStorage.imageQuality = q;
        options.imageQuality = q;
        $('#quality-value span').text(q);
        self.port.emit("saveoptions", {'options': options, 'target': 'imageQuality'});
    });

    function changeFormat(f) {
        if(f === 'jpeg') {
            setQuality(options.imageQuality);
            $("input#quality").prop('disabled', false).parent().attr('original-title', "");
        } else {
            setQuality(100);
            $("input#quality").prop('disabled', true).parent().attr('original-title', "Only for JPG").tipsy({gravity: 's'});
        }
    }
    function setQuality (q) {
        $("input#quality").val(q);
        $('#quality-value span').text(q);
    }

    setQuality(localStorage.imageQuality);
    var loadValue = function() {

        changeFormat(options.format);
        $('#format-setting').find('.' + options.format).addClass('active');

        if (options.enablehotkeys) {
            $('#mask').hide();
            $("input#enablekey").prop('checked', true);
        } else {
            $('#mask').show();
            $("input#enablekey").prop('checked', false);
        }

        $("#button-position").find("input[name='main']").prop('checked', options.toolbarbutton);


        $('#entire').val(options.hotkeys.entire);
        $('#selected').val(options.hotkeys.selected);
        $('#visible').val(options.hotkeys.visible);
    };

    var checkDifferent = function(arr) {
        var l = arr.length;
        for (var i = 0; i < l - 1; i++) {
            for (var j = i + 1; j < l; j++) {
                if (arr[i] === arr[j])
                    return false;
            }
        }
        return true;
    };

    $('#visible, #selected, #entire').change(function() {
        var e = $('#entire').val();
        var s = $('#selected').val();
        var v = $('#visible').val();
        var w = '99';//$('#window').val();

        if (checkDifferent([e, s, v, w])) {
            options.hotkeys = {entire: e, selected: s, visible: v, window: w};
            self.port.emit("saveoptions", {'options': options, 'target': 'hotkeys'});
        } else {
            loadValue();
        }

    });

    self.port.on("setOptionsL10n", function(l10n) {
        qcType.find('.visible').attr('original-title', l10n["popupBtnVisible"]).tipsy();
        qcType.find('.area').attr('original-title', l10n["popupBtnArea"]).tipsy();
        qcType.find('.entire').attr('original-title', l10n["popupBtnEntire"]).tipsy();
        qcType.find('.blank').attr('original-title', l10n["popupBtnBlank"]).tipsy();

        qcEdit.find('.edit').attr('original-title', l10n["popupBtnEnableEdit"]).tipsy();
        qcEdit.find('.done').attr('original-title', l10n["popupBtnEnableSave"]).tipsy();
        qcEdit.find('.save').attr('original-title', l10n["popupBtnEnableDownload"]).tipsy();
        qcEdit.find('.copy').attr('original-title', l10n["popupBtnEnableCopy"]).tipsy();
    });
    self.port.emit("getOptionsL10n");
});