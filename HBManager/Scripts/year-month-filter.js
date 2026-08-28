(function () {
    function updateMonthOptions() {
        var selectedYear = parseInt($('#ddlYear').val(), 10);
        var selectedMonth = parseInt($('#ddlMonth').val(), 10) || 0;

        $('#ddlMonth option').each(function () {
            var month = parseInt($(this).val(), 10);
            $(this).prop('disabled', selectedYear === 2024 && month >= 1 && month <= 6);
        });

        if (selectedYear === 2024 && selectedMonth >= 1 && selectedMonth <= 6) {
            $('#ddlMonth').val('0');
        }
    }

    window.updateMonthOptions = updateMonthOptions;

    $(function () {
        updateMonthOptions();
        $('#ddlYear').on('change.yearMonthFilter', updateMonthOptions);
    });
})();