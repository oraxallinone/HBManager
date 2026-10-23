$(document).ready(function () {
    $('#searchDDlG1').hide();
    $('#searchDDlG2').hide();
    $('#searchDDlG3').hide();
    $('#searchDDlG4').hide();

    // Load groups on page load
    loadGroupDropdowns();

    window.trendChart = null;

    $("#btnLoadTrendChart").on("click", loadTrendChart);
    $("#toggleMonthlyAmount, #toggleRunningAverage, #toggleMonthlyAverage, #toggleCumulativeSum")
        .on("change", function () {
            if (window.trendChartData) {
                renderTrendChart(window.trendChartData);
            }
        });
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

                window.trendChartData = res;
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
        const amounts = data.map(function (d) {
            return parseFloat(d.Amount || 0);
        });
        const labels = data.map(function (d) {
            return d.MonthDetails || 'N/A';
        });
        let runningTotal = 0;
        const cumulative = amounts.map(function (amount) {
            runningTotal += amount;
            return runningTotal;
        });
        const runningAverage = amounts.map(function (amount, index) {
            return amounts.slice(0, index + 1).reduce(function (total, value) {
                return total + value;
            }, 0) / (index + 1);
        });
        const overallAverage = amounts.length
            ? amounts.reduce(function (total, amount) { return total + amount; }, 0) / amounts.length
            : 0;
        const monthlyAverage = amounts.map(function () {
            return overallAverage;
        });
        const series = [];
        const seriesColors = [];
        const seriesWidths = [];
        const seriesFills = [];

        if ($('#toggleMonthlyAmount').prop('checked')) {
            series.push({
                name: 'Monthly Amount',
                type: 'column',
                data: amounts
            });
            seriesColors.push('#1769e0');
            seriesWidths.push(0);
            seriesFills.push(1);
        }
        if ($('#toggleRunningAverage').prop('checked')) {
            series.push({
                name: 'Average Till Now',
                type: 'line',
                data: runningAverage
            });
            seriesColors.push('#9b2226');
            seriesWidths.push(2);
            seriesFills.push(1);
        }
        if ($('#toggleMonthlyAverage').prop('checked')) {
            series.push({
                name: 'Each Month Average',
                type: 'line',
                data: monthlyAverage
            });
            seriesColors.push('#c27c0e');
            seriesWidths.push(2);
            seriesFills.push(1);
        }
        if ($('#toggleCumulativeSum').prop('checked')) {
            series.push({
                name: 'Cumulative Sum',
                type: 'area',
                data: cumulative
            });
            seriesColors.push('#3d1d5b');
            seriesWidths.push(2);
            seriesFills.push(0.2);
        }

        if (window.trendChart) {
            window.trendChart.destroy();
        }

        window.trendChart = new ApexCharts(document.querySelector('#chartContainerTrend'), {
            chart: {
                type: 'line',
                height: 420,
                animations: { enabled: true },
                toolbar: {
                    show: true,
                    tools: {
                        customIcons: [{
                            icon: '<span class="trend-chart-maximize-icon" aria-hidden="true">⛶</span>',
                            index: -1,
                            title: 'Maximize chart',
                            class: 'trend-chart-maximize-button',
                            click: function () {
                                toggleTrendChartMaximize();
                            }
                        }]
                    }
                },
                zoom: { enabled: true }
            },
            series: series,
            colors: seriesColors,
            stroke: {
                width: seriesWidths,
                curve: 'smooth'
            },
            fill: {
                opacity: seriesFills
            },
            markers: {
                size: 4,
                hover: { sizeOffset: 2 }
            },
            dataLabels: {
                enabled: true,
                formatter: function (value) {
                    return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                },
                offsetY: -3,
                style: { fontSize: '10px', colors: ['#4b5563'] }
            },
            xaxis: {
                categories: labels,
                tickPlacement: 'on',
                labels: { rotate: 0, style: { fontSize: '10px' } }
            },
            yaxis: {
                min: 0,
                labels: {
                    formatter: function (value) {
                        return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                    }
                },
                title: { text: 'Amount (₹)' }
            },
            grid: {
                padding: {
                    top: 35
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (value) {
                        return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    }
                }
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center'
            },
            noData: {
                text: 'Select a chart series'
            }
        });

        window.trendChart.render();
    }

    function toggleTrendChartMaximize() {
        var chartCard = $('#trendChartCard');
        var isMaximized = chartCard.toggleClass('trend-chart-maximized').hasClass('trend-chart-maximized');
        $('.trend-chart-maximize-button')
            .attr('title', isMaximized ? 'Minimize chart' : 'Maximize chart')
            .find('.trend-chart-maximize-icon')
            .text(isMaximized ? '⛶' : '⛶');

        if (window.trendChart) {
            window.trendChart.updateOptions({
                chart: {
                    height: isMaximized ? Math.max(window.innerHeight - 105, 420) : 420
                }
            }, false, false);
        }
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