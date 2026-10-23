
        $(document).ready(function () {

            $(document).ajaxStart(function () {
                $("#pageLoader").fadeIn(200);
            });

            $(document).ajaxStop(function () {
                $("#pageLoader").fadeOut(200);
            });

        });
        