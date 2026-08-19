$(document).ready(function () {
    $('#stockSearchForm').on('submit', function (e) {
        e.preventDefault();
        var symbol = $('#txtStockSymbol').val().trim();
        if (!symbol) {
            showError('Please enter a stock symbol.');
            return;
        }
        fetchStockData(symbol);
    });

    function fetchStockData(symbol) {
        // Show loading spinner
        $('#loadingSpinner').show();
        hideAllSections();
        hideError();

        $.ajax({
            url: '/Default/GetStockTechFundamentalData',
            type: 'POST',
            data: { stockSymbol: symbol },
            dataType: 'json',
            timeout: 30000,
            success: function (response) {
                $('#loadingSpinner').hide();

                if (!response.success) {
                    showError(response.message || 'Unable to fetch stock data.');
                    return;
                }

                // Display all sections
                displayCompanyOverview(response.profile);
                displayTechnicalData(response.metrics, response.ratios);
                displayFundamentalData(response.ratios, response.growth);
                displayFinancialStatements(response.income, response.balance, response.cashFlow);
            },
            error: function (xhr, status, error) {
                $('#loadingSpinner').hide();
                var errorMsg = 'Error fetching data: ' + (error || 'Unknown error');
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showError(errorMsg);
                console.error('AJAX Error:', xhr, status, error);
            }
        });
    }

    function displayCompanyOverview(profile) {
        if (!profile) {
            return;
        }

        var html = '<div class="row" style="margin: 0;">';

        if (profile.companyName) {
            html += '<div class="col-md-12" style="padding:10px 0; margin-bottom:10px; border-bottom:2px solid #0c5460;">' +
                '<h4 style="color:#0c5460; margin:0;">' + profile.companyName + ' (' + profile.symbol + ')</h4>' +
                '</div>';
        }

        var metrics = [
            { label: 'Sector', value: profile.sector },
            { label: 'Industry', value: profile.industry },
            { label: 'Country', value: profile.country },
            { label: 'Website', value: profile.website },
            { label: 'CEO', value: profile.ceo },
            { label: 'Employees', value: profile.employees ? formatNumber(profile.employees) : null }
        ];

        html += '<div class="col-md-12">';
        metrics.forEach(function (metric) {
            if (metric.value) {
                html += '<div style="margin-bottom:8px;"><strong>' + metric.label + ':</strong> ' + metric.value + '</div>';
            }
        });
        html += '</div></div>';

        $('#companyOverviewContainer').html(html);
        $('#companyOverviewSection').show();
    }

    function displayTechnicalData(metrics, ratios) {
        if (!metrics && !ratios) {
            return;
        }

        var html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">';

        // From Key Metrics
        if (metrics) {
            if (metrics.peRatio) {
                html += createMetricBox('P/E Ratio', formatNumber(metrics.peRatio, 2), '#1565c0');
            }
            if (metrics.pbRatio) {
                html += createMetricBox('P/B Ratio', formatNumber(metrics.pbRatio, 2), '#388e3c');
            }
            if (metrics.psRatio) {
                html += createMetricBox('P/S Ratio', formatNumber(metrics.psRatio, 2), '#f57c00');
            }
            if (metrics.evToRevenue) {
                html += createMetricBox('EV/Revenue', formatNumber(metrics.evToRevenue, 2), '#512da8');
            }
            if (metrics.evToOperatingCashFlow) {
                html += createMetricBox('EV/Operating CF', formatNumber(metrics.evToOperatingCashFlow, 2), '#c2185b');
            }
            if (metrics.bookValuePerShare) {
                html += createMetricBox('Book Value/Share', '$' + formatNumber(metrics.bookValuePerShare, 2), '#00796b');
            }
            if (metrics.dividendYield) {
                html += createMetricBox('Dividend Yield', (metrics.dividendYield * 100).toFixed(2) + '%', '#d32f2f');
            }
            if (metrics.returnOnEquity) {
                html += createMetricBox('ROE', (metrics.returnOnEquity * 100).toFixed(2) + '%', '#2e7d32');
            }
            if (metrics.returnOnAssets) {
                html += createMetricBox('ROA', (metrics.returnOnAssets * 100).toFixed(2) + '%', '#1976d2');
            }
        }

        html += '</div>';
        $('#technicalDataContainer').html(html);
        $('#technicalDataSection').show();
    }

    function displayFundamentalData(ratios, growth) {
        if (!ratios && !growth) {
            return;
        }

        var html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">';

        // Profitability Ratios
        if (ratios) {
            if (ratios.netProfitMargin) {
                html += createMetricBox('Net Profit Margin', (ratios.netProfitMargin * 100).toFixed(2) + '%', '#388e3c');
            }
            if (ratios.grossProfitMargin) {
                html += createMetricBox('Gross Profit Margin', (ratios.grossProfitMargin * 100).toFixed(2) + '%', '#4caf50');
            }
            if (ratios.operatingProfitMargin) {
                html += createMetricBox('Operating Margin', (ratios.operatingProfitMargin * 100).toFixed(2) + '%', '#66bb6a');
            }
            if (ratios.currentRatio) {
                html += createMetricBox('Current Ratio', formatNumber(ratios.currentRatio, 2), '#1976d2');
            }
            if (ratios.quickRatio) {
                html += createMetricBox('Quick Ratio', formatNumber(ratios.quickRatio, 2), '#42a5f5');
            }
            if (ratios.debtToEquity) {
                html += createMetricBox('Debt/Equity', formatNumber(ratios.debtToEquity, 2), '#d32f2f');
            }
            if (ratios.debtRatio) {
                html += createMetricBox('Debt Ratio', (ratios.debtRatio * 100).toFixed(2) + '%', '#f44336');
            }
        }

        // Growth Metrics
        if (growth) {
            if (growth.revenueGrowth) {
                var color = growth.revenueGrowth > 0 ? '#388e3c' : '#d32f2f';
                html += createMetricBox('Revenue Growth', (growth.revenueGrowth * 100).toFixed(2) + '%', color);
            }
            if (growth.operatingIncomeGrowth) {
                var color = growth.operatingIncomeGrowth > 0 ? '#388e3c' : '#d32f2f';
                html += createMetricBox('Operating Income Growth', (growth.operatingIncomeGrowth * 100).toFixed(2) + '%', color);
            }
            if (growth.netIncomeGrowth) {
                var color = growth.netIncomeGrowth > 0 ? '#388e3c' : '#d32f2f';
                html += createMetricBox('Net Income Growth', (growth.netIncomeGrowth * 100).toFixed(2) + '%', color);
            }
            if (growth.epsgrowth) {
                var color = growth.epsgrowth > 0 ? '#388e3c' : '#d32f2f';
                html += createMetricBox('EPS Growth', (growth.epsgrowth * 100).toFixed(2) + '%', color);
            }
        }

        html += '</div>';
        $('#fundamentalDataContainer').html(html);
        $('#fundamentalDataSection').show();
    }

    function displayFinancialStatements(income, balance, cashFlow) {
        if (!income && !balance && !cashFlow) {
            return;
        }

        // Income Statement
        if (income) {
            var incomeHtml = '<div style="overflow-x: auto;">' +
                '<table class="table table-sm table-bordered" style="font-size: 12px; margin-bottom: 0;">' +
                '<tbody>';

            incomeHtml += addRowToTable('Total Revenue', income.revenue);
            incomeHtml += addRowToTable('Cost of Revenue', income.costOfRevenue);
            incomeHtml += addRowToTable('Gross Profit', income.grossProfit);
            incomeHtml += addRowToTable('Operating Expenses', income.operatingExpenses);
            incomeHtml += addRowToTable('Operating Income', income.operatingIncome);
            incomeHtml += addRowToTable('Interest Expense', income.interestExpense);
            incomeHtml += addRowToTable('Net Income', income.netIncome);
            incomeHtml += addRowToTable('EPS (Basic)', income.eps);

            incomeHtml += '</tbody></table></div>';
            $('#incomeStatementContainer').html(incomeHtml);
        }

        // Balance Sheet
        if (balance) {
            var balanceHtml = '<div style="overflow-x: auto;">' +
                '<table class="table table-sm table-bordered" style="font-size: 12px; margin-bottom: 0;">' +
                '<tbody>';

            balanceHtml += addRowToTable('Total Assets', balance.totalAssets);
            balanceHtml += addRowToTable('Current Assets', balance.totalCurrentAssets);
            balanceHtml += addRowToTable('Total Liabilities', balance.totalLiabilities);
            balanceHtml += addRowToTable('Current Liabilities', balance.totalCurrentLiabilities);
            balanceHtml += addRowToTable('Total Stockholders Equity', balance.totalStockholdersEquity);
            balanceHtml += addRowToTable('Common Stock', balance.commonStock);
            balanceHtml += addRowToTable('Retained Earnings', balance.retainedEarnings);

            balanceHtml += '</tbody></table></div>';
            $('#balanceStatementContainer').html(balanceHtml);
        }

        // Cash Flow Statement
        if (cashFlow) {
            var cashFlowHtml = '<div style="overflow-x: auto;">' +
                '<table class="table table-sm table-bordered" style="font-size: 12px; margin-bottom: 0;">' +
                '<tbody>';

            cashFlowHtml += addRowToTable('Operating Cash Flow', cashFlow.operatingCashFlow);
            cashFlowHtml += addRowToTable('Investing Cash Flow', cashFlow.investingCashFlow);
            cashFlowHtml += addRowToTable('Financing Cash Flow', cashFlow.financingCashFlow);
            cashFlowHtml += addRowToTable('Free Cash Flow', cashFlow.freeCashFlow);
            cashFlowHtml += addRowToTable('Capital Expenditure', cashFlow.capitalExpenditure);
            cashFlowHtml += addRowToTable('Depreciation & Amortization', cashFlow.depreciationAndAmortization);

            cashFlowHtml += '</tbody></table></div>';
            $('#cashFlowStatementContainer').html(cashFlowHtml);
        }

        $('#financialStatementsSection').show();
    }

    function createMetricBox(label, value, color) {
        return '<div style="border:1px solid ' + color + '; background:' + color + '15; padding:12px; border-radius:4px; text-align:center;">' +
            '<div style="font-size:11px; color:#555; margin-bottom:6px;">' + label + '</div>' +
            '<div style="font-size:16px; font-weight:700; color:' + color + ';">' + value + '</div>' +
            '</div>';
    }

    function addRowToTable(label, value) {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        return '<tr style="border-bottom: 1px solid #ddd;">' +
            '<td style="font-weight: 600; color: #333; width: 50%; padding: 8px;">' + label + '</td>' +
            '<td style="text-align: right; padding: 8px; color: #1976d2; font-weight: 600;">$' + formatNumber(value, 0) + '</td>' +
            '</tr>';
    }

    function formatNumber(value, decimals) {
        if (!value) return 'N/A';
        var num = Number(value);
        if (isNaN(num)) return 'N/A';

        decimals = decimals || 2;

        if (Math.abs(num) >= 1000000000) {
            return (num / 1000000000).toFixed(decimals) + 'B';
        } else if (Math.abs(num) >= 1000000) {
            return (num / 1000000).toFixed(decimals) + 'M';
        } else if (Math.abs(num) >= 1000) {
            return (num / 1000).toFixed(decimals) + 'K';
        }
        return num.toFixed(decimals);
    }

    function hideAllSections() {
        $('#companyOverviewSection').hide();
        $('#technicalDataSection').hide();
        $('#fundamentalDataSection').hide();
        $('#financialStatementsSection').hide();
    }

    function showError(message) {
        $('#errorMessage').text(message);
        $('#errorSection').show();
    }

    function hideError() {
        $('#errorSection').hide();
    }
});
