$(function () {
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function loadRepeatStatus() {
        $.getJSON('/RepeatStatus/GetRepeatStatus').done(function (result) {
            var columns = result.columns || [], header = '<tr><th>G1</th><th>G2</th><th>G3</th><th>G4</th>';
            $.each(columns, function (_, column) { header += '<th>' + formatMonthHeader(column) + '</th>'; });
            $('#repeatStatusHead').html(header + '</tr>');
            var body = '';
            $.each(result.rows || [], function (_, row) {
                body += '<tr><td class="group-cell">' + display(row.G1Name) + '</td><td class="group-cell">' + display(row.G2Name) + '</td><td class="group-cell">' + display(row.G3Name) + '</td><td class="group-cell">' + display(row.G4Name) + '</td>';
                $.each(columns, function (_, column) {
                    var parts = column.split('-');
                    var completed = row.completed && row.completed.indexOf(column) >= 0;
                    body += '<td class="repeat-status-amount-cell' + (completed ? ' repeat-status-completed' : '') + '" data-year="' + parts[0] + '" data-month="' + parseInt(parts[1], 10) + '" data-g1="' + display(row.G1Id) + '" data-g2="' + display(row.G2Id) + '" data-g3="' + display(row.G3Id) + '" data-g4="' + display(row.G4Id) + '">' + number(row.amounts[column]) + '</td>';
                });
                body += '</tr>';
            });
            $('#repeatStatusBody').html(body || '<tr><td class="repeat-status-empty" colspan="' + (columns.length + 4) + '">No repeat budget found.</td></tr>');
        }).fail(function () { $('#repeatStatusBody').html('<tr><td class="repeat-status-empty" colspan="20">Unable to load repeat status.</td></tr>'); });
    }
    function display(value) { return value === null || value === undefined ? '' : value; }
    function number(value) { return value === null || value === undefined || value === 0 ? '' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
    function formatMonthHeader(column) {
        var parts = column.split('-'), year = parts[0], month = parseInt(parts[1], 10);
        var previousMonth = month === 1 ? 12 : month - 1;
        return year.substring(2) + '/ ' + ('0' + month).slice(-2) + '/ ' + monthNames[previousMonth - 1];
    }
    $('#reloadRepeatStatus').on('click', loadRepeatStatus);
    $('#repeatStatusBody').on('click', 'tr', function () {
        $(this).addClass('repeat-status-selected').siblings().removeClass('repeat-status-selected');
    });
    $('#repeatStatusGrid').on('mouseenter', 'th, td', function () {
        var columnIndex = this.cellIndex + 1;
        $('#repeatStatusGrid th, #repeatStatusGrid td').removeClass('repeat-status-column-hover');
        $('#repeatStatusGrid th:nth-child(' + columnIndex + '), #repeatStatusGrid td:nth-child(' + columnIndex + ')').addClass('repeat-status-column-hover');
    }).on('mouseleave', function () {
        $('#repeatStatusGrid th, #repeatStatusGrid td').removeClass('repeat-status-column-hover');
    });
    $('#repeatStatusBody').on('dblclick', 'td.repeat-status-amount-cell', function (event) {
        event.stopPropagation();
        var cell = $(this), completed = cell.hasClass('repeat-status-completed');
        if (completed && !window.confirm('Are you sure you want to remove this status?')) return;
        var request = {
            year: parseInt(cell.data('year'), 10), month: parseInt(cell.data('month'), 10),
            g1: nullableInt(cell.data('g1')), g2: nullableInt(cell.data('g2')), g3: nullableInt(cell.data('g3')), g4: nullableInt(cell.data('g4')),
            completed: !completed
        };
        $.post('/RepeatStatus/SetRepeatStatus', request).done(function () {
            cell.toggleClass('repeat-status-completed', !completed);
        }).fail(function () { window.alert('Unable to save repeat status.'); });
    });
    function nullableInt(value) { return value === '' || value === undefined || value === null ? null : parseInt(value, 10); }
    loadRepeatStatus();
});