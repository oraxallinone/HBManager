
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
    