
    (function () {
        var rows = Array.prototype.slice.call(document.querySelectorAll('#invoiceTableBody .invoice-row'));
        var filteredRows = rows.slice();
        var currentPage = 1;
        var rowsPerPage = 20;

        function getSearchValue(id) {
            return document.getElementById(id).value.trim().toLowerCase();
        }

        function filterRows() {
            var filters = {
                'data-invoice-no': getSearchValue('searchInvoiceNo'),
                'data-customer': getSearchValue('searchCustomer'),
                'data-note': getSearchValue('searchNote'),
                'data-do-number': getSearchValue('searchDoNumber'),
                'data-internal-note': getSearchValue('searchInternalNote'),
                'data-gst-type': getSearchValue('searchGstType'),
                'data-date': getSearchValue('searchDate'),
                'data-total-value': getSearchValue('searchTotalValue')
            };

            filteredRows = rows.filter(function (row) {
                return Object.keys(filters).every(function (attribute) {
                    var filterValue = filters[attribute];
                    var rowValue = (row.getAttribute(attribute) || '').toLowerCase();
                    return filterValue === '' || rowValue.indexOf(filterValue) !== -1;
                });
            });
            currentPage = 1;
            renderTable();
            renderPagination();
        }

        function renderTable() {
            rows.forEach(function (row) {
                row.style.display = 'none';
            });

            var start = (currentPage - 1) * rowsPerPage;
            filteredRows.slice(start, start + rowsPerPage).forEach(function (row) {
                row.style.display = '';
            });
        }

        function renderPagination() {
            var totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            var pagination = document.getElementById('invoicePagination');
            pagination.innerHTML = '';

            if (totalPages <= 1) {
                return;
            }

            var list = document.createElement('ul');
            list.className = 'pagination';
            for (var page = 1; page <= totalPages; page++) {
                var item = document.createElement('li');
                item.className = 'page-item' + (page === currentPage ? ' active' : '');
                var link = document.createElement('a');
                link.className = 'page-link';
                link.textContent = page;
                link.setAttribute('data-page', page);
                item.appendChild(link);
                list.appendChild(item);
            }
            pagination.appendChild(list);
        }

        document.getElementById('searchInvoices').addEventListener('click', filterRows);
        document.getElementById('cancelInvoiceSearch').addEventListener('click', function () {
            ['searchInvoiceNo', 'searchCustomer', 'searchNote', 'searchDoNumber', 'searchInternalNote', 'searchDate', 'searchTotalValue']
                .forEach(function (id) {
                    document.getElementById(id).value = '';
                });
            document.getElementById('searchGstType').value = '';
            filterRows();
        });
        document.getElementById('invoicePagination').addEventListener('click', function (event) {
            if (event.target.classList.contains('page-link')) {
                currentPage = parseInt(event.target.getAttribute('data-page'), 10);
                renderTable();
                renderPagination();
            }
        });

        filterRows();
    }());

    $(document).on('click', '.internal-note-more', function () {
        swal('Internal Note', $(this).data('note'), 'info');
    });
