(function ($) {
    "use strict";

    $(function () {
        var bankNames = ["ICI", "KOT", "SBI", "SUR", "CAH", "BBB"];
        var entries = [];
        var lastAddedValues = null;
        var monthBeginningValue = 0;
        var currentMonthSalary = 0;
        var editingEntryId = null;
        var deletingEntryId = null;
        var lastFocusedElement = $();
        var loadRequest = null;
        var monthBeginningRequest = null;
        var isSavingEntry = false;
        var isSavingMonthBeginning = false;
        var $page = $("#bankTracker");
        var $monthSelect = $("#monthSelect");
        var $yearSelect = $("#yearSelect");
        var $monthBeginning = $("#monthBeginning");
        var $entryModal = $("#entryModal");
        var $monthBeginningModal = $("#monthBeginningModal");
        var $deleteModal = $("#deleteConfirmModal");
        var $entryModalStatus = $("#entryModalStatus");
        var $monthBeginningModalStatus = $("#monthBeginningModalStatus");
        var $entryValueInputs = $(".bank-tracker-value");
        var csrfToken = $("input[name='__RequestVerificationToken']").val();

        function formatAmount(value) {
            return "\u20B9" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
        }

        function formatBalance(value) {
            return Number(value).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        function formatDateTime(value) {
            return new Intl.DateTimeFormat("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }).format(new Date(value));
        }

        function setStatus(message) {
            $("#trackerStatus").text(message);
        }

        function getErrorMessage(xhr, fallback) {
            return xhr.responseJSON && xhr.responseJSON.message
                ? xhr.responseJSON.message
                : fallback;
        }

        function ajaxPost(url, data) {
            data.__RequestVerificationToken = csrfToken;
            return $.ajax({
                url: url,
                type: "POST",
                data: data,
                dataType: "json"
            });
        }

        function ensureYearOption(year) {
            var exists = $yearSelect.find("option").filter(function () {
                return Number($(this).val()) === year;
            }).length > 0;

            if (!exists) {
                $("<option>").val(year).text(year).appendTo($yearSelect);
            }
        }

        function initializePeriod() {
            var currentYear = new Date().getFullYear();
            if (!$yearSelect.find("option").filter(function () {
                return Number($(this).val()) === currentYear;
            }).length) {
                currentYear = Number($yearSelect.find("option").last().val());
            }
            $monthSelect.val(new Date().getMonth() + 1);
            $yearSelect.val(currentYear);
        }

        function appendListCell($row, values, isAmountList) {
            var $cell = $("<td>");
            var $list = $("<ul>").addClass(isAmountList
                ? "bank-tracker-list bank-tracker-value-list"
                : "bank-tracker-list");

            $.each(values, function (_, value) {
                $("<li>").text(isAmountList ? formatAmount(value) : value).appendTo($list);
            });
            $cell.append($list).appendTo($row);
        }

        function renderEntries() {
            var $body = $("#outputBody").empty();

            if (entries.length === 0) {
                $("<tr class='bank-tracker-empty'><td colspan='5'></td></tr>")
                    .find("td")
                    .text("No bank entries for this month yet. Select New Entry to add one.")
                    .end()
                    .appendTo($body);
                return;
            }

            $.each(entries, function (_, entry) {
                var date = new Date(entry.dateTime);
                var sum = entry.values.reduce(function (total, value) {
                    return total + value;
                }, 0);
                var monthOut = monthBeginningValue - sum;
                var remainingSalary = currentMonthSalary - monthOut;
                var $row = $("<tr>");
                var $dateCell = $("<td>");
                var $dateActions = $("<div>").addClass("bank-tracker-date-actions");
                var $rowActions = $("<div>").addClass("bank-tracker-row-actions");
                var $dateBadge = $("<div>").addClass("bank-tracker-date-badge");
                var $time = $("<span>").addClass("bank-tracker-time");

                $dateBadge.text(new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }).format(date));
                $time.text(new Intl.DateTimeFormat("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit"
                }).format(date));
                $dateBadge.append($time);

                $("<button type='button'>")
                    .addClass("bank-tracker-row-edit")
                    .text("Edit")
                    .data("entry-id", entry.id)
                    .appendTo($rowActions);
                $("<button type='button'>")
                    .addClass("bank-tracker-row-delete")
                    .text("Delete")
                    .data("entry-id", entry.id)
                    .appendTo($rowActions);
                $dateActions.append($rowActions, $dateBadge).appendTo($dateCell);
                $row.append($dateCell);

                appendListCell($row, bankNames, false);
                appendListCell($row, entry.values, true);

                $("<td>")
                    .addClass("bank-tracker-sum")
                    .text(
                        formatAmount(monthBeginningValue) + " - " +
                        formatAmount(sum) + " = " + formatAmount(monthOut)
                    )
                    .appendTo($row);
                $("<td>")
                    .addClass("bank-tracker-remaining")
                    .text(
                        formatAmount(currentMonthSalary) + " - " +
                        formatAmount(monthOut) + " = " + formatAmount(remainingSalary)
                    )
                    .appendTo($row);
                $body.append($row);
            });
        }

        function showLoadError(message) {
            entries = [];
            $("#outputBody").empty()
                .append($("<tr class='bank-tracker-empty bank-tracker-load-error'><td colspan='5'></td></tr>")
                    .find("td")
                    .text(message)
                    .end());
            setStatus(message);
        }

        function setModalOpen($modal, isOpen) {
            $modal.toggleClass("is-open", isOpen).attr("aria-hidden", isOpen ? "false" : "true");
            $("body").toggleClass("bank-tracker-modal-open",
                $entryModal.hasClass("is-open") ||
                $monthBeginningModal.hasClass("is-open") ||
                $deleteModal.hasClass("is-open"));
        }

        function rememberFocus() {
            lastFocusedElement = $(document.activeElement);
        }

        function restoreFocus() {
            if (lastFocusedElement.length) {
                lastFocusedElement.trigger("focus");
            }
        }

        function formatLocalDateTime(date) {
            function pad(value) {
                return value < 10 ? "0" + value : String(value);
            }

            return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
                "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
        }

        function setCurrentDateTime() {
            var now = new Date();
            var year = Number($yearSelect.val());
            var month = Number($monthSelect.val()) - 1;
            var lastDay = new Date(year, month + 1, 0).getDate();
            var date = new Date(year, month, Math.min(now.getDate(), lastDay),
                now.getHours(), now.getMinutes(), 0, 0);

            $("#entryDateTime").val(formatLocalDateTime(date));
        }

        function loadMonth(silent) {
            var year = Number($yearSelect.val());
            var month = Number($monthSelect.val());
            var request;

            if (loadRequest) {
                loadRequest.abort();
            }
            if (!silent) {
                setStatus("Loading bank entries...");
            }

            request = $.getJSON($page.data("month-url"), {
                year: year,
                month: month
            });
            loadRequest = request;

            request.done(function (result) {
                if (!result || !result.success || !$.isArray(result.entries)) {
                    showLoadError("The server returned an invalid bank entry response.");
                    return;
                }

                entries = result.entries.map(function (entry) {
                    return {
                        id: Number(entry.id),
                        dateTime: entry.dateTime,
                        values: entry.values.map(Number)
                    };
                });
                monthBeginningValue = Number(result.monthBeginning) || 0;
                currentMonthSalary = Number(result.currentMonthSalary) || 0;
                $monthBeginning.val(formatBalance(monthBeginningValue));
                $("#currentMonthSalary").val(formatBalance(currentMonthSalary));
                lastAddedValues = entries.length ? entries[0].values.slice() : null;
                renderEntries();
                if (!silent) {
                    setStatus("");
                }
            }).fail(function (xhr, status) {
                if (status !== "abort") {
                    showLoadError(getErrorMessage(xhr, "Could not load bank entries. Please try again."));
                }
            });
            request.always(function () {
                if (loadRequest === request) {
                    loadRequest = null;
                }
            });
        }

        function loadMonthBeginningForModal() {
            var year = Number($("#beginningYearSelect").val());
            var month = Number($("#beginningMonthSelect").val());
            var request;

            if (year <= 0 || month <= 0) {
                $("#beginningAmountInput").val("");
                $monthBeginningModalStatus.text("Select a month and year.");
                return;
            }

            if (monthBeginningRequest) {
                monthBeginningRequest.abort();
            }
            $monthBeginningModalStatus.text("Loading month beginning...");
            request = $.getJSON($page.data("month-url"), {
                year: year,
                month: month
            });
            monthBeginningRequest = request;

            request.done(function (result) {
                if (!result || !result.success) {
                    $monthBeginningModalStatus.text("Could not load this month beginning value.");
                    return;
                }

                $("#beginningAmountInput").val(Number(result.monthBeginning).toFixed(2));
                $monthBeginningModalStatus.text("");
            }).fail(function (xhr, status) {
                if (status !== "abort") {
                    $monthBeginningModalStatus.text(getErrorMessage(xhr, "Could not load this month beginning value."));
                }
            }).always(function () {
                if (monthBeginningRequest === request) {
                    monthBeginningRequest = null;
                }
            });
        }

        function openMonthBeginningModal() {
            var month = Number($monthSelect.val());
            var year = Number($yearSelect.val());

            $("#beginningMonthSelect").html($monthSelect.html()).val(month);
            $("#beginningYearSelect").html($yearSelect.html()).val(year);
            $("#beginningAmountInput").val(Number(monthBeginningValue).toFixed(2));
            $monthBeginningModalStatus.text("");
            rememberFocus();
            setModalOpen($monthBeginningModal, true);
            $("#beginningAmountInput").trigger("focus").trigger("select");
            loadMonthBeginningForModal();
        }

        function closeMonthBeginningModal() {
            if (isSavingMonthBeginning) {
                return;
            }
            setModalOpen($monthBeginningModal, false);
            restoreFocus();
        }

        function saveMonthBeginning() {
            var year = Number($("#beginningYearSelect").val());
            var month = Number($("#beginningMonthSelect").val());
            var amountText = $.trim($("#beginningAmountInput").val());
            var amount = Number(amountText);

            if (year <= 0 || month <= 0) {
                $monthBeginningModalStatus.text("Select a valid month and year.");
                return;
            }
            if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(amountText) || !isFinite(amount)) {
                $monthBeginningModalStatus.text("Enter a non-negative amount with no more than two decimal places.");
                $("#beginningAmountInput").trigger("focus");
                return;
            }

            isSavingMonthBeginning = true;
            $("#saveMonthBeginningButton").prop("disabled", true);
            $monthBeginningModalStatus.text("Saving month beginning...");
            ajaxPost($page.data("save-month-beginning-url"), {
                year: year,
                month: month,
                monthBeginning: amount
            }).done(function (result) {
                if (!result || !result.success) {
                    $monthBeginningModalStatus.text(result && result.message
                        ? result.message
                        : "Could not save the month beginning value.");
                    return;
                }

                $monthSelect.val(month);
                $yearSelect.val(year);
                setModalOpen($monthBeginningModal, false);
                restoreFocus();
                loadMonth(true);
                setStatus("Month beginning value saved.");
            }).fail(function (xhr) {
                $monthBeginningModalStatus.text(getErrorMessage(xhr, "Could not save the month beginning value. Please try again."));
            }).always(function () {
                isSavingMonthBeginning = false;
                $("#saveMonthBeginningButton").prop("disabled", false);
            });
        }

        function openEntryModal() {
            editingEntryId = null;
            $entryModalStatus.text("");
            $("#modalTitle").text("Add New Bank Entry");
            $("#submitEntryButton").text("+ Add").prop("disabled", false);
            $entryValueInputs.val("0");
            setCurrentDateTime();
            rememberFocus();
            setModalOpen($entryModal, true);
            $entryValueInputs.first().trigger("focus").trigger("select");
        }

        function openEditModal(entryId) {
            var entry = $.grep(entries, function (item) {
                return item.id === entryId;
            })[0];

            if (!entry) {
                return;
            }

            editingEntryId = entry.id;
            $entryModalStatus.text("");
            $("#modalTitle").text("Edit Bank Entry");
            $("#submitEntryButton").text("Update").prop("disabled", false);
            $.each(entry.values, function (index, value) {
                $entryValueInputs.eq(index).val(value);
            });
            $("#entryDateTime").val(entry.dateTime);
            rememberFocus();
            setModalOpen($entryModal, true);
            $entryValueInputs.first().trigger("focus").trigger("select");
        }

        function closeEntryModal() {
            setModalOpen($entryModal, false);
            restoreFocus();
        }

        function saveEntry() {
            var dateTime = $("#entryDateTime").val();
            var values = $entryValueInputs.map(function () {
                var value = $(this).val();
                return value === "" ? 0 : Number(value);
            }).get();
            var requestData = {
                id: editingEntryId,
                entryDateTime: dateTime,
                iciValue: values[0],
                kotValue: values[1],
                sbiValue: values[2],
                surValue: values[3],
                cahValue: values[4],
                bbbValue: values[5]
            };

            if (!dateTime || !Number.isFinite(new Date(dateTime).getTime())) {
                $entryModalStatus.text("Please select a valid date and time.");
                $("#entryDateTime").trigger("focus");
                return;
            }
            if ($.grep(values, function (value) {
                return !Number.isFinite(value) || value < 0 || Math.round(value * 100) !== value * 100;
            }).length > 0) {
                $entryModalStatus.text("Enter a valid, non-negative amount with no more than two decimal places for each bank.");
                return;
            }
            isSavingEntry = true;
            $("#submitEntryButton").prop("disabled", true);
            $entryModalStatus.text("Saving bank entry...");
            ajaxPost($page.data("save-url"), requestData)
                .done(function (result) {
                    if (!result || !result.success) {
                        $entryModalStatus.text(result && result.message ? result.message : "Could not save the bank entry.");
                        return;
                    }

                    lastAddedValues = values.slice();
                    var selectedDate = new Date(dateTime);
                    $monthSelect.val(selectedDate.getMonth() + 1);
                    ensureYearOption(selectedDate.getFullYear());
                    $yearSelect.val(selectedDate.getFullYear());
                    closeEntryModal();
                    loadMonth(true);
                    setStatus(editingEntryId ? "Bank entry updated." : "Bank entry saved.");
                    editingEntryId = null;
                })
                .fail(function (xhr) {
                    $entryModalStatus.text(getErrorMessage(xhr, "Could not save the bank entry. Please try again."));
                })
                .always(function () {
                    isSavingEntry = false;
                    $("#submitEntryButton").prop("disabled", false);
                });
        }

        function openDeleteModal(entryId) {
            var entry = $.grep(entries, function (item) {
                return item.id === entryId;
            })[0];
            var total;

            if (!entry) {
                return;
            }

            deletingEntryId = entryId;
            total = entry.values.reduce(function (sum, value) {
                return sum + value;
            }, 0);
            $("#deletePreviewInfo").text("Entry: " + formatDateTime(entry.dateTime) + " | Total: " + formatAmount(total));
            rememberFocus();
            setModalOpen($deleteModal, true);
            $("#cancelDeleteButton").trigger("focus");
        }

        function closeDeleteModal() {
            deletingEntryId = null;
            setModalOpen($deleteModal, false);
            restoreFocus();
        }

        $("#newEntryButton").on("click", openEntryModal);
        $("#editMonthBeginningButton").on("click", openMonthBeginningModal);
        $("#closeEntryButton").on("click", closeEntryModal);
        $("#closeMonthBeginningButton, #cancelMonthBeginningButton").on("click", closeMonthBeginningModal);
        $("#saveMonthBeginningButton").on("click", saveMonthBeginning);
        $("#submitEntryButton").on("click", saveEntry);
        $("#cancelDeleteButton").on("click", closeDeleteModal);
        $("#confirmDeleteButton").on("click", function () {
            if (!deletingEntryId) {
                return;
            }

            var entryId = deletingEntryId;
            $(this).prop("disabled", true);
            ajaxPost($page.data("delete-url"), { id: entryId })
                .done(function (result) {
                    if (!result || !result.success) {
                        setStatus(result && result.message ? result.message : "Could not delete the bank entry.");
                        return;
                    }

                    closeDeleteModal();
                    loadMonth(true);
                    setStatus("Bank entry deleted.");
                })
                .fail(function (xhr) {
                    setStatus(getErrorMessage(xhr, "Could not delete the bank entry. Please try again."));
                })
                .always(function () {
                    $("#confirmDeleteButton").prop("disabled", false);
                });
        });

        $("#loadLastEntryButton").on("click", function () {
            if (!lastAddedValues) {
                $entryModalStatus.text("There are no previous values to load.");
                return;
            }

            $.each(lastAddedValues, function (index, value) {
                $entryValueInputs.eq(index).val(value);
            });
            $entryValueInputs.first().trigger("focus").trigger("select");
            $entryModalStatus.text("Loaded the values from the last entry.");
        });

        $("#loadBudgetButton").on("click", function () {
            $entryModalStatus.text("Budget Verification is not connected to this page yet.");
        });

        $monthSelect.add($yearSelect).on("change", function () {
            loadMonth(false);
        });
        $("#beginningMonthSelect, #beginningYearSelect").on("change", loadMonthBeginningForModal);
        $entryModal.add($monthBeginningModal).add($deleteModal).on("click", function (event) {
            if (event.target === this) {
                if (this === $entryModal[0] && !isSavingEntry) {
                    closeEntryModal();
                } else if (this === $monthBeginningModal[0]) {
                    closeMonthBeginningModal();
                } else if (this === $deleteModal[0]) {
                    closeDeleteModal();
                }
            }
        });

        $("#outputBody").on("click", ".bank-tracker-row-edit", function () {
            openEditModal(Number($(this).data("entry-id")));
        }).on("click", ".bank-tracker-row-delete", function () {
            openDeleteModal(Number($(this).data("entry-id")));
        });

        $(document).on("keydown", function (event) {
            var $activeModal;
            var $focusable;
            var first;
            var last;

            if (event.key === "Escape") {
                if ($deleteModal.hasClass("is-open")) {
                    closeDeleteModal();
                } else if ($monthBeginningModal.hasClass("is-open")) {
                    closeMonthBeginningModal();
                } else if ($entryModal.hasClass("is-open") && !isSavingEntry) {
                    closeEntryModal();
                }
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            $activeModal = $deleteModal.hasClass("is-open") ? $deleteModal :
                ($monthBeginningModal.hasClass("is-open") ? $monthBeginningModal :
                    ($entryModal.hasClass("is-open") ? $entryModal : $()));
            if (!$activeModal.length) {
                return;
            }

            $focusable = $activeModal.find("button:not(:disabled), input:not(:disabled)");
            if (!$focusable.length) {
                return;
            }

            first = $focusable[0];
            last = $focusable[$focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                $(last).trigger("focus");
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                $(first).trigger("focus");
            }
        });

        initializePeriod();
        loadMonth(false);
    });
}(jQuery));
