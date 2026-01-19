$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();


    function parseNetDate(d) {
        if (!d) return null;
        // handle /Date(1234567890)/
        if (typeof d === 'string') {
            var m = d.match(/\/Date\((\d+)(?:[-+]\d+)?\)\//);
            if (m) return new Date(parseInt(m[1], 10));
            var t = Date.parse(d);
            return isNaN(t) ? null : new Date(t);
        }
        if (typeof d === 'number') return new Date(d);
        if (d instanceof Date) return d;
        return null;
    }

    function formatDateDDMMMYYYY(d) {
        if (!d) return '';
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var day = d.getDate();
        var mon = months[d.getMonth()];
        var yr = d.getFullYear();
        return day + '-' + mon + '-' + yr;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&"'<>]/g, function (s) {
            return ({'&':'&amp;','"':'&quot;','\'':'&#39;','<':'&lt;','>':'&gt;'}[s]);
        });
    }

    function toInputDateFormat(d) {
        // yyyy-MM-dd
        if (!d) return '';
        var y = d.getFullYear();
        var m = ('0' + (d.getMonth()+1)).slice(-2);
        var dd = ('0' + d.getDate()).slice(-2);
        return y + '-' + m + '-' + dd;
    }

    function loadList() {
        $.getJSON('/Birthday/GetAll', function (list) {
            var html = '';
            $.each(list, function (i, it) {
                var dt = parseNetDate(it.DateOfBirth);
                var dtText = dt ? formatDateDDMMMYYYY(dt) : 'Invalid Date';
                var dtInput = dt ? toInputDateFormat(dt) : '';

                html += '<tr>';
                html += '<td>' + (i+1) + '</td>';
                html += '<td>' + escapeHtml(it.Name) + '</td>';
                html += '<td>' + dtText + '</td>';
                html += '<td>' + (it.IsActive ? 'Yes' : 'No') + '</td>';
                html += '<td>';
                html += '<a href="#" class="btn btn-sm btn-warning btn-edit" data-id="' + it.Id + '" data-name="' + escapeHtml(it.Name) + '" data-dob="' + dtInput + '" data-active="' + (it.IsActive ? 1 : 0) + '">Edit</a> ';
                html += '<a href="#" class="btn btn-sm btn-danger btn-delete" data-id="' + it.Id + '">Delete</a>';
                html += '</td>';
                html += '</tr>';
            });
            $('#birthdayTable tbody').html(html);
        });
    }

    function resetForm() {
        $('#hidenBirthdayID').val('');
        $('#txtName').val('');
        $('#txtDOB').val('');
        $('#chkIsActive').prop('checked', true);
        $('#btnSaveBirthday').show();
        $('#btnUpdateBirthday').hide();
        $('#btnCancelBirthday').hide();
    }

    $('#btnSaveBirthday').on('click', function () {
        var name = $('#txtName').val().trim();
        var dob = $('#txtDOB').val().trim();
        var isActive = $('#chkIsActive').is(':checked');

        if (!name) { alert('Name required'); $('#txtName').focus(); return; }
        if (!dob) { alert('Date required'); $('#txtDOB').focus(); return; }

        $.post('/Birthday/AddBirthday', { name: name, dateOfBirth: dob, isActive: isActive }, function (res) {
            if (res.success) {
                resetForm();
                loadList();
            } else {
                alert('Error: ' + (res.message || 'Failed'));
            }
        });
    });

    $('#btnUpdateBirthday').on('click', function () {
        var id = parseInt($('#hidenBirthdayID').val(), 10);
        var name = $('#txtName').val().trim();
        var dob = $('#txtDOB').val().trim();
        var isActive = $('#chkIsActive').is(':checked');

        if (!id) { alert('Invalid record'); return; }
        if (!name) { alert('Name required'); $('#txtName').focus(); return; }
        if (!dob) { alert('Date required'); $('#txtDOB').focus(); return; }

        $.post('/Birthday/UpdateBirthday', { id: id, name: name, dateOfBirth: dob, isActive: isActive }, function (res) {
            if (res.success) {
                resetForm();
                loadList();
                alert('Updated');
            } else {
                alert('Error: ' + (res.message || 'Failed'));
            }
        });
    });

    $('#btnCancelBirthday').on('click', function () { resetForm(); });

    // allow Enter key to submit (Save or Update)
    $('#txtName, #txtDOB').on('keydown', function (e) {
        if (e.key === 'Enter' || e.which === 13) {
            e.preventDefault();
            if ($('#btnUpdateBirthday').is(':visible')) {
                $('#btnUpdateBirthday').click();
            } else {
                $('#btnSaveBirthday').click();
            }
        }
    });

    // delegate edit & delete
    $('#birthdayTable').on('click', '.btn-edit', function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        var name = $(this).data('name');
        var dob = $(this).data('dob');
        var active = $(this).data('active') == 1;

        $('#hidenBirthdayID').val(id);
        $('#txtName').val(name);
        $('#txtDOB').val(dob);
        $('#chkIsActive').prop('checked', active);

        $('#btnSaveBirthday').hide();
        $('#btnUpdateBirthday').show();
        $('#btnCancelBirthday').show();
    });

    $('#birthdayTable').on('click', '.btn-delete', function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        if (!confirm('Delete record?')) return;
        $.post('/Birthday/DeleteBirthday', { id: id }, function (res) {
            if (res.success) {
                loadList();
                alert('Deleted');
            } else {
                alert('Error: ' + (res.message || 'Failed'));
            }
        });
    });

    // calendar for showBirthday page
    function renderCalendar(containerSelector, year, month) {
        $.getJSON('/Birthday/GetByMonth', { year: year, month: month }, function (list) {
            var container = $(containerSelector);
            container.empty();
            var first = new Date(year, month-1, 1);
            var daysInMonth = new Date(year, month, 0).getDate();

            var header = '<div class="calendar-header">' +
                '<button id="prevMonth" class="btn btn-sm btn-light">&lt;</button>' +
                '<span class="mx-3">' + first.toLocaleString('default', { month: 'long' }) + ' ' + year + '</span>' +
                '<button id="nextMonth" class="btn btn-sm btn-light">&gt;</button>' +
                '</div>';

            var table = '<table class="table table-bordered calendar-table"><thead><tr>' +
                '<th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>' +
                '</tr></thead><tbody>';

            var startDay = first.getDay();
            var curDay = 1;
            for (var r=0; r<6; r++) {
                table += '<tr>';
                for (var c=0; c<7; c++) {
                    if ((r===0 && c<startDay) || curDay>daysInMonth) {
                        table += '<td></td>';
                    } else {
                        var dateStr = year + '-' + ('0'+month).slice(-2) + '-' + ('0'+curDay).slice(-2);
                        // find names for this day
                        var todays = list.filter(x => {
                            var d = parseNetDate(x.DateOfBirth);
                            return d && d.getDate() === curDay; // month/year already filtered
                        });

                        // highlight today specially (bg-info + text-white). If today also has birthday(s), use today's highlight but still show names.
                        var nowDate = new Date();
                        var isToday = (nowDate.getFullYear() === year && (nowDate.getMonth() + 1) === month && nowDate.getDate() === curDay);

                        if (todays && todays.length) {
                            var names = todays.map(x => escapeHtml(x.Name)).join('<br/>');
                            var cls = isToday ? 'bg-info text-white' : 'bg-warning';
                            table += '<td class="' + cls + '"><strong>' + curDay + '</strong><br/>' + names + '</td>';
                        } else {
                            var cls = isToday ? 'bg-info text-white' : '';
                            table += '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + curDay + '</td>';
                        }
                        curDay++;
                    }
                }
                table += '</tr>';
                if (curDay>daysInMonth) break;
            }

            table += '</tbody></table>';

            container.append(header);
            container.append(table);

            // attach prev/next
            container.find('#prevMonth').on('click', function () {
                var prev = new Date(year, month-2, 1);
                renderCalendar(containerSelector, prev.getFullYear(), prev.getMonth()+1);
            });
            container.find('#nextMonth').on('click', function () {
                var next = new Date(year, month, 1);
                renderCalendar(containerSelector, next.getFullYear(), next.getMonth()+1);
            });
        });
    }

    // Expose small helper when this script runs on show page
    window.renderBirthdayCalendar = function (selector, year, month) {
        var now = new Date();
        var y = year || now.getFullYear();
        var m = month || (now.getMonth()+1);
        renderCalendar(selector, y, m);
    };

    // init list on index page
    if ($('#birthdayTable').length) {
        $('#chkIsActive').prop('checked', true);
        loadList();
    }
});