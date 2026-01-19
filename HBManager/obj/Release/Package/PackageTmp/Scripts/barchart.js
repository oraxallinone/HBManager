$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    const COLORS = ['#0d6efd', '#dc3545', '#28a745', '#ffc107'];

    // Load groups on page load
    loadGroupDropdowns();

    $("#btnLoadTrendChart").on("click", loadTrendChart);
    $("#ddlG1, #ddlG2, #ddlG3, #ddlG4").on("change", function () {
        // When a dropdown changes, clear the other three so only one is selected at a time
        var changedId = $(this).attr('id');
        // Reset other dropdowns to default empty value
        $('#ddlG1, #ddlG2, #ddlG3, #ddlG4').not(this).each(function () {
            $(this).val('');
        });

        loadTrendChart();
    });

    function loadGroupDropdowns() {
        $.ajax({
            url: '/Budget/Get4Group',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                if (res && res.G1Groups) {
                    populateDropdown('#ddlG1', res.G1Groups);
                }
                if (res && res.G2Groups) {
                    populateDropdown('#ddlG2', res.G2Groups);
                }
                if (res && res.G3Groups) {
                    populateDropdown('#ddlG3', res.G3Groups);
                }
                if (res && res.G4Groups) {
                    populateDropdown('#ddlG4', res.G4Groups);
                }
            },
            error: function (xhr) {
                console.error('Error loading groups:', xhr.statusText);
            }
        });
    }

    function populateDropdown(selector, groups) {
        $(selector).append(
            groups.map(function (g) {
                return '<option value="' + g.GroupId + '">' + g.GroupName + '</option>';
            })
        );
    }

    function loadTrendChart() {
        var g1 = parseInt($("#ddlG1").val()) || null;
        var g2 = parseInt($("#ddlG2").val()) || null;
        var g3 = parseInt($("#ddlG3").val()) || null;
        var g4 = parseInt($("#ddlG4").val()) || null;

        if (!g1 && !g2 && !g3 && !g4) {
            alert("Please select at least one group.");
            return;
        }

        $.ajax({
            url: '/Default/GetBarGraphByGroup',
            type: 'POST',
            data: {
                g1: g1,
                g2: g2,
                g3: g3,
                g4: g4
            },
            dataType: 'json',
            success: function (res) {
                if (!res || !res.length) {
                    $("#chartContainerTrend").html('<div style="padding:20px;color:#666">No data available for selected groups</div>');
                    $("#gridTrendTable tbody").html('<tr><td colspan="2" class="text-center">No data</td></tr>');
                    return;
                }

                renderTrendChart(res);
                populateTrendTable(res);
            },
            error: function (xhr) {
                console.error('Chart load error:', xhr.statusText);
                $("#chartContainerTrend").html('<div style="padding:20px;color:#c00">Error loading chart</div>');
            }
        });
    }

    function renderTrendChart(data) {
        const dataPoints = data.map(function (d) {
            return {
                label: d.MonthDetails || 'N/A',
                y: parseFloat(d.Amount || 0)
            };
        });

        const chart = new CanvasJS.Chart("chartContainerTrend", {
            animationEnabled: true,
            theme: "light2",
            toolTip: {
                content: "<strong>{label}</strong> : {y}"
            },
            axisY: {
                prefix: "",
                includeZero: true,
                labelFontSize: 10
            },
            axisX: {
                labelAngle: 0,
                labelFontSize: 10,
                interval: 1
            },
            data: [{
                type: "column",
                markerType: "circle",
                markerSize: 6,
                lineThickness: 2.5,
                color: "#0d6efd",
                dataLabelFontSize: 8,
                indexLabel: "{y}",
                dataPoints: dataPoints
            }]
        });

        chart.render();
    }

    function populateTrendTable(data) {
        let sumRow = "<tr><td><b>Sum</b></td>";
        let amtRow = "<tr><td><b>Amt</b></td>";
        let monthRow = "<tr><td><b>Month</b></td>";
        let _sum = 0;

        data.forEach(function (item, index) {
            const amtVal = parseFloat(item.Amount || 0);
            const month = item.MonthDetails || 'N/A';
            _sum = _sum + amtVal;
            
            amtRow += "<td class='text-right'>" + amtVal + "</td>";
            monthRow += "<td>" + month + "</td>";
            sumRow += "<td class='text-right'>" + Intl.NumberFormat('en-IN').format(_sum) + "</td>";
            
        });

        sumRow += "</tr>";
        amtRow += "</tr>";
        monthRow += "</tr>";

        let finalHtml = sumRow + amtRow + monthRow;

        $("#gridTrendTable tbody").html(finalHtml);
    }
});