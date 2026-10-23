
            $.ajaxPrefilter(function (options) {
                var token = $('input[name="__RequestVerificationToken"]').first().val();
                if (token) {
                    options.headers = options.headers || {};
                    options.headers.RequestVerificationToken = token;
                }
            });
        