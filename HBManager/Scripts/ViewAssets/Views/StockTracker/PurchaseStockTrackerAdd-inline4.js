
    const { useEffect, useState } = React;

    const urls = {
        list: document.getElementById('purchaseStockDetailsApp').dataset.listUrl,
        add: document.getElementById('purchaseStockDetailsApp').dataset.addUrl,
        update: document.getElementById('purchaseStockDetailsApp').dataset.updateUrl,
        remove: document.getElementById('purchaseStockDetailsApp').dataset.removeUrl
    };

    function request(url, values) {
        const token = document.querySelector('input[name="__RequestVerificationToken"]');
        return fetch(url, {
            method: values ? 'POST' : 'GET',
            headers: values
                ? {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'RequestVerificationToken': token ? token.value : ''
                }
                : {},
            body: values ? new URLSearchParams(values) : undefined
        }).then(response => response.json());
    }

    const blankForm = {
        stockName: '',
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchasePrice: '',
        purchaseQty: '',
        isSale: false,
        nsebse: 'nse'
    };

    function App() {
        const [records, setRecords] = useState([]);
        const [filters, setFilters] = useState({});
        const [sort, setSort] = useState({ column: 'slno', direction: 'desc' });
        const [modal, setModal] = useState(null);
        const [form, setForm] = useState(blankForm);
        const [pendingDelete, setPendingDelete] = useState(null);
        const [message, setMessage] = useState('');

        useEffect(() => { loadRecords(); }, []);

        function loadRecords() {
            request(urls.list).then(result => {
                if (result.success) {
                    setRecords(result.data || []);
                } else {
                    setMessage(result.message || 'Unable to load purchase records.');
                }
            }).catch(() => setMessage('Unable to load purchase records.'));
        }

        function showAdd() {
            setForm({ ...blankForm, purchaseDate: new Date().toISOString().slice(0, 10) });
            setModal('add');
        }

        function showEdit(record) {
            setForm({
                slno: record.slno,
                stockName: record.stockName,
                purchaseDate: record.purchaseDate,
                purchasePrice: record.purchasePrice,
                purchaseQty: record.purchaseQty,
                isSale: record.isSale,
                nsebse: record.nsebse || 'nse'
            });
            setModal('edit');
        }

        function updateForm(event) {
            const name = event.target.name;
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            setForm(current => ({ ...current, [name]: value }));
        }

        function saveRecord(event) {
            event.preventDefault();
            const payload = {
                stockName: form.stockName,
                purchaseDate: form.purchaseDate,
                purchasePrice: form.purchasePrice,
                purchaseQty: form.purchaseQty,
                isSale: form.isSale,
                nsebse: form.nsebse
            };
            const url = modal === 'edit' ? urls.update : urls.add;
            if (modal === 'edit') payload.slno = form.slno;

            request(url, payload).then(result => {
                if (!result.success) {
                    setMessage(result.message || 'Unable to save purchase record.');
                    return;
                }
                setModal(null);
                setMessage(result.message);
                loadRecords();
            }).catch(() => setMessage('Unable to save purchase record.'));
        }

        function askDelete(record) {
            setPendingDelete(record);
        }

        function deleteRecord() {
            if (!pendingDelete) return;
            request(urls.remove, { slno: pendingDelete.slno }).then(result => {
                setMessage(result.message || '');
                if (result.success) {
                    setPendingDelete(null);
                    loadRecords();
                }
            }).catch(() => setMessage('Unable to delete purchase record.'));
        }

        function filteredRecords() {
            return records.filter(record => Object.keys(filters).every(column => {
                const value = (record[column] == null ? '' : record[column]).toString().toLowerCase();
                return !filters[column] || value.indexOf(filters[column]) !== -1;
            })).sort((first, second) => {
                const firstValue = first[sort.column] == null ? '' : first[sort.column];
                const secondValue = second[sort.column] == null ? '' : second[sort.column];
                const result = typeof firstValue === 'number'
                    ? firstValue - Number(secondValue)
                    : firstValue.toString().localeCompare(secondValue.toString(), undefined, { sensitivity: 'base' });
                return result * sort.direction;
            });
        }

        function sortBy(column) {
            setSort(current => ({
                column: column,
                direction: current.column === column ? current.direction * -1 : 1
            }));
        }

        function sortIcon(column) {
            if (sort.column !== column) return 'neutral';
            return sort.direction === 1 ? 'ascending' : 'descending';
        }

        const visibleRecords = filteredRecords();

        return (
            <React.Fragment>
                <header className="purchase-header">
                    <h1>Stock Purchase Details</h1>
                    <button className="purchase-btn purchase-btn-primary" onClick={showAdd}>Add New</button>
                </header>
                <main className="purchase-content">
                    {message && <div className="alert alert-info">{message}</div>}
                    <div className="purchase-table-wrap">
                        <table className="purchase-table">
                            <thead>
                                <tr>
                                    {[
                                        ['slno', 'Sl No'], ['stockName', 'Stock Name'], ['purchaseDate', 'Purchase Date'],
                                        ['purchasePrice', 'Purchase Price'], ['purchaseQty', 'Purchase Qty'], ['isSale', 'Is Sale'], ['nsebse', 'NSE/BSE']
                                    ].map(column => (
                                        <th key={column[0]} onClick={() => sortBy(column[0])}>{column[1]} <span className={`sort-icon sort-${sortIcon(column[0])}`} aria-hidden="true"></span></th>
                                    ))}
                                    <th>Action</th>
                                </tr>
                                <tr className="purchase-filter-row">
                                    {['slno', 'stockName', 'purchaseDate', 'purchasePrice', 'purchaseQty', 'isSale', 'nsebse'].map(column => (
                                        <td key={column}>
                                            <input placeholder="Filter" value={filters[column] || ''} onChange={event => setFilters(current => ({ ...current, [column]: event.target.value.toLowerCase() }))} />
                                        </td>
                                    ))}
                                    <td></td>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRecords.map(record => (
                                    <tr key={record.slno}>
                                        <td>{record.slno}</td>
                                        <td>{record.stockName}</td>
                                        <td>{record.purchaseDate}</td>
                                        <td>{Number(record.purchasePrice).toFixed(4)}</td>
                                        <td>{Number(record.purchaseQty).toFixed(4)}</td>
                                        <td>{record.isSale ? 'Yes' : 'No'}</td>
                                        <td>{record.nsebse}</td>
                                        <td>
                                            <div className="purchase-actions">
                                                <button className="purchase-btn purchase-btn-primary" onClick={() => showEdit(record)}>Edit</button>
                                                <button className="purchase-btn purchase-btn-danger" onClick={() => askDelete(record)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!visibleRecords.length && <tr><td colSpan="8" className="purchase-empty">No purchase records found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </main>
                {modal && (
                    <div className="purchase-modal-backdrop">
                        <form className="purchase-modal" onSubmit={saveRecord}>
                            <div className="purchase-modal-header">
                                <h2>{modal === 'edit' ? 'Edit Purchase Details' : 'Add Purchase Details'}</h2>
                                <button type="button" className="purchase-modal-close" onClick={() => setModal(null)}>&times;</button>
                            </div>
                            <div className="purchase-modal-body">
                                <div className="purchase-field">
                                    <label>Stock Name</label>
                                    <input name="stockName" value={form.stockName} onChange={updateForm} required />
                                </div>
                                <div className="purchase-field">
                                    <label>Purchase Date</label>
                                    <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={updateForm} required />
                                </div>
                                <div className="purchase-field">
                                    <label>Purchase Price</label>
                                    <input type="number" step="0.0001" min="0" name="purchasePrice" value={form.purchasePrice} onChange={updateForm} required />
                                </div>
                                <div className="purchase-field">
                                    <label>Purchase Quantity</label>
                                    <input type="number" step="0.0001" min="0" name="purchaseQty" value={form.purchaseQty} onChange={updateForm} required />
                                </div>
                                <div className="purchase-field">
                                    <label>NSE/BSE</label>
                                    <select name="nsebse" value={form.nsebse} onChange={updateForm}>
                                        <option value="nse">NSE</option>
                                        <option value="bse">BSE</option>
                                    </select>
                                </div>
                                <div className="purchase-field">
                                    <label>Sale Status</label>
                                    <label><input type="checkbox" name="isSale" checked={form.isSale} onChange={updateForm} /> Is Sale</label>
                                </div>
                            </div>
                            <div className="purchase-modal-footer">
                                <button type="button" className="purchase-btn purchase-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                                <button type="submit" className="purchase-btn purchase-btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                )}
                {pendingDelete && (
                    <div className="purchase-modal-backdrop">
                        <div className="purchase-modal" role="dialog" aria-modal="true" aria-labelledby="deletePurchaseTitle">
                            <div className="purchase-modal-header">
                                <h2 id="deletePurchaseTitle">Delete Purchase Details</h2>
                                <button type="button" className="purchase-modal-close" onClick={() => setPendingDelete(null)}>&times;</button>
                            </div>
                            <div className="purchase-delete-message">
                                Delete the purchase record for <strong>{pendingDelete.stockName}</strong> dated <strong>{pendingDelete.purchaseDate}</strong>?
                            </div>
                            <div className="purchase-modal-footer">
                                <button type="button" className="purchase-btn purchase-btn-secondary" onClick={() => setPendingDelete(null)}>Cancel</button>
                                <button type="button" className="purchase-btn purchase-btn-danger" onClick={deleteRecord}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </React.Fragment>
        );
    }

    ReactDOM.createRoot(document.getElementById('purchaseStockDetailsApp')).render(<App />);
