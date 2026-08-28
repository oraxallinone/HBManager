$(document).ready(function () {
    var defaultSymbol = $('#txtStockSymbol').val() || 'RELIANCE';

    function formatDateWithDay(dateString) {
        if (!dateString) {
            return '';
        }

        var date = new Date(dateString + 'T00:00:00');
        var isoDate = date.toISOString().split('T')[0];
        var dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        return isoDate + ' (' + dayName + ')';
    }

    function normalizeSymbol(raw, exchange) {
        var value = (raw || '').trim();
        if (!value) {
            return '';
        }

        value = value.toUpperCase();
        if (!value.endsWith('.NS') && !value.endsWith('.BO')) {
            value += exchange === 'BSE' ? '.BO' : '.NS';
        }

        return value;
    }

    function buildCandlesFromYahoo(data) {
        if (!data || !data.chart || !data.chart.result || !data.chart.result.length) {
            return { success: false, message: 'No market data returned for this symbol.' };
        }

        var result = data.chart.result[0];
        if (!result || !result.timestamp || !result.indicators || !result.indicators.quote || !result.indicators.quote.length) {
            return { success: false, message: 'No candle data returned for this symbol.' };
        }

        var timestamps = result.timestamp;
        var quote = result.indicators.quote[0];
        var opens = quote.open || [];
        var highs = quote.high || [];
        var lows = quote.low || [];
        var closes = quote.close || [];
        var volumes = quote.volume || [];

        var candles = [];
        for (var i = 0; i < timestamps.length; i++) {
            if (!opens[i] || !highs[i] || !lows[i] || !closes[i] || !volumes[i]) {
                continue;
            }

            var date = new Date(timestamps[i] * 1000);
            candles.push({
                date: date.toISOString().split('T')[0],
                open: Number(opens[i]),
                high: Number(highs[i]),
                low: Number(lows[i]),
                close: Number(closes[i]),
                volume: Number(volumes[i])
            });
        }

        if (!candles.length) {
            return { success: false, message: 'No valid candle values were found.' };
        }

        return {
            success: true,
            symbol: result.meta && result.meta.symbol ? result.meta.symbol.replace('.NS', '') : normalizeSymbol(defaultSymbol).replace('.NS', ''),
            candles: candles
        };
    }

    function renderCandleChart(candles, symbol) {
        if (!candles || !candles.length) {
            $('#stockChartContainer').html('<div style="padding:20px;color:#666">No candle data available.</div>');
            return;
        }

        var seriesData = candles.map(function (c) {
            return {
                x: new Date(c.date + 'T00:00:00').getTime(),
                y: [Number(c.open), Number(c.high), Number(c.low), Number(c.close)]
            };
        });

        var chart = new ApexCharts(document.querySelector('#stockChartContainer'), {
            chart: {
                type: 'candlestick',
                height: 540,
                background: '#f8f9fb',
                toolbar: {
                    show: true
                },
                animations: {
                    enabled: true,
                    speed: 800
                }
            },
            series: [{
                name: symbol,
                data: seriesData
            }],
            title: {
                text: symbol + ' Last 9 Months OHLC',
                align: 'center',
                style: {
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1f2d3d'
                }
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    format: 'dd MMM'
                },
                tooltip: {
                    enabled: true
                }
            },
            yaxis: {
                labels: {
                    formatter: function (value) {
                        return '₹' + Number(value).toFixed(2);
                    }
                },
                tooltip: {
                    enabled: true
                }
            },
            plotOptions: {
                candlestick: {
                    colors: {
                        upward: '#19a974',
                        downward: '#ef4444'
                    }
                }
            },
            tooltip: {
                theme: 'light',
                x: {
                    format: 'dd MMM yyyy'
                },
                y: {
                    formatter: function (value) {
                        return '₹' + Number(value).toFixed(2);
                    }
                }
            },
            grid: {
                borderColor: '#dfe6ee',
                strokeDashArray: 3
            },
            stroke: {
                width: 1,
                colors: ['#4a5a6a']
            }
        });

        chart.render();
    }

    function populateCandleTable(candles) {
        if (!candles || !candles.length) {
            $('#stockTable tbody').html('<tr><td colspan="9" class="text-center text-muted">No candle data available.</td></tr>');
            return;
        }

        // Group candles by month
        var monthlyGroups = {};
        candles.forEach(function (c) {
            var date = new Date(c.date + 'T00:00:00');
            var monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
            var monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });

            if (!monthlyGroups[monthKey]) {
                monthlyGroups[monthKey] = {
                    monthLabel: monthLabel,
                    candles: []
                };
            }
            monthlyGroups[monthKey].candles.push(c);
        });

        var rows = '';
        Object.keys(monthlyGroups).sort(function (firstKey, secondKey) {
            return secondKey.localeCompare(firstKey);
        }).forEach(function (monthKey) {
            var group = monthlyGroups[monthKey];
            group.candles.sort(function (first, second) {
                return new Date(second.date) - new Date(first.date);
            });
            var monthHeaderRow = '<tr style="background:#e8f0f7; font-weight:bold; border-top:2px solid #1d78b4;"><td colspan="9" style="padding:8px; color:#1a3f5f;">' + group.monthLabel + '</td></tr>';
            rows += monthHeaderRow;

            group.candles.forEach(function (c) {
                rows += renderCandleRow(c);
            });
        });

        $('#stockTable tbody').html(rows);
    }

    function renderCandleRow(c) {
        var changeAmt = Number(c.close) - Number(c.open);
        var changePct = Number(c.open) === 0 ? 0 : (changeAmt / Number(c.open)) * 100;
        var status = changeAmt >= 0 ? 'Up' : 'Down';
        var statusColor = changeAmt >= 0 ? '#1e7e34' : '#d32f2f';

        return '<tr>' +
            '<td>' + formatDateWithDay(c.date) + '</td>' +
            '<td>' + Number(c.open).toFixed(2) + '</td>' +
            '<td>' + Number(c.high).toFixed(2) + '</td>' +
            '<td>' + Number(c.low).toFixed(2) + '</td>' +
            '<td>' + Number(c.close).toFixed(2) + '</td>' +
            '<td style="color:' + (changePct >= 0 ? '#1e7e34' : '#d32f2f') + '; font-weight:bold;">' + changePct.toFixed(2) + '%</td>' +
            '<td style="color:' + (changeAmt >= 0 ? '#1e7e34' : '#d32f2f') + '; font-weight:bold;">' + changeAmt.toFixed(2) + '</td>' +
            '<td style="color:' + statusColor + '; font-weight:bold; text-transform:uppercase;">' + status + '</td>' +
            '<td>' + Number(c.volume).toLocaleString('en-IN') + '</td>' +
            '</tr>';
    }

    function clearStockDataView() {
        $('#stockChartContainer').empty();
        $('#stockChartContainer').html('<div style="padding:20px;color:#666;">Loading stock data...</div>');
        $('#stockSummaryPanel').html('<div class="card-body" style="padding:12px 14px;"><div style="font-size:18px; font-weight:600; color:#1a3f5f; margin-bottom:10px;">Stock Summary</div><div style="font-size:13px; color:#666;">Loading summary...</div></div>');
        $('#stockTable tbody').html('<tr><td colspan="9" class="text-center text-muted">Loading data...</td></tr>');
        $('#technicalDataContainer').html('<div class="text-center text-muted">Loading technical data...</div>');
        $('#fundamentalDataContainer').html('<div class="text-center text-muted">Loading fundamental data...</div>');
    }

    function buildMonthlySummary(candles) {
        var monthlyMap = {};

        candles.forEach(function (c) {
            var date = new Date(c.date + 'T00:00:00');
            var monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
            var monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });

            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = {
                    monthKey: monthKey,
                    monthLabel: monthLabel,
                    firstClose: null,
                    lastClose: null,
                    upCount: 0,
                    downCount: 0
                };
            }

            var current = monthlyMap[monthKey];
            if (current.firstClose === null) {
                current.firstClose = Number(c.close);
            }

            current.lastClose = Number(c.close);

            var changeAmt = Number(c.close) - Number(c.open);
            if (changeAmt >= 0) {
                current.upCount += 1;
            } else {
                current.downCount += 1;
            }
        });

        return Object.keys(monthlyMap)
            .map(function (key) {
                var item = monthlyMap[key];
                var amountChange = item.lastClose - item.firstClose;
                var percentChange = item.firstClose === 0 ? 0 : (amountChange / item.firstClose) * 100;

                return {
                    monthKey: item.monthKey,
                    monthLabel: item.monthLabel,
                    firstClose: item.firstClose,
                    lastClose: item.lastClose,
                    amountChange: amountChange,
                    percentChange: percentChange,
                    upCount: item.upCount,
                    downCount: item.downCount
                };
            })
            .sort(function (a, b) {
                return b.monthKey.localeCompare(a.monthKey);
            });
    }

    function renderSummaryPanel(candles) {
        if (!candles || !candles.length) {
            $('#stockSummaryPanel').html('<div class="card-body" style="padding:12px 14px;"><div style="font-size:18px; font-weight:600; color:#1a3f5f; margin-bottom:10px;">Stock Summary</div><div style="font-size:13px; color:#666;">No data available.</div></div>');
            return;
        }

        var monthlySummary = buildMonthlySummary(candles);
        var lastSixMonths = monthlySummary.slice(0, 9);
        var lastSixCount = lastSixMonths.length;

        var lastSixAmountChange = lastSixMonths.reduce(function (sum, item) {
            return sum + item.amountChange;
        }, 0);

        var lastSixPercentChange = lastSixMonths.length && lastSixMonths[0] && lastSixMonths[0].firstClose ? ((lastSixMonths[lastSixMonths.length - 1].lastClose - lastSixMonths[0].firstClose) / lastSixMonths[0].firstClose) * 100 : 0;

        var lastSixUp = lastSixMonths.reduce(function (sum, item) {
            return sum + item.upCount;
        }, 0);

        var lastSixDown = lastSixMonths.reduce(function (sum, item) {
            return sum + item.downCount;
        }, 0);

        var monthlyRows = monthlySummary.map(function (item) {
            return '<tr>' +
                '<td>' + item.monthLabel + '</td>' +
                '<td>' + Number(item.firstClose).toFixed(2) + '</td>' +
                '<td>' + Number(item.lastClose).toFixed(2) + '</td>' +
                '<td style="color:' + (item.amountChange >= 0 ? '#1e7e34' : '#d32f2f') + '; font-weight:bold;">' + Number(item.amountChange).toFixed(2) + '</td>' +
                '<td style="color:' + (item.percentChange >= 0 ? '#1e7e34' : '#d32f2f') + '; font-weight:bold;">' + Number(item.percentChange).toFixed(2) + '%</td>' +
                '<td>' + item.upCount + '</td>' +
                '<td>' + item.downCount + '</td>' +
                '</tr>';
        }).join('');

        var summaryHtml = '<div class="card-body" style="padding:12px 14px;">' +
            '<div style="font-size:18px; font-weight:600; color:#1a3f5f; margin-bottom:12px;">Monthly Summary</div>' +
            '<div style="overflow:auto; max-height:260px; border:1px solid #dfe6ee;">' +
            '<table class="table table-sm table-bordered mb-0" style="font-size:12px; margin:0; width:100%;">' +
            '<thead style="background:#f4f6f9;">' +
            '<tr>' +
            '<th>Month</th><th>First Close</th><th>Last Close</th><th>Amount Change</th><th>% Change</th><th>Up</th><th>Down</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>' + monthlyRows + '</tbody>' +
            '</table>' +
            '</div>' +
            '<div style="margin-top:14px; border-top:1px solid #dfe6ee; padding-top:12px;">' +
            '<div style="font-size:16px; font-weight:600; color:#1a3f5f; margin-bottom:8px;">Last 9 Month Summary</div>' +
            '<div class="row" style="margin:0;">' +
            '<div class="col-md-3" style="padding:6px 8px;"><div style="border:1px solid #dfe6ee; background:#f9fbfd; padding:8px 10px; border-radius:4px;"><div style="font-size:11px; color:#666;">Amount Change</div><div style="font-size:15px; font-weight:700; color:' + (lastSixAmountChange >= 0 ? '#1e7e34' : '#d32f2f') + ';">' + Number(lastSixAmountChange).toFixed(2) + '</div></div></div>' +
            '<div class="col-md-3" style="padding:6px 8px;"><div style="border:1px solid #dfe6ee; background:#f9fbfd; padding:8px 10px; border-radius:4px;"><div style="font-size:11px; color:#666;">% Change</div><div style="font-size:15px; font-weight:700; color:' + (lastSixPercentChange >= 0 ? '#1e7e34' : '#d32f2f') + ';">' + Number(lastSixPercentChange).toFixed(2) + '%</div></div></div>' +
            '<div class="col-md-3" style="padding:6px 8px;"><div style="border:1px solid #dfe6ee; background:#f9fbfd; padding:8px 10px; border-radius:4px;"><div style="font-size:11px; color:#666;">Up Count</div><div style="font-size:15px; font-weight:700; color:#1e7e34;">' + lastSixUp + '</div></div></div>' +
            '<div class="col-md-3" style="padding:6px 8px;"><div style="border:1px solid #dfe6ee; background:#f9fbfd; padding:8px 10px; border-radius:4px;"><div style="font-size:11px; color:#666;">Down Count</div><div style="font-size:15px; font-weight:700; color:#d32f2f;">' + lastSixDown + '</div></div></div>' +
            '</div>' +
            '</div>' +
            '</div>';

        $('#stockSummaryPanel').html(summaryHtml);
    }

    function calculateTechnicalIndicators(candles) {
        if (!candles || candles.length < 2) {
            return null;
        }

        var closes = candles.map(function (c) { return Number(c.close); });
        var highs = candles.map(function (c) { return Number(c.high); });
        var lows = candles.map(function (c) { return Number(c.low); });
        var volumes = candles.map(function (c) { return Number(c.volume); });

        // Calculate 20-day and 50-day Simple Moving Averages
        var sma20 = closes.length >= 20 ? closes.slice(-20).reduce(function (a, b) { return a + b; }, 0) / 20 : null;
        var sma50 = closes.length >= 50 ? closes.slice(-50).reduce(function (a, b) { return a + b; }, 0) / 50 : null;

        // Calculate RSI (14-period)
        var rsi = calculateRSI(closes, 14);

        // Calculate MACD
        var macd = calculateMACD(closes);

        // Calculate Bollinger Bands (20-period)
        var bollingerBands = calculateBollingerBands(closes, 20, 2);

        // Current values
        var currentPrice = closes[closes.length - 1];
        var previousPrice = closes[closes.length - 2];
        var priceChange = currentPrice - previousPrice;
        var priceChangePercent = (priceChange / previousPrice) * 100;

        // Volatility (Average True Range approximation)
        var atr = calculateATR(highs, lows, closes, 14);

        // Average Volume
        var avgVolume = volumes.reduce(function (a, b) { return a + b; }, 0) / volumes.length;

        // 52-week high and low
        var high52w = Math.max.apply(null, highs);
        var low52w = Math.min.apply(null, lows);

        return {
            currentPrice: currentPrice,
            priceChange: priceChange,
            priceChangePercent: priceChangePercent,
            sma20: sma20,
            sma50: sma50,
            rsi: rsi,
            macd: macd,
            bollingerBands: bollingerBands,
            atr: atr,
            avgVolume: avgVolume,
            high52w: high52w,
            low52w: low52w
        };
    }

    function calculateRSI(closes, period) {
        if (closes.length < period + 1) return null;

        var gains = 0, losses = 0;
        for (var i = closes.length - period; i < closes.length; i++) {
            var change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        var avgGain = gains / period;
        var avgLoss = losses / period;
        var rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        var rsi = 100 - (100 / (1 + rs));

        return rsi;
    }

    function calculateMACD(closes) {
        if (closes.length < 26) return null;

        var ema12 = calculateEMA(closes, 12);
        var ema26 = calculateEMA(closes, 26);
        var macdLine = ema12 - ema26;

        // Signal line (9-period EMA of MACD)
        var macdValues = [];
        for (var i = 26; i <= closes.length; i++) {
            var e12 = calculateEMA(closes.slice(0, i), 12);
            var e26 = calculateEMA(closes.slice(0, i), 26);
            macdValues.push(e12 - e26);
        }
        var signalLine = calculateEMA(macdValues, 9);
        var histogram = macdLine - signalLine;

        return {
            macdLine: macdLine,
            signalLine: signalLine,
            histogram: histogram
        };
    }

    function calculateEMA(closes, period) {
        if (closes.length < period) return null;

        var sma = closes.slice(0, period).reduce(function (a, b) { return a + b; }, 0) / period;
        var multiplier = 2 / (period + 1);
        var ema = sma;

        for (var i = period; i < closes.length; i++) {
            ema = closes[i] * multiplier + ema * (1 - multiplier);
        }

        return ema;
    }

    function calculateBollingerBands(closes, period, stdDevs) {
        if (closes.length < period) return null;

        var lastPrices = closes.slice(-period);
        var sma = lastPrices.reduce(function (a, b) { return a + b; }, 0) / period;

        var variance = lastPrices.reduce(function (sum, price) {
            return sum + Math.pow(price - sma, 2);
        }, 0) / period;

        var stdDev = Math.sqrt(variance);
        var upperBand = sma + (stdDev * stdDevs);
        var lowerBand = sma - (stdDev * stdDevs);

        return {
            middle: sma,
            upper: upperBand,
            lower: lowerBand
        };
    }

    function calculateATR(highs, lows, closes, period) {
        if (highs.length < period) return null;

        var trueRanges = [];
        for (var i = 1; i < highs.length; i++) {
            var tr = Math.max(
                highs[i] - lows[i],
                Math.abs(highs[i] - closes[i - 1]),
                Math.abs(lows[i] - closes[i - 1])
            );
            trueRanges.push(tr);
        }

        var lastATR = trueRanges.slice(-period).reduce(function (a, b) { return a + b; }, 0) / period;
        return lastATR;
    }

    function renderTechnicalData(indicators, symbol) {
        if (!indicators) {
            $('#technicalDataContainer').html('<div class="text-center text-muted">Unable to calculate technical indicators.</div>');
            return;
        }

        var techHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">' +
            // Price and Change
            '<div style="border:1px solid #e3f2fd; background:#f5f9ff; padding:12px; border-radius:4px;">' +
            '<div style="font-size:12px; color:#555; margin-bottom:4px;">Current Price</div>' +
            '<div style="font-size:18px; font-weight:700; color:#1565c0;">₹' + Number(indicators.currentPrice).toFixed(2) + '</div>' +
            '<div style="font-size:12px; color:' + (indicators.priceChange >= 0 ? '#2e7d32' : '#c62828') + '; font-weight:600;">' +
            (indicators.priceChange >= 0 ? '+' : '') + Number(indicators.priceChange).toFixed(2) + ' (' + Number(indicators.priceChangePercent).toFixed(2) + '%)</div>' +
            '</div>' +
            // SMA 20
            (indicators.sma20 ? '<div style="border:1px solid #f3e5f5; background:#faf5ff; padding:12px; border-radius:4px;">' +
                '<div style="font-size:12px; color:#555; margin-bottom:4px;">SMA 20</div>' +
                '<div style="font-size:18px; font-weight:700; color:#7b1fa2;">₹' + Number(indicators.sma20).toFixed(2) + '</div>' +
                '<div style="font-size:12px; color:' + (indicators.currentPrice > indicators.sma20 ? '#2e7d32' : '#c62828') + '; font-weight:600;">' +
                (indicators.currentPrice > indicators.sma20 ? 'Above' : 'Below') + ' SMA</div>' +
                '</div>' : '') +
            // SMA 50
            (indicators.sma50 ? '<div style="border:1px solid #e8f5e9; background:#f1f8f4; padding:12px; border-radius:4px;">' +
                '<div style="font-size:12px; color:#555; margin-bottom:4px;">SMA 50</div>' +
                '<div style="font-size:18px; font-weight:700; color:#388e3c;">₹' + Number(indicators.sma50).toFixed(2) + '</div>' +
                '<div style="font-size:12px; color:' + (indicators.currentPrice > indicators.sma50 ? '#2e7d32' : '#c62828') + '; font-weight:600;">' +
                (indicators.currentPrice > indicators.sma50 ? 'Above' : 'Below') + ' SMA</div>' +
                '</div>' : '') +
            // RSI
            (indicators.rsi ? '<div style="border:1px solid #fff3e0; background:#fffbf0; padding:12px; border-radius:4px;">' +
                '<div style="font-size:12px; color:#555; margin-bottom:4px;">RSI (14)</div>' +
                '<div style="font-size:18px; font-weight:700; color:' + (indicators.rsi > 70 ? '#d32f2f' : indicators.rsi < 30 ? '#388e3c' : '#f57c00') + ';">' + Number(indicators.rsi).toFixed(2) + '</div>' +
                '<div style="font-size:12px; color:' + (indicators.rsi > 70 ? '#d32f2f' : indicators.rsi < 30 ? '#388e3c' : '#f57c00') + '; font-weight:600;">' +
                (indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral') + '</div>' +
                '</div>' : '') +
            // ATR
            (indicators.atr ? '<div style="border:1px solid #ede7f6; background:#f3e5f5; padding:12px; border-radius:4px;">' +
                '<div style="font-size:12px; color:#555; margin-bottom:4px;">ATR (14)</div>' +
                '<div style="font-size:18px; font-weight:700; color:#512da8;">₹' + Number(indicators.atr).toFixed(2) + '</div>' +
                '<div style="font-size:12px; color:#666;">Volatility Measure</div>' +
                '</div>' : '') +
            // 52-week High
            '<div style="border:1px solid #fce4ec; background:#fff5f8; padding:12px; border-radius:4px;">' +
            '<div style="font-size:12px; color:#555; margin-bottom:4px;">52-Week High</div>' +
            '<div style="font-size:18px; font-weight:700; color:#c2185b;">₹' + Number(indicators.high52w).toFixed(2) + '</div>' +
            '<div style="font-size:12px; color:#666;">' + Number(((indicators.currentPrice / indicators.high52w) * 100)).toFixed(1) + '% of high</div>' +
            '</div>' +
            // 52-week Low
            '<div style="border:1px solid #c8e6c9; background:#e8f5e9; padding:12px; border-radius:4px;">' +
            '<div style="font-size:12px; color:#555; margin-bottom:4px;">52-Week Low</div>' +
            '<div style="font-size:18px; font-weight:700; color:#388e3c;">₹' + Number(indicators.low52w).toFixed(2) + '</div>' +
            '<div style="font-size:12px; color:#666;">' + Number(((indicators.currentPrice / indicators.low52w) * 100)).toFixed(1) + '% of low</div>' +
            '</div>' +
            '</div>';

        // Add Bollinger Bands and MACD details
        if (indicators.bollingerBands) {
            techHtml += '<div style="margin-top:15px; padding:12px; border:1px solid #e0e0e0; border-radius:4px; background:#fafafa;">' +
                '<div style="font-size:14px; font-weight:600; color:#333; margin-bottom:10px;">Bollinger Bands (20)</div>' +
                '<div class="row" style="margin:0;">' +
                '<div class="col-md-4" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Upper Band</div><div style="font-size:14px; font-weight:600; color:#d32f2f;">₹' + Number(indicators.bollingerBands.upper).toFixed(2) + '</div></div></div>' +
                '<div class="col-md-4" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Middle (SMA20)</div><div style="font-size:14px; font-weight:600; color:#1976d2;">₹' + Number(indicators.bollingerBands.middle).toFixed(2) + '</div></div></div>' +
                '<div class="col-md-4" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Lower Band</div><div style="font-size:14px; font-weight:600; color:#388e3c;">₹' + Number(indicators.bollingerBands.lower).toFixed(2) + '</div></div></div>' +
                '</div>' +
                '</div>';
        }

        if (indicators.macd) {
            techHtml += '<div style="margin-top:15px; padding:12px; border:1px solid #e0e0e0; border-radius:4px; background:#fafafa;">' +
                '<div style="font-size:14px; font-weight:600; color:#333; margin-bottom:10px;">MACD</div>' +
                '<div class="row" style="margin:0;">' +
                '<div class="col-md-4" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">MACD Line</div><div style="font-size:14px; font-weight:600; color:#1565c0;">₹' + Number(indicators.macd.macdLine).toFixed(4) + '</div></div></div>' +
                '<div class="col-md-4" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Signal Line</div><div style="font-size:14px; font-weight:600; color:#7b1fa2;">₹' + Number(indicators.macd.signalLine).toFixed(4) + '</div></div></div>' +
                '<div class="col-md-4" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Histogram</div><div style="font-size:14px; font-weight:600; color:' + (indicators.macd.histogram >= 0 ? '#388e3c' : '#d32f2f') + ';">₹' + Number(indicators.macd.histogram).toFixed(4) + '</div></div></div>' +
                '</div>' +
                '</div>';
        }

        $('#technicalDataContainer').html(techHtml);
    }

    function renderFundamentalData(symbol) {
        $.ajax({
            url: '/Default/GetStockFundamentalData',
            type: 'POST',
            data: { stockSymbol: symbol },
            dataType: 'json',
            success: function (response) {
                if (!response || !response.success || !response.data) {
                    $('#fundamentalDataContainer').html(
                        '<div style="padding:12px; text-align:center; color:#f57f17;">' +
                        '<strong>Note:</strong> Fundamental data unavailable. Please try again later.<br/>' +
                        'API Rate limits may have been reached. Free tier: 25 requests/day (Alpha Vantage) or 250/day (FMP)' +
                        '</div>'
                    );
                    return;
                }

                var data = response.data;
                var fundHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">';

                // Company Info
                if (data.name) {
                    fundHtml += '<div style="border:1px solid #e8eaf6; background:#f5f5f5; padding:12px; border-radius:4px; grid-column: 1/-1;">' +
                        '<div style="font-size:13px; font-weight:600; color:#333;">' + data.name + '</div>';
                    if (data.sector) fundHtml += '<div style="font-size:12px; color:#666;">Sector: ' + data.sector + '</div>';
                    if (data.industry) fundHtml += '<div style="font-size:12px; color:#666;">Industry: ' + data.industry + '</div>';
                    fundHtml += '</div>';
                }

                // Valuation Metrics
                if (data.marketCapitalization) {
                    fundHtml += '<div style="border:1px solid #c5cae9; background:#f0f4ff; padding:12px; border-radius:4px;">' +
                        '<div style="font-size:11px; color:#555; margin-bottom:4px;">Market Cap</div>' +
                        '<div style="font-size:16px; font-weight:700; color:#283593;">$' + formatLargeNumber(data.marketCapitalization) + '</div>' +
                        '</div>';
                }

                if (data.peRatio) {
                    fundHtml += '<div style="border:1px solid #ede7f6; background:#f3e5f5; padding:12px; border-radius:4px;">' +
                        '<div style="font-size:11px; color:#555; margin-bottom:4px;">P/E Ratio</div>' +
                        '<div style="font-size:18px; font-weight:700; color:#512da8;">' + Number(data.peRatio).toFixed(2) + '</div>' +
                        '</div>';
                }

                if (data.eps) {
                    fundHtml += '<div style="border:1px solid #c8e6c9; background:#e8f5e9; padding:12px; border-radius:4px;">' +
                        '<div style="font-size:11px; color:#555; margin-bottom:4px;">EPS (Earnings Per Share)</div>' +
                        '<div style="font-size:18px; font-weight:700; color:#388e3c;">$' + Number(data.eps).toFixed(2) + '</div>' +
                        '</div>';
                }

                if (data.priceToBookRatio) {
                    fundHtml += '<div style="border:1px solid #bbdefb; background:#e3f2fd; padding:12px; border-radius:4px;">' +
                        '<div style="font-size:11px; color:#555; margin-bottom:4px;">P/B Ratio</div>' +
                        '<div style="font-size:18px; font-weight:700; color:#1565c0;">' + Number(data.priceToBookRatio).toFixed(2) + '</div>' +
                        '</div>';
                }

                if (data.priceToSalesRatio) {
                    fundHtml += '<div style="border:1px solid #ffccbc; background:#ffe0b2; padding:12px; border-radius:4px;">' +
                        '<div style="font-size:11px; color:#555; margin-bottom:4px;">P/S Ratio</div>' +
                        '<div style="font-size:18px; font-weight:700; color:#e64a19;">' + Number(data.priceToSalesRatio).toFixed(2) + '</div>' +
                        '</div>';
                }

                if (data.dividendYield) {
                    fundHtml += '<div style="border:1px solid #f8bbd0; background:#fce4ec; padding:12px; border-radius:4px;">' +
                        '<div style="font-size:11px; color:#555; margin-bottom:4px;">Dividend Yield</div>' +
                        '<div style="font-size:18px; font-weight:700; color:#c2185b;">' + (Number(data.dividendYield) * 100).toFixed(2) + '%</div>' +
                        '</div>';
                }

                fundHtml += '</div>';

                // Profitability Metrics
                if (data.profitMargin || data.operatingMarginTTM || data.returnOnEquityTTM || data.returnOnAssetsTTM) {
                    fundHtml += '<div style="margin-top:15px; padding:12px; border:1px solid #e0e0e0; border-radius:4px; background:#fafafa;">' +
                        '<div style="font-size:14px; font-weight:600; color:#333; margin-bottom:10px;">Profitability & Returns</div>' +
                        '<div class="row" style="margin:0;">';

                    if (data.profitMargin) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Profit Margin</div><div style="font-size:14px; font-weight:600; color:#2e7d32;">' + (Number(data.profitMargin) * 100).toFixed(2) + '%</div></div></div>';
                    }

                    if (data.operatingMarginTTM) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Operating Margin</div><div style="font-size:14px; font-weight:600; color:#1976d2;">' + (Number(data.operatingMarginTTM) * 100).toFixed(2) + '%</div></div></div>';
                    }

                    if (data.returnOnEquityTTM) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Return on Equity (ROE)</div><div style="font-size:14px; font-weight:600; color:#d32f2f;">' + (Number(data.returnOnEquityTTM) * 100).toFixed(2) + '%</div></div></div>';
                    }

                    if (data.returnOnAssetsTTM) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Return on Assets (ROA)</div><div style="font-size:14px; font-weight:600; color:#6a1b9a;">' + (Number(data.returnOnAssetsTTM) * 100).toFixed(2) + '%</div></div></div>';
                    }

                    fundHtml += '</div></div>';
                }

                // Growth Metrics
                if (data.quarterlyEarningsGrowthYoY || data.quarterlyRevenueGrowthYoY) {
                    fundHtml += '<div style="margin-top:15px; padding:12px; border:1px solid #e0e0e0; border-radius:4px; background:#fafafa;">' +
                        '<div style="font-size:14px; font-weight:600; color:#333; margin-bottom:10px;">Growth Metrics (YoY)</div>' +
                        '<div class="row" style="margin:0;">';

                    if (data.quarterlyEarningsGrowthYoY) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Earnings Growth</div><div style="font-size:14px; font-weight:600; color:' + (Number(data.quarterlyEarningsGrowthYoY) > 0 ? '#388e3c' : '#d32f2f') + ';">' + (Number(data.quarterlyEarningsGrowthYoY) * 100).toFixed(2) + '%</div></div></div>';
                    }

                    if (data.quarterlyRevenueGrowthYoY) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Revenue Growth</div><div style="font-size:14px; font-weight:600; color:' + (Number(data.quarterlyRevenueGrowthYoY) > 0 ? '#388e3c' : '#d32f2f') + ';">' + (Number(data.quarterlyRevenueGrowthYoY) * 100).toFixed(2) + '%</div></div></div>';
                    }

                    fundHtml += '</div></div>';
                }

                // Moving Averages & Price Range
                if (data.fiftyDayMovingAverage || data.twoHundredDayMovingAverage || data.fiftyTwoWeekHigh || data.fiftyTwoWeekLow || data.beta) {
                    fundHtml += '<div style="margin-top:15px; padding:12px; border:1px solid #e0e0e0; border-radius:4px; background:#fafafa;">' +
                        '<div style="font-size:14px; font-weight:600; color:#333; margin-bottom:10px;">Price & Volatility</div>' +
                        '<div class="row" style="margin:0;">';

                    if (data.fiftyDayMovingAverage) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">50-Day MA</div><div style="font-size:14px; font-weight:600; color:#1976d2;">$' + Number(data.fiftyDayMovingAverage).toFixed(2) + '</div></div></div>';
                    }

                    if (data.twoHundredDayMovingAverage) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">200-Day MA</div><div style="font-size:14px; font-weight:600; color:#7b1fa2;">$' + Number(data.twoHundredDayMovingAverage).toFixed(2) + '</div></div></div>';
                    }

                    if (data.fiftyTwoWeekHigh) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">52-Week High</div><div style="font-size:14px; font-weight:600; color:#d32f2f;">$' + Number(data.fiftyTwoWeekHigh).toFixed(2) + '</div></div></div>';
                    }

                    if (data.fiftyTwoWeekLow) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">52-Week Low</div><div style="font-size:14px; font-weight:600; color:#388e3c;">$' + Number(data.fiftyTwoWeekLow).toFixed(2) + '</div></div></div>';
                    }

                    if (data.beta) {
                        fundHtml += '<div class="col-md-6" style="padding:6px;"><div style="background:#fff; padding:8px; border:1px solid #e0e0e0; border-radius:3px;"><div style="font-size:11px; color:#666;">Beta</div><div style="font-size:14px; font-weight:600; color:' + (Number(data.beta) > 1 ? '#ff6f00' : '#388e3c') + ';">' + Number(data.beta).toFixed(2) + '</div></div></div>';
                    }

                    fundHtml += '</div></div>';
                }

                if (fundHtml.indexOf('<div style="display: grid') > -1 && fundHtml.lastIndexOf('</div>') - fundHtml.indexOf('<div style="display: grid') > 50) {
                    fundHtml = fundHtml.substring(0, fundHtml.lastIndexOf('</div>')) + '</div>';
                }

                $('#fundamentalDataContainer').html(fundHtml);
            },
            error: function (xhr) {
                console.error('Error fetching fundamental data:', xhr);
                $('#fundamentalDataContainer').html(
                    '<div style="padding:12px; color:#d32f2f;">' +
                    'Unable to fetch fundamental data. API rate limits may have been reached. Try again later.' +
                    '</div>'
                );
            }
        });
    }

    function formatLargeNumber(value) {
        if (!value) return 'N/A';
        var num = Number(value);
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    function loadStockData(symbol) {
        var selectedExchange = $('#stockExchange').val() || 'NSE';
        var normalized = normalizeSymbol(symbol, selectedExchange);
        if (!normalized) {
            $('#stockChartContainer').html('<div style="padding:20px;color:#c00;">Please enter a stock symbol.</div>');
            $('#stockTable tbody').html('<tr><td colspan="6" class="text-center text-muted">Please enter a stock symbol.</td></tr>');
            return;
        }

        clearStockDataView();

        $.ajax({
            url: '/Default/GetNseStockCandles',
            type: 'POST',
            data: {
                stockSymbol: normalized.replace('.NS', '').replace('.BO', ''),
                stockExchange: selectedExchange
            },
            dataType: 'json',
            success: function (response) {
                if (!response || !response.success) {
                    $('#stockChartContainer').html('<div style="padding:20px;color:#c00;">' + (response && response.message ? response.message : 'No data available.') + '</div>');
                    $('#stockTable tbody').html('<tr><td colspan="6" class="text-center text-muted">No data available.</td></tr>');
                    return;
                }

                renderSummaryPanel(response.candles);
                renderCandleChart(response.candles, response.symbol);
                populateCandleTable(response.candles);

                // Render technical data
                try {
                    console.log('Calculating technical indicators from candles:', response.candles.length);
                    var technicalIndicators = calculateTechnicalIndicators(response.candles);
                    console.log('Technical indicators calculated:', technicalIndicators);
                    renderTechnicalData(technicalIndicators, response.symbol);
                } catch (e) {
                    console.error('Error calculating technical indicators:', e);
                    $('#technicalDataContainer').html('<div style="color:#c00;">Error calculating technical data: ' + e.message + '</div>');
                }

            },
            error: function (xhr) {
                console.error(xhr.responseText || xhr.statusText);
                $('#stockChartContainer').html('<div style="padding:20px;color:#c00;">An error occurred while sending the request.</div>');
                $('#stockTable tbody').html('<tr><td colspan="6" class="text-center text-muted">No data available.</td></tr>');
            }
        });
    }

    $('#stockForm').on('submit', function (e) {
        e.preventDefault();
        loadStockData($('#txtStockSymbol').val());
    });

    loadStockData(defaultSymbol);
});
