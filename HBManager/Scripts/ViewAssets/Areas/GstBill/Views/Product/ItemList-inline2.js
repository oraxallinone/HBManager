
                                var items = JSON.parse(document.getElementById('itemListData').dataset.items);
                                var filteredItems = items.slice();
                                var itemsPerPage = 20;
                                var currentPage = 1;
                                var sortColumn = '';
                                var sortDirection = 1;

                                function renderTable(page) {
                                    var start = (page - 1) * itemsPerPage;
                                    var end = start + itemsPerPage;
                                    var pagedItems = filteredItems.slice(start, end);
                                    var snNo = filteredItems.length - start;
                                    var html = '';
                                    pagedItems.forEach(function(itm, idx) {
                                        var bgModified = itm.IsActive ? '' : '#f4240438';
                                        html += '<tr class="fontMenuBody" style="border: 1px solid #3574a4b0;background-color:' + bgModified + '">';
                                        html += '<td class="textCenter">' + (snNo - idx) + '</td>';
                                        html += '<td>' + itm.ItemDetails + '</td>';
                                        html += '<td>' + (itm.ItemPart == null ? '' : itm.ItemPart) + '</td>';
                                        html += '<td>' + itm.ItemCode + '</td>';
                                        html += '<td class="textCenter">' + itm.HSN + '</td>';
                                        html += '<td class="textCenter">' + itm.Rate + '</td>';
                                        html += '<td class="textCenter">' + itm.Gst + '</td>';
                                        html += '<td class="textCenter">';
                                        html += '<a href="/GstBill/Product/ItemView/' + itm.ItemId + '"> <i class="fa-solid fa-eye"></i></a>|';
                                        html += '<a href="/GstBill/Product/ItemEdit/' + itm.ItemId + '"> <i class="fa-solid fa-pen-to-square"></i></a>';
                                        html += '</td>';
                                        html += '</tr>';
                                    });
                                    $('#itemTableBody').html(html);
                                }

                                function renderPagination() {
                                    var totalPages = Math.ceil(filteredItems.length / itemsPerPage);
                                    var html = '';
                                    if (totalPages > 1) {
                                        html += '<ul class="pagination" style="justify-content:center;">';
                                        for (var i = 1; i <= totalPages; i++) {
                                            html += '<li class="page-item' + (i === currentPage ? ' active' : '') + '"><a href="#" class="page-link" data-page="' + i + '">' + i + '</a></li>';
                                        }
                                        html += '</ul>';
                                    }
                                    $('#paginationContainer').html(html);
                                }

                                function applySearchAndSort() {
                                    var searchText = $('#itemSearchBox').val().toLowerCase().trim();
                                    filteredItems = items.filter(function (item) {
                                        return [item.ItemDetails, item.ItemPart, item.ItemCode, item.HSN, item.Rate, item.Gst]
                                            .some(function (value) {
                                                return String(value == null ? '' : value).toLowerCase().indexOf(searchText) !== -1;
                                            });
                                    });

                                    if (sortColumn) {
                                        filteredItems.sort(function (firstItem, secondItem) {
                                            var firstValue = firstItem[sortColumn];
                                            var secondValue = secondItem[sortColumn];
                                            var firstNumber = parseFloat(firstValue);
                                            var secondNumber = parseFloat(secondValue);

                                            if (sortColumn === 'Rate' || sortColumn === 'Gst') {
                                                return (firstNumber - secondNumber) * sortDirection;
                                            }

                                            return String(firstValue == null ? '' : firstValue).localeCompare(
                                                String(secondValue == null ? '' : secondValue),
                                                undefined,
                                                { sensitivity: 'base' }
                                            ) * sortDirection;
                                        });
                                    }

                                    currentPage = 1;
                                    renderTable(currentPage);
                                    renderPagination();
                                }

                                $('.item-sort').on('click', function () {
                                    var selectedColumn = $(this).data('sort');
                                    if (sortColumn === selectedColumn) {
                                        sortDirection = sortDirection * -1;
                                    }
                                    else {
                                        sortColumn = selectedColumn;
                                        sortDirection = 1;
                                    }

                                    $('.item-sort i').removeClass('fa-sort-up fa-sort-down').addClass('fa-sort');
                                    $(this).find('i')
                                        .removeClass('fa-sort')
                                        .addClass(sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down');
                                    applySearchAndSort();
                                });

                                $('#itemSearchBox').on('input', applySearchAndSort);

                                $(document).ready(function () {
                                    applySearchAndSort();

                                    $('#paginationContainer').on('click', '.page-link', function (e) {
                                        e.preventDefault();
                                        var page = parseInt($(this).data('page'));
                                        if (page !== currentPage) {
                                            currentPage = page;
                                            renderTable(currentPage);
                                            renderPagination();
                                        }
                                    });
                                });
                                