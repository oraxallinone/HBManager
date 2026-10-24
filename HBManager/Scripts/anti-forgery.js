(function ($) {
    if (!$) {
        return;
    }

    $.ajaxPrefilter(function (options, originalOptions, xhr) {
        var method = (options.type || options.method || 'GET').toUpperCase();
        if (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method)) {
            return;
        }

        var target = document.createElement('a');
        target.href = options.url;
        if (target.protocol !== window.location.protocol || target.host !== window.location.host) {
            return;
        }

        var tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
        if (tokenInput && tokenInput.value) {
            xhr.setRequestHeader('RequestVerificationToken', tokenInput.value);
        }
    });
})(window.jQuery);
