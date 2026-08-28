$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    let spendingData = [];
    let calendarRequest = null;

    Get4Group();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const today = new Date();
    $('#ddlYear').val(today.getFullYear());
    $('#ddlMonth').val(today.getMonth() + 1);

    if (!$('#ddlYear').val()) {
        $('#ddlYear').append($('<option></option>').attr('value', today.getFullYear()).text(today.getFullYear()));
        $('#ddlYear').val(today.getFullYear());
    }

    getList();

    $('#btnCalederSearch').click(function () {
        getList();
    });

    $('#btnPreviousMonth, #btnNextMonth').on('click', function (event) {
        event.preventDefault();
        const change = this.id === 'btnNextMonth' ? 1 : -1;
        const selectedYearValue = parseInt($('#ddlYear').val(), 10);
        const selectedMonthValue = parseInt($('#ddlMonth').val(), 10);

        if (isNaN(selectedYearValue) || isNaN(selectedMonthValue) || selectedMonthValue < 1) {
            return;
        }

        const selectedDate = new Date(selectedYearValue, selectedMonthValue - 1 + change, 1);
        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth() + 1;

        if (!$('#ddlYear option[value="' + selectedYear + '"]').length) {
            $('#ddlYear').append($('<option></option>').attr('value', selectedYear).text(selectedYear));
        }

        $('#ddlYear').val(selectedYear);
        $('#ddlMonth').val(selectedMonth);
        getList();
    });

    $(document).on('change', '#ddlYear, #ddlMonth, #ddlUpdateG1, #ddlUpdateG2, #ddlUpdateG3, #ddlUpdateG4', function () {

        const forYear = $('#ddlYear').val();
        const forMonth = $('#ddlMonth').val();

        if (!forYear || forYear === "0" || !forMonth || forMonth === "0") {
            return;
        }

        if (this.id.indexOf('ddlUpdateG') === 0) {
            const gIDs = ['#ddlUpdateG1', '#ddlUpdateG2', '#ddlUpdateG3', '#ddlUpdateG4'];
            const changedID = '#' + this.id;
            const changedValue = $(changedID).val();

            if (changedValue !== "0") {
                gIDs.forEach(id => {
                    if (id !== changedID) {
                        $(id).val("0");
                    }
                });
            }
        }

        getList();
    });


    //#get monthwise dates
    function getList() {

        $('.spending').remove();           // Remove ₹amount display
        $('.highlight').removeClass('highlight'); // Remove color highlights

        let forYear = $('select#ddlYear option:selected').val();
        let forMonth = $('select#ddlMonth option:selected').val();

        let g1 = $('select#ddlUpdateG1 option:selected').val();
        let g2 = $('select#ddlUpdateG2 option:selected').val();
        let g3 = $('select#ddlUpdateG3 option:selected').val();
        let g4 = $('select#ddlUpdateG4 option:selected').val();

            const hasGroupSelected = [g1, g2, g3, g4].some(value => value && value !== "0");
            if (!hasGroupSelected) {
                const selectedYear = parseInt(forYear, 10);
                const selectedMonth = parseInt(forMonth, 10);
                spendingData = [];
                const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
                const monthEnd = new Date(selectedYear, selectedMonth, 0);
                generateCalendar(selectedMonth - 2, selectedYear, 'prev-calendar', 'prev-calendar-title', monthStart, monthEnd);
                generateCalendar(selectedMonth - 1, selectedYear, 'curr-calendar', 'curr-calendar-title', monthStart, monthEnd);
                return;
            }

        //if (forYear == 0 || forMonth == "-- select --") {
        //    return false;
        //}

        //if (forGroup1 == 0 && forGroup2 == 0 && forGroup3 == 0 && forGroup4 == 0) {
        //    return false;
        //}

        //if (forGroup2 != "" && forGroup1 != "" && forGroup3 != "") {
        //    $("#tblExpensive").empty();
        //    return;
        //}

        //if (forMonth == "-- select --") {
        //    $("#tblExpensive").empty();
        //    return;
        //}
        let CalenderBudgetModelIn = {
            forYear: forYear,
            forMonth: forMonth,
            g1: g1,
            g2: g2,
            g3: g3,
            g4: g4
        }
        $.ajax({
            type: "POST",
            url: '/Calender/GetDataForCalender',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(CalenderBudgetModelIn),
            success: function (result) {
                const calendarDate = result.calenderDate && result.calenderDate.length > 0
                    ? result.calenderDate[0]
                    : null;
                const selectedYear = parseInt(forYear, 10);
                const selectedMonth = parseInt(forMonth, 10);

                function parseCalendarDate(value, fallback) {
                    if (!value) {
                        return fallback;
                    }

                    const serializedDate = String(value);
                    const timestampMatch = serializedDate.match(/\/Date\((\d+)\)\//);
                    if (timestampMatch) {
                        const timestampDate = new Date(parseInt(timestampMatch[1], 10));
                        return new Date(timestampDate.getFullYear(), timestampDate.getMonth(), timestampDate.getDate());
                    }

                    let parsedDate = null;
                    const isoMatch = serializedDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
                    const usMatch = serializedDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    const dmyMatch = serializedDate.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);

                    if (isoMatch) {
                        parsedDate = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
                    } else if (usMatch) {
                        const firstPart = parseInt(usMatch[1], 10);
                        const secondPart = parseInt(usMatch[2], 10);
                        const dateMonth = firstPart > 12 ? secondPart : firstPart;
                        const dateDay = firstPart > 12 ? firstPart : secondPart;
                        parsedDate = new Date(parseInt(usMatch[3], 10), dateMonth - 1, dateDay);
                    } else if (dmyMatch) {
                        parsedDate = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
                    }

                    if (parsedDate && !isNaN(parsedDate.getTime())) {
                        return parsedDate;
                    }

                    return fallback;
                }

                const monthStart = parseCalendarDate(calendarDate && calendarDate.fromDate,
                    new Date(selectedYear, selectedMonth - 1, 1));
                const monthEnd = parseCalendarDate(calendarDate && calendarDate.toDate,
                    new Date(selectedYear, selectedMonth, 0));
                monthStart.setHours(0, 0, 0, 0);
                monthEnd.setHours(0, 0, 0, 0);

                const fromMonth = monthStart.getMonth();
                const fromYear = monthStart.getFullYear();
                const toMonth = monthEnd.getMonth();
                const toYear = monthEnd.getFullYear();

                function stripTime(dateTimeStr) {
                    return dateTimeStr.split(" ")[0];
                }

                //monthMaster
                spendingData = [];
                $.each(result.calenderData, function (index, data) {
                    let tempObj = { date: stripTime(data.date), amount: data.spending };
                    spendingData.push(tempObj);
                });

                generateCalendar(fromMonth, fromYear, 'prev-calendar', 'prev-calendar-title', monthStart, monthEnd);
                generateCalendar(toMonth, toYear, 'curr-calendar', 'curr-calendar-title', monthStart, monthEnd);
            },
            error: function (xhr) {
                alert('Error: ' + xhr.statusText);
            }
        });
    }

    function generateCalendar(month, year, calendarId, titleId, monthStart, monthEnd) {

        const calendar = $(`#${calendarId}`);
        const title = $(`#${titleId}`);
        calendar.empty();

        title.text(`${monthNames[month]} ${year}`);

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        // Day headers
        for (let d of daysOfWeek) {
            calendar.append(`<div class='day-head header'>${d}</div>`);
        }

        // Blank slots before first day
        for (let i = 0; i < firstDay; i++) {
            calendar.append(`<div class='day'></div>`);
        }

        // Days with spending
        for (let day = 1; day <= lastDate; day++) {
            const fullDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const currentDate = new Date(year, month, day);
            currentDate.setHours(0, 0, 0, 0);
            const isDisabled = currentDate < monthStart || currentDate > monthEnd;

            const spend = spendingData.find(s => s.date == fullDate);
            const highlightClass = spend ? 'highlight' : '';
            const disabledClass = isDisabled ? 'disabled' : '';
            const spendingHtml = spend ? `<div class='spending'>₹${spend.amount}</div>` : '';

            calendar.append(`
                <div class='day ${highlightClass} ${disabledClass}'>
                    ${day}
                    ${spendingHtml}
                </div>
            `);
        }
    }

    function Get4Group() {
        if (calendarRequest) {
            calendarRequest.abort();
        }

        calendarRequest = $.ajax({
            url: "/Budget/Get4Group",
            type: "GET",
            dataType: "json",
            success: function (res) {
                if (res) {
                    // Populate G1 dropdown
                    if (res.G1Groups && res.G1Groups.length > 0) {
                        $.each(res.G1Groups, function (idx, item) {
                            $("#searchDDlG1").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG1").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                        });
                    }

                    // Populate G2 dropdown
                    if (res.G2Groups && res.G2Groups.length > 0) {
                        $.each(res.G2Groups, function (idx, item) {
                            $("#searchDDlG2").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG2").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                        });
                    }

                    // Populate G3 dropdown
                    if (res.G3Groups && res.G3Groups.length > 0) {
                        $.each(res.G3Groups, function (idx, item) {
                            $("#searchDDlG3").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG3").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                        });
                    }

                    // Populate G4 dropdown
                    if (res.G4Groups && res.G4Groups.length > 0) {
                        $.each(res.G4Groups, function (idx, item) {
                            $("#searchDDlG4").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                            $("#ddlUpdateG4").append($('<option></option>').attr('value', item.GroupId).text(item.GroupName));
                        });
                    }
                }
            },
            error: function (xhr, status, error) {
                alert("Error loading groups: " + error);
                console.log(xhr.responseText);
            }
        });
    }

});