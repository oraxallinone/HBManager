
    var currentSortColumn = -1;
    var currentSortDirection = 'asc';
    var cachedStockList = [];
    var currentUpdateStock = null;

    $(document).ready(function () {
        loadPurchaseStockTracker();

        // Fullscreen toggle event for modal
        $('#btnToggleFullScreen').on('click', function () {
            var $dialog = $('#stockModalDialog');
            $dialog.toggleClass('modal-fullscreen-custom');

            var isFull = $dialog.hasClass('modal-fullscreen-custom');
            $('#fullScreenIcon').html(isFull ? '&#128471;' : '&#x26F6;');
        });

        // Reset fullscreen mode on modal close
        $('#stockDetailModal').on('hidden.bs.modal', function () {
            $('#stockModalDialog').removeClass('modal-fullscreen-custom');
            $('#fullScreenIcon').html('&#x26F6;');
        });

        $('#saveStockUpdate').on('click', function () {
            if (!currentUpdateStock || !currentUpdateStock.slno) return;

            var $button = $(this);
            $button.prop('disabled', true).text('Saving...');
            $.ajax({
                url: '/StockMarket/UpdatePurchaseStockTracker',
                type: 'POST',
                dataType: 'json',
                data: {
                    slno: currentUpdateStock.slno,
                    nsebse: $('#updateStockExchange').val(),
                    status: $('#updateStockStatus').val()
                },
                success: function (response) {
                    if (!response || !response.success) {
                        alert(response && response.message ? response.message : 'Unable to update stock.');
                        return;
                    }

                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('stockUpdateModal')).hide();
                    } else {
                        $('#stockUpdateModal').modal('hide');
                    }
                    loadPurchaseStockTracker();
                },
                error: function () {
                    alert('Unable to update stock.');
                },
                complete: function () {
                    $button.prop('disabled', false).text('Update');
                }
            });
        });
    });

    function loadPurchaseStockTracker() {
        $.ajax({
            url: '/StockMarket/GetPurchaseStockTrackerData',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                if (!response || !response.success) {
                    $('#purchaseStockTable tbody').html('<tr><td colspan="18" class="text-center text-danger">' + (response && response.message ? response.message : 'Unable to load data.') + '</td></tr>');
                    return;
                }

                cachedStockList = response.data || [];
                if (!cachedStockList.length) {
                    $('#purchaseStockTable tbody').html('<tr><td colspan="18" class="text-center text-muted">No stock records found.</td></tr>');
                    return;
                }

                var html = '';
                $.each(cachedStockList, function (index, item) {
                    var amountBg = item.amountChange >= 0 ? 'text-success' : 'text-danger';
                    var percentBg = item.percentChange >= 0 ? 'text-success' : 'text-danger';
                    var myChangeBg = item.myChangeAmount >= 0 ? 'text-success' : 'text-danger';
                    var stockName = item.stockName || '';
                    var exchange = (item.exchange || 'NSE').toUpperCase();
                    var exchangeClass = (exchange === 'BSE' ? 'bse' : 'nse');
                    var quantity = parseFloat(item.quantity || 0);
                    var purchasePrice = parseFloat(item.purchasePrice || 0);
                    var currentPrice = parseFloat(item.currentPrice || item.lastClosePrice || 0);
                    var isApiMissing = String(item.status || '') === '4';
                    var totalPurchaseAmount = quantity * purchasePrice;
                    var stockValuation = quantity * currentPrice;

                    html += '<tr>' +
                        '<td class="stock-details-column"><button type="button" class="stock-detail-btn" data-index="' + index + '" title="View 90 Day Details" aria-label="View 90 day details">&#8594;</button></td>' +
                        '<td>' + escapeHtml(formatStatusLabel(item.status)) + '</td>' +
                        '<td>' + escapeHtml(stockName) + '</td>' +
                        '<td class="text-center"><span class="stock-exchange-badge ' + exchangeClass + '">' + exchange + '</span></td>' +
                        '<td>' + formatDaysOrPlaceholder(item.ageOfStock) + '</td>' +
                        '<td>' + (item.purchaseDate || '') + '</td>' +
                        '<td>' + formatNumber(quantity) + '</td>' +
                        '<td>' + formatCurrency(purchasePrice) + '</td>' +
                        '<td>' + (isApiMissing ? '--' : formatCurrency(item.lastClosePrice)) + '</td>' +
                        '<td class="' + amountBg + '">' + (isApiMissing ? '--' : formatCurrency(item.amountChange)) + '</td>' +
                        '<td class="' + percentBg + '">' + (isApiMissing ? '--' : formatPercent(item.percentChange)) + '</td>' +
                        '<td class="' + myChangeBg + '">' + (isApiMissing ? '--' : formatSignedCurrency(item.myChangeAmount)) + '</td>' +
                        '<td>' + (isApiMissing ? '--' : formatCurrency(totalPurchaseAmount)) + '</td>' +
                        '<td>' + (isApiMissing ? '--' : formatCurrency(stockValuation)) + '</td>' +
                        '<td>' + (isApiMissing ? '--' : (item.increaseDays || 0)) + '</td>' +
                        '<td>' + (isApiMissing ? '--' : (item.decreaseDays || 0)) + '</td>' +
                        '<td class="stock-update-column"><button type="button" class="stock-update-btn" data-index="' + index + '" title="Update stock" aria-label="Update stock">&#8942;</button></td>' +
                        '</tr>';
                });

                $('#purchaseStockTable tbody').html(html);
                bindSearchFilters();
                bindColumnSort();

                $('.stock-detail-btn').off('click').on('click', function () {
                    var idx = parseInt($(this).attr('data-index'), 10);
                    var stock = cachedStockList[idx];
                    if (stock) {
                        openStockDetailPopup(stock);
                    }
                });

                $('.stock-update-btn').off('click').on('click', function () {
                    var idx = parseInt($(this).attr('data-index'), 10);
                    var stock = cachedStockList[idx];
                    if (stock) openStockUpdatePopup(stock);
                });
            },
            error: function () {
                $('#purchaseStockTable tbody').html('<tr><td colspan="18" class="text-center text-danger">Error loading data.</td></tr>');
            }
        });
    }

    function openStockUpdatePopup(item) {
        currentUpdateStock = item;
        $('#updateStockName').val(item.stockName || '');
        $('#updateStockExchange').val((item.exchangeCode || item.exchange || 'NSE').toUpperCase());
        $('#updateStockStatus').val(String(item.status || '1'));

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('stockUpdateModal')).show();
        } else {
            $('#stockUpdateModal').modal('show');
        }
    }

    function openStockDetailPopup(item) {
        var stockName = item.stockName || '';
        var exchange = (item.exchange || 'NSE').toUpperCase();
        var exchangeClass = (exchange === 'BSE' ? 'bse' : 'nse');
        var myChangeBg = item.myChangeAmount >= 0 ? 'text-success' : 'text-danger';
        var quantity = parseFloat(item.quantity || 0);
        var purchasePrice = parseFloat(item.purchasePrice || 0);
        var currentPrice = parseFloat(item.currentPrice || item.lastClosePrice || 0);
        var dailyChanges = item.dailyChanges || [];

        $('#stockDetailModalTitle').html(
            escapeHtml(stockName) + ' <span class="stock-exchange-badge ' + exchangeClass + '">' + exchange + '</span> - Last 90 Days History'
        );

        var modalBodyHtml = '<div class="row">' +
            '<div class="col-md-2 mb-3">' +
            '<div class="summary-card">' +
            '<h6 class="font-weight-bold text-dark border-bottom pb-2 mb-2">Position Summary</h6>' +
            '<strong>Purchase Date:</strong> ' + (item.purchaseDate || '-') + '<br>' +
            '<strong>Age:</strong> ' + (item.ageOfStock || 0) + ' days<br>' +
            '<strong>Purchase Price:</strong> ' + formatCurrency(purchasePrice) + '<br>' +
            '<strong>Quantity:</strong> ' + formatNumber(quantity) + '<br>' +
            '<strong>Current / Last Price:</strong> ' + formatCurrency(currentPrice) + '<br>' +
            '<strong>Total Purchase Amt:</strong> ' + formatCurrency(quantity * purchasePrice) + '<br>' +
            '<strong>Current Valuation:</strong> ' + formatCurrency(quantity * currentPrice) + '<br>' +
            '<strong>My Change:</strong> <span class="' + myChangeBg + '">' + formatSignedCurrency(item.myChangeAmount) + ' (' + formatSignedPercent(item.myChangePercent) + ')</span>' +
            '</div>' +
            '</div>' +
            '<div class="col-md-10 mb-3">' +
            '<div class="stock-candle-container" style="max-height: 400px; overflow-y: auto; border: 1px solid #dfe3e8;">' +
            buildDailyChangesTable(dailyChanges) +
            '</div>' +
            '</div>' +
            '</div>';

        $('#stockDetailModalBody').html(modalBodyHtml);

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            var modalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('stockDetailModal'));
            modalInstance.show();
        } else {
            $('#stockDetailModal').modal('show');
        }
    }

    function bindSearchFilters() {
        $('.stock-filter-row input').off('keyup change').on('keyup change', function () {
            var query = $(this).val().toLowerCase();
            var columnIndex = parseInt($(this).attr('data-column'), 10);

            $('#purchaseStockTable tbody tr').each(function () {
                var $row = $(this);
                var cellText = $row.find('td').eq(columnIndex).text().toLowerCase();
                var isMatch = cellText.indexOf(query) !== -1;
                $row.toggle(isMatch || query === '');
            });
        });
    }

    function bindColumnSort() {
        $('#purchaseStockTable thead th[data-column]').off('click').on('click', function () {
            var columnIndex = parseInt($(this).attr('data-column'), 10);
            var isAscending = true;

            if (currentSortColumn === columnIndex) {
                isAscending = currentSortDirection === 'desc';
            }

            currentSortColumn = columnIndex;
            currentSortDirection = isAscending ? 'asc' : 'desc';

            sortTableByColumn(columnIndex, isAscending);

            $('#purchaseStockTable thead th .stock-sort-icon').removeClass('asc desc');
            $(this).find('.stock-sort-icon').addClass(isAscending ? 'asc' : 'desc');
        });
    }

    function sortTableByColumn(columnIndex, isAscending) {
        var $tbody = $('#purchaseStockTable tbody');
        var rows = $tbody.find('tr').toArray();

        if (rows.length <= 1) return;

        // 1. Map rows into memory first to avoid querying the DOM inside the sort loop
        var mappedRows = rows.map(function (row, idx) {
            var rawText = $(row).find('td').eq(columnIndex).text().trim();

            // Clean currency signs, commas, '%', 'days', and '+'
            var cleanedNum = rawText.replace(/[^\d.-]/g, '');
            var numVal = parseFloat(cleanedNum);

            return {
                index: idx,
                row: row,
                rawText: rawText.toLowerCase(),
                numVal: !isNaN(numVal) && cleanedNum !== '' ? numVal : null
            };
        });

        // 2. Sort purely in-memory
        mappedRows.sort(function (a, b) {
            if (a.numVal !== null && b.numVal !== null) {
                return isAscending ? a.numVal - b.numVal : b.numVal - a.numVal;
            }
            return isAscending ? a.rawText.localeCompare(b.rawText) : b.rawText.localeCompare(a.rawText);
        });

        // 3. Batch re-insert using DocumentFragment for instant rendering (single reflow)
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < mappedRows.length; i++) {
            fragment.appendChild(mappedRows[i].row);
        }

        $tbody[0].appendChild(fragment);
    }

    function buildDailyChangesTable(data) {
        if (!data || !data.length) {
            return '<div class="p-3 text-center text-muted">No historical candle data available.</div>';
        }

        // Sort descending by date so the latest day appears first
        var sortedData = data.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        var html = '<table class="stock-candle-table"><thead><tr>' +
            '<th>Date</th>' +
            '<th>Open</th>' +
            '<th>High</th>' +
            '<th>Low</th>' +
            '<th>Close</th>' +
            '<th>Change %</th>' +
            '<th>Change Amt</th>' +
            '<th>Status</th>' +
            '<th>Volume</th>' +
            '</tr></thead><tbody>';

        $.each(sortedData, function (index, item) {
            var changeClass = 'stock-change-flat';
            if (item.changeAmount > 0) changeClass = 'stock-change-up';
            if (item.changeAmount < 0) changeClass = 'stock-change-down';

            html += '<tr>' +
                '<td>' + (item.date || '') + '</td>' +
                '<td>' + formatCurrency(item.open) + '</td>' +
                '<td>' + formatCurrency(item.high) + '</td>' +
                '<td>' + formatCurrency(item.low) + '</td>' +
                '<td>' + formatCurrency(item.close) + '</td>' +
                '<td class="' + (item.changePercent >= 0 ? 'stock-change-up' : 'stock-change-down') + '">' + formatPercent(item.changePercent) + '</td>' +
                '<td class="' + changeClass + '">' + formatCurrency(item.changeAmount) + '</td>' +
                '<td class="' + changeClass + '">' + (item.changeStatus || 'FLAT') + '</td>' +
                '<td>' + formatNumber(item.volume) + '</td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    function formatCurrency(value) {
        var num = parseFloat(value || 0);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    }

    function formatSignedCurrency(value) {
        var num = parseFloat(value || 0);
        return isNaN(num) ? '+0.00' : ((num >= 0 ? '+' : '') + num.toFixed(2));
    }

    function formatPercent(value) {
        var num = parseFloat(value || 0);
        return isNaN(num) ? '0.00%' : (num.toFixed(2) + '%');
    }

    function formatSignedPercent(value) {
        var num = parseFloat(value || 0);
        return isNaN(num) ? '+0.00%' : ((num >= 0 ? '+' : '') + num.toFixed(2) + '%');
    }

    function formatNumber(value) {
        var num = parseFloat(value || 0);
        return isNaN(num) ? '0' : num.toLocaleString('en-IN');
    }

    function formatDaysOrPlaceholder(value) {
        return String(value) === '--' ? '--' : (value || 0) + ' days';
    }

    function formatStatusLabel(value) {
        var statusLabels = {
            '1': 'New',
            '2': 'Working',
            '3': 'Partial Data',
            '4': 'API Missing',
            '5': 'No Tracking'
        };
        var normalizedStatus = String(value || '1');
        return statusLabels[normalizedStatus] || 'New';
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
