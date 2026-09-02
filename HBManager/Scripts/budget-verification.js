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

        const match = /\/Date\((\d+)\)\//.exec(dateStr);
        if (match) {
            const d = new Date(parseInt(match[1], 10));
            if (isNaN(d)) return '';

            return formatDatabaseDate(d);
        }

        const valueMatch = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(dateStr);
        const displayHours = valueMatch && valueMatch[6]
            ? convertTo24Hour(+valueMatch[4], valueMatch[6])
            : valueMatch && +valueMatch[4];
        return valueMatch
            ? formatDateParts(+valueMatch[1], +valueMatch[2], +valueMatch[3], displayHours, +valueMatch[5])
            : '';
    }

    function formatDateParts(year, month, day, hours, minutes) {
        const monthText = String(month).padStart(2, '0');
        const dayText = String(day).padStart(2, '0');
        const hourText = String(hours % 12 || 12);
        const minuteText = String(minutes).padStart(2, '0');
        const amPm = hours >= 12 ? 'pm' : 'am';
        return `${year}-${monthText}-${dayText} ${hourText}:${minuteText} ${amPm}`;
    }

    function convertTo24Hour(hours, amPm) {
        const normalizedHours = hours % 12;
        return normalizedHours + (amPm.toLowerCase() === 'pm' ? 12 : 0);
    }

    function getDatabaseDateParts(date) {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).formatToParts(date).reduce(function (result, part) {
            result[part.type] = part.value;
            return result;
        }, {});

        return {
            year: +parts.year,
            month: +parts.month,
            day: +parts.day,
            hours: +parts.hour,
            minutes: +parts.minute
        };
    }

    function formatDatabaseDate(date) {
        const parts = getDatabaseDateParts(date);
        return formatDateParts(parts.year, parts.month, parts.day, parts.hours, parts.minutes);
    }

    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        const match = /\/Date\((\d+)\)\//.exec(dateStr);
        if (match) {
            const d = new Date(parseInt(match[1], 10));
            if (isNaN(d)) return '';
            const parts = getDatabaseDateParts(d);
            return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}`;
        }

        const valueMatch = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(dateStr);
        if (!valueMatch) return '';
        const yyyy = valueMatch[1];
        const mm = valueMatch[2];
        const dd = valueMatch[3];
        const hours = valueMatch[6]
            ? String(convertTo24Hour(+valueMatch[4], valueMatch[6])).padStart(2, '0')
            : valueMatch[4].padStart(2, '0');
        const minutes = valueMatch[5];
        return `${yyyy}-${mm}-${dd}T${hours}:${minutes}`;
    }

    function getTimeEditorHtml(dateStr) {
        var inputValue = formatDateForInput(dateStr);
        var match = inputValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
        if (!match) return '';

        var hour24 = parseInt(match[4], 10);
        var hour12 = String(hour24 % 12 || 12).padStart(2, '0');
        var minute = match[5];
        var amPm = hour24 >= 12 ? 'pm' : 'am';
        var hours = '';
        var minutes = '';
        for (var hour = 1; hour <= 12; hour++) {
            var hourText = String(hour).padStart(2, '0');
            hours += `<option value="${hourText}" ${hourText === hour12 ? 'selected' : ''}>${hourText}</option>`;
        }
        for (var minuteValue = 0; minuteValue < 60; minuteValue++) {
            var minuteText = String(minuteValue).padStart(2, '0');
            minutes += `<option value="${minuteText}" ${minuteText === minute ? 'selected' : ''}>${minuteText}</option>`;
        }

        return `<div class="verification-date-editor">
            <input type="date" class="form-control form-control-sm edit-date" value="${match[1]}-${match[2]}-${match[3]}" />
            <select class="form-control form-control-sm edit-hour">${hours}</select>
            <span>:</span>
            <select class="form-control form-control-sm edit-minute">${minutes}</select>
            <select class="form-control form-control-sm edit-ampm"><option ${amPm === 'am' ? 'selected' : ''}>am</option><option ${amPm === 'pm' ? 'selected' : ''}>pm</option></select>
        </div>`;
    }

    function getEditedDate($row) {
        var date = $row.find('.edit-date').val();
        var hour = parseInt($row.find('.edit-hour').val(), 10);
        var minute = $row.find('.edit-minute').val();
        var hour24 = hour % 12 + ($row.find('.edit-ampm').val() === 'pm' ? 12 : 0);
        return date ? `${date}T${String(hour24).padStart(2, '0')}:${minute}` : null;
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
                inRows += `<tr data-id="${item.IdIn}" data-date="${item.DateIn || ''}"><td>${item.DateIn ? formatDateForDisplay(item.DateIn) : ''}</td><td>${item.AmountIn.toLocaleString()}</td><td>${item.DetailsIn || ''}</td><td><button class="btn btn-primary btn-xs edit-in new-edit-btn"  title="Edit"><i class="fa fa-pencil"></i></button> <button class="btn btn-danger btn-xs delete-in new-delete-btn" title="Delete"><i class="fa fa-trash"></i></button></td></tr>`;
            });
            $('#tblMin tbody').html(inRows);

            // M Now
            var nowRows = '';
            $.each(data.NowList, function (i, item) {
                nowRows += `<tr data-id="${item.IdNow}" data-date="${item.DateNow || ''}"><td>${item.DateNow ? formatDateForDisplay(item.DateNow) : ''}</td><td>${item.AmountNow.toLocaleString()}</td><td>${item.DetailsNow || ''}</td><td><button class="btn btn-primary btn-xs edit-now new-edit-btn"  title="Edit"><i class="fa fa-pencil"></i></button> <button class="btn btn-danger btn-xs delete-now new-delete-btn" title="Delete"><i class="fa fa-trash"></i></button></td></tr>`;
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

    function getModalDate(prefix) {
        var date = $('#' + prefix + 'Date').val();
        var hour = parseInt($('#' + prefix + 'Hour').val(), 10);
        var minute = $('#' + prefix + 'Minute').val();
        var hour24 = hour % 12 + ($('#' + prefix + 'AmPm').val() === 'pm' ? 12 : 0);
        return date ? `${date}T${String(hour24).padStart(2, '0')}:${minute}` : null;
    }

    function populateEditModal(prefix, id, date, amount, details) {
        var inputValue = formatDateForInput(date);
        var match = inputValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
        if (!match) return false;
        var hour24 = parseInt(match[4], 10);
        $('#' + prefix + 'Id').val(id);
        $('#' + prefix + 'Date').val(`${match[1]}-${match[2]}-${match[3]}`);
        $('#' + prefix + 'Hour').val(String(hour24 % 12 || 12).padStart(2, '0'));
        $('#' + prefix + 'Minute').val(match[5]);
        $('#' + prefix + 'AmPm').val(hour24 >= 12 ? 'pm' : 'am');
        $('#' + prefix + 'Amount').val(amount);
        $('#' + prefix + 'Details').val(details);
        return true;
    }

    $('.modal-date-editor').each(function () {
        var prefix = $(this).data('prefix');
        for (var hour = 1; hour <= 12; hour++) {
            var hourText = String(hour).padStart(2, '0');
            $('#' + prefix + 'Hour').append($('<option>').val(hourText).text(hourText));
        }
        for (var minute = 0; minute < 60; minute++) {
            var minuteText = String(minute).padStart(2, '0');
            $('#' + prefix + 'Minute').append($('<option>').val(minuteText).text(minuteText));
        }
    });

    $('#tblMin').on('click', '.edit-in', function () {
        var $tr = $(this).closest('tr');
        if (populateEditModal('editMin', $tr.data('id'), $tr.data('date'), $tr.find('td').eq(1).text().replace(/,/g, '').trim(), $tr.find('td').eq(2).text().trim())) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editMinModal')).show();
        }
    });

    $('#saveMinModal').on('click', function () {
        $.post('/Budget/UpdateBudgetVerificationIn', {
            IdIn: $('#editMinId').val(), DateIn: getModalDate('editMin'), AmountIn: parseFloat($('#editMinAmount').val()) || 0,
            DetailsIn: $('#editMinDetails').val(), YearIn: parseInt($('#ddlYear').val()), MonthIn: parseInt($('#ddlMonth').val())
        }, function () {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editMinModal')).hide();
            loadData();
        });
    });

    $('#tblMnow').on('click', '.edit-now', function () {
        var $tr = $(this).closest('tr');
        if (populateEditModal('editNow', $tr.data('id'), $tr.data('date'), $tr.find('td').eq(1).text().replace(/,/g, '').trim(), $tr.find('td').eq(2).text().trim())) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editNowModal')).show();
        }
    });

    $('#saveNowModal').on('click', function () {
        $.post('/Budget/UpdateBudgetVerificationNow', {
            IdNow: $('#editNowId').val(), DateNow: getModalDate('editNow'), AmountNow: parseFloat($('#editNowAmount').val()) || 0,
            DetailsNow: $('#editNowDetails').val(), YearNow: parseInt($('#ddlYear').val()), MonthNow: parseInt($('#ddlMonth').val())
        }, function () {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editNowModal')).hide();
            loadData();
        });
    });


});