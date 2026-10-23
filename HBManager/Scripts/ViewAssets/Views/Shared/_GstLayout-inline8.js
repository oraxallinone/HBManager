
        $(document).ready(function () {
            $('#btnLogoutGst').on('click', function (e) {
                e.preventDefault();
                $.post($('#btnLogoutGst').data('logout-url'), function () {
                    window.location.href = $('#btnLogoutGst').data('login-url');
                });
            });
        });
        