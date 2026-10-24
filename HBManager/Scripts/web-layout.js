$(document).ready(function () {
            $(document).ajaxStart(function () {
                showLoader();
            });
            $(document).ajaxStop(function () {
                hideLoader();
            });
            function showLoader() {
                $("#loadingSpinner").fadeIn(200);
            }
            function hideLoader() {
                $("#loadingSpinner").fadeOut(200);
            }
        });

$(document).ready(function () {
            $('#btnLogout').on('click', function (e) {
                e.preventDefault();
                window.location.href = document.getElementById('btnLogout').dataset.logoutUrl;
            });
        });
