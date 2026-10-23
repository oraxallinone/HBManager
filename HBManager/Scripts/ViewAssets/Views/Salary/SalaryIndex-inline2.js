
    document.addEventListener('DOMContentLoaded', function () {
        var monthSelect = document.getElementById('txtMonthName');
        var orderRowYearInput = document.getElementById('txtOrderRowYear');
        if (monthSelect && orderRowYearInput) {
            monthSelect.addEventListener('change', function () {
                var val = monthSelect.value;
                // Only assign if a valid month is selected
                if (val !== '0') {
                    orderRowYearInput.value = val;
                } else {
                    orderRowYearInput.value = '';
                }
            });
        }
    });
