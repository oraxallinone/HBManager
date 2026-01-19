$(document).ready(function () {
    setTimeout(function () {
        myFunction();
    }, 500); // 1000 milliseconds = 1 second

    function myFunction() {
        $('#email').val('');
        $('#password').val('');
    }

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        var email = $('#email').val().trim();
        var password = $('#password').val().trim();
        var rememberMe = $('#rememberMe').is(':checked');
        var error = '';
        if (!email) {
            error = 'Email is required.';
        } else if (!password) {
            error = 'Password is required.';
        }
        if (error) {
            $('#loginError').text(error);
            return;
        }
        $('#loginError').text('');
        $.ajax({
            url: '/Login/CheckLogin',
            type: 'POST',
            data: { email: email, password: password, rememberMe: rememberMe },
            success: function (res) {
                if (res.success) {
                    window.location.href = res.redirectUrl;
                } else {
                    $('#loginError').text(res.message);
                }
            },
            error: function () {
                $('#loginError').text('Server error. Please try again.');
            }
        });
    });
});
