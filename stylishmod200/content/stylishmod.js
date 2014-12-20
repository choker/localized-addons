var {classes: Cc, interfaces: Ci, utils: Cu} = Components, 
  prefX = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.'),
  prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.stylish.'),
  prefs2 = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.stylishmod.'), 
  prefs3 = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.stylishmod.move.'), 
  prefs4 = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.stylishmod.label.'), 
  getWin = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator).getMostRecentWindow,
  biStream = Cc['@mozilla.org/binaryinputstream;1'].createInstance(Ci.nsIBinaryInputStream),
  ciStream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream),
  coStream = Cc['@mozilla.org/intl/converter-output-stream;1'].createInstance(Ci.nsIConverterOutputStream), 
  fiStream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream),
  foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream), 
  service = Cc['@userstyles.org/style;1'].getService(Ci.stylishStyle), 
  ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService), 
  sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
  nSpace = '@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);', 
  alertSlide = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService),
  nsIFilePicker = Ci.nsIFilePicker, 
  fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker),
  timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer), 
  clipB = Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper),
  colorChosen = false, pageStyleId = null, pageStyleUrl = null, alertWarn = 'chrome://stylishmod/skin/stylishmod.png', alertTitle = 'Copied To Clipboard', alertMsg = 'Selected Text',
  gScale = '.button .button-icon {filter: url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'grayscale\'>' + 
    '<feColorMatrix type=\'matrix\' values=\'0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0\'/></filter>' + 
    '</svg>#grayscale");}', gray = encodeURIComponent(gScale),
  shade = ios.newURI('data:text/css,' + nSpace + '%23stylish-edit ' + gray + '%23stylish-edit .button:not([disabled]):hover .button-icon {filter: none;}', null, null),
  noshade = ios.newURI('data:text/css,' + nSpace + '%23stylish-edit .button .button-icon {filter: none;}', null, null),
  icononly = ios.newURI('chrome://stylishmod/skin/icononly.css', null, null),
  textonly = ios.newURI('chrome://stylishmod/skin/textonly.css', null, null),
  icontext = ios.newURI('chrome://stylishmod/skin/icontext.css', null, null),
  errors = ios.newURI('chrome://stylishmod/skin/errors.css', null, null),
  dark = ios.newURI('chrome://stylishmod/skin/dark.css', null, null);
  shownum = ios.newURI('chrome://stylishmod/skin/shownumber.css', null, null),
  hidenum = ios.newURI('chrome://stylishmod/skin/hidenumber.css', null, null),
  intervalID = null;

var stylish_mod = {
  init: function() {
    var mov = document.getElementsByClassName('move'), tb = document.getElementsByClassName('toolbar'), tb1 = document.getElementById('toolbar1'),
      tb2 = document.getElementById('toolbar2'), tb3 = document.getElementById('toolbar3'), tb4 = document.getElementById('toolbar4'),
      tb5 = document.getElementById('toolbar5'), tb6 = document.getElementById('toolbar6'), tb7 = document.getElementById('toolbar7'),
      tog = document.getElementsByClassName('togger'), fi = document.getElementById('findbar'), path = prefs2.getCharPref('externalEditor');
    setTimeout(function() {displayButton(); }, 20);
    setTimeout(function() {grayScale();}, 40);
    setTimeout(function() {errorsTop();}, 60);
    setTimeout(function() {themeDark();}, 80);
    setTimeout(function() {findbarText();}, 200);
    setTimeout(function() {getCharCount(); updateStyleId();}, 1000);
    if (prefs2.getBoolPref('windowalert')) window.addEventListener('beforeunload', function(event) {event.returnValue = ''}, false);
    else window.addEventListener('beforeunload', function(event) {var code = sourceEditorType !== 'sourceeditor' ? codeE : codeElementWrapper;
      if (code.value !== initialCode) event.returnValue = 'Are you sure?'}, false);
    if (prefs2.getBoolPref('autoimportant.enabled')) getKeyCode(prefs2.getCharPref('autoimportant.key'));
    if (prefX.getCharPref('enabledAddons').match(/9c1acee4-c567-4e71-8d1b-edf314afef97/)) prefs2.setBoolPref('rainbowpicker', true);
    else prefs2.setBoolPref('rainbowpicker', false);
    document.getElementById('auto-important').lastChild.label = prefs4.getCharPref('auto-important');
    document.getElementById('bytes').firstChild.value = prefs4.getCharPref('bytes');
    document.getElementById('clear1btn').label = prefs4.getCharPref('clear1');
    document.getElementById('clear2btn').label = prefs4.getCharPref('clear2');
    document.getElementById('custom-insert-popup').maxWidth = prefs2.getCharPref('custom-insert-popup');
    document.getElementById('cursor').firstChild.label = prefs4.getCharPref('cursor');
    document.getElementById('cursor-at').collapsed = !prefs.getIntPref('editor');
    document.getElementById('editoralert').value = prefs2.getBoolPref('editoralert');
    document.getElementById('important-key').value = String.fromCharCode(prefs2.getCharPref('autoimportant.key'));
    document.getElementById('important-enabled').checked = prefs2.getBoolPref('autoimportant.enabled');
    document.getElementById('line').firstChild.label = prefs4.getCharPref('line');
    document.getElementById('line-number').collapsed = !prefs.getIntPref('editor');
    document.getElementById('removefocus').value = prefs2.getBoolPref('removefocus');
    document.getElementById('scratchpad1').value = prefs2.getCharPref('scratchpad1Text');
    document.getElementById('scratchpad2').value = prefs2.getCharPref('scratchpad2Text');
    document.getElementById('set-editor').value = prefs2.getCharPref('externalEditor');
    document.getElementById('styleid').firstChild.value = prefs4.getCharPref('styleid');
    document.getElementById('style-name').firstChild.value = prefs4.getCharPref('style-name');
    document.getElementById('switcheditor').value = prefs.getIntPref('editor');
    document.getElementById('windowalert').value = prefs2.getBoolPref('windowalert');
    if (prefs.getIntPref('editorWindowMode') == 0) document.getElementById('openeditor').value = true;
    else document.getElementById('openeditor').value = false;
    if (prefs2.getBoolPref('findbar')) fi.style.display = '-moz-box';
    else fi.style.display = 'none';
    if (prefs.getIntPref('editor') === 0) fi.style.display = 'none';
try {
    for (var i = 0; i < tb.length; i++) {
      var pref = prefs2.getBoolPref(tb[i].id);
      tb[i].collapsed = pref;
    }
    for (var i = 0; i < mov.length; i++) {
      var pref = prefs2.getBoolPref(mov[i].id);
      mov[i].collapsed = !pref;
      mov[i].hidden = !pref;
      if (pref) mov[i].style.display = '-moz-box';
      else mov[i].style.display = 'none';
    } 
    for (var i = 0; i < mov.length; i++) {
      var pref0 = prefs3.getCharPref(mov[i].id).split(',')[0];
      if (pref0 === '1') tb1.appendChild(mov[i]);
      if (pref0 === '2') tb2.appendChild(mov[i]);
      if (pref0 === '3') tb3.appendChild(mov[i]);
      if (pref0 === '4') tb4.appendChild(mov[i]);
      if (pref0 === '5') tb5.appendChild(mov[i]);
      if (pref0 === '6') tb6.appendChild(mov[i]);
      if (pref0 === '7') tb7.appendChild(mov[i]);
    }
    for (var i = 0; i < mov.length; i++) {
      var pref = prefs3.getCharPref(mov[i].id).split(',')[1];
      mov[i].style.MozBoxOrdinalGroup = pref;
    } 
    for (var i = 0; i < mov.length; i++) {
      var pref = prefs4.getCharPref(mov[i].id);
      if (pref === '' && mov[i].nodeName !== 'vbox') mov[i].setAttribute('no-text', true);
      else if (pref === '' && mov[i].nodeName === 'vbox') mov[i].firstChild.setAttribute('no-text', true);
      else {mov[i].removeAttribute('no-text'); mov[i].label = pref;}
    } 
    for (var i = 0; i < tog.length; i++) {
      var pref = prefs2.getBoolPref(tog[i].label.replace(/\s/, '').toLowerCase());
      tog[i].setAttribute('no-show', pref);
    } 
} catch(ex) {}
    document.getElementById('external-editor').label = ucFirst(path.substring(path.lastIndexOf('\\') + 1, path.lastIndexOf('.')));
    updateView();
} }
addEventListener('load', stylish_mod.init, false);
addEventListener('close', clearPad2, false);

function addMenu() {
  var str = prefs2.getCharPref('insert-text').split('<>'), pop = document.getElementById('custom-insert-popup');
  for (var i = 0; i < str.length; i++) {
    var box = document.createElement('hbox'), but = document.createElement('button'), btn = document.createElement('button'), lab = document.createElement('label');
    box.setAttribute('align', 'center');
    box.setAttribute('class', 'insert-hbox');
    but.setAttribute('class', 'text-button');
    but.setAttribute('oncommand', 'insText(this.nextSibling.value)');
    lab.setAttribute('class', 'insert-label');
    lab.setAttribute('value', str[i]);
    lab.setAttribute('onclick', 'insText(this.value)');
    lab.setAttribute('tooltiptext', str[i]);
    box.appendChild(but);
    box.appendChild(lab);
    if (str[i].indexOf('url("")') !== -1) {
      btn.setAttribute('class', 'button uri-button');
      btn.setAttribute('label', 'Get URI');
      btn.setAttribute('onclick', 'getURI(this.previousSibling.value, event.button)');
      btn.setAttribute('tooltiptext', 'Left-click to insert Image Path\nMiddle-click to Add/Remove text entries\nRight-click to insert Base64 Data');
      box.appendChild(btn);
    }
    pop.appendChild(box);
  } 
  document.getElementById('custom-insert-popup').maxWidth = prefs2.getCharPref('custom-insert-popup');
}

function addTag() {
  var code = codeElementWrapper.value, array = [], tagsep, sym, sym2, sym3, val;
  tagsep = prefs2.getCharPref('tag-sep');
  val = tagsep.split(',');
  for (var i in val) array.push(unescape('%u' + val[i]));
  sym = array.join();
  sym = sym.replace(/,/g, '');
  if (sym.length === 1) {
    if (!code.match('/*' + sym)) insertCodeAtStart('/*' + sym + ' ' + sym + '*/');
  } else if (sym.length === 2) {
    sym2 = array[1] + array[0];
    if (!code.match('/*' + sym)) insertCodeAtStart('/*' + sym + ' ' + sym2 + '*/');
  } else if (sym.length === 3) {
    sym3 = array[2] + array[1] + array[0];
    if (!code.match('/*' + sym)) insertCodeAtStart('/*' + sym + ' ' + sym3 + '*/');
} }

function alertDialog(e) {
  var bool = prefs2.getBoolPref(e.id) !== true ? true : false;
  prefs2.setBoolPref(e.id, bool);
  document.location.reload();
}

function blankStyle() {
  var win = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher).activeWindow;
  stylishCommon.addCode('', win);
}

function buttonDisplay(e) {
  prefs2.setCharPref(e.id, e.value);
  displayButton();
}

function changeImportantEnabled(checked) {
  var el = sourceEditorType !== 'sourceeditor' ? codeE : document.getElementById('sourceeditor');
  prefs2.setBoolPref('autoimportant.enabled', checked);
  var autoImportantKey = prefs2.getCharPref('autoimportant.key');
  var autoImportantText = 'if (event.which == ' + autoImportantKey + ') {event.preventDefault(); insertImportant()}';
  if (checked) {
    el.setAttribute('onkeydown', autoImportantText);
    getKeyCode(prefs2.getCharPref('autoimportant.key'));
  } else {
    el.setAttribute('onkeydown', '{}');
} }

function checkFile(cssFile) {
  var el = codeElementWrapper;
  fiStream.init(cssFile, -1, 0, 0);
  ciStream.init(fiStream, 'UTF-8', cssFile.fileSizeOfLink, 0);
  let (str = {}) {
    ciStream.readString(-1, str);
    el.value = str.value;
  }
  ciStream.close();
}

function checkFileStop(which) {
  if (timer) timer.cancel();
  if (which !== false) {
    if (cssFile) cssFile.remove(false);
} }

function chooseColor(event) {
  colorChosen = true;
  var parent = event.target.parentNode;
  while (parent != null) {
    switch (parent.nodeName) {
      case 'menupopup': parent.hidePopup(); break;
      case 'button': parent.open = false;
    }
    parent = parent.parentNode;
  }
  var observer = {
    observe: function() {
      insertColor();
      timer.cancel();
    }
  };
  timer.init(observer, 20, Ci.nsITimer.TYPE_ONE_SHOT);
}

function clearFind() {
  prefs2.setCharPref('findtext', '');
}

function clearPad(e) {
  var pad = 'scratchpad' + e + 'Text';
  prefs2.setCharPref(pad, '');
  document.getElementById('scratchpad' + e).value = '';
  return;
}

function clearPad2() {
  prefs2.setCharPref('scratchpad2Text', '');
  document.getElementById('scratchpad2').value = '';
}

function cloneStyle() {
  var num = parseInt(document.getElementById('stylish-edit').getAttribute('windowtype').replace(/stylishEdit/, ''));
  var id = prefs2.getIntPref('id'), el = codeElementWrapper, nam = document.getElementById('name');
  if (prefs.getIntPref('editorWindowMode') === 0) {
    var nav = getWin('navigator:browser');
    var win = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher).activeWindow;
    stylishCommon.addCode('', win);
    setTimeout(function() {
      nav.gBrowser.contentDocument.getElementById('internal-code').value = el.value;
      nav.gBrowser.contentDocument.getElementById('name').value = nam.value + ' (Clone)';
    }, 1000);
  } else {
    stylishCommon.openEdit(stylishCommon.getWindowName('stylishEdit'), {code: el.value});
    prefs2.setIntPref('id', num);
    updateTitle(1);
} }

function codeElKeyDown(key, that) {
  if (key === 37 || key === 38 || key === 39 || key === 40) lineNumber(that);
}

function commentGroup(selectedText) {
  var el = codeElementWrapper;
  if (!style) {
    alert('Need To Save');
    return null;
  }
  style.mode = style.CALCULATE_META;
  var i, j, comment, commentId, comments, xxx, yyy, zzz, sym1, sym2, sym3;
  var array1 = [], array2 = [], array3 = [];
  var aaa = prefs2.getCharPref('symbol1'), bbb = prefs2.getCharPref('symbol2'), ccc = prefs2.getCharPref('symbol3');
  xxx = aaa.split(',');
  for (var i in xxx) array1.push(unescape('%u' + xxx[i]));
  sym1 = array1.join();
  sym1 = sym1.replace(/,/g, '');
  yyy = bbb.split(',');
  for (var i in yyy) array2.push(unescape('%u' + yyy[i]));
  sym2 = array2.join();
  sym2 = sym2.replace(/,/g, '');
  zzz = ccc.split(',');
  for (var i in zzz) array3.push(unescape('%u' + zzz[i]));
  sym3 = array3.join();
  sym3 = sym3.replace(/,/g, '');
  var selectedText = el.value.substring(el.selectionStart, el.selectionEnd);
  function listComments(commentId) {
    var commentArray = [];
    var rightComment;
    comments = style.getMeta('COMMENT', {}).join('|nsSplit|');
    comments = comments.split('|nsSplit|');
    for (i = 0; i < comments.length; i++) {
      if (comments[i] === '') continue;
      if (commentId !== undefined && comments[i].indexOf(commentId) === -1) continue;
      comment = comments[i].split('@nsSplit@');
      for (j = 0; j < comment.length; j++) {
        if (rightComment === true) {
          commentArray.push({id:comment[j-1], comment:comment[j]});
          rightComment = '';
        }
        if (comment[j] > 0) rightComment = true;
    }	 }
    return commentArray;
  }
  selectedText = selectedText.replace(/^[\n\r\u2028\u2029 ]*/, '').replace(/[\n\r\u2028\u2029 ]*$/, '');
  if (selectedText.search(sym1 + ' COMMENT GROUP ' + sym1) === -1) {
    comments = listComments();
    commentId = null;
    for (i = 0; i < comments.length; i++) {
      if (comments[i].comment === selectedText) {
        commentId = comments[i].id;
        break;
    }	 }
    if (!commentId) {
      comment = '\n' + selectedText;
      style.addMeta(sym1 + ' COMMENT GROUP ' + sym1, comment);
      style.save();
    }
    selectedText = selectedText.replace(/\/\*(\s+)?/gm, sym2).replace(/(\s+)?\*\//gm, sym3).replace(/\*\//gm, '').replace(/\/\*/gm, '') + '\n' + sym1 + ' END COMMENT ' + sym1 + ' */';
    selectedText = '/* ' + sym1 + ' COMMENT GROUP ' + sym1 + '\n' + selectedText;
    style.mode = style.CALCULATE_META | style.REGISTER_STYLE_ON_CHANGE;
    return selectedText;
  }
  commentId = selectedText.split(' ')[0].replace('/* ' + sym1 + ' COMMENT GROUP', '');
  comments = listComments(commentId);
  if (comments[0].id === commentId) selectedText = comments[0].comment;
  style.mode = style.CALCULATE_META | style.REGISTER_STYLE_ON_CHANGE;
  return selectedText;
  getCharCount();
}

function copySelected() {
  var el = codeElementWrapper, selectedText = el.value.substring(el.selectionStart, el.selectionEnd);
  if (selectedText.length > 0) {
    clipB.copyString(selectedText);
    //alertSlide.showAlertNotification(alertWarn, alertTitle, alertMsg);
} }

function createInstance(aURL, aInterface){
  try {
    return Cc[aURL].createInstance(Ci[aInterface]);
  } catch(e){}
}

function cutMenu() {
  var pop = document.getElementById('custom-insert-popup');
  while (pop.firstChild) {
    pop.removeChild(pop.firstChild);
} }

function cutSelected() {
  var el = codeElementWrapper;
  el.focus();
  goDoCommand('cmd_cut');
}

function darkTheme(e) {
  prefs2.setCharPref(e.id, e.value);
  themeDark();
}

function displayButton() {
  document.getElementById('icon-text').value = prefs2.getCharPref('icon-text');
  switch (prefs2.getCharPref('icon-text')) {
    case '1': 
      if (!sss.sheetRegistered(icononly, sss.USER_SHEET)) sss.loadAndRegisterSheet(icononly, sss.USER_SHEET);
      if (sss.sheetRegistered(textonly, sss.USER_SHEET)) sss.unregisterSheet(textonly, sss.USER_SHEET);
      if (sss.sheetRegistered(icontext, sss.USER_SHEET)) sss.unregisterSheet(icontext, sss.USER_SHEET);
      break;
    case '2':
      if (!sss.sheetRegistered(textonly, sss.USER_SHEET)) sss.loadAndRegisterSheet(textonly, sss.USER_SHEET);
      if (sss.sheetRegistered(icononly, sss.USER_SHEET)) sss.unregisterSheet(icononly, sss.USER_SHEET);
      if (sss.sheetRegistered(icontext, sss.USER_SHEET)) sss.unregisterSheet(icontext, sss.USER_SHEET);
      break;
    case '3':
      if (!sss.sheetRegistered(icontext, sss.USER_SHEET)) sss.loadAndRegisterSheet(icontext, sss.USER_SHEET);
      if (sss.sheetRegistered(icononly, sss.USER_SHEET)) sss.unregisterSheet(icononly, sss.USER_SHEET);
      if (sss.sheetRegistered(textonly, sss.USER_SHEET)) sss.unregisterSheet(textonly, sss.USER_SHEET);
      break;
} }

function editText(which, button) {
  var el = codeElementWrapper;
  var selectedText = el.value.substring(el.selectionStart, el.selectionEnd);
  var array1 = [], array2 = [], array3 = [], xxx, yyy, zzz, sym1, sym2, sym3;
  var aaa = prefs2.getCharPref('symbol1'), bbb = prefs2.getCharPref('symbol2'), ccc = prefs2.getCharPref('symbol3');
  xxx = aaa.split(',');
  for (var i in xxx) array1.push(unescape('%u' + xxx[i]));
  sym1 = array1.join();
  sym1 = sym1.replace(/,/g, '');
  yyy = bbb.split(',');
  for (var i in yyy) array2.push(unescape('%u' + yyy[i]));
  sym2 = array2.join();
  sym2 = sym2.replace(/,/g, '');
  zzz = ccc.split(',');
  for (var i in zzz) array3.push(unescape('%u' + zzz[i]));
  sym3 = array3.join();
  sym3 = sym3.replace(/,/g, '');
  switch (which) {
    case 'Comment':
      if (selectedText.search(/^[\s]*\/\*[\s\S]*\*\/[\s]*$/)) { //comment it
        selectedText = '/* ' + selectedText + ' */';
      } else { //uncomment it
        if (selectedText.indexOf('COMMENT GROUP') != -1) selectedText = selectedText.
          replace(new RegExp(sym2, 'gm'), '/* ').
          replace(new RegExp(sym3, 'gm'), ' */').
          replace(sym1 + ' COMMENT GROUP ' + sym1, '').
          replace(sym1 + ' END COMMENT ' + sym1, '');
        selectedText = selectedText.replace(/^([\s]*)\/\*([\s\S]*)\*\/([\s]*)$/gm, '$1$2$3').trim();
      }
      break;
    case 'CommentGroup':
      if (button === 0) {
        if (selectedText.indexOf('COMMENT GROUP') !== -1) {
          editText('Comment'); 
          return selectedText;
        }
        selectedText = commentGroup(selectedText);
        if (!selectedText) return;
      } 
      if (button === 1) openDialog('chrome://stylishmod/content/symbol.xul', '_blank', 'alwaysRaised=yes');
      break;
    case 'Class':
      if (selectedText.search(/^[\s]*\[class[\S]*\"\][\s]*$/i)) selectedText = selectedText.replace(/^([\s]*)\.([\S]*)([\s]*)$/igm, '$1[class=\"$2\"]$3');
      else selectedText = selectedText.replace(/^([\s]*)\[class=\"([\S]*)\"\]([\s]*)$/igm, '$1.$2$3');
      break;
    case 'ID':
      if (selectedText.indexOf('[id') !== -1 || selectedText.indexOf('#') !== -1) {
        if (selectedText.search(/^[\s]*\[id[\S]*\"\][\s]*$/i)) selectedText = selectedText.replace(/^([\s]*)\#([\S]*)([\s]*)$/igm, '$1[id=\"$2\"]$3');
        else selectedText = selectedText.replace(/^([\s]*)\[id=\"([\S]*)\"\]([\s]*)$/igm, '$1#$2$3');
      } else if (selectedText.indexOf('[@id') != -1 && selectedText.search(/^[\s]*\[@id[\S]*\"\][\s]*$/i) != -1) {
        selectedText = selectedText.replace(/^([\s]*)\[@id=\"([\S]*)\"\]([\s]*)$/igm, '$1#$2$3');
      } else if (selectedText.indexOf('//*[@id') != -1 && selectedText.search(/^[\s]*\/\/\*\[@id[\S]*\"\][\s]*$/i) != -1) {
        selectedText = selectedText.replace(/^([\s]*)\/\/\*\[@id=\"([\S]*)\"\]([\s]*)$/igm, '$1#$2$3');
      }
      break;
    case 'Bracket':
      if (selectedText.search(/^[\s]*\[[\s\S]*\][\s]*$/)) selectedText = '[' + selectedText + ']';
      else selectedText = selectedText.replace(/^([\s]*)\[([\s\S]*)\]([\s]*)$/gm, '$1$2$3');
      break;
    case 'CurlyBracket':
      if (selectedText.search(/^[\s]*\{[\s\S]*\}[\s]*$/)) selectedText = '{' + selectedText + '}';
      else selectedText = selectedText.replace(/^([\s]*)\{([\s\S]*)\}([\s]*)$/gm, '$1$2$3');
      break;
    case 'RemoveXUL':
      el.value = el.value.replace(/xul\:/ig, '');
      break;
  }
  var selectionEnd = el.selectionStart + selectedText.length;
  el.value = el.value.substring(0, el.selectionStart) + selectedText + el.value.substring(el.selectionEnd, el.value.length);
  el.focus();
  el.setSelectionRange(selectionEnd - selectedText.length, selectionEnd);
  getCharCount();
}

function errorDisplay(e) {
  prefs2.setCharPref(e.id, e.value);
  switch (e.value) {
    case '1':
      if (!sss.sheetRegistered(errors, sss.USER_SHEET)) sss.loadAndRegisterSheet(errors, sss.USER_SHEET);
      break;
    case '0':
      if (sss.sheetRegistered(errors, sss.USER_SHEET)) sss.unregisterSheet(errors, sss.USER_SHEET);
      break;
} }

function errorsTop() {
  document.getElementById('errorstop').value = prefs2.getCharPref('errorstop');
  if (prefs2.getCharPref('errorstop') === '1') {
    if (!sss.sheetRegistered(errors, sss.USER_SHEET)) sss.loadAndRegisterSheet(errors, sss.USER_SHEET);
  } else {
    if (sss.sheetRegistered(errors, sss.USER_SHEET)) sss.unregisterSheet(errors, sss.USER_SHEET);
} }

function exportPrefs() {
  fp.init(window, 'Export Settings', nsIFilePicker.modeSave);
  fp.appendFilters(nsIFilePicker.filterAll);
  fp.defaultString = 'Stylishmod Prefs.xul';
  if (fp.show() === nsIFilePicker.returnCancel) return;
  var file = fp.file;
  var doc = document.implementation.createDocument('', '', null);
  var docRoot = doc.createElement('prefs');
  var aPref, prefType;
  function createPrefs(prefs, array, path) {
    for (var i = 0; i < array.length; i++) {
      array.sort();
      prefType = prefs.getPrefType(array[i]);
      if (prefType === 32) { //char
        aPref = doc.createElement('pref');
        aPref.setAttribute('name', path + array[i]);
        aPref.setAttribute('type', 'char');
        aPref.setAttribute('data', prefs.getCharPref(array[i]));
        docRoot.appendChild(aPref);
      } else if (prefType === 64) { //int
        aPref = doc.createElement('pref');
        aPref.setAttribute('name', path + array[i]);
        aPref.setAttribute('type', 'int');
        aPref.setAttribute('data', prefs.getIntPref(array[i]));
        docRoot.appendChild(aPref);
      } else if (prefType === 128) { //bool
        aPref = doc.createElement('pref');
        aPref.setAttribute('name', path + array[i]);
        aPref.setAttribute('type', 'bool');
        aPref.setAttribute('data', prefs.getBoolPref(array[i]));
        docRoot.appendChild(aPref);
  } } }
  var prefsText, prefs, array, path;
  path = 'stylishmod.';
  prefsText = 'extensions.stylishmod.';
  array = prefs2.getChildList('', {});
  createPrefs(prefs2, array, path);
  doc.appendChild(docRoot);
  foStream.init(file, 0x02|0x08|0x20, 0664, 0);
  coStream.init(foStream, 'UTF-8', 0, 0);
  var serializer = new XMLSerializer().serializeToString(doc);
  serializer = serializer.replace(/<prefs>/g, '<prefs>\n').replace(/\/>/g, '/>\n');
  coStream.writeString(serializer);
  coStream.close();
  foStream.close();
}

function exportStyle() {
  var el = codeElementWrapper;
  var nam = document.getElementById('name');
  fp.init(window, 'Export Style', nsIFilePicker.modeSave);
  fp.appendFilters(nsIFilePicker.filterAll);
  fp.defaultString = nam.value + '.css';
  if (fp.show() === nsIFilePicker.returnCancel) return;
  foStream.init(fp.file, 0x02|0x08|0x20, 0664, 0);
  coStream.init(foStream, 'UTF-8', 0, 0);
  coStream.writeString(el.value);
  coStream.close();
  foStream.close();
}

function externalEdit(button) {
  if (button === 2) {
    checkFileStop(false);
    return;
  }
  if (timer) timer.cancel();
  function timer2() {
    var observer = {
      observe: function() {checkFile(cssFile);}
    };
    timer.init(observer, 20, Ci.nsITimer.TYPE_REPEATING_SLACK);
  }
  var editorPath = prefs2.getCharPref('externalEditor');
  editorPath = decodeURIComponent(editorPath).replace(/file:\/\/\//, '').replace(/\//g, '\\');
  if (cssFile) {
    checkFile(cssFile);
    proc.runAsync(args, args.length);
    timer2();
    return;
  }
  if (editorPath === '') {
    alert('Invalid Editor');
    return;
  }
  Cu.import('resource://gre/modules/FileUtils.jsm');
  var cssFile = FileUtils.getDir('ProfD', ['stylishmod-styles'], true);
  cssFile.append(style.name + '.css');
  cssFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
  var el = codeElementWrapper;
  if (style.code === '') style.code = el.value;
  foStream.init(cssFile, 0x02|0x08|0x20, 0664, 0);
  coStream.init(foStream, 'UTF-8', 0, 0);
  coStream.writeString(style.code);
  coStream.close();
  foStream.close();
  cssFile = cssFile;
  args = [cssFile.path];
  var exe = createInstance('@mozilla.org/file/local;1', 'nsIFile');
  exe.followLinks = true;
  exe.initWithPath(editorPath);
  proc = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
  proc.init(exe);
  proc.runAsync(args, args.length);
  timer2();
}

function findbarText() {
  document.getElementById('findbar').getElement('findbar-textbox').value = prefs2.getCharPref('findtext');
  if (prefs2.getCharPref('findtext')) document.getElementById('findbar').getElement('find-next').disabled = document.getElementById('findbar').getElement('find-previous').disabled = false;
}

function findText() {
  var fb = document.getElementById('findbar'), el = fb.getElement('findbar-textbox');
  prefs2.setCharPref('findtext', el.value);
}

function formatColor() {
  var el = codeElementWrapper;
  var selectionStart = el.selectionStart, selectionEnd = el.selectionEnd;
  var snip = el.value.substring(selectionStart, selectionEnd).toLowerCase();
  var h = el.value.substring(selectionStart, selectionEnd).replace('#', '');
  if (snip.match('aliceblue')) {insertCodeAtCaret('#f0f8ff'); return;}
  if (snip.match('antiquewhite')) {insertCodeAtCaret('#FAEBD7'); return;}
  if (snip.match('aqua')) {insertCodeAtCaret('#00FFFF'); return;}
  if (snip.match('aquamarine')) {insertCodeAtCaret('#7FFFD4'); return;}
  if (snip.match('azure')) {insertCodeAtCaret('#F0FFFF'); return;}
  if (snip.match('beige')) {insertCodeAtCaret('#F5F5DC'); return;}
  if (snip.match('bisque')) {insertCodeAtCaret('#FFE4C4'); return;}
  if (snip.match('black')) {insertCodeAtCaret('#000000'); return;}
  if (snip.match('blanchedalmond')) {insertCodeAtCaret('#FFEBCD'); return;}
  if (snip.match('blue')) {insertCodeAtCaret('#0000FF'); return;}
  if (snip.match('blueviolet')) {insertCodeAtCaret('#8A2BE2'); return;}
  if (snip.match('brown')) {insertCodeAtCaret('#A52A2A'); return;}
  if (snip.match('burlywood')) {insertCodeAtCaret('#DEB887'); return;}
  if (snip.match('cadetblue')) {insertCodeAtCaret('#5F9EA0'); return;}
  if (snip.match('chartreuse')) {insertCodeAtCaret('#7FFF00'); return;}
  if (snip.match('chocolate')) {insertCodeAtCaret('#D2691E'); return;}
  if (snip.match('coral')) {insertCodeAtCaret('#FF7F50'); return;}
  if (snip.match('cornflowerblue')) {insertCodeAtCaret('#6495ED'); return;}
  if (snip.match('cornsilk')) {insertCodeAtCaret('#FFF8DC'); return;}
  if (snip.match('crimson')) {insertCodeAtCaret('#DC143C'); return;}
  if (snip.match('cyan')) {insertCodeAtCaret('#00FFFF'); return;}
  if (snip.match('darkblue')) {insertCodeAtCaret('#00008B'); return;}
  if (snip.match('darkcyan')) {insertCodeAtCaret('#008B8B'); return;}
  if (snip.match('darkgoldenrod')) {insertCodeAtCaret('#B8860B'); return;}
  if (snip.match('darkgray')) {insertCodeAtCaret('#A9A9A9'); return;}
  if (snip.match('darkgreen')) {insertCodeAtCaret('#006400'); return;}
  if (snip.match('darkkhaki')) {insertCodeAtCaret('#BDB76BB'); return;}
  if (snip.match('darkmagenta')) {insertCodeAtCaret('#8B008B'); return;}
  if (snip.match('darkolivegreen')) {insertCodeAtCaret('#556B2F'); return;}
  if (snip.match('darkorange')) {insertCodeAtCaret('#FF8C00'); return;}
  if (snip.match('darkorchid')) {insertCodeAtCaret('#9932CC'); return;}
  if (snip.match('darkred')) {insertCodeAtCaret('#8B0000'); return;}
  if (snip.match('darksalmon')) {insertCodeAtCaret('#E9967A'); return;}
  if (snip.match('darkseagreen')) {insertCodeAtCaret('#8fBC8F'); return;}
  if (snip.match('darkslateblue')) {insertCodeAtCaret('#483D8B'); return;}
  if (snip.match('darkslategray')) {insertCodeAtCaret('#2F4F4F'); return;}
  if (snip.match('darkturquoise')) {insertCodeAtCaret('#00CED1'); return;}
  if (snip.match('darkviolet')) {insertCodeAtCaret('#9400D3'); return;}
  if (snip.match('deeppink')) {insertCodeAtCaret('#FF1493'); return;}
  if (snip.match('deepskyblue')) {insertCodeAtCaret('#00BFFF'); return;}
  if (snip.match('dimgray')) {insertCodeAtCaret('#696969'); return;}
  if (snip.match('dodgerblue')) {insertCodeAtCaret('#1E90FF'); return;}
  if (snip.match('firebrick')) {insertCodeAtCaret('#B22222'); return;}
  if (snip.match('floralwhite')) {insertCodeAtCaret('#FFFAF0'); return;}
  if (snip.match('forestgreen')) {insertCodeAtCaret('#228B22'); return;}
  if (snip.match('fuchsia')) {insertCodeAtCaret('#FF00FF'); return;}
  if (snip.match('gainsboro')) {insertCodeAtCaret('#DCDCDC'); return;}
  if (snip.match('ghostwhite')) {insertCodeAtCaret('#F8F8FF'); return;}
  if (snip.match('gold')) {insertCodeAtCaret('#FFD700'); return;}
  if (snip.match('goldenrod')) {insertCodeAtCaret('#DAA520'); return;}
  if (snip.match('gray')) {insertCodeAtCaret('#808080'); return;}
  if (snip.match('green')) {insertCodeAtCaret('#008000'); return;}
  if (snip.match('greenyellow')) {insertCodeAtCaret('#ADFF2F'); return;}
  if (snip.match('honeydew')) {insertCodeAtCaret('#F0FFF0'); return;}
  if (snip.match('hotpink')) {insertCodeAtCaret('#FF69B4'); return;}
  if (snip.match('indianred')) {insertCodeAtCaret('#CD5C5C'); return;}
  if (snip.match('indigo')) {insertCodeAtCaret('#4B0082'); return;}
  if (snip.match('ivory')) {insertCodeAtCaret('#FFFFF0'); return;}
  if (snip.match('khaki')) {insertCodeAtCaret('#F0E68C'); return;}
  if (snip.match('lavender')) {insertCodeAtCaret('#E6E6FA'); return;}
  if (snip.match('lavenderblush')) {insertCodeAtCaret('#FFF0F5'); return;}
  if (snip.match('lawngreen')) {insertCodeAtCaret('#7CFC00'); return;}
  if (snip.match('lemonchiffon')) {insertCodeAtCaret('#FFFACD'); return;}
  if (snip.match('lightblue')) {insertCodeAtCaret('#ADD8E6'); return;}
  if (snip.match('lightcoral')) {insertCodeAtCaret('#F08080'); return;}
  if (snip.match('lightcyan')) {insertCodeAtCaret('#E0FFFF'); return;}
  if (snip.match('lightgoldenrodyellow')) {insertCodeAtCaret('#FAFAD2'); return;}
  if (snip.match('lightgray')) {insertCodeAtCaret('#D3D3D3'); return;}
  if (snip.match('lightgreen')) {insertCodeAtCaret('#90EE90'); return;}
  if (snip.match('lightpink')) {insertCodeAtCaret('#FFB6C1'); return;}
  if (snip.match('lightsalmon')) {insertCodeAtCaret('#FFA07A'); return;}
  if (snip.match('lightseagreen')) {insertCodeAtCaret('#20B2AA'); return;}
  if (snip.match('lightskyblue')) {insertCodeAtCaret('#87CEFA'); return;}
  if (snip.match('lightslategray')) {insertCodeAtCaret('#778899'); return;}
  if (snip.match('lightsteelblue')) {insertCodeAtCaret('#B0C4DE'); return;}
  if (snip.match('lightyellow')) {insertCodeAtCaret('#FFFFE0'); return;}
  if (snip.match('lime')) {insertCodeAtCaret('#00FF00'); return;}
  if (snip.match('limegreen')) {insertCodeAtCaret('#32CD32'); return;}
  if (snip.match('linen')) {insertCodeAtCaret('#FAF0E6'); return;}
  if (snip.match('magenta')) {insertCodeAtCaret('#FF00FF'); return;}
  if (snip.match('maroon')) {insertCodeAtCaret('#800000'); return;}
  if (snip.match('mediumaquamarine')) {insertCodeAtCaret('#66CDAA'); return;}
  if (snip.match('mediumblue')) {insertCodeAtCaret('#0000CD'); return;}
  if (snip.match('mediumorchid')) {insertCodeAtCaret('#BA55D3'); return;}
  if (snip.match('mediumpurple')) {insertCodeAtCaret('#9370DB'); return;}
  if (snip.match('mediumseagreen')) {insertCodeAtCaret('#3CB371'); return;}
  if (snip.match('mediumslateblue')) {insertCodeAtCaret('#7B68EE'); return;}
  if (snip.match('mediumspringgreen')) {insertCodeAtCaret('#00FA9A'); return;}
  if (snip.match('mediumturquoise')) {insertCodeAtCaret('#48D1CC'); return;}
  if (snip.match('mediumvioletred')) {insertCodeAtCaret('#C71585'); return;}
  if (snip.match('midnightblue')) {insertCodeAtCaret('#191970'); return;}
  if (snip.match('mintcream')) {insertCodeAtCaret('#F5FFFA'); return;}
  if (snip.match('mistyrose')) {insertCodeAtCaret('#FFE4E1'); return;}
  if (snip.match('moccasin')) {insertCodeAtCaret('#FFE4B5'); return;}
  if (snip.match('navajowhite')) {insertCodeAtCaret('#FFDEAD'); return;}
  if (snip.match('navy')) {insertCodeAtCaret('#000080'); return;}
  if (snip.match('oldlace')) {insertCodeAtCaret('#FDF5E6'); return;}
  if (snip.match('olive')) {insertCodeAtCaret('#808000'); return;}
  if (snip.match('olivedrab')) {insertCodeAtCaret('#6B8E23'); return;}
  if (snip.match('orange')) {insertCodeAtCaret('#FFA500'); return;}
  if (snip.match('orangered')) {insertCodeAtCaret('#FF4500'); return;}
  if (snip.match('orchid')) {insertCodeAtCaret('#DA70D6'); return;}
  if (snip.match('palegoldenrod')) {insertCodeAtCaret('#EEE8AA'); return;}
  if (snip.match('palegreen')) {insertCodeAtCaret('#98FB98'); return;}
  if (snip.match('paleturquoise')) {insertCodeAtCaret('#AFEEEE'); return;}
  if (snip.match('palevioletred')) {insertCodeAtCaret('#DB7093'); return;}
  if (snip.match('papayawhip')) {insertCodeAtCaret('#FFEFD5'); return;}
  if (snip.match('peachpuff')) {insertCodeAtCaret('#FFDAB9'); return;}
  if (snip.match('peru')) {insertCodeAtCaret('#CD853F'); return;}
  if (snip.match('pink')) {insertCodeAtCaret('#FFC0CB'); return;}
  if (snip.match('plum')) {insertCodeAtCaret('#DDA0DD'); return;}
  if (snip.match('powderblue')) {insertCodeAtCaret('#B0E0E6'); return;}
  if (snip.match('purple')) {insertCodeAtCaret('#800080'); return;}
  if (snip.match('red')) {insertCodeAtCaret('#FF0000'); return;}
  if (snip.match('rosybrown')) {insertCodeAtCaret('#BC8F8F'); return;}
  if (snip.match('royalblue')) {insertCodeAtCaret('#4169E1'); return;}
  if (snip.match('saddlebrown')) {insertCodeAtCaret('#8B4513'); return;}
  if (snip.match('salmon')) {insertCodeAtCaret('#FA8072'); return;}
  if (snip.match('sandybrown')) {insertCodeAtCaret('#F4A460'); return;}
  if (snip.match('seagreen')) {insertCodeAtCaret('#2E8B57'); return;}
  if (snip.match('seashell')) {insertCodeAtCaret('#FFF5EE'); return;}
  if (snip.match('sienna')) {insertCodeAtCaret('#A0522D'); return;}
  if (snip.match('silver')) {insertCodeAtCaret('#C0C0C0'); return;}
  if (snip.match('skyblue')) {insertCodeAtCaret('#87CEEB'); return;}
  if (snip.match('slateblue')) {insertCodeAtCaret('#6A5ACD'); return;}
  if (snip.match('slategray')) {insertCodeAtCaret('#708090'); return;}
  if (snip.match('snow')) {insertCodeAtCaret('#FFFAFA'); return;}
  if (snip.match('springgreen')) {insertCodeAtCaret('#00FF7F'); return;}
  if (snip.match('steelblue')) {insertCodeAtCaret('#4682B4'); return;}
  if (snip.match('tan')) {insertCodeAtCaret('#D2B48C'); return;}
  if (snip.match('teal')) {insertCodeAtCaret('#008080'); return;}
  if (snip.match('thistle')) {insertCodeAtCaret('#D8BFD8'); return;}
  if (snip.match('tomato')) {insertCodeAtCaret('#FF6347'); return;}
  if (snip.match('turquoise')) {insertCodeAtCaret('#40E0D0'); return;}
  if (snip.match('violet')) {insertCodeAtCaret('#EE82EE'); return;}
  if (snip.match('wheat')) {insertCodeAtCaret('#f5DEB3'); return;}
  if (snip.match('white')) {insertCodeAtCaret('#FFFFFF'); return;}
  if (snip.match('whitesmoke')) {insertCodeAtCaret('#F5F5F5'); return;}
  if (snip.match('yellow')) {insertCodeAtCaret('#FFFF00'); return;}
  if (snip.match('yellowgreen')) {insertCodeAtCaret('#9ACD32'); return;}
  if (snip.match(/#/)) {
    h =  h.match(new RegExp('(.{'+h.length/3+'})', 'g'));
    for (var i = 0; i < h.length; i++) h[i] = parseInt(h[i].length === 1 ? h[i] + h[i] : h[i], 16);
    insertCodeAtCaret('rgba(' + h.join(', ') + ', 1.0)');
  } else {
    var m = /rgba?\(\s*?(\d+),\s*?(\d+),\s*?(\d+)/.exec(snip);
    var r = parseInt(m[1], 10).toString(16), g = parseInt(m[2], 10).toString(16), b = parseInt(m[3 ], 10).toString(16);
    insertCodeAtCaret(m ? '#' + ((r.length === 1 ? '0'+ r : r).toUpperCase() + (g.length === 1 ? '0' + g : g).toUpperCase() + (b.length === 1 ? '0' + b : b).toUpperCase()) : h);
  } 
  if (prefs2.getBoolPref('removefocus')) removeFocus();
}

function getCharCount() {
  var cnt = codeElementWrapper.value.length;
  var cc = document.getElementById('character-count');
  if (prefs2.getCharPref('darktheme') === '0') {
    if (cnt > 99999) cc.setAttribute('style', 'background: red; color: white;');
    else if (cnt > 95000 && cnt < 100000) cc.setAttribute('style', 'background: yellow; color: black;');
    else cc.setAttribute('style', 'background: none; color: black;');
  }
  cc.value = cnt.toLocaleString();
}

function getInsert(event) {
  if (event === 1) openDialog('chrome://stylishmod/content/custom.xul', '_blank', 'chrome,resizable,dialog=yes,alwaysRaised');
}

function getKeyCode(eventkey) {
  var win = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher).activeWindow;
  var el = sourceEditorType != 'sourceeditor' ? codeE : document.getElementById('sourceeditor');
  if (eventkey == 8 || eventkey == 32 || eventkey == 0) {
    alert('Invalid Key');
    return;
  }
  prefs2.setCharPref('autoimportant.key', eventkey);
  try {
    el.setAttribute('onkeypress', 'if(event.which == ' + uneval(eventkey) + ') {event.preventDefault(); insertImportant()}');
  } catch(ex) {}
}

function getPicker() {
  if (prefs2.getBoolPref('rainbowpicker')) {
    document.getElementById('rainbowpicker-detect').showPopup();
  } else {
    document.getElementById('insert-color-popup').style.opacity = '1';
    document.getElementById('colorpicker').style.display = '-moz-box';
} }

function getURI(a, b) {
  var begin = a.split('("")')[0], end = a.split('("")')[1];
  switch (b) {
    case 1:
      break;
    case 0:
      fp.init(window, strings.getString('dataURIDialogTitle'), nsIFilePicker.modeOpen);
      fp.appendFilters(nsIFilePicker.filterImages);
      if (fp.show() !== nsIFilePicker.returnOK) return;
      insertCodeAtCaret(begin + '("' + fp.fileURL.spec + '")' + end);
      break;
    case 2:
      fp.init(window, strings.getString('dataURIDialogTitle'), nsIFilePicker.modeOpen);
      fp.appendFilters(nsIFilePicker.filterImages);
      if (fp.show() !== nsIFilePicker.returnOK) return;
      var file = fp.file, contentType = Cc['@mozilla.org/mime;1'].getService(Ci.nsIMIMEService).getTypeFromFile(file);
      fiStream.init(file, 0x01, 0600, 0);
      biStream.setInputStream(fiStream);
      var encoded = btoa(biStream.readBytes(biStream.available()));
      biStream.close();
      fiStream.close();
      insertCodeAtCaret(begin + '("data:' + contentType + ';base64,' + encoded + '")' + end);
      break;
  }
  removeFocus()
}

function goToEnd() {
  if (sourceEditorType === 'sourceeditor') var count = sourceEditor.getText();
  else var count = codeE.value;
  count = count.match(/[\n]/g);
  goToLine(count.length + 1, 0);
}

function goToTop() {
    goToLine(0, 0);
}

function grayScale() {
  document.getElementById('scalegray').value = prefs2.getCharPref('scalegray');
  switch (prefs2.getCharPref('scalegray')) {
    case 'yes': 
      if (!sss.sheetRegistered(shade, sss.USER_SHEET)) sss.loadAndRegisterSheet(shade, sss.USER_SHEET);
      if (sss.sheetRegistered(noshade, sss.USER_SHEET)) sss.unregisterSheet(noshade, sss.USER_SHEET);
      break;
    case 'no':
      if (!sss.sheetRegistered(noshade, sss.USER_SHEET)) sss.loadAndRegisterSheet(noshade, sss.USER_SHEET);
      if (sss.sheetRegistered(shade, sss.USER_SHEET)) sss.unregisterSheet(shade, sss.USER_SHEET);
      break;
} }

function hideNumber() {
  if (sss.sheetRegistered(shownum, sss.USER_SHEET)) sss.unregisterSheet(shownum, sss.USER_SHEET);
  if (!sss.sheetRegistered(hidenum, sss.USER_SHEET)) sss.loadAndRegisterSheet(hidenum, sss.USER_SHEET);
}

function importPrefs() {
  fp.init(window, 'Import Settings', nsIFilePicker.modeOpen);
  fp.appendFilters(nsIFilePicker.filterAll);
  if (fp.show() === nsIFilePicker.returnCancel) return;
  var prefsFile;
  prefsFile = readFile(fp.file.path);
  var prefsBranch = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService);
  var name, type, data, prefs;
  var children = prefsFile.firstChild.childNodes;
  for (var i = 0; i < children.length; i++) {
  if (children[i] != '[object Element]' || !children[i].hasAttribute('name')) continue;
  name = children[i].getAttribute('name');
  prefs = prefsBranch.getBranch('extensions.');
  if (prefs.getPrefType(name) < 1) continue;
  type = children[i].getAttribute('type');
  data = children[i].getAttribute('data');
    if (type == 'int') {
      prefs.setIntPref(name, data);
    } else if (type == 'char') {
      prefs.setCharPref(name, data);
    } else if (type == 'bool') {
      if (data == 'true') prefs.setBoolPref(name, true);
      else prefs.setBoolPref(name, false);
    } 
  } 
  document.location.reload();
}

function insertColor() {
  if (colorChosen) {
    insertCodeAtCaret(document.getElementById('colorpicker').color);
    colorChosen = false;
  } 
  if (prefs2.getBoolPref('removefocus')) removeFocus();
}

function insertImportant() {
  var xxx = prefs2.getCharPref('autoimportant.key'), yyy = String.fromCharCode(xxx);
  if (prefs2.getBoolPref('autoimportant.enabled')) insertCodeAtCaret(prefs2.getCharPref('autoimportant.text'));
  else insertCodeAtCaret(yyy);
  var caretPosition = codeElementWrapper.selectionEnd;
  codeElementWrapper.setSelectionRange(caretPosition, caretPosition);
}

function insertRainbowPickerColor(event) {
  codeE.focus();
  insertCodeAtCaret(event.target.color);
  setTimeout(function() {
    if (prefs2.getBoolPref('removefocus')) removeFocus();
  }, 100);
}

function insertText(e) {
  switch (e) {
    case 1: insertCodeAtStart('/* AGENT_SHEET */'); break;
  } 
  if (prefs2.getBoolPref('removefocus')) removeFocus();
}

function insText(e) {
  insertCodeAtCaret(e);
  if (prefs2.getBoolPref('removefocus')) removeFocus();
}

function lineNumber(that) {
  var observer = {
    observe: function() {
      timer.cancel();
      var idTmp = document.getElementById('line-number');
      if (!idTmp) return;
      var text = that.value.slice(0, that.selectionEnd);
      var lines = text.split('\n');
      lines.splice(0, 0, 0);
      idTmp.value = lines.length-1 + ':' + lines[lines.length-1].length;
      getCharCount();
    }
  };
  timer.init(observer, 20, Ci.nsITimer.TYPE_ONE_SHOT);
}

function lineNumberSearch(num, key) {
  if (key !== 13) return;
  if (num == 0) {
    codeE.inputField.scrollTop = 0;
    return;
  }
  var lines = codeE.value.split('\n');
  lines.splice(0, 0, 0);
  var col = null;
  if (num.indexOf(':') !== -1) {
    num = num.split(':');
    col = num[1];
    num = num[0];
  }
  var start = '', end = '', newLines;
  for (var i = 1; i < lines.length; i++) {
    end = end + lines[i];
    start = start + lines[i];
    if (i == num && num != 1) {
      newLines = i;
      start = start.slice(0, -lines[newLines--].length);
      var lastLine = lines[i].length;
    }
    if (i >= num) break;
  }
  codeE.focus();
  if (num == 1) {
    codeE.setSelectionRange(0, end.length);
  } else if (start == '') {
    codeE.setSelectionRange(end.length+newLines, end.length + newLines);
  } else {
    if (col) {
      col = col++;
      codeE.setSelectionRange(start.length+newLines, end.length+newLines - lastLine + col);
    } else {
      codeE.setSelectionRange(start.length + newLines, end.length + newLines + 1);
  } }
  if (newLines > 4) {
    newLines = newLines - 4;
    codeE.inputField.scrollTop = newLines * 16;
  } else {
    codeE.inputField.scrollTop = 0;
} }

function lineNumberSearchChoice(button, num, key) {
  if (prefs.getIntPref('editor') === 0) {
    var num = document.getElementById('line-number-search').value;
    var val = num.split(':');
    goToLine(val[0], val[1]);
  } else {
    if (button === 0) {
     lineNumberSearch(num, 13);
    } else {
      var idTmp = document.getElementById('line-number-search');
      if (!idTmp) return;
      idTmp.inputField.value = '';
} } }

function lineNumberSearchDrag(that, event) {
  var text = event.dataTransfer.getData('text/plain');
  lineNumberSearch(text, 13);
  that.value = '';
}

function lineNumberSearchType(num, event) {
  if (event.keyCode === 13) {
    lineNumberSearch(num, 13);
    return;
  }
  if (event.ctrlKey === true && event.keyCode === 86) {
    num = document.getElementById('line-number-search');
    if (num) lineNumberSearch(num.inputField.value, 13);
} }

function makeImportant() {
  var el = codeElementWrapper;
  el.value = el.value.replace(/;base64/g, '__base64__')
    .replace(/(?!important;);/g, ' !important;')
    .replace(/!important !important;/g, '!important;')
    .replace(/__base64__/g, ';base64');
  getCharCount();
}

function onCheckbox(e) {
  var ed = prefs.getIntPref('editor');
  var id = prefs2.getIntPref('id');
  var nav = getWin('navigator:browser'), wm = getWin('stylishEdit' + id);
  var nam = e.id.split('-cb')[0];
  var bool = e.checked;
  prefs2.setBoolPref(nam, bool);
  if (prefs.getIntPref('editorWindowMode') === 0) var el = nav.gBrowser.contentDocument.getElementById(nam);
  else var el = wm.document.getElementById(nam);
  el.collapsed = !bool;
  el.hidden = !bool;
  if (bool) el.style.display = '-moz-box';
  else el.style.display = 'none';
}

function onLabel(e) {
  var id = prefs2.getIntPref('id');
  var nav = getWin('navigator:browser'), wm = getWin('stylishEdit' + id);
  var nam = e.id.split('-lb')[0];
  if (prefs.getIntPref('editorWindowMode') === 0) var el = nav.gBrowser.contentDocument.getElementById(nam);
  else var el = wm.document.getElementById(nam);
  prefs4.setCharPref(nam, e.value);
  if (nam === 'bytes' || nam === 'styleid' || nam === 'style-name') el.firstChild.value = e.value;
  else if (nam === 'cursor' || nam === 'line' || nam === 'clear1' || nam === 'clear2') el.firstChild.label = e.value;
  else if (nam === 'auto-important') el.lastChild.label = e.value;
  else el.label = e.value;
}

function onPageLoad(event) {
  var mainWin = getWin('navigator:browser');
  var appContent = mainWin.document.getElementById('appcontent');
  if (!appContent) appContent = mainWin.document.getElementById('frame_main_pane');
  function removeEvent() {
    appContent.removeEventListener('DOMContentLoaded', onPageLoad, true);
  }
  var editWin = getWin(pageStyleId);
  if (!editWin) {
    removeEvent();
    return;
  }
  var doc = event.originalTarget;
  var oldStyle = doc.location.href.indexOf(pageStyleUrl);
  var newStyle = doc.location.href.indexOf('userstyles.org/styles/new');
  if (newStyle !== -1 && oldStyle !== -1 || newStyle === -1 && oldStyle === -1 || !newStyle && !oldStyle) return;
  var code = editWin.document.getElementById('internal-code').value
    .replace(/http:\/\/userstyles/g, 'https://userstyles')
    .replace(/http:\/\/forum\.userstyles/g, 'https://forum.userstyles')
    .replace(/http:\/\/greasyfork/g, 'https://greasyfork');
  var name = editWin.document.getElementById('name').value;
  var cssEl = doc.getElementById('css');
  var nameEl = doc.getElementById('style_short_description');
  if (cssEl && code !== '') cssEl.value = code;
  if (newStyle !== -1 && name !== '' && nameEl) nameEl.value = name;
  removeEvent();
}

function onPosition(e) {
  if (e.id === 'togglebars-tb') e.value = e.value.replace(/^[^1]/, '');
  else e.value = e.value.replace(/[^0-9,]/g, '');
  var nam = e.id.split('-tb')[0], id = prefs2.getIntPref('id')
  var val = e.value.split(',')[0], val2 = e.value.split(',')[1];
  var nav = getWin('navigator:browser'), wm = getWin('stylishEdit' + id);
  if (prefs.getIntPref('editorWindowMode') === 0) {
    var el = nav.gBrowser.contentDocument.getElementById(nam);
    var tb = nav.gBrowser.contentDocument.getElementById('toolbar' + val);
  } else {
    var el = wm.document.getElementById(nam);
    var tb = wm.document.getElementById('toolbar' + val);
  }
  tb.appendChild(el);
  el.style.MozBoxOrdinalGroup = val2;
  if (nam === 'findbar') {
    if (prefs.getIntPref('editor') === 0) el.collapsed = true;
    else el.collapsed = !prefs2.getBoolPref('findbar');
} }

function onRadio(e) {
  var bool = prefs2.getBoolPref(e.id) !== true ? true : false;
  prefs2.setBoolPref(e.id, bool);
}

function onSave(event) {
  window.addEventListener('beforeunload', function(event) {event.returnValue = ''}, false);
}

function onToggle(e) {
  var num = e.id.split('togglebar')[1], tb = 'toolbar' + num;
  var bool = prefs2.getBoolPref(tb) !== true ? true : false;
  prefs2.setBoolPref(tb, bool);
  document.getElementById(tb).collapsed = bool;
  e.setAttribute('no-show', bool);
}

function openEditor(e) {
  if (e.value === false) e.value = 0;
  else e.value = 1;
  prefs.setIntPref('editorWindowMode', e.value);
  var id = prefs2.getIntPref('id'), doc = getWin('stylishEdit' + id);
  var win = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher).activeWindow;
  var url = 'about:stylish-edit?id=' + id, nav = getWin('navigator:browser');
  if (e.value === 0) {
    doc.close();
    nav.gBrowser.loadOneTab(url);  
  } else {
    if (doc) return;
    var aTab = nav.gBrowser.tabs;
    for (var i = aTab.length - 1; i >= 0; i--) {
      var tabs = aTab[i], browser = nav.gBrowser.getBrowserForTab(tabs);
      if (browser.currentURI.spec.match('about:stylish-edit')) nav.gBrowser.removeTab(tabs);
    }
    stylishCommon.openEdit(id, {id: id}, win);
} }

function pasteAll() {
  var el = codeElementWrapper;
  el.focus();
  goDoCommand('cmd_paste');
}

function previewAlt() {
  prefs2.setBoolPref('unpreview', true);
  document.getElementById('unpreview').collapsed = false;
  document.getElementById('unpreview').hidden = false;
  document.getElementById('unpreview').style.display = '-moz-box';
}

function readFile(file){
  file = 'file:///' + file;
  var req = new XMLHttpRequest();
  req.open('GET', file, false);
  try {
    req.send(null);
  } catch (e) {}
  return req.responseXML;
}

function removeFocus() {
  var el = codeElementWrapper, caretPosition = el.selectionEnd;
  el.setSelectionRange(caretPosition, caretPosition);
}

function restoreDown() {
  window.resizeTo(screen.availWidth, document.height / 1.25);
  window.moveTo(0, screen.availHeight - document.height - 40);
}

function restoreWindow() {
  window.moveTo(window.screen.left, 0);
  window.resizeTo(screen.availWidth, screen.availHeight);
}

function save(e) {
  style.name = nameE.value;
  if (!style.name) {
    alert('Missing Name');
    return false;
  }
  var code = codeElementWrapper.value;
  if (!code) {
    alert('Missing Code');
    return false;
  }
  if (!style.id) style.enabled = e;
  else if (!style.enabled) style.setPreview(false);
  if (code != initialCode) style.code = code;
  else style.revert();
  style.updateUrl = updateUrlE.value;
  var newStyle = !style.id;
  style.save();
  saved = true;
  if (newStyle) {
    location.href = location.href.split('?')[0] + '?id=' + style.id;
    return true;
  }
  if (prefs.getIntPref('editorWindowMode') === 0) updateTitle(0);
  else updateTitle(1);
  enableSave(false);
  enablePreview(!style.enabled);
  return true;
}

function saveClose(e) {
  window.addEventListener('beforeunload', function(event) {event.returnValue = ''}, false);
  if (document.getElementById('name').value === '') {
    alert(strings.getString('missingname'));
    return;
  }
  style.enabled = e;
  save(e); 
  close();
}

function scaleGray(e) {
  prefs2.setCharPref(e.id, e.value);
  grayScale();
}

function scratchPad(e) {
  var pad = e.id + 'Text', sp = document.getElementById(e.id);
  prefs2.setCharPref(pad, sp.value);
}

function selectAll() {
  var el = codeElementWrapper;
  el.focus();
  goDoCommand('cmd_selectAll');
}

function setEditor() {
  fp.init(window, null, fp.modeOpen);
  fp.appendFilters(fp.filterApps);
  if (fp.show() !== fp.returnCancel) {
    var path = decodeURIComponent(fp.fileURL.spec).replace(/file:\/\/\//, '').replace(/\//g, '\\');
    document.getElementById('set-editor').value = path;
    prefs2.setCharPref('externalEditor', path);
    document.getElementById('external-editor').label = ucFirst(path.substring(path.lastIndexOf('\\') + 1, path.lastIndexOf('.')));
} }

function showNumber() {
  if (sss.sheetRegistered(hidenum, sss.USER_SHEET)) sss.unregisterSheet(hidenum, sss.USER_SHEET);
  if (!sss.sheetRegistered(shownum, sss.USER_SHEET)) sss.loadAndRegisterSheet(shownum, sss.USER_SHEET);
}

function switchEditor(e) {
  var int = prefs.getIntPref('editor') !== 1 ? 1 : 0;
  prefs.setIntPref('editor', int);
  document.getElementById('switcheditor').value = int;
  var code = sourceEditorType !== 'sourceeditor' ? codeE : codeElementWrapper;
  if (prefs2.getBoolPref('editoralert')) {}
  if (!prefs2.getBoolPref('editoralert') && code.value !== initialCode) {
    var r = confirm("You're going to lose your changes - switch editors anyway?");
    if (r !== true) return;
  }
  document.location.reload();
}

function themeDark() {
  document.getElementById('darktheme').value = prefs2.getCharPref('darktheme');
  switch (prefs2.getCharPref('darktheme')) {
    case '1':
      if (!sss.sheetRegistered(dark, sss.USER_SHEET)) sss.loadAndRegisterSheet(dark, sss.USER_SHEET);
      break;
    case '0':
      if (sss.sheetRegistered(dark, sss.USER_SHEET)) sss.unregisterSheet(dark, sss.USER_SHEET);
      break;
} }

function ucFirst(str) {
  var firstLetter = str.slice(0, 1);
  return firstLetter.toUpperCase() + str.substring(1);
}

function undoAll() {
  var el = codeElementWrapper;
  el.value = style.code;
}

function undoRedo(e) {
  if (sourceEditorType !== 'sourceeditor') {
    if (e.id === 'undo') codeE.editor.undo(1);
    if (e.id === 'redo') codeE.editor.redo(1);
  } else {
    if (e.id === 'undo') sourceEditor.undo(1);
    if (e.id === 'redo') sourceEditor.redo(1);
  }
  getCharCount();
} 

function unobfuscate(event) {
  var el = codeElementWrapper;
  if (el.value.match(/\}[a-zA-Z0-9]/)) {
    el.value = el.value
      .replace(/(?!(:\/\/)|(:-moz)|(::)):/g, ': ')
      .replace(/(?!;base);/g, ';\u000D')
      .replace(/\!/g, ' !')
      .replace(/base64,\u000D/g, 'base64,')
      .replace(/>/g, ' > ')
      .replace(/{/g, ' {\u000D')
      .replace(/}/g, '\u000D}\u000D\u000D')
      .replace(/data: /g, 'data:')
      .replace(/png; /g, 'png;')
      .replace(/\u000D\u000D\u000D/g, '\u000D')
      .replace(/\u000D}/g, '}')
      .replace(/}}/g, '}\u000D}')
      .replace(/;}/g, '; }')
      .replace(/{(?!([{\n]|[{\s]))/g, '{ ')
      .replace(/}\s+/g, '}\n\n')
      .replace(/:\s*?(?![://])(?![^[\]]+(?=]))/g, ': ')
      .replace(/:\s*?-moz/g, ':-moz')
      .replace(/:\s*?active/g, ':active')
      .replace(/:\s*?after/g, ':after')
      .replace(/:\s*?application/g, ':application')
      .replace(/:\s*?before/g, ':before')
      .replace(/:\s*?checked/g, ':checked')
      .replace(/:\s*?empty/g, ':empty')
      .replace(/:\s*?first/g, ':first')
      .replace(/:\s*?focus/g, ':focus')
      .replace(/:\s*?hover/g, ':hover')
      .replace(/:\s*?image\//g, ':image/')
      .replace(/:\s*?last/g, ':last')
      .replace(/:\s*?link/g, ':link')
      .replace(/:\s*?not/g, ':not')
      .replace(/:\s*?nth/g, ':nth')
      .replace(/:\s*?root/g, ':root')
      .replace(/:\s*?selection/g, ':selection')
      .replace(/:\s*?visited/g, ':visited')
      .replace(/:\s+/g, ': ')
      .replace(/(\s+)?!important/g, ' !important')
      .replace(/!important;?}/g, '!important;\n}');
  }
  getCharCount();
}

function unPreview(e) {
  var box = document.getElementById('errors');
  prefs2.setBoolPref('unpreview', false);
  e.collapsed = true;
  e.hidden = true;
  e.style.display = 'none';
  if (box) box.style.display = 'none'; 
  style.revert();
}

function updateCheckToggle() {
  if (updateUrlE.value.search(/NOUPDATE/) == -1) updateUrlE.value = 'NOUPDATE ' + updateUrlE.value
    .replace(/http:\/\/userstyles/g, 'https://userstyles')
    .replace(/http:\/\/forum\.userstyles/g, 'https://forum.userstyles')
    .replace(/http:\/\/greasyfork/g, 'https://greasyfork');
  else updateUrlE.value = updateUrlE.value
    .replace(/NOUPDATE /, '')
    .replace(/http:\/\/userstyles/g, 'https://userstyles')
    .replace(/http:\/\/forum\.userstyles/g, 'https://forum.userstyles')
    .replace(/http:\/\/greasyfork/g, 'https://greasyfork');
}

function updateStyleId() {
  var styleId = document.getElementById('style-id');
  if (!styleId) return;
  var id = document.getElementById('stylish-edit').getAttribute('windowtype').replace(/stylishEdit/, '');
  styleId.inputField.value = id;
  prefs2.setIntPref('id', id);
}

function updateTitle(e) {
  var id = prefs2.getIntPref('id');
  if (e === 0) {
    setTimeout(function() {
      var win = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher).activeWindow;
      win.document.title = document.title.replace(/^Edit:/, 'Clone:');
      win.document.getElementById('name').value = document.title.replace(/^Edit: /, '') + ' (Clone)';
      win.document.getElementById('style-id').value = null;
    }, 1200);
  } else {
    setTimeout(function() {
      var el = codeElementWrapper, wm = getWin('stylishEdit' + id);
      var nam = document.getElementById('name');
      if (nam.value !== '') document.title = 'Edit: ' + nam.value;
      else if (nam.value === '' && el.value === '') document.title = 'New Style';
      else { 
        document.title = wm.document.getElementById('name').value + ' (Clone)';
        document.getElementById('name').value = document.title;
      }
    }, 1000);
} }

function updateUrlCheck() {
  var updateCheck = document.getElementById('update-check');
  if (!updateCheck) return;
  if (updateUrlE.value === '') {
    updateCheck.style.display = 'none';
    return;
  }
  if (updateUrlE.value.search(/NOUPDATE/) == -1) updateCheck.checked = true;
  else updateCheck.checked = false;
  updateCheck.style.display = '';
}

function updateView() {
  document.getElementById('update').hidden = false;
  document.getElementById('update').style.display = '-moz-box';
  document.getElementById('unpreview').style.display = 'none';
  document.getElementById('unpreview').hidden = true;
  document.getElementById('unpreview').collapsed = true;
  prefs2.setBoolPref('unpreview', false);
}

function userstylesPage(event) {
  var mainWin = getWin('navigator:browser'), content = mainWin.document.getElementById('content');
  if (!content) return;
  var appContent = mainWin.document.getElementById('appcontent');
  if (!appContent) appContent = mainWin.document.getElementById('frame_main_pane');
  function pageListen(newStyle) {
    pageStyleId = document.getElementById('stylish-edit').getAttribute('windowtype');
    if (newStyle !== true && styleUrl) {
      var www = updateUrlE.value.match(/\d+/);
      var xxx = updateUrlE.value.split(/\d+/)[0].replace(/NOUPDATE /, '') + www + '/edit';
      pageStyleUrl = xxx;
      content.selectedTab = content.addTab(xxx);
    } else {
      content.selectedTab = content.addTab('https://userstyles.org/styles/new');
    }
    appContent.removeEventListener('DOMContentLoaded', onPageLoad, true);
    appContent.addEventListener('DOMContentLoaded', onPageLoad, true);
  }
  if (!updateUrlE.value) {
    pageListen(true);
    return;
  } 
  var styleUrl = updateUrlE.value
    .replace(/\.css|(NOUPDATE )|raw\/|\/about-firefox\?r\=.*$/, '')
    .replace(/http:\/\/userstyles/g, 'https://userstyles')
    .replace(/http:\/\/forum\.userstyles/g, 'https://forum.userstyles')
    .replace(/http:\/\/greasyfork/g, 'https://greasyfork');
  switch (event.button) {
    case 0: styleUrl.match('userstyles.org') ? content.selectedTab = content.addTab(styleUrl) : content.selectedTab = content.addTab('https://userstyles.org/styles/new'); break;
    case 1: content.selectedTab = content.addTab('https://userstyles.org/styles/new'); break;
    case 2: styleUrl.match('userstyles.org') ? pageListen(false) : pageListen(true); break; 
} }


