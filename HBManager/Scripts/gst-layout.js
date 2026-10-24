$(document).ready(function () {

            $(document).ajaxStart(function () {
                $("#pageLoader").fadeIn(200);
            });

            $(document).ajaxStop(function () {
                $("#pageLoader").fadeOut(200);
            });

        });

$(document).ready(function () {
            $('#btnLogoutGst').on('click', function (e) {
                //e.preventDefault(); // stop # default behavior

                window.location.href = document.getElementById('btnLogoutGst').dataset.logoutUrl;
            });
        });
