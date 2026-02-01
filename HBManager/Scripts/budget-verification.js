$(document).ready(function () {

    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    setThisYearMonth();


    //set current month & year
    function setThisYearMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // getMonth() returns 0–11

        $("#ddlYear").val(year);
        $("#ddlMonth").val(month);
    }



    $('#ddlYear, #ddlMonth').change(loadData);
    loadData();

    function loadData() {
        var year = $('#ddlYear').val();
        var month = $('#ddlMonth').val();
        $.getJSON('/Budget/GetBudgetVerificationData', { year: year, month: month }, function (data) {
            // Totals
            $('#totalIn').text(data.TotalIn.toLocaleString());
            $('#totalCompareIn').text(data.TotalIn.toLocaleString());
            $('#totalOut').text(data.TotalOut.toLocaleString());
            $('#totalNow').text(data.TotalNow.toLocaleString());

            let out_Now = parseFloat(data.TotalOut) + parseFloat(data.TotalNow);

            $('#totalCompare').text(out_Now.toLocaleString());

            // M IN
            var inRows = '';
            $.each(data.InList, function (i, item) {
                inRows += `<tr><td>${item.AmountIn.toLocaleString()}</td><td>${item.DetailsIn}</td></tr>`;
            });
            $('#tblMin tbody').html(inRows);

            // M Out
            var outRows = '';
            $.each(data.OutList, function (i, item) {
                outRows += `<tr><td>${item.AmountOut.toLocaleString()}</td><td></td></tr>`;
            });
            $('#tblMout tbody').html(outRows);

            // M Now
            var nowRows = '';
            $.each(data.NowList, function (i, item) {
                nowRows += `<tr><td>${item.AmountNow.toLocaleString()}</td><td>${item.DetailsNow}</td></tr>`;
            });
            $('#tblMnow tbody').html(nowRows);
        });
    }

   
});