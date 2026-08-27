$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    var birthdayTable = null;

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

    function formatBirthdayDayMonth(d) {
        if (!d) return '';
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return ('0' + d.getDate()).slice(-2) + '-' + months[d.getMonth()];
    }

    function birthdaySortValue(d) {
        return d ? (d.getMonth() + 1) * 100 + d.getDate() : 9999;
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
                var dtText = dt ? formatBirthdayDayMonth(dt) : 'Invalid Date';
                var dtInput = dt ? toInputDateFormat(dt) : '';

                html += '<tr>';
                html += '<td>' + (i+1) + '</td>';
                html += '<td>' + escapeHtml(it.Name) + '</td>';
                html += '<td data-order="' + birthdaySortValue(dt) + '">' + escapeHtml(dtText) + '</td>';
                html += '<td>' + (it.IsActive ? 'Yes' : 'No') + '</td>';
                html += '<td>';
                html += '<a href="#" class="btn btn-sm btn-warning btn-edit" data-id="' + it.Id + '" data-name="' + escapeHtml(it.Name) + '" data-dob="' + dtInput + '" data-active="' + (it.IsActive ? 1 : 0) + '">Edit</a> ';
                html += '<a href="#" class="btn btn-sm btn-danger btn-delete" data-id="' + it.Id + '">Delete</a>';
                html += '</td>';
                html += '</tr>';
            });

            if ($.fn.DataTable) {
                if (!birthdayTable) {
                    $('#birthdayTable tbody').html(html);
                    birthdayTable = $('#birthdayTable').DataTable({
                        order: [[2, 'asc']],
                        paging: false,
                        info: false,
                        searching: true,
                        dom: 'rt'
                    });
                    $('#birthdayGridSearch').on('input', function () {
                        birthdayTable.search(this.value).draw();
                    });
                } else {
                    birthdayTable.clear();
                    $('<tbody>' + html + '</tbody>').children().each(function () {
                        birthdayTable.row.add(this);
                    });
                    birthdayTable.draw(false);
                }
            } else {
                $('#birthdayTable tbody').html(html);
            }
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
        $.when(
            $.getJSON('/Birthday/GetByMonth', { year: year, month: month }),
            $.getJSON('/Birthday/GetAll')
        ).done(function (monthResponse, allResponse) {
            var list = monthResponse[0] || [];
            var allBirthdays = allResponse[0] || [];
            var container = $(containerSelector);
            container.empty();
            var first = new Date(year, month-1, 1);
            var daysInMonth = new Date(year, month, 0).getDate();
            var monthName = first.toLocaleString('default', { month: 'long' });

            var header = '<div class="calendar-header">' +
                '<div class="calendar-nav">' +
                '<button id="prevMonth" class="btn-glass" aria-label="Previous month">&#9664;</button>' +
                '<span class="current-month-display">' + monthName + ' ' + year + '</span>' +
                '<button id="nextMonth" class="btn-glass" aria-label="Next month">&#9654;</button>' +
                '</div>' +
                '<div class="stats-container">' +
                '<div class="stat-pill pill-month"><span class="stat-label">THIS MONTH</span><span class="stat-badge" id="month-bday-count">' + list.length + '</span></div>' +
                '<div class="stat-pill pill-total"><span class="stat-label">TOTAL BIRTHDAYS</span><span class="stat-badge" id="total-bday-count">' + allBirthdays.length + '</span></div>' +
                '</div>' +
                '</div>';

            var weekdays = '<div class="weekdays-grid">' +
                '<div class="weekday">Sun</div><div class="weekday">Mon</div><div class="weekday">Tue</div>' +
                '<div class="weekday">Wed</div><div class="weekday">Thu</div><div class="weekday">Fri</div><div class="weekday">Sat</div>' +
                '</div>';
            var rows = '<div class="calendar-rows-wrapper" id="calendar-rows-container">';

            var startDay = first.getDay();
            var curDay = 1;
            var cells = [];
            for (var empty = 0; empty < startDay; empty++) {
                cells.push({ isEmpty: true });
            }
            for (; curDay <= daysInMonth; curDay++) {
                var todays = list.filter(function (item) {
                    var date = parseNetDate(item.DateOfBirth);
                    return date && date.getDate() === curDay;
                });
                var now = new Date();
                cells.push({
                    isEmpty: false,
                    day: curDay,
                    birthdays: todays,
                    isToday: now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === curDay
                });
            }
            while (cells.length % 7 !== 0) {
                cells.push({ isEmpty: true });
            }

            for (var r = 0; r < cells.length / 7; r++) {
                var week = cells.slice(r * 7, (r + 1) * 7);
                var maxBirthdays = week.reduce(function (max, cell) {
                    return Math.max(max, cell.isEmpty ? 0 : cell.birthdays.length);
                }, 0);
                rows += '<div class="calendar-week-row row-density-' + Math.min(maxBirthdays, 3) + '">';
                week.forEach(function (cell) {
                    if (cell.isEmpty) {
                        rows += '<div class="day-cell empty"></div>';
                        return;
                    }
                    var classes = 'day-cell' + (cell.isToday ? ' is-today' : '') + (cell.birthdays.length ? ' has-birthday' : '');
                    var birthdayTags = cell.birthdays.map(function (item) {
                        return '<div class="bday-tag"><span class="cake-icon">&#127874;</span><span>' + escapeHtml(item.Name) + '</span></div>';
                    }).join('');
                    rows += '<div class="' + classes + '"><span class="day-number">' + cell.day + '</span>' + birthdayTags + '</div>';
                });
                rows += '</div>';
            }
            rows += '</div>';

            container.append(header);
            container.append(weekdays);
            container.append(rows);

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