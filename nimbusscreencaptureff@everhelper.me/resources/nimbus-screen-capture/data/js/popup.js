$(function () {
    var page = {'body': false, 'area': false};
    var cssdisable = {backgroundPosition: '0px -70px', color: 'gray'};
    self.port.on("enable-button", function (data) {
        page = data;
        $("#visible, #area, #entire, #blank").removeAttr('style');
        if (!data.body || data.area) {
            $("#visible, #area, #entire").css(cssdisable);
            if (data.area) {
                $("#blank").css(cssdisable);
                $("#area").css({backgroundPosition: '0px -35px', color: 'black'});
            }
        }
    });

    self.port.on("doneType", function (data) {
        $("select#doneType").val(data);
    });

    $("#entire").click(function () {
        if (page.body && !page.area) {
            self.port.emit("screen", 'entire');
        }
    });

    $("#area").click(function () {
        if (page.body && !page.area) {
            self.port.emit("screen", 'area');
        }
    });

    $("#visible").click(function () {
        if (page.body && !page.area) {
            self.port.emit("screen", 'visible');
        }
    });

    /*
     $("#window").click(function() {
     self.port.emit("screen", 'window');
     });*/

    $("#blank").click(function () {
        if (!page.area) {
            self.port.emit("screen", 'blank');
        }
    });

    $("#android").click(function() {
        self.port.emit("screen", 'android');
    });

    $("#options").click(function () {
        self.port.emit("screen", 'options');
    });

    $("select#doneType").bind("change click", function () {
        self.port.emit("setDoneType", $(this).val());
    });

    $("input").focus(
        function () {
            this.blur();
        }
    );
});