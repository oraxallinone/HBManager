
    const { useEffect, useState } = React;

    const pricesUrl = document.getElementById('activeStockPricesApp').dataset.pricesUrl;
    const detailsUrl = document.getElementById('activeStockPricesApp').dataset.detailsUrl;

    function App() {
        const [stocks, setStocks] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        const [lastUpdated, setLastUpdated] = useState('');
        const [selectedStock, setSelectedStock] = useState(null);
        const [detailsLoading, setDetailsLoading] = useState(false);
        const [detailsError, setDetailsError] = useState('');
        const [candleRange, setCandleRange] = useState('1d');
        const [candleData, setCandleData] = useState([]);
        const [candleLoading, setCandleLoading] = useState(false);
        const [candleError, setCandleError] = useState('');

        function loadPrices() {
            setLoading(true);
            setError('');

            fetch(pricesUrl, { cache: 'no-store' })
                .then(response => response.json())
                .then(result => {
                    if (!result.success) {
                        throw new Error(result.message || 'Unable to load prices.');
                    }

                    setStocks(result.data || []);
                    setLastUpdated(new Date().toLocaleTimeString());
                })
                .catch(loadError => setError(loadError.message))
                .finally(() => setLoading(false));
        }

        useEffect(() => {
            loadPrices();
        }, []);

        function formatPrice(value) {
            return value === null || value === undefined
                ? '-'
                : Number(value).toFixed(2);
        }

        function exchangeClass(exchange) {
            return exchange === 'BSE' ? 'exchange-bse' : 'exchange-nse';
        }

        function openStockDetails(stock) {
            setSelectedStock(stock);
            setDetailsLoading(true);
            setDetailsError('');
            setCandleData([]);
            setCandleError('');

            const query = '?stockName=' + encodeURIComponent(stock.StockName) +
                '&stockExchange=' + encodeURIComponent(stock.StockExchange || 'NSE');

            fetch(detailsUrl + query, { cache: 'no-store' })
                .then(response => response.json())
                .then(result => {
                    if (!result.success) {
                        throw new Error(result.message || 'Unable to load stock details.');
                    }

                    setSelectedStock(result.data);
                    loadCandles('1d', result.data);
                })
                .catch(loadError => setDetailsError(loadError.message))
                .finally(() => setDetailsLoading(false));
        }

        function loadCandles(range, stockOverride) {
            const stock = stockOverride || selectedStock;
            if (!stock) {
                return;
            }

            setCandleRange(range);
            setCandleLoading(true);
            setCandleError('');

            const query = '?stockName=' + encodeURIComponent(stock.StockName) +
                '&stockExchange=' + encodeURIComponent(stock.StockExchange || 'NSE') +
                '&range=' + encodeURIComponent(range);

            fetch(document.getElementById('activeStockPricesApp').dataset.candlesUrl + query, { cache: 'no-store' })
                .then(response => response.json())
                .then(result => {
                    if (!result.success) {
                        throw new Error(result.message || 'Unable to load candle data.');
                    }

                    setCandleData(result.data || []);
                })
                .catch(loadError => {
                    setCandleData([]);
                    setCandleError(loadError.message);
                })
                .finally(() => setCandleLoading(false));
        }

        function chartPoints(data) {
            if (!data.length) {
                return '';
            }

            const values = data.map(item => Number(item.Close));
            const minimum = Math.min.apply(null, values);
            const maximum = Math.max.apply(null, values);
            const spread = maximum - minimum || 1;
            return values.map((value, index) => {
                const x = data.length === 1 ? 400 : (index / (data.length - 1)) * 800;
                const y = 210 - ((value - minimum) / spread) * 180;
                return x.toFixed(1) + ',' + y.toFixed(1);
            }).join(' ');
        }

        function CandleChart({ data, range }) {
            if (!data.length) {
                return <div className="stock-no-data">No candle data available for this range.</div>;
            }

            const line = chartPoints(data);
            const area = '0,220 ' + line + ' 800,220';
            const first = data[0];
            const last = data[data.length - 1];

            if (range) {
                const chartData = data.length > 250
                    ? data.filter((item, index) => index % Math.ceil(data.length / 250) === 0 || index === data.length - 1)
                    : data;
                const values = chartData.reduce((result, item) => result.concat([item.High, item.Low]), []);
                const minimum = Math.min.apply(null, values);
                const maximum = Math.max.apply(null, values);
                const spread = maximum - minimum || 1;
                const candleWidth = Math.max(3, Math.min(18, 680 / chartData.length));

                return (
                    <React.Fragment>
                        <div className="candle-chart-wrap">
                            <svg className="candle-chart" viewBox="0 0 800 230" preserveAspectRatio="none" role="img" aria-label="One day candlestick chart">
                                <line className="candle-chart-grid" x1="0" y1="30" x2="800" y2="30" />
                                <line className="candle-chart-grid" x1="0" y1="120" x2="800" y2="120" />
                                <line className="candle-chart-grid" x1="0" y1="210" x2="800" y2="210" />
                                {chartData.map((item, index) => {
                                    const center = chartData.length === 1
                                        ? 400
                                        : 35 + (index / (chartData.length - 1)) * 730;
                                    const y = value => 210 - ((value - minimum) / spread) * 180;
                                    const openY = y(item.Open);
                                    const closeY = y(item.Close);
                                    const highY = y(item.High);
                                    const lowY = y(item.Low);
                                    const bodyTop = Math.min(openY, closeY);
                                    const bodyHeight = Math.max(3, Math.abs(openY - closeY));
                                    const colorClass = item.Close >= item.Open ? 'candle-up' : 'candle-down';

                                    return (
                                        <React.Fragment key={item.Date + index}>
                                            <line className={colorClass} x1={center} y1={highY} x2={center} y2={lowY} strokeWidth="2" />
                                            <rect className={colorClass} x={center - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} />
                                        </React.Fragment>
                                    );
                                })}
                            </svg>
                        </div>
                        <table className="stock-detail-table">
                            <thead>
                                <tr>
                                    <th>Date / Day</th>
                                    <th>Open</th>
                                    <th>High</th>
                                    <th>Low</th>
                                    <th>Close</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={item.Date + index}>
                                        <td>{item.Date}</td>
                                        <td>{formatPrice(item.Open)}</td>
                                        <td>{formatPrice(item.High)}</td>
                                        <td>{formatPrice(item.Low)}</td>
                                        <td>{formatPrice(item.Close)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </React.Fragment>
                );
            }

            return (
                <React.Fragment>
                    <div className="candle-chart-wrap">
                        <svg className="candle-chart" viewBox="0 0 800 230" preserveAspectRatio="none" role="img" aria-label="Closing price chart">
                            <line className="candle-chart-grid" x1="0" y1="30" x2="800" y2="30" />
                            <line className="candle-chart-grid" x1="0" y1="120" x2="800" y2="120" />
                            <line className="candle-chart-grid" x1="0" y1="210" x2="800" y2="210" />
                            <polygon className="candle-chart-area" points={area} />
                            <polyline className="candle-chart-line" points={line} />
                        </svg>
                    </div>
                    <table className="stock-detail-table">
                        <thead>
                            <tr>
                                <th>Date / Day</th>
                                <th>Last Closing Price</th>
                                <th>Change Price</th>
                                <th>Change %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(-100).reverse().map((item, index) => (
                                <tr key={item.Date + index}>
                                    <td>{item.Date}</td>
                                    <td>{formatPrice(item.Close)}</td>
                                    <td>{item.ChangeAmount >= 0 ? '+' : ''}{formatPrice(item.ChangeAmount)}</td>
                                    <td>{item.ChangePercent >= 0 ? '+' : ''}{formatPrice(item.ChangePercent)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="stock-no-data">
                        {first.Date} to {last.Date} · {data.length} trading points
                    </div>
                </React.Fragment>
            );
        }

        function formatDetail(value, suffix) {
            return value === null || value === undefined || value === ''
                ? '-'
                : String(value) + (suffix || '');
        }

        function formatNumber(value) {
            return value === null || value === undefined
                ? '-'
                : Number(value).toLocaleString('en-IN');
        }

        function DetailItem({ label, value }) {
            return (
                <div className="stock-detail-item">
                    <span className="stock-detail-label">{label}</span>
                    <span className="stock-detail-value" title={formatDetail(value)}>
                        {formatDetail(value)}
                    </span>
                </div>
            );
        }

        function DetailSection({ title, children }) {
            return (
                <section className="stock-detail-section">
                    <h3>{title}</h3>
                    {children}
                </section>
            );
        }

        return (
            <div className="price-page">
                <div className="price-shell">
                    <header className="price-header">
                        <div>
                            <h1>Active Stock Prices</h1>
                            <p>Today&apos;s latest daily close from Yahoo Finance</p>
                        </div>
                        <button className="refresh-button" type="button" onClick={loadPrices} disabled={loading}>
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </header>

                    <main className="price-body">
                        <div className="price-toolbar">
                            <span><strong>{stocks.length}</strong> active stocks</span>
                            <span>{lastUpdated ? 'Updated ' + lastUpdated : ''}</span>
                        </div>

                        {loading && stocks.length === 0 ? (
                            <div className="loading">Loading active stock prices...</div>
                        ) : error ? (
                            <div className="error">{error}</div>
                        ) : stocks.length === 0 ? (
                            <div className="empty">No active stocks found in tblStockAnalysis.</div>
                        ) : (
                            <div className="price-table-wrap">
                                <table className="price-table">
                                    <thead>
                                        <tr>
                                            <th>Stock</th>
                                            <th>Exchange</th>
                                            <th>Yahoo Symbol</th>
                                            <th>Priority</th>
                                            <th>Today Close</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.map(stock => (
                                            <tr key={stock.Id}>
                                                <td>
                                                    <button
                                                        className="stock-info-button"
                                                        type="button"
                                                        title="View company name"
                                                        aria-label={'View company name for ' + stock.StockName}
                                                        onClick={() => openStockDetails(stock)}
                                                    >
                                                        i
                                                    </button>
                                                    <strong>{stock.StockName}</strong>
                                                </td>
                                                <td>
                                                    <span className={'exchange-badge ' + exchangeClass(stock.StockExchange)}>
                                                        {stock.StockExchange}
                                                    </span>
                                                </td>
                                                <td>{stock.YahooSymbol}</td>
                                                <td>{stock.Priority === 5 ? 'New' : stock.Priority}</td>
                                                <td className="close-price">{formatPrice(stock.TodayClose)}</td>
                                                <td>
                                                    <span className={'status-badge ' + (stock.Status === 'OK' ? 'status-ok' : 'status-error')}>
                                                        {stock.Status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedStock && (
                            <div
                                className="stock-modal-backdrop"
                                role="presentation"
                                onClick={() => setSelectedStock(null)}
                            >
                                <div
                                    className="stock-modal"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="stockCompanyNameTitle"
                                    onClick={event => event.stopPropagation()}
                                >
                                    <div className="stock-modal-header">
                                        <div>
                                            <h2 id="stockCompanyNameTitle">{selectedStock.StockName}</h2>
                                            <p className="stock-modal-subtitle">
                                                {selectedStock.YahooSymbol} company details
                                            </p>
                                        </div>
                                        <button
                                            className="stock-modal-close"
                                            type="button"
                                            aria-label="Close"
                                            onClick={() => setSelectedStock(null)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    {detailsLoading ? (
                                        <div className="stock-company-name">Loading Yahoo Finance details...</div>
                                    ) : detailsError ? (
                                        <div className="stock-company-name">{detailsError}</div>
                                    ) : (
                                        <React.Fragment>
                                            <div className="stock-company-name">
                                                {selectedStock.CompanyName || selectedStock.StockName}
                                            </div>

                                            <DetailSection title="Identity & Market">
                                        <div className="stock-detail-grid">
                                            <DetailItem label="Symbol" value={selectedStock.YahooSymbol} />
                                            <DetailItem label="Currency" value={selectedStock.Currency} />
                                            <DetailItem label="Exchange" value={selectedStock.FullExchangeName || selectedStock.ExchangeName} />
                                            <DetailItem label="Instrument" value={selectedStock.InstrumentType} />
                                            <DetailItem label="Timezone" value={selectedStock.Timezone} />
                                            <DetailItem label="Market Time" value={selectedStock.RegularMarketTime} />
                                            <DetailItem label="First Trade Date" value={selectedStock.FirstTradeDate} />
                                            <DetailItem label="Priority" value={selectedStock.Priority === 5 ? 'New' : selectedStock.Priority} />
                                            <DetailItem label="Status" value={selectedStock.Status} />
                                        </div>
                                            </DetailSection>

                                            <DetailSection title="Price Snapshot">
                                        <div className="stock-detail-grid">
                                            <DetailItem label="Regular Market Price" value={formatPrice(selectedStock.RegularMarketPrice)} />
                                            <DetailItem label="Today Close" value={formatPrice(selectedStock.TodayClose)} />
                                            <DetailItem label="Previous Close" value={formatPrice(selectedStock.PreviousClose)} />
                                            <DetailItem label="Chart Previous Close" value={formatPrice(selectedStock.ChartPreviousClose)} />
                                            <DetailItem label="52 Week High" value={formatPrice(selectedStock.FiftyTwoWeekHigh)} />
                                            <DetailItem label="52 Week Low" value={formatPrice(selectedStock.FiftyTwoWeekLow)} />
                                            <DetailItem label="Day High" value={formatPrice(selectedStock.DayHigh)} />
                                            <DetailItem label="Day Low" value={formatPrice(selectedStock.DayLow)} />
                                            <DetailItem label="Market Volume" value={formatNumber(selectedStock.MarketVolume)} />
                                        </div>
                                            </DetailSection>

                                            <DetailSection title="Latest Trading Session">
                                        {selectedStock.LatestCandle ? (
                                            <div className="stock-detail-grid">
                                                <DetailItem label="Date" value={selectedStock.LatestCandle.Date} />
                                                <DetailItem label="Open" value={formatPrice(selectedStock.LatestCandle.Open)} />
                                                <DetailItem label="High" value={formatPrice(selectedStock.LatestCandle.High)} />
                                                <DetailItem label="Low" value={formatPrice(selectedStock.LatestCandle.Low)} />
                                                <DetailItem label="Close" value={formatPrice(selectedStock.LatestCandle.Close)} />
                                                <DetailItem label="Adjusted Close" value={formatPrice(selectedStock.LatestCandle.AdjustedClose)} />
                                                <DetailItem label="Volume" value={formatNumber(selectedStock.LatestCandle.Volume)} />
                                            </div>
                                        ) : (
                                            <div className="stock-no-data">No latest candle data available.</div>
                                        )}
                                            </DetailSection>

                                            <DetailSection title="Corporate Actions">
                                        {selectedStock.Actions && selectedStock.Actions.length > 0 ? (
                                            <table className="stock-detail-table">
                                                <thead>
                                                    <tr>
                                                        <th>Type</th>
                                                        <th>Date</th>
                                                        <th>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedStock.Actions.map((action, index) => (
                                                        <tr key={action.Type + action.Date + index}>
                                                            <td>{action.Type}</td>
                                                            <td>{action.Date || '-'}</td>
                                                            <td>{action.Amount === null || action.Amount === undefined ? '-' : formatPrice(action.Amount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="stock-no-data">No dividends or splits in the selected Yahoo range.</div>
                                        )}
                                            </DetailSection>

                                            <DetailSection title="Closing Price History">
                                                <div className="candle-toolbar">
                                                    <span className="stock-modal-subtitle">
                                                        {candleLoading ? 'Loading candle data...' : 'Select a range to analyze closing-price movement.'}
                                                    </span>
                                                    <select
                                                        className="candle-range-select"
                                                        value={candleRange}
                                                        onChange={event => loadCandles(event.target.value)}
                                                    >
                                                        <option value="1d">1 Day</option>
                                                        <option value="5d">1 Week</option>
                                                        <option value="1mo">1 Month</option>
                                                        <option value="1y">1 Year</option>
                                                        <option value="max">Max</option>
                                                    </select>
                                                </div>
                                                {candleError ? (
                                                    <div className="stock-no-data">{candleError}</div>
                                                ) : candleLoading ? (
                                                    <div className="stock-no-data">Fetching Yahoo candle history...</div>
                                                ) : (
                                                    <CandleChart data={candleData} range={candleRange} />
                                                )}
                                            </DetailSection>
                                        </React.Fragment>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    ReactDOM.createRoot(document.getElementById('activeStockPricesApp')).render(<App />);
