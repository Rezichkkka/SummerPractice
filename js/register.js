$(document).ready(function () {
    $('#register-button').click(function (event) {
        event.preventDefault();

        let email = $('#email-address').val();
        let password = $('#password').val();
        let confirmPassword = $('#confirm-password').val();
        let error = false;

        if (email === '') {
            $('#email-address').addClass('is-invalid');
            error = true;
        } else {
            $('#email-address').removeClass('is-invalid');
        }

        if (password === '') {
            $('#password').addClass('is-invalid');
            error = true;
        } else {
            $('#password').removeClass('is-invalid');
        }

        if (confirmPassword === '') {
            $('#confirm-password').addClass('is-invalid');
            error = true;
        } else {
            $('#confirm-password').removeClass('is-invalid');
        }

        if (password !== confirmPassword) {
            $('#password, #confirm-password').addClass('is-invalid');
            error = true;
        } else {
            $('#password, #confirm-password').removeClass('is-invalid');
        }

        if (!error) {
            $('#register-form').submit();
        }
    });

   
});



