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

    function formatDateForDisplay(dateStr) {
        if (!dateStr) return '';

        // Extract milliseconds from /Date(1454178600000)/
        const match = /\/Date\((\d+)\)\//.exec(dateStr);
        if (!match) return '';

        const d = new Date(parseInt(match[1], 10));
        if (isNaN(d)) return '';

        // Format as yyyy-MM-dd
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function loadData() {
        var year = $('#ddlYear').val();
        var month = $('#ddlMonth').val();
        $.getJSON('/Budget/GetBudgetVerificationData',
            { year: year, month: month },
            function (data) {
            // Totals
        

            $('#totalIn').text(data.TotalIn.toLocaleString());
            $('#totalCompareIn').text(data.TotalIn.toLocaleString() + '  _ month beginning');
            $('#totalOut').text(data.TotalOut.toLocaleString());
            $('#totalNow').text(data.TotalNow.toLocaleString());

            //card:rem salary
            $('#cardRem_salary').text(data.InList.find(item => item.DetailsIn === "Salary Amount").AmountIn.toLocaleString());

            //card:rem assign out
            $('#cardRem_speand').text(data.TotalOut.toLocaleString());
            //calc of remain
            let calcRemain = parseFloat(data.InList.find(item => item.DetailsIn === "Salary Amount").AmountIn) - parseFloat(data.TotalOut);
            $('#cardRem_remain').text(calcRemain.toLocaleString());


            let out_Now = parseFloat(data.TotalOut) + parseFloat(data.TotalNow);
                $('#totalCompare').text(out_Now.toLocaleString() + ' _ having, spending');

            //difference between #totalCompareIn - #totalCompare= ?
            let difference = parseFloat(data.TotalIn) - parseFloat(out_Now);
            $('#IdDifference').text(difference.toLocaleString());
            if (difference > 0) {
                $('#idSpanPVE').text(difference.toLocaleString());
            }
            else if (difference < 0) {
                $('#idSpanNVE').text(difference.toLocaleString());
            }
            else {
                $('#idSpanPVE').text('0');
                $('#idSpanNVE').text('0');
            }

            // Compare and set card color
            var compareIn = parseFloat(data.TotalIn).toFixed(2);
            var compare = out_Now.toFixed(2);
            var $summaryCard = $('.summary-card.bg-success-cstm');
            if ($summaryCard.length == 0) {
                $summaryCard = $('.summary-card.bg-danger-cstm');
            }


            //var $icon = $('.fa-solid.summary-icon');
            //if (compareIn === compare) {
            //    $summaryCard.removeClass('bg-danger').addClass('bg-success');
            //    //nikili balanced
            //    //nikiti
            //    if ($icon.hasClass('fa-scale-unbalanced')) {
            //        $icon.removeClass('fa-scale-unbalanced').addClass('fa-scale-balanced');
            //    } else {
            //        $icon.addClass('fa-scale-balanced');
            //    }
            //} else {
            //    $summaryCard.removeClass('bg-success').addClass('bg-danger');
            //    //nikiti
            //    if ($icon.hasClass('fa-scale-balanced')) {
            //        $icon.removeClass('fa-scale-balanced').addClass('fa-scale-unbalanced');
            //    } else {
            //        $icon.addClass('fa-scale-unbalanced');
            //    }
            //}

            var $icon = $('#idNikiti');

            if (compareIn === compare) {
                $summaryCard.removeClass('bg-danger-cstm').addClass('bg-success-cstm');

                // balanced
                if ($icon.hasClass('fa-scale-unbalanced')) {
                    $icon.removeClass('fa-scale-unbalanced')
                         .addClass('fa-scale-balanced');
                } else {
                    $icon.addClass('fa-scale-balanced');
                }

            } else {
                $summaryCard.removeClass('bg-success-cstm').addClass('bg-danger-cstm');

                // unbalanced
                if ($icon.hasClass('fa-scale-balanced')) {
                    $icon.removeClass('fa-scale-balanced')
                         .addClass('fa-scale-unbalanced');
                } else {
                    $icon.addClass('fa-scale-unbalanced');
                }
            }






            // M IN
            var inRows = '';
            $.each(data.InList, function (i, item) {
                inRows += `<tr data-id="${item.IdIn}"><td>${item.DateIn ? formatDateForDisplay(item.DateIn) : ''}</td><td>${item.AmountIn.toLocaleString()}</td><td>${item.DetailsIn || ''}</td><td><button class="btn btn-primary btn-xs edit-in new-edit-btn"  title="Edit"><i class="fa fa-pencil"></i></button> <button class="btn btn-danger btn-xs delete-in new-delete-btn" title="Delete"><i class="fa fa-trash"></i></button></td></tr>`;
            });
            $('#tblMin tbody').html(inRows);

            // M Now
            var nowRows = '';
            $.each(data.NowList, function (i, item) {
                nowRows += `<tr data-id="${item.IdNow}"><td>${item.DateNow ? formatDateForDisplay(item.DateNow) : ''}</td><td>${item.AmountNow.toLocaleString()}</td><td>${item.DetailsNow || ''}</td><td><button class="btn btn-primary btn-xs edit-now new-edit-btn"  title="Edit"><i class="fa fa-pencil"></i></button> <button class="btn btn-danger btn-xs delete-now new-delete-btn" title="Delete"><i class="fa fa-trash"></i></button></td></tr>`;
            });
            // Delete for M IN
            $('#tblMin').on('click', '.delete-in', function () {
                var $tr = $(this).closest('tr');
                var id = $tr.data('id');
                if (confirm('Are you sure you want to delete this M IN entry?')) {
                    $.post('/Budget/DeleteBudgetVerificationIn', { idIn: id }, function (resp) {
                        loadData();
                    });
                }
            });

            // Delete for M Now
            $('#tblMnow').on('click', '.delete-now', function () {
                var $tr = $(this).closest('tr');
                var id = $tr.data('id');
                if (confirm('Are you sure you want to delete this M Now entry?')) {
                    $.post('/Budget/DeleteBudgetVerificationNow', { idNow: id }, function (resp) {
                        loadData();
                    });
                }
            });
            // Cancel for M Now (delegated, like M IN)
            $('#tblMnow').on('click', '.cancel-edit', function () {
                loadData();
            });
            $('#tblMnow tbody').html(nowRows);
        });
    }

    // Handle add for M IN
    $('#addInBtn').on('click', function () {
        var model = {
            DateIn: $('#inDateAdd').val() || null,
            AmountIn: parseFloat($('#inAmountAdd').val()) || 0,
            DetailsIn: $('#inDetailsAdd').val(),
            YearIn: parseInt($('#ddlYear').val()),
            MonthIn: parseInt($('#ddlMonth').val())
        };
        $.post('/Budget/InsertBudgetVerificationIn', model, function (resp) {
            if (resp.Id && resp.Id > 0) {
                $('#inDateAdd').val('');
                $('#inAmountAdd').val('');
                $('#inDetailsAdd').val('');
                loadData();
            }
        });
    });

    // Handle add for M Now
    $('#addNowBtn').on('click', function () {
        var model = {
            DateNow: $('#nowDateAdd').val() || null,
            AmountNow: parseFloat($('#nowAmountAdd').val()) || 0,
            DetailsNow: $('#nowDetailsAdd').val(),
            YearNow: parseInt($('#ddlYear').val()),
            MonthNow: parseInt($('#ddlMonth').val())
        };
        $.post('/Budget/InsertBudgetVerificationNow', model, function (resp) {
            if (resp.Id && resp.Id > 0) {
                $('#nowDateAdd').val('');
                $('#nowAmountAdd').val('');
                $('#nowDetailsAdd').val('');
                loadData();
            }
        });
    });

    // Edit / Save / Cancel for M IN (delegated)
    $('#tblMin').on('click', '.edit-in', function () {
        var $btn = $(this);
        var $tr = $btn.closest('tr');
        var date = $tr.find('td').eq(0).text().trim();
        var amount = $tr.find('td').eq(1).text().replace(/,/g, '').trim();
        var details = $tr.find('td').eq(2).text().trim();

        $tr.find('td').eq(0).html(`<input type="date" class="form-control form-control-sm edit-date" value="${formatDateForInput(date)}" />`);
        $tr.find('td').eq(1).html(`<input type="number" step="0.01" class="form-control form-control-sm edit-amount" value="${amount}" />`);
        $tr.find('td').eq(2).html(`<input type="text" class="form-control form-control-sm edit-details" value="${details}" />`);
        $btn.removeClass('edit-in btn-primary').addClass('save-in btn-success btn-xs').html('<i class="fa fa-floppy-disk"></i>').attr('title', 'Save').css({ 'padding': '2px 8px', 'font-size': '11px' });
        $btn.after(`<button class="btn btn-secondary btn-xs cancel-edit" style="margin-left:5px;padding:2px 8px;font-size:11px;" title="Cancel"><i class="fa fa-xmark"></i></button>`);
    });

    $('#tblMin').on('click', '.cancel-edit', function () {
        loadData();
    });

    $('#tblMin').on('click', '.save-in', function () {
        var $btn = $(this);
        var $tr = $btn.closest('tr');
        var id = $tr.data('id');
        var model = {
            IdIn: id,
            DateIn: $tr.find('.edit-date').val() || null,
            AmountIn: parseFloat($tr.find('.edit-amount').val()) || 0,
            DetailsIn: $tr.find('.edit-details').val(),
            YearIn: parseInt($('#ddlYear').val()),
            MonthIn: parseInt($('#ddlMonth').val())
        };
        $.post('/Budget/UpdateBudgetVerificationIn', model, function (resp) {
            loadData();
        });
    });

    // Edit / Save / Cancel for M Now (delegated)
    $('#tblMnow').on('click', '.edit-now', function () {
        var $btn = $(this);
        var $tr = $btn.closest('tr');
        var date = $tr.find('td').eq(0).text().trim();
        var amount = $tr.find('td').eq(1).text().replace(/,/g, '').trim();
        var details = $tr.find('td').eq(2).text().trim();

        $tr.find('td').eq(0).html(`<input type="date" class="form-control form-control-sm edit-date" value="${formatDateForInput(date)}" />`);
        $tr.find('td').eq(1).html(`<input type="number" step="0.01" class="form-control form-control-sm edit-amount" value="${amount}" />`);
        $tr.find('td').eq(2).html(`<input type="text" class="form-control form-control-sm edit-details" value="${details}" />`);
        $btn.removeClass('edit-now btn-primary').addClass('save-now btn-success btn-xs').html('<i class="fa fa-floppy-disk"></i>').attr('title', 'Save').css({ 'padding': '2px 8px', 'font-size': '11px' });
        $btn.after(`<button class="btn btn-secondary btn-xs cancel-edit" style="margin-left:5px;padding:2px 8px;font-size:11px;" title="Cancel"><i class="fa fa-xmark"></i></button>`);
    });

    $('#tblMnow').on('click', '.save-now', function () {
        var $btn = $(this);
        var $tr = $btn.closest('tr');
        var id = $tr.data('id');
        var model = {
            IdNow: id,
            DateNow: $tr.find('.edit-date').val() || null,
            AmountNow: parseFloat($tr.find('.edit-amount').val()) || 0,
            DetailsNow: $tr.find('.edit-details').val(),
            YearNow: parseInt($('#ddlYear').val()),
            MonthNow: parseInt($('#ddlMonth').val())
        };
        $.post('/Budget/UpdateBudgetVerificationNow', model, function (resp) {
            loadData();
        });
    });


});