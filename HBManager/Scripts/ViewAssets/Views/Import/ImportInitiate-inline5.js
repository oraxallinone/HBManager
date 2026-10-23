
        var selectedRowId = null;

        $(document).ready(function () {
            var currentDate = new Date();
            var currentYear = currentDate.getFullYear();      // Returns the 4-digit year (e.g., 2026)
            var currentMonth = currentDate.getMonth() + 1;    // Returns 1-12 (January is 1, etc.)

            if ($("#ddlYear option[value='" + currentYear + "']").length > 0) {
                $("#ddlYear").val(currentYear);
            }
            $("#ddlMonth").val(currentMonth);


            loadBankNames();


            // Year & Month filter change
            $("#ddlYear, #ddlMonth").change(function () {

                var year = $("#ddlYear").val().trim();
                var month = $("#ddlMonth").val().trim();

                if (year && year !== "0" && month && month !== "0") {
                    loadBankNames();
                }
            });

            $("#ddlbyBank").change(function () {
                loadGridData();
            });

            $("#btnClear").click(function () {
                $("#csvData").val("");
                $("#summaryPanel").slideUp();
            });

            $("#csvImportForm").submit(function (e) {
                e.preventDefault();
                var csvData = $("#csvData").val();
                if (!csvData.trim()) { alert("Please paste CSV data first."); return false; }

                $.ajax({
                    url: $(this).attr("action"),
                    type: "POST",
                    contentType: "text/csv; charset=utf-8",
                    processData: false,
                    data: csvData,
                    success: function (res) {
                        $("#summaryPanel").slideUp(200, function () {
                            if (res.success) {
                                $("#statInserted").text(res.inserted);
                                $("#statDuplicates").text(res.duplicates);
                                $("#summaryMessage").text(res.message);
                                $("#summaryPanel").removeClass("alert-danger alert-info alert-success").addClass(res.inserted > 0 ? "alert-success" : "alert-info");
                                $("#summaryStatus").text(res.inserted > 0 ? "Data Sync Completed Successfully" : "Process Complete (No Rows Added)");
                                $("#summaryPanel").slideDown();
                                loadBankNames();
                            } else {
                                $("#summaryPanel").removeClass("alert-success alert-info").addClass("alert-danger").slideDown();
                                $("#summaryStatus").text("Processing Interrupted");
                                $("#summaryMessage").text(res.message);
                            }
                        });
                    },
                    error: function (xhr) {
                        $("#summaryPanel").removeClass("alert-success alert-info").addClass("alert-danger").slideDown();
                        $("#summaryStatus").text("Import Failed");
                        $("#summaryMessage").text(xhr.responseText || "The CSV import request could not be processed.");
                    }
                });
            });

            // NEW MOVE BUTTON INTERACTION: Captures selected radio arrays and dispatches to server endpoint
            $("#btnMove").click(function () {
                var selectedItems = [];
                var selectedRow = $('#auditGrid tbody tr.row-selected');

                if (selectedRow.length > 0) {
                    selectedRowId = selectedRow.data('id');
                }

                // Select only the inputs that the user checked
                $('#auditGrid tbody input[type="radio"]:checked').each(function () {
                    var radioName = $(this).attr('name'); // e.g., "status_3"
                    var rowId = radioName.split('_')[1];  // extracts the ID number
                    var optionValue = $(this).val();      // "trans" or "skip"

                    selectedItems.push({
                        Id: parseInt(rowId),
                        Status: optionValue
                    });
                });

                if (selectedItems.length === 0) {
                    alert("Please select at least one Trans or Skip option before clicking the Move button.");
                    return;
                }

                $.ajax({
                    url: document.getElementById('csvImportForm').dataset.moveUrl,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ items: selectedItems }),
                    success: function (response) {
                        if (response.success) {
                            //alert(response.message);
                            loadBankNames(); // Refresh bank options and grid after status change
                        } else {
                            alert("Error processing updates: " + response.message);
                        }
                    },
                    error: function () {
                        alert("System connectivity fault executing batch status assignments.");
                    }
                });
            });

            // Revert button handler for each row
            $(document).on('click', '.btn-revert', function () {
                var rowId = $(this).data('id');
                if (!rowId) {
                    alert('Unable to determine record id for revert.');
                    return;
                }

                // Confirmation check
                if (!confirm('Are you sure you want to revert this record?')) {
                    return; // If user clicks Cancel, exit the function
                }

                $.ajax({
                    url: document.getElementById('csvImportForm').dataset.revertUrl,
                    type: 'POST',
                    data: { id: rowId },
                    success: function (response) {
                        if (response.success) {
                            //loadGridDataWithYearMonth();
                            loadBankNames(); // Refresh bank options and grid after revert
                        } else {
                            alert('Revert failed: ' + response.message);
                        }
                    },
                    error: function () {
                        alert('System fault while reverting the record.');
                    }
                });
            });

            //delete button handler
            $(document).on('click', '.btnDelete', function () {
                var id = $(this).data('id');
                if (!confirm('Are you sure you want to delete this record?'))
                    return;
                $.ajax({
                    url: document.getElementById('csvImportForm').dataset.deleteUrl,
                    type: 'POST',
                    data: { id: id },
                    success: function (response) {
                        if (response.success) {
                            alert("Record deleted successfully.");
                            loadBankNames();
                        } else {
                            alert(response.message);
                        }
                    },
                    error: function (xhr, status, error) {
                        console.log(xhr);
                        alert("Status: " + xhr.status);
                        alert("Error: " + error);
                        alert("Response: " + xhr.responseText);
                    }
                });
            });

            // Filter only the column whose search box was changed.
            $(document).on('input', '.column-search', function () {
                var searchBoxes = $('.column-search');

                $('#auditGrid tbody tr').each(function () {
                    var row = $(this);
                    var matches = true;

                    searchBoxes.each(function () {
                        var searchText = $(this).val().toLowerCase().trim();
                        var columnIndex = $(this).data('column');
                        var cellText = row.children('td').eq(columnIndex).text().toLowerCase();

                        if (searchText && cellText.indexOf(searchText) === -1) {
                            matches = false;
                            return false;
                        }
                    });

                    row.toggle(matches);
                });
            });

            // Toggle the selected color when a data row is clicked.
            $(document).on('click', '#auditGrid tbody tr', function () {
                $('#auditGrid tbody tr').removeClass('row-selected');
                $(this).addClass('row-selected');
                selectedRowId = $(this).data('id');
            });

            // Open the full details value for editing on double-click.
            $(document).on('dblclick', '#auditGrid tbody .details-cell', function (event) {
                event.stopPropagation();
                $('#detailsRecordId').val($(this).data('id'));
                $('#detailsEditor').val($(this).find('.details-source').val() || '');
                $('#detailsModal').modal('show');
            });

            $('#btnSaveDetails').click(function () {
                var button = $(this);
                var id = $('#detailsRecordId').val();

                button.prop('disabled', true);
                $.ajax({
                    url: document.getElementById('csvImportForm').dataset.updateUrl,
                    type: 'POST',
                    data: {
                        id: id,
                        details: $('#detailsEditor').val()
                    },
                    success: function (response) {
                        if (response.success) {
                            $('#detailsModal').modal('hide');
                            loadGridData();
                        } else {
                            alert(response.message);
                        }
                    },
                    error: function () {
                        alert('System fault while updating the details.');
                    },
                    complete: function () {
                        button.prop('disabled', false);
                    }
                });
            });

            $('#detailsModal').on('keydown', function (event) {
                if (event.which === 13 && !$(event.target).is('button, input, select')) {
                    event.preventDefault();
                    $('#btnSaveDetails').click();
                }
            });
        });

        function loadBankNames() {
            var year = $("#ddlYear").val();
            var month = $("#ddlMonth").val();
            var bankSelect = $("#ddlbyBank");
            var selectedBank = bankSelect.val() || "";

            bankSelect.empty().append("<option value=''>--Bank--</option>");

            if (year === "0" || month === "0") {
                loadGridData();
                return;
            }

            $.ajax({
                url: document.getElementById('csvImportForm').dataset.bankNamesUrl,
                type: "GET",
                data: { year: year, month: month },
                dataType: "json",
                success: function (bankNames) {
                    $.each(bankNames, function (index, bankName) {
                        bankSelect.append($('<option>', {
                            value: bankName,
                            text: bankName
                        }));
                    });

                    if (selectedBank && bankSelect.find("option").filter(function () {
                        return this.value === selectedBank;
                    }).length > 0) {
                        bankSelect.val(selectedBank);
                    }

                    loadGridData();
                },
                error: function () {
                    loadGridData();
                }
            });
        }

        // Dynamic grid building process mapping
        function loadGridData() {

            var year = $("#ddlYear").val();
            var month = $("#ddlMonth").val();

            if (year == "0" || month == "0") {

                $("#auditGrid tbody").html(
                    "<tr><td colspan='10' style='text-align:center;padding:40px;'>Select Year and Month filters to load target transaction streams.</td></tr>"
                );

                return;
            }

            $.ajax({
                url: document.getElementById('csvImportForm').dataset.budgetDataUrl,
                data: {
                    year: $("#ddlYear").val(),
                    month: $("#ddlMonth").val(),
                    bankName: $("#ddlbyBank").val()
                },
                type: "GET",
                dataType: "json",
                success: function (payload) {
            var htmlBuffer = "";
            $("#auditGrid tbody").empty();

                    $.each(payload, function (idx, obj) {
                        var shortDetails = obj.Details && obj.Details.length > 25 ? obj.Details.substring(0, 25) + "..." : (obj.Details || "");
                        var highlightClass = obj.TransactionType === "Credit" ? "success" : "";

                        htmlBuffer += "<tr class='" + highlightClass + "' data-id='" + obj.Id + "'>";
                        htmlBuffer += "<td>" + obj.Id + "</td>";
                        htmlBuffer += "<td>" + (obj.BankName || '') + "</td>";
                                htmlBuffer += "<td>" + obj.Year + "/" + obj.Month + "</td>";
                        htmlBuffer += "<td>" + obj.TransactionType + "</td>";

                        // NEW DYNAMIC TRANS/SKIP COLUMN RENDERING
                        htmlBuffer += "<td style='text-align: center; vertical-align: middle;'>";
                        if (obj.IsTransferStatus === "Transfered") {
                            htmlBuffer += "<span class='status-trans'>Transfered</span>";
                        } else if (obj.IsTransferStatus === "Skiped") {
                            htmlBuffer += "<span class='status-skip'>Skiped</span>";
                        } else {
                            // If unassigned, render dynamic interactive radio buttons bound to row ID
                            htmlBuffer += "<label class='radio-inline'><input type='radio' name='status_" + obj.Id + "' value='trans'>Trans</label>";
                            htmlBuffer += "<label class='radio-inline' style='margin-left: 10px;'><input type='radio' name='status_" + obj.Id + "' value='skip'>Skip</label>";
                        }
                        htmlBuffer += "</td>";

                        htmlBuffer += "<td style='font-weight: bold;'>₹" + parseFloat(obj.Amount).toFixed(2) + "</td>";
                        htmlBuffer += "<td style='white-space:nowrap; text-transform: uppercase;'>" + obj.TransactionDate + "</td>";
                                htmlBuffer += "<td class='details-cell' data-id='" + obj.Id + "' title='Double-click to edit details'>";
                                htmlBuffer += shortDetails;
                                htmlBuffer += "<textarea class='details-source'>" + escapeHtml(obj.Details || '') + "</textarea></td>";
                                // Delete column
                                htmlBuffer += "<td style='text-align:center; vertical-align:middle;'>";
                                htmlBuffer += "<button type='button' class='btn btn-danger btn-xs btnDelete' data-id='" + obj.Id + "'>";
                                htmlBuffer += "<span class='glyphicon glyphicon-trash'></span>";
                                htmlBuffer += "</button>";
                                htmlBuffer += "</td>";

                        htmlBuffer += "<td style='text-align:center; vertical-align:middle;'><button type='button' class='btn-revert' data-id='" + obj.Id + "'>Revert</button></td>";
                        htmlBuffer += "</tr>";
                    });

                    $("#auditGrid tbody").append(htmlBuffer);

                    if (selectedRowId !== null) {
                        $('#auditGrid tbody tr').filter(function () {
                            return $(this).data('id') == selectedRowId;
                        }).addClass('row-selected');
                    }
                },
                error: function (xhr) {
                    $("#summaryPanel").removeClass("alert-success alert-info").addClass("alert-danger").slideDown();
                    $("#summaryStatus").text("Import Failed");
                    $("#summaryMessage").text(xhr.responseText || "The CSV import request could not be processed.");
                }
            });
        }

        function escapeHtml(value) {
            return $('<div>').text(value).html();
        }
    