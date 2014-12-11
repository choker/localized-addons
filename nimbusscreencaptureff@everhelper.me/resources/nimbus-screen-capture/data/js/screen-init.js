self.port.on('init', function(message) {
    localStorage.l10n = message.l10n;
    document.getElementById('imageedit').setAttribute('title', message.title);
    document.getElementById('imageedit').setAttribute('src', message.src);
});