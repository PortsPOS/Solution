// ========== Realtime Clock ==========
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB');
    document.querySelector('.datetime').textContent = dateTimeString;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ========== Transactions ==========
let currentTransaction = 1;
let transactions = loadTransactionsFromStorage();

document.querySelectorAll('.transactions button').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        currentTransaction = index + 1;
        updateTransactionView();
    });
});

function addItem(name, qty, price) {
    const total = qty * price;
    const currentItems = transactions[currentTransaction];

    // If voided or cleared, replace it
    if (currentItems.length === 1 && currentItems[0].status) {
        transactions[currentTransaction] = [{ name, qty, total }];
    } else {
        transactions[currentTransaction].push({ name, qty, total });
    }

    saveTransactionsToStorage();
    updateTransactionView();
}

function removeItem(index) {
    transactions[currentTransaction].splice(index, 1);
    saveTransactionsToStorage();
    updateTransactionView();
}

function updateTransactionView(paidAmount = null, changeAmount = null) {
    const items = transactions[currentTransaction];
    const itemList = document.querySelector('.item-list');
    itemList.innerHTML = `
        <div class="item-header">
            <span>Name</span>
            <span>Qty</span>
            <span>Total</span>
        </div>
    `;

    let totalQty = 0;
    let totalAmount = 0;

    items.forEach((item, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.cursor = 'pointer';
        row.style.padding = '2px 0';

        let itemName = item.name;
        let itemTotal = `£${item.total ? item.total.toFixed(2) : '0.00'}`;
        let voidedStyle = '';

        if (item.voided) {
            itemName = `<span style="text-decoration: line-through; color: red;">${itemName} (Voided)</span>`;
            itemTotal = `<span style="text-decoration: line-through; color: red;">${itemTotal}</span>`;
        } else if (item.status) {
            itemName = `<span style="color:green; font-weight:bold">${item.status}</span>`;
            itemTotal = '';
        } else if (item.status === "Transaction Voided") {
            itemName = `<span style="color:red; font-weight:bold">${item.status}</span>`;
            itemTotal = '';
        }
         else if (item.status === "Transaction Cleared via Bank Transfer") {
            itemName = `<span style="color:#8BC34A; font-weight:bold">${item.status}</span>`;
        }
        else if (item.status === "Payment Pending") {
            itemName = `<span style="color:orange; font-weight:bold">${item.status}</span>`;
            itemTotal = '';
        }
        else {
            row.onclick = () => removeItem(index);
            totalQty += item.qty;
            totalAmount += item.total;
        }

        row.innerHTML = `<span>${itemName}</span><span>${item.qty || ''}</span><span>${itemTotal}</span>`;
        itemList.appendChild(row);
    });

    const infoBar = document.querySelector('.info-bar');
    if (infoBar) {
        const infoBarChildren = infoBar.children;
        const countTotalElement = infoBarChildren[0];
        let paidElement = infoBarChildren[1];
        let changeElement = infoBarChildren[2];

        if (countTotalElement) {
            countTotalElement.textContent = `Count: ${totalQty} Total: £${totalAmount.toFixed(2)}`;
        }

        if (!paidElement) {
            paidElement = document.createElement('span');
            infoBar.appendChild(paidElement);
        }
        paidElement.textContent = `Paid: £${paidAmount !== null ? paidAmount.toFixed(2) : '0.00'}`;

        if (changeAmount !== null) {
            if (!changeElement) {
                changeElement = document.createElement('span');
                infoBar.appendChild(changeElement);
            }
            changeElement.textContent = ` Change: £${changeAmount.toFixed(2)}`;
        } else if (changeElement) {
            changeElement.textContent = ` Change: £0.00`;
        }
    }
    return {totalQty, totalAmount};
}

// ========== LocalStorage ==========
function saveTransactionsToStorage() {
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
}

function loadTransactionsFromStorage() {
    const data = localStorage.getItem('pos_transactions');
    return data ? JSON.parse(data) : { 1: [], 2: [], 3: [] };
}

// ========== History Logging ==========
function saveToHistory(type, items) {
    const now = new Date();
    const timestamp = now.toLocaleString('en-GB');
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0);

    const history = JSON.parse(localStorage.getItem('pos_history') || '[]');

    history.push({
        timestamp,
        type,
        items: items.filter(item => !item.status && !item.voided),
        total
    });

    localStorage.setItem('pos_history', JSON.stringify(history));
}

// ========== Button Event Listeners ==========
document.addEventListener('DOMContentLoaded', () => {
    const actionsButtons = document.querySelectorAll('.actions button');

    if (actionsButtons.length >= 9) {
        // Sales Button
        actionsButtons[0].addEventListener('click', () => {
            const name = prompt("Enter item name:");
            if (!name) return;

            const qtyInput = prompt("Enter quantity:");
            const qty = parseInt(qtyInput);
            if (isNaN(qty) || qty <= 0) return alert("Invalid quantity!");

            const priceInput = prompt("Enter price:");
            const price = parseFloat(priceInput);
            if (isNaN(price) || price < 0) return alert("Invalid price!");

            addItem(name, qty, price);
        });

        // Non-Sales Button
        actionsButtons[1].addEventListener('click', () => {
            const amountInput = prompt("Enter cash amount to add to the till:");
            const amount = parseFloat(amountInput);

            if (isNaN(amount) || amount <= 0) {
                return alert("Invalid amount!");
            }

            const item = { name: "Cash Deposit", qty: 1, total: amount };
            addItem(item.name, item.qty, item.total); // Add to current transaction view
            saveToHistory("Non-Sales", [item]);
            alert("Non-sales transaction recorded and added to till.");
        });

        // Menu Button
        actionsButtons[2].addEventListener('click', () => {
            window.location.href = 'menu.html';
        });

        // Void Transaction Button
        actionsButtons[3].addEventListener('click', () => {
            const currentItems = transactions[currentTransaction];
            if (currentItems && currentItems.length > 0 && !currentItems[0].status) {
                const voidedItems = currentItems.filter(item => !item.voided);
                if (confirm(`Are you sure you want to void ${voidedItems.length} item(s) in this transaction?`)) {
                    let allVoided = true;
                    currentItems.forEach(item => {
                        if (!item.voided) {
                            item.voided = true;
                        }
                        if (!item.voided && !item.status) {
                            allVoided = false;
                        }
                    });
                    saveTransactionsToStorage();
                    updateTransactionView();

                    // Display "Transaction Voided" message temporarily
                    const itemListContainer = document.querySelector('.item-list');
                    const voidedMessage = document.createElement('div');
                    voidedMessage.style.color = '#FF8A80';
                    voidedMessage.style.fontWeight = 'bold';
                    voidedMessage.style.textAlign = 'center';
                    voidedMessage.style.padding = '10px';
                    voidedMessage.textContent = 'Transaction Voided';
                    itemListContainer.insertBefore(voidedMessage, itemListContainer.firstChild);

                    setTimeout(() => {
                        // Remove the temporary message
                        if (itemListContainer.contains(voidedMessage)) {
                            itemListContainer.removeChild(voidedMessage);
                        }

                        // If all items are now voided, set the transaction status
                        const currentTransactionItems = transactions[currentTransaction];
                        if (currentTransactionItems.every(item => item.voided)) {
                            transactions[currentTransaction] = [{ status: "Transaction Voided" }]; //store
                            saveTransactionsToStorage();
                            updateTransactionView();
                        }
                    }, 10000);
                    saveToHistory("Voided", voidedItems);
                }
            } else if (currentItems && currentItems[0].status === "Transaction Voided") {
                alert("This transaction is already voided.");
            } else if (currentItems && currentItems[0].status === "Transaction Cleared") {
                alert("This transaction has already been cleared.");
            } else {
                alert("No items to void in this transaction.");
            }
        });

        // Exact Change Button
        actionsButtons[4].addEventListener('click', () => {
            const itemsToClear = transactions[currentTransaction].filter(item => !item.status && !item.voided);
            if (itemsToClear.length === 0) return;

            let {totalQty, totalAmount} = updateTransactionView();

            transactions[currentTransaction] = [{ status: "Transaction Cleared" }]; // Store the ID
            saveTransactionsToStorage();
            updateTransactionView(totalAmount, 0); //show paid and change
        });

        // Cash Button
        const cashButton = document.getElementById('cash-payment');
        if (cashButton) {
            cashButton.addEventListener('click', () => {
                const itemsToClear = transactions[currentTransaction].filter(item => !item.status && !item.voided);
                if (itemsToClear.length === 0) return;

                const totalAmount = itemsToClear.reduce((sum, item) => sum + item.total, 0);
                const cashReceivedInput = prompt("Enter amount of cash received from customer:");
                const cashReceived = parseFloat(cashReceivedInput);

                if (isNaN(cashReceived) || cashReceived < totalAmount) {
                    alert("Insufficient cash received.");
                    return;
                }

                const changeAmount = cashReceived - totalAmount;
                updateTransactionView();

                saveToHistory("Sale", itemsToClear);
                transactions[currentTransaction] = [{ status: "Transaction Cleared", paid: cashReceived, change: changeAmount }];
                saveTransactionsToStorage();
                updateTransactionView(cashReceived, changeAmount);
                alert(`Transaction complete. Cash received: £${cashReceived.toFixed(2)}, Change: £${changeAmount.toFixed(2)}`);
            });
        }
    } // End of if (actionsButtons.length >= 9)


    // Bank Transfer Button
    const bankTransferButton = document.getElementById('bank-transfer-payment');
    if (bankTransferButton) {
        bankTransferButton.addEventListener('click', () => {
            const itemsToClear = transactions[currentTransaction].filter(item => !item.status && !item.voided);
            if (itemsToClear.length === 0) return;

            saveToHistory("Sale", itemsToClear);
            transactions[currentTransaction] = [{ status: "Transaction Cleared via Bank Transfer" }];
            saveTransactionsToStorage();
            updateTransactionView();
            window.location.href = 'index.html';
        });
    }

    // Pay Later Button (on payments.html)
    const payLaterButton = document.getElementById('pay-later-payment');
    if (payLaterButton) {
        payLaterButton.addEventListener('click', () => {
            const itemsToMarkPending = transactions[currentTransaction].filter(item => !item.status && !item.voided);
            if (itemsToMarkPending.length === 0) return;

            const now = new Date();
            const timestamp = now.toLocaleString('en-GB');
            const pendingTransaction = {
                timestamp,
                items: itemsToMarkPending,
                total: itemsToMarkPending.reduce((sum, item) => sum + item.total, 0)
            };

            let pending = loadPendingTransactions();
            pending.push(pendingTransaction);
            savePendingTransactions(pending);

            transactions[currentTransaction] = [{ status: "Payment Pending" }];
            saveTransactionsToStorage();
            updateTransactionView();
            alert("Transaction marked for Pay Later.");
            window.location.href = 'index.html';
        });
    }

    function savePendingTransactions(pendingTransactions) {
        localStorage.setItem('pos_pending', JSON.stringify(pendingTransactions));
    }

    function loadTransactionsFromStorage() {
        const data = localStorage.getItem('pos_transactions');
        return data ? JSON.parse(data) : { 1: [], 2: [], 3: [] };
    }

    // Carrier Bag Button
    const carrierBagButton = document.getElementById('carrier-bag-btn');
    if (carrierBagButton) {
        carrierBagButton.addEventListener('click', () => {
            addItem("Carrier Bag", 1, 0.30);
        });
    }

    // Home Button (for footer)
    document.querySelectorAll('button').forEach(button => {
        if (button.textContent.trim().toLowerCase() === 'home') {
            button.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    });

    // Print Receipt Button (for footer)
    const printBtn = document.getElementById('print-receipt');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            const items = transactions[currentTransaction].filter(item => !item.status && !item.voided);
            if (!items.length) {
                alert("No valid items in transaction to print.");
                return;
            }

            let receiptWindow = window.open('', '', 'width=400,height=600');
            receiptWindow.document.write('<html><head><title>Receipt</title></head><body>');
            receiptWindow.document.write('<h2>Transaction Receipt</h2>');
            receiptWindow.document.write(`<p>Date: ${new Date().toLocaleString('en-GB')}</p>`);
            receiptWindow.document.write('<table border="1" width="100%" style="border-collapse: collapse;"><tr><th>Item</th><th>Qty</th><th>Total</th></tr>');

            let total = 0;
            items.forEach(item => {
                receiptWindow.document.write(`<tr><td>${item.name}</td><td>${item.qty}</td><td>£${item.total.toFixed(2)}</td></tr>`);
                total += item.total;
            });

            receiptWindow.document.write('</table>');
            receiptWindow.document.write(`<h3>Total: £${total.toFixed(2)}</h3>`);
            receiptWindow.document.write('</body></html>');

            receiptWindow.document.close();
            receiptWindow.print();
        });
    }
});

// ========== Initialize ==========
updateTransactionView();

// Back button functionality
document.addEventListener('DOMContentLoaded', () => {
    const backButtons = document.querySelectorAll('.footer-buttons button');

    backButtons.forEach(button => {
        if (button.textContent.trim() === '←' || button.textContent.trim() === '&larr;') {
            button.addEventListener('click', () => {
                window.history.back();
            });
        }
    });
});

    // ========== Pending Transactions ==========
    function savePendingTransactions(pendingTransactions) {
        localStorage.setItem('pos_pending', JSON.stringify(pendingTransactions));
    }

    function loadPendingTransactions() {
        const data = localStorage.getItem('pos_pending');
        return data ? JSON.parse(data) : [];
    }

    function addTransactionToPending(transaction) {
        let pendingTransactions = loadPendingTransactions();
        pendingTransactions.push(transaction);
        savePendingTransactions(pendingTransactions);
    }

    function getPendingTransactionsAndClear() { // Changed function name
        let pendingTransactions = loadPendingTransactions();
        savePendingTransactions([]); // Clear the pending transactions
        return pendingTransactions;
    }

    // New Function to Add Cleared Transaction
    function addClearedTransaction(transaction) {
        if (!transaction || !transaction.items) return;

        transaction.items.forEach(item => {
            addItem(item.name, item.qty, item.total / item.qty); // Assuming total holds the item's total
        });
    }

    // Pay Later Button (on payments.html)
    const payLaterButton = document.getElementById('pay-later-payment');
    if (payLaterButton) {
        payLaterButton.addEventListener('click', () => {
            const itemsToMarkPending = transactions[currentTransaction].filter(item => !item.status && !item.voided);
            if (itemsToMarkPending.length === 0) return;

            const now = new Date();
            const timestamp = now.toLocaleString('en-GB');
            const pendingTransaction = {
                timestamp,
                items: itemsToMarkPending,
                total: itemsToMarkPending.reduce((sum, item) => sum + item.total, 0)
            };

            addTransactionToPending(pendingTransaction); // Add to pending
            transactions[currentTransaction] = [{ status: "Payment Pending" }];
            saveTransactionsToStorage();
            updateTransactionView();
            alert("Transaction marked for Pay Later.");
            window.location.href = 'index.html';
            carrierBagAdded = false; // Reset
        });
    }

    //pending button functionality
    document.addEventListener('DOMContentLoaded', () => {
        const pendingButton = document.getElementById('pending-payment');
        if (pendingButton) {
            pendingButton.addEventListener('click', () => {
                window.location.href = 'pending.html';
            });
        }
    });

    function clearPendingTransaction(index) {
        let pendingTransactions = loadPendingTransactions();
        const transactionToClear = pendingTransactions[index];
    
        // Remove the transaction from the pending list
        pendingTransactions.splice(index, 1);
        savePendingTransactions(pendingTransactions); // You'll need to define this function
    
        // Get existing transactions from localStorage
        let currentTransactions = loadTransactionsFromStorage(); // Make sure this function exists
    
        // Add the cleared transaction to the current transactions object.  Use currentTransaction as the key
        if (!currentTransactions[currentTransaction]) {
            currentTransactions[currentTransaction] = [];
        }
        currentTransactions[currentTransaction].push(transactionToClear);
        saveTransactionsToStorage();  // Make sure this function exists
    
        //  No redirection here.  We'll handle updating the UI in pending.html's script.
        renderPendingTransactions(); // Re-render the pending list in pending.html
        // Inform index.html to update
        localStorage.setItem('refresh_index', 'true');
    }
    
    function loadPendingTransactions() {
        const data = localStorage.getItem('pos_pending');
        return data ? JSON.parse(data) : [];
    }
    
    function savePendingTransactions(pendingTransactions) {
        localStorage.setItem('pos_pending', JSON.stringify(pendingTransactions));
    }
    