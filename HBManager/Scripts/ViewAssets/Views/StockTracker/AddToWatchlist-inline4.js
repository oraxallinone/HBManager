
    const { useEffect, useState } = React;

    const api = {
        list: document.getElementById('stockTrackerApp').dataset.listUrl,
        add: document.getElementById('stockTrackerApp').dataset.addUrl,
        update: document.getElementById('stockTrackerApp').dataset.updateUrl,
        remove: document.getElementById('stockTrackerApp').dataset.removeUrl
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

    function App() {
        const [stocks, setStocks] = useState([]);
        const [loading, setLoading] = useState(true);
        const [notice, setNotice] = useState(null);
        const [editingId, setEditingId] = useState(null);
        const [form, setForm] = useState({
            stockName: '',
            stockExchange: 'NSE',
            priority: '5'
        });
        const [editForm, setEditForm] = useState({});

        useEffect(() => {
            loadStocks();
        }, []);

        function showNotice(message, type) {
            setNotice({ message: message, type: type });
            window.setTimeout(() => setNotice(null), 3500);
        }

        function loadStocks() {
            setLoading(true);

            request(api.list)
                .then(result => {
                    if (result.success) {
                        setStocks(result.data);
                    } else {
                        showNotice(result.message, 'error');
                    }
                })
                .catch(() => showNotice('Unable to load stocks.', 'error'))
                .finally(() => setLoading(false));
        }

        function changeForm(event) {
            const name = event.target.name;
            const value = event.target.value;

            setForm(current => ({
                ...current,
                [name]: value
            }));
        }

        function changeEditForm(event) {
            const name = event.target.name;
            const value = event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value;

            setEditForm(current => ({
                ...current,
                [name]: value
            }));
        }

        function addStock(event) {
            event.preventDefault();

            if (!form.stockName.trim()) {
                showNotice('Enter a stock name.', 'error');
                return;
            }

            request(api.add, {
                stockName: form.stockName,
                stockExchange: form.stockExchange,
                priority: form.priority
            })
                .then(result => {
                    if (!result.success) {
                        showNotice(result.message, 'error');
                        return;
                    }

                    showNotice(result.message, 'success');
                    setForm({
                        stockName: '',
                        stockExchange: 'NSE',
                        priority: '5'
                    });
                    loadStocks();
                })
                .catch(() => showNotice('Unable to add stock.', 'error'));
        }

        function startEdit(stock) {
            setEditingId(stock.id);
            setEditForm({
                stockName: stock.stockName,
                stockExchange: stock.stockExchange,
                priority: String(stock.priority),
                isActive: stock.isActive
            });
        }

        function cancelEdit() {
            setEditingId(null);
            setEditForm({});
        }

        function saveEdit(id) {
            request(api.update, {
                id: id,
                stockName: editForm.stockName,
                stockExchange: editForm.stockExchange,
                priority: editForm.priority,
                isActive: editForm.isActive
            })
                .then(result => {
                    if (!result.success) {
                        showNotice(result.message, 'error');
                        return;
                    }

                    showNotice(result.message, 'success');
                    cancelEdit();
                    loadStocks();
                })
                .catch(() => showNotice('Unable to update stock.', 'error'));
        }

        function deleteStock(id) {
            if (!window.confirm('Delete this stock?')) {
                return;
            }

            request(api.remove, { id: id })
                .then(result => {
                    if (!result.success) {
                        showNotice(result.message, 'error');
                        return;
                    }

                    showNotice(result.message, 'success');
                    loadStocks();
                })
                .catch(() => showNotice('Unable to delete stock.', 'error'));
        }

        function priorityLabel(priority) {
            return priority === 5 ? 'New' : 'Priority ' + priority;
        }

        function priorityClass(priority) {
            return priority === 5
                ? 'priority-new'
                : priority === 1
                ? 'priority-high'
                : priority === 2
                    ? 'priority-medium'
                    : 'priority-low';
        }

        return (
            <div className="stock-page">
                <div className="stock-shell">
                    <header className="stock-hero">
                        <div>
                            <h1>Stock Analysis Tracker</h1>
                            <p>Manage your analysis watchlist by exchange and priority.</p>
                        </div>
                        <div className="stock-count">
                            <strong>{stocks.length}</strong>
                            Stocks
                        </div>
                    </header>

                    <main className="stock-content">
                        {notice && (
                            <div className={'notice notice-' + notice.type}>
                                {notice.message}
                            </div>
                        )}

                        <form className="stock-form" onSubmit={addStock}>
                            <div className="field">
                                <label>Stock Name</label>
                                <input
                                    name="stockName"
                                    value={form.stockName}
                                    onChange={changeForm}
                                    placeholder="Example: TCS"
                                    maxLength="100"
                                />
                            </div>

                            <div className="field">
                                <label>Exchange</label>
                                <select
                                    name="stockExchange"
                                    value={form.stockExchange}
                                    onChange={changeForm}
                                >
                                    <option value="NSE">NSE</option>
                                    <option value="BSE">BSE</option>
                                </select>
                            </div>

                            <div className="field">
                                <label>Priority</label>
                                <select
                                    name="priority"
                                    value={form.priority}
                                    onChange={changeForm}
                                >
                                     <option value="2">Priority 2</option>
                                     <option value="3">Priority 3</option>
                                     <option value="4">Priority 4</option>
                                     <option value="5">New</option>
                                     <option value="6">Priority 6</option>
                                     <option value="7">Priority 7</option>
                                     <option value="8">Priority 8</option>
                                     <option value="9">Priority 9</option>
                                     <option value="10">Priority 10</option>
                                </select>
                            </div>

                            <button className="btn btn-primary" type="submit">
                                Add Stock
                            </button>

                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => setForm({
                                    stockName: '',
                                    stockExchange: 'NSE',
                                    priority: '5'
                                })}
                            >
                                Reset
                            </button>
                        </form>

                        {loading ? (
                            <div className="loading">Loading stocks...</div>
                        ) : stocks.length === 0 ? (
                            <div className="empty">No stocks have been added yet.</div>
                        ) : (
                            <div className="table-wrap">
                                <table className="stock-table">
                                    <thead>
                                        <tr>
                                            <th>Stock</th>
                                            <th>Exchange</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Added Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.map(stock => (
                                            <tr key={stock.id}>
                                                {editingId === stock.id ? (
                                                    <React.Fragment>
                                                        <td>
                                                            <input
                                                                className="edit-input"
                                                                name="stockName"
                                                                value={editForm.stockName}
                                                                onChange={changeEditForm}
                                                            />
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="edit-select"
                                                                name="stockExchange"
                                                                value={editForm.stockExchange}
                                                                onChange={changeEditForm}
                                                            >
                                                                <option value="NSE">NSE</option>
                                                                <option value="BSE">BSE</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="edit-select"
                                                                name="priority"
                                                                value={editForm.priority}
                                                                onChange={changeEditForm}
                                                            >
                                                                    <option value="1">Priority 1</option>
                                                                    <option value="2">Priority 2</option>
                                                                    <option value="3">Priority 3</option>
                                                                    <option value="4">Priority 4</option>
                                                                    <option value="5">New</option>
                                                                    <option value="6">Priority 6</option>
                                                                    <option value="7">Priority 7</option>
                                                                    <option value="8">Priority 8</option>
                                                                    <option value="9">Priority 9</option>
                                                                    <option value="10">Priority 10</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <label>
                                                                <input
                                                                    type="checkbox"
                                                                    name="isActive"
                                                                    checked={editForm.isActive}
                                                                    onChange={changeEditForm}
                                                                /> Active
                                                            </label>
                                                        </td>
                                                        <td>{stock.addedDate}</td>
                                                        <td>
                                                            <div className="actions">
                                                                <button
                                                                    className="btn btn-save"
                                                                    type="button"
                                                                    onClick={() => saveEdit(stock.id)}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    className="btn btn-cancel"
                                                                    type="button"
                                                                    onClick={cancelEdit}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </React.Fragment>
                                                ) : (
                                                    <React.Fragment>
                                                        <td><strong>{stock.stockName}</strong></td>
                                                        <td>
                                                            <span className={
                                                                'badge ' +
                                                                (stock.stockExchange === 'NSE'
                                                                    ? 'badge-nse'
                                                                    : 'badge-bse')
                                                            }>
                                                                {stock.stockExchange}
                                                            </span>
                                                        </td>
                                                        <td className={priorityClass(stock.priority)}>
                                                            {priorityLabel(stock.priority)}
                                                        </td>
                                                        <td>
                                                            <span className={
                                                                'badge ' +
                                                                (stock.isActive
                                                                    ? 'badge-active'
                                                                    : 'badge-inactive')
                                                            }>
                                                                {stock.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td>{stock.addedDate}</td>
                                                        <td>
                                                            <div className="actions">
                                                                <button
                                                                    className="btn btn-edit"
                                                                    type="button"
                                                                    onClick={() => startEdit(stock)}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="btn btn-delete"
                                                                    type="button"
                                                                    onClick={() => deleteStock(stock.id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </React.Fragment>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    ReactDOM
        .createRoot(document.getElementById('stockTrackerApp'))
        .render(<App />);
