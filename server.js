<script>
    lucide.createIcons();

    // Slider Interactivity JS
    const slider = document.getElementById('heightSlider');
    const thumb = document.getElementById('customThumb');
    const activeTrack = document.getElementById('activeTrack');

    function updateSlider() {
      const val = slider.value;
      thumb.style.left = val + '%';
      activeTrack.style.width = val + '%';
    }

    slider.addEventListener('input', updateSlider);
    updateSlider();

    // Elements & Views
    const viewBalance = document.getElementById('view-balance');
    const viewMain = document.getElementById('view-main');
    const viewEaTrading = document.getElementById('view-ea-trading');
    const viewDate = document.getElementById('view-date');
    const viewDeposit = document.getElementById('view-deposit');
    const viewWithdraw = document.getElementById('view-withdraw');
    const viewTxHistory = document.getElementById('view-tx-history');

    // Navigation Buttons
    const btnGotoChartSettings = document.getElementById('btn-goto-chart-settings');
    const btnBalance = document.getElementById('btn-balance');
    const btnEaTrading = document.getElementById('btn-ea-trading');
    const btnEaBack = document.getElementById('btn-ea-back');
    const btnDate = document.getElementById('btn-date');
    const btnDateBack = document.getElementById('btn-date-back');
    
    // Deposit / Withdrawal Navigations
    const btnDeposit = document.querySelector('.btn-deposit');
    const btnDepositBack = document.getElementById('btn-deposit-back');
    const btnWithdraw = document.querySelector('.btn-withdraw');
    const btnWithdrawBack = document.getElementById('btn-withdraw-back');

    // History Navigations
    const btnTxHistory = document.getElementById('btn-tx-history');
    const btnTxHistoryBack = document.getElementById('btn-tx-history-back');

    // Save and Run Action Buttons
    const btnSaveEa = document.getElementById('btn-save-ea');
    const btnRunEa = document.getElementById('btn-run-ea');

    // Inputs
    const btnSubmitDeposit = document.getElementById('btn-submit-deposit');
    const depositAmount = document.getElementById('deposit-amount');
    const depositUid = document.getElementById('deposit-uid');
    const depositAccount = document.getElementById('deposit-account');

    const btnSubmitWithdraw = document.getElementById('btn-submit-withdraw');
    const withdrawAmount = document.getElementById('withdraw-amount');
    const withdrawUid = document.getElementById('withdraw-uid');
    const withdrawAccount = document.getElementById('withdraw-account');
    const quickAmtBtns = document.querySelectorAll('.quick-amt-btn');

    // EA Fields 
    const eaFields = document.querySelectorAll('.ea-field');
    const eaSymbolSelect = document.getElementById('ea-symbol');

    // Global Values State
    let accountBalanceLimit = 0.00;
    let eaActive = 0; 
    let limit24hVal = 0.50;
    let lowLotVal = 0.30;
    let pendingTxExist = false; 

    // ទាញយកទិន្នន័យពី LocalStorage ដើម្បីកុំឱ្យបាត់បង់ទិន្នន័យពេលបិទម៉ាស៊ីន/App
    let dailyHistoryData = JSON.parse(localStorage.getItem('dailyHistoryData')) || {};

    let navDate = new Date();
    let displayYear = navDate.getFullYear();
    let displayMonth = navDate.getMonth();

    function loadLocalSettings() {
      const localParams = JSON.parse(localStorage.getItem('eaSettingsParams'));
      if (localParams) {
        document.getElementById('ea-lot-size').value = localParams.lot || '0.01';
        document.getElementById('ea-target-tp').value = localParams.tp || '0.65';
        document.getElementById('ea-max-loss').value = localParams.sl || '5.00';
        document.getElementById('limit-input').value = `$${parseFloat(localParams.limit24h || 0.50).toFixed(2)}`;
        document.getElementById('ea-low-lot').value = localParams.lowLot || '0.30';
        eaSymbolSelect.value = localParams.symbol || 'XAU/USD';
        eaActive = parseInt(localParams.active || 0);
        updateUIWithActiveState();
      }
    }

    btnGotoChartSettings.addEventListener('click', () => {
      viewBalance.style.display = 'none';
      viewMain.style.display = 'block';
    });

    btnBalance.addEventListener('click', () => {
      viewMain.style.display = 'none';
      viewBalance.style.display = 'block';
    });

    btnEaTrading.addEventListener('click', () => {
      viewMain.style.display = 'none';
      viewEaTrading.style.display = 'block';
    });

    btnEaBack.addEventListener('click', () => {
      viewEaTrading.style.display = 'none';
      viewMain.style.display = 'block';
    });

    btnDate.addEventListener('click', () => {
      viewMain.style.display = 'none';
      viewDate.style.display = 'block';
      renderCalendar(); 
      updateTrendChart();
    });

    btnDateBack.addEventListener('click', () => {
      viewDate.style.display = 'none';
      viewMain.style.display = 'block';
    });

    btnDeposit.addEventListener('click', () => {
      viewBalance.style.display = 'none';
      viewDeposit.style.display = 'block';
      validateDepositForm();
    });

    btnDepositBack.addEventListener('click', () => {
      viewDeposit.style.display = 'none';
      viewBalance.style.display = 'block';
    });

    btnWithdraw.addEventListener('click', () => {
      viewBalance.style.display = 'none';
      viewWithdraw.style.display = 'block';
      validateWithdrawForm();
    });

    btnWithdrawBack.addEventListener('click', () => {
      viewWithdraw.style.display = 'none';
      viewBalance.style.display = 'block';
    });

    btnTxHistory.addEventListener('click', () => {
      viewBalance.style.display = 'none';
      viewTxHistory.style.display = 'block';
      fetchTransactions();
    });

    btnTxHistoryBack.addEventListener('click', () => {
      viewTxHistory.style.display = 'none';
      viewBalance.style.display = 'block';
    });

    // Dismiss Keyboard
    document.addEventListener('pointerdown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'INPUT') {
        if (e.target !== activeEl && !e.target.closest('input') && !e.target.closest('button') && !e.target.closest('.copy-field-btn')) {
          activeEl.blur();
        }
      }
    });

    function validateEaForm() {
      let allFilled = true;
      eaFields.forEach(field => {
        if (!field.value.trim()) allFilled = false;
      });
      if (allFilled) btnSaveEa.classList.remove('disabled');
      else btnSaveEa.classList.add('disabled');
    }

    eaFields.forEach(field => {
      field.addEventListener('input', validateEaForm);
    });

    validateEaForm();

    function validateDepositForm() {
      if (pendingTxExist) {
        btnSubmitDeposit.classList.add('disabled');
        btnSubmitDeposit.innerText = 'រង់ចាំការអនុញ្ញាត...';
        return;
      }
      const amountVal = depositAmount.value.trim();
      const uidVal = depositUid.value.trim();
      const accountVal = depositAccount.value.trim();
      if (amountVal && uidVal && accountVal) {
        btnSubmitDeposit.classList.remove('disabled');
        btnSubmitDeposit.innerText = 'បង់ប្រាក់';
      } else {
        btnSubmitDeposit.classList.add('disabled');
        btnSubmitDeposit.innerText = 'បង់ប្រាក់';
      }
    }

    function validateWithdrawForm() {
      if (pendingTxExist) {
        btnSubmitWithdraw.classList.add('disabled');
        btnSubmitWithdraw.innerText = 'រង់ចាំការអនុញ្ញាត...';
        return;
      }
      const amountVal = parseFloat(withdrawAmount.value);
      const uidVal = withdrawUid.value.trim();
      const accountVal = withdrawAccount.value.trim();
      if (amountVal > 0 && uidVal && accountVal && amountVal <= accountBalanceLimit) {
        btnSubmitWithdraw.classList.remove('disabled');
        btnSubmitWithdraw.innerText = 'ដកប្រាក់';
      } else {
        btnSubmitWithdraw.classList.add('disabled');
        btnSubmitWithdraw.innerText = 'ដកប្រាក់';
      }
    }

    depositAmount.addEventListener('input', validateDepositForm);
    depositUid.addEventListener('input', validateDepositForm);
    depositAccount.addEventListener('input', validateDepositForm);

    withdrawAmount.addEventListener('input', () => {
      quickAmtBtns.forEach(b => b.classList.remove('active'));
      validateWithdrawForm();
    });
    withdrawUid.addEventListener('input', validateWithdrawForm);
    withdrawAccount.addEventListener('input', validateWithdrawForm);

    quickAmtBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        quickAmtBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        withdrawAmount.value = btn.getAttribute('data-val');
        validateWithdrawForm();
      });
    });

    btnSubmitDeposit.addEventListener('click', () => {
      if (btnSubmitDeposit.classList.contains('disabled') || pendingTxExist) return;

      const amount = depositAmount.value;
      const uid = depositUid.value;
      const accountName = depositAccount.value;

      btnSubmitDeposit.disabled = true;
      btnSubmitDeposit.innerText = 'Processing...';

      fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Deposit',
          amount,
          uid,
          account: accountName
        })
      })
      .then(response => {
        if (response.ok) {
          alert('ប្រតិបត្តិការជោគជ័យ កំពុងត្រួតពិនិត្យ….');
          depositAmount.value = '';
          depositUid.value = '';
          depositAccount.value = '';
          viewDeposit.style.display = 'none';
          viewBalance.style.display = 'block';
          fetchTransactions();
        } else {
          alert('ការផ្ញើបានបរាជ័យ សូមព្យាយាមម្តងទៀត។');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('មានបញ្ហាប្រព័ន្ធ។ សូមព្យាយាមម្តងទៀត។');
      })
      .finally(() => {
        btnSubmitDeposit.disabled = false;
        btnSubmitDeposit.innerText = 'បង់ប្រាក់';
      });
    });

    btnSubmitWithdraw.addEventListener('click', () => {
      if (btnSubmitWithdraw.classList.contains('disabled') || pendingTxExist) return;

      const amount = withdrawAmount.value;
      const uid = withdrawUid.value;
      const accountName = withdrawAccount.value;

      btnSubmitWithdraw.disabled = true;
      btnSubmitWithdraw.innerText = 'Processing...';

      fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Withdrawal',
          amount,
          uid,
          account: accountName
        })
      })
      .then(response => {
        if (response.ok) {
          alert('ប្រតិបត្តិការជោគជ័យ កំពុងត្រួតពិនិត្យ….');
          withdrawAmount.value = '';
          withdrawUid.value = '';
          withdrawAccount.value = '';
          quickAmtBtns.forEach(b => b.classList.remove('active'));
          viewWithdraw.style.display = 'none';
          viewBalance.style.display = 'block';
          fetchTransactions();
        } else {
          alert('ការផ្ញើបានបរាជ័យ សូមព្យាយាមម្តងទៀត។');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('មានបញ្ហាប្រព័ន្ធ។ សូមព្យាយាមម្តងទៀត។');
      })
      .finally(() => {
        btnSubmitWithdraw.disabled = false;
        btnSubmitWithdraw.innerText = 'ដកប្រាក់';
      });
    });

    function fetchTransactions() {
      fetch('/api/transactions')
      .then(res => res.json())
      .then(txs => {
        pendingTxExist = txs.some(t => t.status === 'Pending');

        const txHistoryList = document.getElementById('tx-history-list');
        if (txs.length > 0) {
          txHistoryList.innerHTML = txs.map(tx => {
            let statusColor = 'rgba(255, 177, 26, 0.15)';
            let statusTextColor = '#ffb11a';
            
            if (tx.status === 'Success') {
              statusColor = 'rgba(14, 203, 129, 0.15)';
              statusTextColor = '#0ecb81';
            } else if (tx.status === 'Refusal') {
              statusColor = 'rgba(246, 70, 93, 0.15)';
              statusTextColor = '#f6465d';
            }

            return `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 14px 16px; border-radius: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 14px; font-weight: 600; color: #ffffff;">${tx.type} - $${parseFloat(tx.amount).toFixed(2)}</div>
                  <div style="font-size: 11px; color: #848e9c; margin-top: 4px;">UID: ${tx.uid} | ${tx.date} ${tx.time}</div>
                </div>
                <span style="padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; background-color: ${statusColor}; color: ${statusTextColor};">${tx.status}</span>
              </div>
            `;
          }).join('');
        } else {
          txHistoryList.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; text-align: center; color: #5e6673;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p style="font-size: 14.5px; font-weight: 500;">គ្មានប្រតិបត្តិការណាមួយឡើយ</p>
            </div>
          `;
        }

        if (viewDeposit.style.display === 'block') validateDepositForm();
        if (viewWithdraw.style.display === 'block') validateWithdrawForm();
      })
      .catch(err => console.error("Error fetching transactions:", err));
    }

    const limitInput = document.getElementById('limit-input');
    limitInput.addEventListener('input', () => {
      let val = limitInput.value;
      if (!val.startsWith('$')) {
        limitInput.value = '$' + val.replace(/\$/g, '');
      }
    });

    const btnEyeToggle = document.getElementById('btn-eye-toggle');
    const mt5Server = document.getElementById('mt5-server');
    const mt5Id = document.getElementById('mt5-id');
    const mt5Password = document.getElementById('mt5-password');

    let isMasked = true;

    const realValues = {
      server: 'Exness-MT5Trial6',
      id: '414063265',
      password: 'Id168169$'
    };

    const maskedValues = {
      server: '••••••••••••••••',
      id: '•••••••••',
      password: '•••••••••'
    };

    function updateFieldsVisibility() {
      if (isMasked) {
        mt5Server.value = maskedValues.server;
        mt5Id.value = maskedValues.id;
        mt5Password.value = maskedValues.password;
        btnEyeToggle.innerHTML = '<i data-lucide="eye-off" size="18"></i>';
      } else {
        mt5Server.value = realValues.server;
        mt5Id.value = realValues.id;
        mt5Password.value = realValues.password;
        btnEyeToggle.innerHTML = '<i data-lucide="eye" size="18"></i>';
      }
      lucide.createIcons();
    }

    btnEyeToggle.addEventListener('click', () => {
      isMasked = !isMasked;
      updateFieldsVisibility();
    });

    window.copyField = function(id) {
      let textToCopy = '';
      if (id === 'mt5-server') textToCopy = realValues.server;
      else if (id === 'mt5-id') textToCopy = realValues.id;
      else if (id === 'mt5-password') textToCopy = realValues.password;

      navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Copied successfully!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    };

    updateFieldsVisibility();

    // ==========================================================================
    // DATE REPORT CALENDAR
    // ==========================================================================
    function renderCalendar() {
      const today = new Date();
      const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ];
      
      document.getElementById('calendar-month-title').innerText = `${monthNames[displayMonth]} ${displayYear}`;

      const firstDay = new Date(displayYear, displayMonth, 1).getDay();
      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

      const totalDays = new Date(displayYear, displayMonth + 1, 0).getDate();
      const prevTotalDays = new Date(displayYear, displayMonth, 0).getDate();

      const daysGrid = document.getElementById('calendar-days-grid');
      daysGrid.innerHTML = '';

      for (let i = adjustedFirstDay - 1; i >= 0; i--) {
        const span = document.createElement('span');
        span.className = 'day-num muted';
        span.innerText = prevTotalDays - i;
        daysGrid.appendChild(span);
      }

      for (let i = 1; i <= totalDays; i++) {
        const span = document.createElement('span');
        span.className = 'day-num';
        span.innerText = i;

        if (i === today.getDate() && displayMonth === today.getMonth() && displayYear === today.getFullYear()) {
          span.classList.add('current');
        }

        const dateKey = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayRecord = dailyHistoryData[dateKey];

        if (dayRecord) {
          const totalProfitValue = parseFloat(dayRecord.profit || 0);
          if (totalProfitValue > 0) {
            span.classList.add('blue-total'); 
            const profitText = document.createElement('div');
            profitText.className = 'day-profit-text tp-color';
            profitText.innerText = `+$${totalProfitValue.toFixed(2)}`;
            span.appendChild(profitText);
          } else if (totalProfitValue < 0) {
            span.classList.add('red-total'); 
            const lossText = document.createElement('div');
            lossText.className = 'day-profit-text sl-color';
            lossText.innerText = `-$${Math.abs(totalProfitValue).toFixed(2)}`;
            span.appendChild(lossText);
          }
        }
        
        daysGrid.appendChild(span);
      }
    }

    document.getElementById('btn-prev-month').addEventListener('click', () => {
      displayMonth--;
      if (displayMonth < 0) {
        displayMonth = 11;
        displayYear--;
      }
      renderCalendar();
    });

    document.getElementById('btn-next-month').addEventListener('click', () => {
      displayMonth++;
      if (displayMonth > 11) {
        displayMonth = 0;
        displayYear++;
      }
      renderCalendar();
    });

    // ==========================================================================
    // TABS LOGIC
    // ==========================================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        
        if (targetTab === 'journal') document.getElementById('panel-journal').classList.add('active');
        else if (targetTab === 'history') document.getElementById('panel-history').classList.add('active');
        else if (targetTab === 'active-pos') document.getElementById('panel-active-pos').classList.add('active');
      });
    });

    // ==========================================================================
    // DYNAMIC TREND LINE CHART
    // ==========================================================================
    function updateTrendChart() {
      const sortedKeys = Object.keys(dailyHistoryData).sort();
      const pathEl = document.getElementById('trendPath');
      const dotBack = document.getElementById('glowingDotBack');
      const dotFront = document.getElementById('glowingDotFront');

      if (sortedKeys.length === 0) {
        pathEl.setAttribute('d', "M 10 60 L 310 60");
        dotBack.setAttribute('cx', 310); dotBack.setAttribute('cy', 60);
        dotFront.setAttribute('cx', 310); dotFront.setAttribute('cy', 60);
        return;
      }

      let currentCumulative = 0;
      let points = [];
      const startX = 10;
      const endX = 310;
      const stepX = sortedKeys.length > 1 ? (endX - startX) / (sortedKeys.length - 1) : 300;

      sortedKeys.forEach((key, index) => {
        currentCumulative += parseFloat(dailyHistoryData[key].profit || 0);
        
        let y = 60 - (currentCumulative * 5); 
        if (y < 10) y = 10; 
        if (y > 110) y = 110; 

        points.push({ x: startX + (index * stepX), y: y });
      });

      let dAttr = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        dAttr += ` L ${points[i].x} ${points[i].y}`;
      }
      pathEl.setAttribute('d', dAttr);

      const lastPoint = points[points.length - 1];
      dotBack.setAttribute('cx', lastPoint.x); dotBack.setAttribute('cy', lastPoint.y);
      dotFront.setAttribute('cx', lastPoint.x); dotFront.setAttribute('cy', lastPoint.y);

      if (currentCumulative >= 0) {
        pathEl.setAttribute('stroke', '#00b4d8');
        dotBack.setAttribute('fill', 'rgba(0, 180, 216, 0.35)');
        dotFront.setAttribute('fill', '#00b4d8');
      } else {
        pathEl.setAttribute('stroke', '#f6465d');
        dotBack.setAttribute('fill', 'rgba(246, 70, 93, 0.35)');
        dotFront.setAttribute('fill', '#f6465d');
      }
    }

    // ==========================================================================
    // SAVE & RUN PARAMETERS SYNC
    // ==========================================================================
    
    btnSaveEa.addEventListener('click', () => {
      if (btnSaveEa.classList.contains('disabled')) return;

      const lot = document.getElementById('ea-lot-size').value;
      const tp = document.getElementById('ea-target-tp').value;
      const sl = document.getElementById('ea-max-loss').value;
      limit24hVal = parseFloat(document.getElementById('limit-input').value.replace('$', '')) || 0.50;
      lowLotVal = parseFloat(document.getElementById('ea-low-lot').value) || 0.30;
      const symbol = eaSymbolSelect.value;

      btnSaveEa.innerText = "Saving...";
      btnSaveEa.classList.add('disabled');

      const settingsParams = { lot, tp, sl, active: eaActive, limit24h: limit24hVal, lowLot: lowLotVal, symbol };
      localStorage.setItem('eaSettingsParams', JSON.stringify(settingsParams));

      fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsParams)
      })
      .then(res => res.text())
      .then(() => {
        alert("បានរក្សាទុកការកំណត់ជោគជ័យ!");
        btnSaveEa.innerText = "Save";
        validateEaForm();
      })
      .catch(() => {
        alert("ការរក្សាទុកបរាជ័យ!");
        btnSaveEa.innerText = "Save";
        validateEaForm();
      });
    });

    function updateUIWithActiveState() {
      const statusBadge = document.getElementById('ea-trading-status-badge');
      const spinnerIcon = document.getElementById('ea-spinner-icon');

      if (eaActive === 1) {
        btnRunEa.innerText = "Run";
        btnRunEa.style.backgroundColor = "#00b4d8"; 
        statusBadge.innerText = "Trading Auto";
        statusBadge.style.color = "#0ecb81";
        statusBadge.style.backgroundColor = "rgba(14, 203, 129, 0.15)";
        spinnerIcon.classList.remove('stopped'); 
      } else {
        btnRunEa.innerText = "Stopped";
        btnRunEa.style.backgroundColor = "#f6465d"; 
        statusBadge.innerText = "Trading Stopped";
        statusBadge.style.color = "#f6465d";
        statusBadge.style.backgroundColor = "rgba(246, 70, 93, 0.15)";
        spinnerIcon.classList.add('stopped'); 
      }
    }

    btnRunEa.addEventListener('click', () => {
      const lot = document.getElementById('ea-lot-size').value;
      const tp = document.getElementById('ea-target-tp').value;
      const sl = document.getElementById('ea-max-loss').value;
      const symbol = eaSymbolSelect.value;

      if (eaActive === 1) {
        eaActive = 0;
      } else {
        eaActive = 1;
      }

      updateUIWithActiveState();

      const settingsParams = { lot, tp, sl, active: eaActive, limit24h: limit24hVal, lowLot: lowLotVal, symbol };
      localStorage.setItem('eaSettingsParams', JSON.stringify(settingsParams));

      fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsParams)
      });
    });

    loadLocalSettings();

    // Loop Sync រៀងរាល់ ២ វិនាទី
    setInterval(() => {
      fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        const balance = parseFloat(data.balance || 0);
        const equity = parseFloat(data.equity || 0);
        accountBalanceLimit = balance;

        document.getElementById('balance-display-value').innerText = `$${balance.toFixed(2)}`;
        document.getElementById('equity-display-value').innerText = `$${equity.toFixed(2)}`;
        
        let totalActiveProfit = 0;
        if (data.positions && data.positions.length > 0) {
          data.positions.forEach(pos => {
            totalActiveProfit += parseFloat(pos.profit || 0);
          });
        }
        
        if (totalActiveProfit >= 0) {
          document.getElementById('tp-display-value').innerText = `+ $${totalActiveProfit.toFixed(2)}`;
          document.getElementById('sl-display-value').innerText = `- $0.00`;
          
          document.getElementById('date-tp-value').innerText = `+$${totalActiveProfit.toFixed(2)}`;
          document.getElementById('date-sl-value').innerText = `-$0.00`;
        } else {
          document.getElementById('tp-display-value').innerText = `+ $0.00`;
          document.getElementById('sl-display-value').innerText = `- $${Math.abs(totalActiveProfit).toFixed(2)}`;
          
          document.getElementById('date-tp-value').innerText = `+$0.00`;
          document.getElementById('date-sl-value').innerText = `-$${Math.abs(totalActiveProfit).toFixed(2)}`;
        }

        // --- ការគណនាទិន្នន័យចំណេញប្រចាំថ្ងៃសម្រាប់ទំព័រ Date Reports ---
        let closedProfitToday = 0;
        if (data.history && data.history.length > 0) {
          data.history.forEach(deal => {
            closedProfitToday += parseFloat(deal.profit || 0);
          });
        }

        // ប្រាក់ចំណេញសរុបថ្ងៃនេះ = ប្រាក់ចំណេញបិទរួច + ប្រាក់ចំណេញកំពុងរត់ (Floating)
        let totalRealtimeProfitToday = closedProfitToday + totalActiveProfit;

        if (totalRealtimeProfitToday !== 0) {
          const todayObj = new Date();
          const todayKey = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
          
          dailyHistoryData[todayKey] = { profit: totalRealtimeProfitToday };
          localStorage.setItem('dailyHistoryData', JSON.stringify(dailyHistoryData));
        }

        const diff = data.serverTime - data.lastPing;
        const connectionBadge = document.getElementById('vps-connection-badge');

        if (data.lastPing === 0) {
          connectionBadge.innerText = "Connecting...";
          connectionBadge.style.color = "#ffb11a";
          connectionBadge.style.backgroundColor = "rgba(255, 177, 26, 0.15)";
        } else if (diff < 6000) {
          connectionBadge.innerText = "Success";
          connectionBadge.style.color = "#0ecb81";
          connectionBadge.style.backgroundColor = "rgba(14, 203, 129, 0.15)";
          
          if (data.positions.length === 0 && data.history.length > 0) {
            let sumProfit24h = 0;
            data.history.forEach(deal => {
              sumProfit24h += parseFloat(deal.profit || 0);
            });
            
            if (sumProfit24h >= limit24hVal) {
              eaActive = 0;
              updateUIWithActiveState();
            }
          }
        } else {
          connectionBadge.innerText = "Failed";
          connectionBadge.style.color = "#f6465d";
          connectionBadge.style.backgroundColor = "rgba(246, 70, 93, 0.15)";
        }

        // Active Positions Render
        const activeListArea = document.getElementById('active-list-area');
        if (data.positions && data.positions.length > 0) {
          activeListArea.innerHTML = data.positions.map(pos => {
            const typeText = pos.type === 0 ? 'BUY' : 'SELL';
            const colorClass = pos.type === 0 ? 'tp-color' : 'sl-color';
            const profitColor = parseFloat(pos.profit) >= 0 ? 'tp-color' : 'sl-color';
            return `
              <div class="table-row-item">
                <span>${pos.ticket}</span>
                <span class="${colorClass}" style="font-weight: bold;">${typeText}</span>
                <span>${parseFloat(pos.volume).toFixed(2)}</span>
                <span>$${parseFloat(pos.price).toFixed(2)}</span>
                <span class="${profitColor}">$${parseFloat(pos.profit).toFixed(2)}</span>
              </div>
            `;
          }).join('');
        } else {
          activeListArea.innerHTML = `<div class="empty-state-text">គ្មានលំដាប់ជួញដូរកំពុងដំណើរការឡើយ</div>`;
        }

        // History Render
        const historyListArea = document.getElementById('history-list-area');
        if (data.history && data.history.length > 0) {
          historyListArea.innerHTML = data.history.map(his => {
            const typeText = his.type === 0 ? 'BUY' : 'SELL';
            const colorClass = his.type === 0 ? 'tp-color' : 'sl-color';
            const profitColor = parseFloat(his.profit) >= 0 ? 'tp-color' : 'sl-color';
            return `
              <div class="table-row-item">
                <span>${his.ticket}</span>
                <span class="${colorClass}">${typeText}</span>
                <span>${parseFloat(his.volume).toFixed(2)}</span>
                <span class="${profitColor}">$${parseFloat(his.profit).toFixed(2)}</span>
                <span style="color: #5e6673;">${his.time}</span>
              </div>
            `;
          }).join('');
        } else {
          historyListArea.innerHTML = `<div class="empty-state-text">គ្មានប្រវត្តិប្រតិបត្តិការឡើយ</div>`;
        }

        // Journal Render
        const journalLogArea = document.getElementById('journal-log-area');
        if (data.journal && data.journal.length > 0) {
          journalLogArea.innerHTML = data.journal.map(log => `<div>${log}</div>`).join('');
        }

        // Auto Refresh Calendar និង Chart នៅពេលកំពុងបើកមើលទំព័រ Date Reports
        if (viewDate.style.display === 'block') {
          renderCalendar();
          updateTrendChart();
        }
      })
      .catch(err => console.log("Sync failed: ", err));

      fetchTransactions();
    }, 2000);
  </script>
