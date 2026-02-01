$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    let editingId = null;
    setThisYearMonth();
    bindData();

    $('#btnSaveBudget').click(function () {
        if (validateBudget()) {
            if (editingId) {
                updateBudget(editingId);
            } else {
                insertBudget();
            }
        }
    });

    $('#ddlYear, #ddlMonth').change(function () {
        bindData();
    });

    function validateBudget() {
        var year = $('#ddlYear').val();
        var month = $('#ddlMonth').val();
        var spendDate = $('#txtDate').val();
        var amount = $('#txtAmt').val();
        var details = $('#txtDetails').val();
        if (year === '0' || year === '') {
            alert('Please select a Year');
            $('#ddlYear').focus();
            return false;
        }
        if (month === '0' || month === '') {
            alert('Please select a Month');
            $('#ddlMonth').focus();
            return false;
        }
        if (spendDate.trim() === '') {
            alert('Please select a Spend Date');
            $('#txtDate').focus();
            return false;
        }
        if (amount.trim() === '' || isNaN(amount) || parseFloat(amount) <= 0) {
            alert('Please enter a valid Amount');
            $('#txtAmt').focus();
            return false;
        }
        if (details.trim() === '') {
            alert('Please enter Details');
            $('#txtDetails').focus();
            return false;
        }
        return true;
    }

    function insertBudget() {
        let obj = {
            Year: parseInt($('#ddlYear').val()),
            Month: parseInt($('#ddlMonth').val()),
            SpendDate: $('#txtDate').val(),
            Amount: parseFloat($('#txtAmt').val()),
            Details: $('#txtDetails').val(),
            G1: null, G2: null, G3: null, G4: null
        };
        $.ajax({
            url: '/Budget/InsertBudget',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(obj),
            dataType: 'json',
            success: function (rowIffected) {
                if (rowIffected > 0) {
                    showMessage('Saved');
                    clearForm();
                    bindData();
                } else {
                    alert('Error: Failed to insert budget record');
                }
            },
            error: function (xhr, status, error) {
                alert('Error occurred: ' + error);
            }
        });
    }

    function updateBudget(id) {
        let obj = {
            Id: id,
            Year: parseInt($('#ddlYear').val()),
            Month: parseInt($('#ddlMonth').val()),
            SpendDate: $('#txtDate').val(),
            Amount: parseFloat($('#txtAmt').val()),
            Details: $('#txtDetails').val(),
            G1: null, G2: null, G3: null, G4: null
        };
        $.ajax({
            url: '/Budget/UpdateBudgetById',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(obj),
            dataType: 'json',
            success: function (rowIffected) {
                if (rowIffected > 0) {
                    showMessage('Updated');
                    clearForm();
                    editingId = null;
                    $('#btnSaveBudget').text('Save');
                    bindData();
                } else {
                    alert('Error: Failed to update budget record');
                }
            },
            error: function (xhr, status, error) {
                alert('Error occurred: ' + error);
            }
        });
    }

    function bindData() {
        var year = parseInt($('#ddlYear').val(), 10) || 0;
        var month = parseInt($('#ddlMonth').val(), 10) || 0;
        if (year === 0 || month === 0) {
            $('#gridTableBudgetMobile tbody').html('<tr><td colspan="4" style="text-align:center;">Select Year and Month</td></tr>');
            return;
        }
        $.ajax({
            url: '/Budget/GetAllBudgetFromTo',
            type: 'GET',
            data: { year: year, month: month },
            dataType: 'json',
            success: function (res) {
                var $tbody = $('#gridTableBudgetMobile tbody');
                $tbody.empty();
                if (!res || !res.length) {
                    $tbody.html('<tr><td colspan="4" style="text-align:center;">No records found</td></tr>');
                    return;
                }
                $.each(res, function (i, item) {
                    var dateStr = formatDate(item.SpendDate);
                    var row = '<tr>' +
                        '<td>' +
                        '<button class="btn-edit" data-id="' + item.Id + '">Edit</button>' +
                        '<button class="btn-delete" data-id="' + item.Id + '">Del</button>' +
                        '</td>' +
                        '<td>' + dateStr + '</td>' +
                        '<td>' + Intl.NumberFormat('en-IN').format(item.Amount) + '</td>' +
                        '<td>' + escapeHtml(item.Details) + '</td>' +
                        '</tr>';
                    $tbody.append(row);
                });
            },
            error: function (xhr, status, err) {
                $('#gridTableBudgetMobile tbody').html('<tr><td colspan="4" style="text-align:center;">Failed to load data</td></tr>');
            }
        });
    }

    // Edit button click
    $(document).on('click', '.btn-edit', function () {
        var id = $(this).data('id');
        $.ajax({
            url: '/Budget/GetBudgetById',
            type: 'GET',
            data: { id: id },
            dataType: 'json',
            success: function (item) {
                if (item) {
                    editingId = item.Id;
                    $('#ddlYear').val(item.Year);
                    $('#ddlMonth').val(item.Month);
                    $('#txtDate').val(formatDateForInput(item.SpendDate));
                    $('#txtAmt').val(item.Amount);
                    $('#txtDetails').val(item.Details);
                    $('#btnSaveBudget').text('Update');
                }
            }
        });
    });

    // Delete button click
    $(document).on('click', '.btn-delete', function () {
        var id = $(this).data('id');
        if (confirm('Delete this record?')) {
            $.ajax({
                url: '/Budget/DeleteBudgetById',
                type: 'POST',
                data: { id: id },
                dataType: 'json',
                success: function (res) {
                    if (res && res.Success) {
                        showMessage('Deleted');
                        bindData();
                    } else {
                        alert('Failed to delete');
                    }
                }
            });
        }
    });

    // Save on Enter key press
    $(document).on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // prevent form submit / page reload

            if (validateBudget()) {
                if (editingId) {
                    updateBudget(editingId);
                } else {
                    insertBudget();
                }
            }
        }
    });

    function clearForm() {
        $('#txtDate').val('');
        $('#txtAmt').val('');
        $('#txtDetails').val('');
        editingId = null;
        $('#btnSaveBudget').text('Save');
    }

    function showMessage(msg) {
        var $msg = $('<div id="tempMessage">' + msg + '</div>');
        $('body').append($msg);
        setTimeout(function () {
            $msg.fadeOut(300, function () { $(this).remove(); });
        }, 1200);
    }

    function setThisYearMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        $('#ddlYear').val(year);
        $('#ddlMonth').val(month);
    }

    function formatDate(jsonDate) {
        if (!jsonDate) return '';
        var ticks = parseInt(jsonDate.replace(/\/Date\((\d+)\)\//, '$1'));
        var date = new Date(ticks);
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        return (day < 10 ? '0' : '') + day + '/' + (month < 10 ? '0' : '') + month + '/' + year;
    }
    function formatDateForInput(jsonDate) {
        if (!jsonDate) return '';
        var ticks = parseInt(jsonDate.replace(/\/Date\((\d+)\)\//, '$1'));
        var date = new Date(ticks);
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        return date.getFullYear() + '-' + month + '-' + day;
    }
    function escapeHtml(text) {
        return $('<div/>').text(text).html();
    }
});
