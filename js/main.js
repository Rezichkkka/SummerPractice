$('#login-button').click(function(event) {
    event.preventDefault();

    let email = $('#email-address').val();
    let password = $('#password').val();
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

    if (!error) {
        $('#login-form').submit();
    }
});


