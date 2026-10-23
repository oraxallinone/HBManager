
        $(document).ready(function () {
            $('#btnLogout').on('click', function (e) {
                e.preventDefault();
                $.post($('#btnLogout').data('logout-url'), function () {
                    window.location.href = $('#btnLogout').data('login-url');
                });
            });
        });
    