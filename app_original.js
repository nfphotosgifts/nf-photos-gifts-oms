$transcriptPath = "C:\Users\nfpho\.gemini\antigravity\brain\5208e3d6-0110-4dd1-aee0-d7cc13f9e405\.system_generated\logs\transcript_full.jsonl"
$lines = Get-Content -Path $transcriptPath

$parts = @{
    "1_800" = $null
    "801_1600" = $null
    "1601_2400" = $null
    "2401_3180" = $null
}

foreach ($line in $lines) {
    if ($line.Trim() -eq "") { continue }
    try {
        $json = ConvertFrom-Json $line
        $content = $json.content
            $parts["1_800"] = $content
        }
            $parts["801_1600"] = $content
        }
            $parts["1601_2400"] = $content
        }
            $parts["2401_3180"] = $content
        }
    } catch {
        # ignore parse errors
    }
}

# Function to clean up the content (remove line prefixes like "123: ")
function Clean-Part($partText) {
    if ($null -eq $partText) {
        Write-Error "Part is null!"
        return $null
    }
    
    # Split by newlines
    $lines = $partText -split "`n"
    $cleanLines = @()
    
    $startCoding = $false
    foreach ($line in $lines) {
            $startCoding = $true
            continue
        }
            continue
        }
        if (-not $startCoding) {
            continue
        }
        if ($line.Trim() -eq "") {
            $cleanLines += ""
            continue
        }
        
        # Match pattern like "123: " and strip it
        if ($line -match "^\s*(\d+):\s?(.*)") {
            $cleanLines += $Matches[2]
        } else {
            $cleanLines += $line
        }
    }
    return $cleanLines -join "`r`n"
}

$c1 = Clean-Part $parts["1_800"]
$c2 = Clean-Part $parts["801_1600"]
$c3 = Clean-Part $parts["1601_2400"]
$c4 = Clean-Part $parts["2401_3180"]

$fullContent = $c1 + "`r`n" + $c2 + "`r`n" + $c3 + "`r`n" + $c4
Set-Content -Path "e:\OMS\New folder\app_original.js" -Value $fullContent -NoNewline

Write-Output "Successfully reconstructed original app.js from transcript_full.jsonl!"

The above content shows the entire, complete file contents of the requested file.



  resetDemoData() {
    if (confirm("Are you sure you want to restore the demo mock data? This will overwrite your local changes.")) {
      localStorage.removeItem('nf_oms_seeded_spreadsheet_v4');
      this.seedMockData();
      this.loadDemoData();
      this.renderAll();
      this.closeSettingsModal();
      alert("Demo data restored successfully.");
    }
  }

  // 2. Firebase / Firestore Handlers
  setupFirestoreListeners() {
    // Config listener
    this.db.collection('system_settings').doc('config').onSnapshot((docSnapshot) => {
      if (docSnapshot.exists) {
        this.settings = docSnapshot.data();
        if (this.settings && this.settings.upiId === 'nfphotosgifts@upi') {
          this.settings.upiId = 'photosgiftsbynf@sbi';
          this.db.collection('system_settings').doc('config').update({ upiId: 'photosgiftsbynf@sbi' });
        }
      } else {
        // Initialize config doc if it doesn't exist
        this.db.collection('system_settings').doc('config').set(this.settings);
      }
      this.renderAll();
    });

    // Photographers listener
    this.db.collection('photographers').orderBy('name').onSnapshot((snapshot) => {
      this.photographers = [];
      snapshot.forEach(doc => {
        this.photographers.push({ id: doc.id, ...doc.data() });
      });
      this.renderAll();
    });

    // Orders listener
    this.db.collection('orders').orderBy('invoiceSeq', 'desc').onSnapshot((snapshot) => {
      this.orders = [];
      snapshot.forEach(doc => {
        this.orders.push({ id: doc.id, ...doc.data() });
      });
      // If we are looking at details, update it reactive
      if (this.activeOrderId) {
        this.renderOrderDetails(this.activeOrderId);
      }
      this.renderAll();
    });

    // Payments listener
    this.db.collection('payments').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
      this.payments = [];
      snapshot.forEach(doc => {
        this.payments.push({ id: doc.id, ...doc.data() });
      });
      if (this.activeOrderId) {
        this.renderOrderDetails(this.activeOrderId);
      }
      this.renderAll();
    });
  }

  openFirebaseConfigModal() {
    document.getElementById('firebaseConfigText').value = localStorage.getItem('nf_oms_firebase_config') || '';
    document.getElementById('firebaseConfigModal').classList.add('active');
  }

  closeFirebaseConfigModal() {
    document.getElementById('firebaseConfigModal').classList.remove('active');
  }

  saveFirebaseConfig() {
    const configText = document.getElementById('firebaseConfigText').value.trim();
    if (!configText) {
      localStorage.removeItem('nf_oms_firebase_config');
      alert("Firebase config cleared. The app will reload in offline/demo mode.");
      window.location.reload();
      return;
    }

    try {
      JSON.parse(configText); // Verify JSON format
      localStorage.setItem('nf_oms_firebase_config', configText);
      alert("Firebase Config saved successfully! Reloading to connect...");
      window.location.reload();
    } catch (err) {
      alert("Invalid JSON format. Please copy the complete Firebase Web Config SDK Object.");
    }
  }

  // 3. UI View Manager
  initializeUI() {
    lucide.createIcons();
    this.switchView('dashboard');
    this.populatePhotographerDropdowns();
  }

  switchView(viewId) {
    this.currentView = viewId;
    
    // Toggle active state in desktop header tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    const activeTab = document.getElementById(`tab-${viewId}`);
    if (activeTab) activeTab.classList.add('active');

    // Toggle active state in mobile bottom bar
    document.querySelectorAll('.bottom-nav-item').forEach(tab => {
      tab.classList.remove('active');
    });
    const activeBottomTab = document.getElementById(`bottom-tab-${viewId}`);
    if (activeBottomTab) activeBottomTab.classList.add('active');

    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    // Show selected view
    document.getElementById(`view-${viewId}`).style.display = 'block';

    if (viewId === 'dashboard') {
      this.activeOrderId = null;
      this.renderDashboard();
    } else if (viewId === 'photographers') {
      this.renderPhotographers();
    } else if (viewId === 'reports') {
      this.renderReports();
    }
    
    lucide.createIcons();
  }

  renderAll() {
    if (this.currentView === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentView === 'photographers') {
      this.renderPhotographers();
    } else if (this.currentView === 'reports') {
      this.renderReports();
    }
    this.populatePhotographerDropdowns();
  }

  // 4. Calculations Helpers
  calculateOrderFinancials(order) {
    // If it's a combined temporary invoice, sum the totals of the actual individual orders
    if (order.id === 'combined_temp' && order.combinedOrderIds) {
      let gross = 0;
      let received = 0;
      let balance = 0;
      order.combinedOrderIds.forEach(id => {
        const origOrder = this.orders.find(o => o.id === id);
        if (origOrder) {
          const fin = this.calculateOrderFinancials(origOrder);
          gross += fin.gross;
          received += fin.received;
          balance += fin.balance;
        }
      });
      return { gross, received, balance };
    }

    let gross = 0;
    let received = 0;
    
    if (order.albums && order.albums.length > 0) {
      order.albums.forEach(album => {
        const pages = Number(album.pages) || 0;
        const rate = Number(album.rate) || 0;
        const coverDesign = album.coverIncluded;
        const coverCharge = coverDesign ? rate : 0; // Cover design charge is automatically equal to Rate Per Page
        
        album.coverCharge = rate; // Keep coverCharge in sync with the per-page rate
        album.total = (pages * rate) + coverCharge;
        gross += album.total;
        received += Number(album.received) || 0;
      });
    }
    
    // Fetch ledger payments for this order
    const ledgerPayments = this.payments
      .filter(p => p.orderId === order.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
      
    // Total received = album level received + transaction ledger payments
    const totalReceived = received + ledgerPayments;
    const balance = gross - totalReceived;

    return {
      gross,
      received: totalReceived,
      balance
    };
  }

  getUpiLink(order, amount) {
    const rawUpiId = this.settings.upiId || 'photosgiftsbynf@sbi';
    const rawBizName = this.settings.businessName || 'NF PHOTOS GIFTS';
    
    // Strict sanitization for PhonePe and other UPI app compatibility
    const cleanUpiId = rawUpiId.trim().toLowerCase();
    const cleanBizName = rawBizName.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 20);
    const cleanAmount = Number(amount || 0).toFixed(2);
    const cleanNote = `Invoice ${order.invoiceNumber}`.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 20);

    return `upi://pay?pa=${cleanUpiId}&pn=${encodeURIComponent(cleanBizName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
  }

  // 5. Dashboard Page
  renderDashboard() {
    // 1. Calculations KPIs
    let totalProjects = this.orders.length;
    let activeAlbums = 0;
    let totalBusiness = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let monthEarnings = 0;
    let weekPayments = 0;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Start of current week (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    this.orders.forEach(order => {
      const fin = this.calculateOrderFinancials(order);
      totalBusiness += fin.gross;
      totalReceived += fin.received;
      totalPending += fin.balance;
      
      if (order.albums) {
        activeAlbums += order.albums.length;
      }
      
      // Calculate month earnings (Based on booking date)
      if (order.orderDate) {
        const oDate = new Date(order.orderDate);
        if (oDate.getFullYear() === currentYear && oDate.getMonth() === currentMonth) {
          monthEarnings += fin.gross;
        }
      }
    });

    // Calculate weekly payments collected (From payment transactions ledger)
    this.payments.forEach(payment => {
      if (payment.date) {
        const pDate = new Date(payment.date);
        if (pDate >= sevenDaysAgo && pDate <= now) {
          weekPayments += Number(payment.amount);
        }
      }
    });

    const completedCount = this.orders.filter(o => o.status === 'Completed').length;
    const photographersCount = this.photographers.length;

    // Update Dom
    document.getElementById('kpi-total-projects').innerText = totalProjects;
    document.getElementById('kpi-active-albums').innerText = activeAlbums;
    document.getElementById('kpi-total-business').innerText = '₹' + totalBusiness.toLocaleString('en-IN');
    document.getElementById('kpi-total-received').innerText = '₹' + totalReceived.toLocaleString('en-IN');
    document.getElementById('kpi-net-outstanding').innerText = '₹' + totalPending.toLocaleString('en-IN');
    
    // Color code outstanding balance card
    const outstandingCard = document.getElementById('kpi-outstanding-card');
    if (totalPending > 0) {
      outstandingCard.classList.remove('fully-paid');
    } else {
      outstandingCard.classList.add('fully-paid');
    }
    
    document.getElementById('kpi-month-earnings').innerText = '₹' + monthEarnings.toLocaleString('en-IN');
    document.getElementById('kpi-week-payments').innerText = '₹' + weekPayments.toLocaleString('en-IN');
    document.getElementById('kpi-completed-projects').innerText = completedCount;
    document.getElementById('kpi-total-photographers').innerText = photographersCount;

    this.filterOrders();
    this.renderWeeklyReminders();
  }

  setStatusFilter(status, element) {
    this.statusFilter = status;
    document.querySelectorAll('#statusChipsContainer .chip').forEach(chip => {
      chip.classList.remove('active');
    });
    element.classList.add('active');
    this.filterOrders();
  }

  filterOrders() {
    const query = document.getElementById('dashboardSearch').value.toLowerCase().trim();
    const payStatus = document.getElementById('filterPaymentStatus').value;
    const eventType = document.getElementById('filterEventType').value;
    
    const container = document.getElementById('ordersList');
    container.innerHTML = '';
    
    const filtered = this.orders.filter(order => {
      const fin = this.calculateOrderFinancials(order);
      
      // 1. Text Search
      const matchesSearch = 
        order.clientName.toLowerCase().includes(query) ||
        order.photographerName.toLowerCase().includes(query) ||
        order.invoiceNumber.toLowerCase().includes(query);
        
      // 2. Status Chip Filter
      const matchesStatus = this.statusFilter === 'all' || order.status === this.statusFilter;
      
      // 3. Payment Filter
      let matchesPayment = true;
      if (payStatus === 'pending') {
        matchesPayment = fin.balance > 0;
      } else if (payStatus === 'fully-paid') {
        matchesPayment = fin.balance <= 0;
      }
      
      // 4. Event Filter
      const matchesEvent = eventType === 'all' || order.eventType === eventType;

      return matchesSearch && matchesStatus && matchesPayment && matchesEvent;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <i data-lucide="folder-open" style="width: 48px; height: 48px; margin-bottom: 8px;"></i>
          <p>No projects found matching the criteria.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    filtered.forEach(order => {
      const fin = this.calculateOrderFinancials(order);
      const isPending = fin.balance > 0;
      
      // Status formatting
      let statusClass = 'badge-info';
      if (order.status === 'Completed') statusClass = 'badge-success';
      else if (order.status === 'Approved') statusClass = 'badge-success';
      else if (order.status === 'Changes Requested') statusClass = 'badge-warning';
      
      // Smart Status Text for Google Drive Sent with pending balance
      let smartStatusText = order.status;
      if (order.status === 'Google Drive Link Sent') {
        if (isPending) {
          smartStatusText = `G Drive Sent (Payment Pending)`;
          statusClass = 'badge-pending';
        } else {
          smartStatusText = `G Drive Sent`;
          statusClass = 'badge-success';
        }
      }

      const card = document.createElement('div');
      card.className = 'order-card';
      card.onclick = () => this.openOrderDetails(order.id);
      
      card.innerHTML = `
        <div class="order-main-info">
          <div class="order-header">
            <span class="order-id">${order.invoiceNumber}</span>
            <span class="order-title">${order.clientName}</span>
            <span class="badge ${statusClass}">${smartStatusText}</span>
          </div>
          <div class="order-meta">
            <span><i data-lucide="camera" style="width: 12px; height: 12px; display:inline; vertical-align:middle;"></i> ${order.photographerName}</span>
            <span>•</span>
            <span><i data-lucide="tag" style="width: 12px; height: 12px; display:inline; vertical-align:middle;"></i> ${order.eventType}</span>
            <span>•</span>
            <span><i data-lucide="calendar" style="width: 12px; height: 12px; display:inline; vertical-align:middle;"></i> ${order.orderDate || 'N/A'}</span>
          </div>
        </div>
        <div class="order-financials">
          <div class="order-amt-block">
            <div class="order-amt-label">Gross</div>
            <div class="order-amt-val">₹${fin.gross.toLocaleString('en-IN')}</div>
          </div>
          <div class="order-amt-block">
            <div class="order-amt-label">Due</div>
            <div class="order-amt-val ${isPending ? 'due' : ''}">₹${fin.balance.toLocaleString('en-IN')}</div>
          </div>
          ${(order.googleDriveLink || order.rawPhotosLink) ? `
            <a class="btn btn-secondary btn-icon" href="${order.googleDriveLink || order.rawPhotosLink}" target="_blank" onclick="event.stopPropagation();" title="Open Google Drive Link" style="padding: 0; width: 36px; height: 36px; color: #4285F4; border-color: rgba(66, 133, 244, 0.3);">
              <i data-lucide="folder-open" style="width: 16px; height: 16px;"></i>
            </a>
          ` : ''}
          <button class="btn btn-secondary btn-icon" onclick="event.stopPropagation(); app.openQuickPayModal('${order.id}')" title="Quick Payment" style="padding: 0; width: 36px; height: 36px;">
            <i data-lucide="indian-rupee" style="width: 16px; height: 16px;"></i>
          </button>
          <i data-lucide="chevron-right" style="color: var(--text-secondary);"></i>
        </div>
      `;
      
      container.appendChild(card);
    });
    
    lucide.createIcons();
  }

  renderWeeklyReminders() {
    const container = document.getElementById('weeklyRemindersList');
    const panel = document.getElementById('weeklyRemindersPanel');
    if (!container || !panel) return;

    container.innerHTML = '';
    
    // Filter orders with balance > 0 and status in ['Approved', 'Google Drive Link Sent', 'Completed']
    const pendingOrders = this.orders.filter(o => {
      if (o.id === 'combined_temp') return false;
      const fin = this.calculateOrderFinancials(o);
      const isAllowedStatus = ['Approved', 'Google Drive Link Sent', 'Completed'].includes(o.status);
      return fin.balance > 0 && isAllowedStatus;
    });

    if (pendingOrders.length === 0) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'flex';

    pendingOrders.forEach(o => {
      const fin = this.calculateOrderFinancials(o);
      
      let statusClass = 'badge-info';
      if (o.status === 'Completed') statusClass = 'badge-success';
      else if (o.status === 'Approved') statusClass = 'badge-success';
      else if (o.status === 'Changes Requested') statusClass = 'badge-warning';
      
      let smartStatusText = o.status;
      if (o.status === 'Google Drive Link Sent') {
        smartStatusText = `G Drive Sent (Payment Pending)`;
        statusClass = 'badge-pending';
      }

      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.backgroundColor = 'var(--card-bg)';
      item.style.padding = '8px 12px';
      item.style.borderRadius = '8px';
      item.style.border = '1px solid var(--card-border)';
      item.style.fontSize = '0.9rem';

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <strong>${o.clientName}</strong> (${o.invoiceNumber}) 
          <span style="color: var(--text-secondary); font-size: 0.8rem;">Photographer: ${o.photographerName}</span>
          <span class="badge ${statusClass}" style="font-size: 0.65rem; padding: 2px 6px;">${smartStatusText}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <strong style="color: var(--pending-color);">Due: ₹${fin.balance.toLocaleString('en-IN')}</strong>
          <button class="btn btn-secondary" onclick="app.openWhatsappModal('${o.id}')" style="padding: 4px 10px; font-size: 0.75rem; border-color: #25D366; color: #128C7E; display: flex; align-items: center; gap: 4px;">
            <i data-lucide="message-square" style="width: 12px; height: 12px; color: #25D366;"></i> Remind
          </button>
        </div>
      `;
      container.appendChild(item);
    });

    lucide.createIcons();
  }

  sendWhatsAppReminderForId(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);
    const photog = this.photographers.find(p => p.id === order.photographerId);
    const mobile = (order.directContact || !photog) ? order.clientMobile : (photog.mobile || order.clientMobile);
    
    if (!mobile) {
      alert("Please configure a mobile number for this photographer or client first.");
      return;
    }

    const upiId = this.settings.upiId || 'photosgiftsbynf@sbi';
    const bizName = this.settings.businessName || 'NF PHOTOS GIFTS';
    const upiLink = this.getUpiLink(order, fin.balance);

    const message = `*Payment Reminder - ${bizName}*\n` +
      `-----------------------------\n` +
      `Dear *${order.clientName}*,\n` +
      `This is a friendly reminder that an outstanding balance of *₹${fin.balance}* is pending on your album order *${order.invoiceNumber}* (${order.eventType}).\n\n` +
      `Please pay using the UPI checkout link below:\n` +
      `👉 ${upiLink}\n\n` +
      `Thank you for your cooperation!`;

    window.open(this.generateWhatsAppURL(mobile, message), '_blank');
  }

  openWhatsappModal(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    this.whatsappOrderId = orderId;
    const fin = this.calculateOrderFinancials(order);
    const upiLink = this.getUpiLink(order, fin.balance);
    const bizName = this.settings.businessName || 'NF PHOTOS GIFTS';

    const msg1 = `*Invoice No:* ${order.invoiceNumber}\n` +
      `*Client Name:* ${order.clientName}\n` +
      `*Order Status:* ${order.status}\n\n` +
      `Hello, a friendly payment reminder from *${bizName}*.\n` +
      `Outstanding balance: *₹${fin.balance.toLocaleString('en-IN')}*\n` +
      `👉 Pay via UPI: ${upiLink}\n\n` +
      `Thank you!`;

    const msg2 = `*Invoice No:* ${order.invoiceNumber}\n` +
      `*Client Name:* ${order.clientName}\n` +
      `*Order Status:* ${order.status}\n\n` +
      `Final settlement request from *${bizName}*.\n` +
      `Please clear the outstanding amount of *₹${fin.balance.toLocaleString('en-IN')}* using the link below:\n` +
      `👉 Settle via UPI: ${upiLink}\n\n` +
      `Thank you for your business.`;

    document.getElementById('wa-preview-1').innerText = msg1;
    document.getElementById('wa-preview-2').innerText = msg2;

    document.getElementById('whatsappModal').classList.add('active');
  }

  closeWhatsappModal() {
    document.getElementById('whatsappModal').classList.remove('active');
    this.whatsappOrderId = null;
  }

  sendSelectedWhatsApp(templateId) {
    if (!this.whatsappOrderId) return;
    const order = this.orders.find(o => o.id === this.whatsappOrderId);
    if (!order) return;

    // Determine target mobile: photographer or client
    const photog = this.photographers.find(p => p.id === order.photographerId);
    const mobile = (order.directContact || !photog) ? order.clientMobile : (photog.mobile || order.clientMobile);

    if (!mobile) {
      alert("Please configure a mobile number for this photographer or client first.");
      return;
    }

    const message = templateId === 1 
      ? document.getElementById('wa-preview-1').innerText 
      : document.getElementById('wa-preview-2').innerText;

    window.open(this.generateWhatsAppURL(mobile, message), '_blank');
    this.closeWhatsappModal();
  }

  // 6. Order Details Page
  openOrderDetails(orderId) {
    this.activeOrderId = orderId;
    this.switchView('order-details');
    this.renderOrderDetails(orderId);
  }

  renderOrderDetails(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);

    // Meta prefill
    document.getElementById('detail-invoice-number').innerText = order.invoiceNumber;
    document.getElementById('detail-client-name-title').innerText = order.clientName;
    document.getElementById('detail-event-badge').innerText = order.eventType;
    document.getElementById('detail-photographer-name').innerText = order.photographerName;

    // Smart Payment badge in details
    const indicatorBox = document.getElementById('detail-payment-indicator');
    if (order.status === 'Google Drive Link Sent') {
      if (fin.balance > 0) {
        indicatorBox.innerHTML = `<span class="badge badge-pending">G Drive Sent (Payment Pending)</span>`;
      } else {
        indicatorBox.innerHTML = `<span class="badge badge-success">G Drive Sent (Paid)</span>`;
      }
    } else {
      indicatorBox.innerHTML = fin.balance > 0 
        ? `<span class="badge badge-pending">Pending ₹${fin.balance}</span>` 
        : `<span class="badge badge-success">Fully Paid</span>`;
    }

    // Dropdowns & Fields
    document.getElementById('detail-status').value = this.albumTypes.includes(order.status) || this.eventTypes.includes(order.status) || [
      'Order Received', 'Designing', 'PDF Sent', 'Changes Requested', 'Approved', 'Google Drive Link Sent', 'Completed', 'Archived'
    ].includes(order.status) ? order.status : 'Other';

    const customStatusInput = document.getElementById('detail-custom-status');
    if (document.getElementById('detail-status').value === 'Other') {
      customStatusInput.style.display = 'block';
      customStatusInput.value = order.status;
    } else {
      customStatusInput.style.display = 'none';
    }

    document.getElementById('detail-client-mobile').value = order.clientMobile || '';
    document.getElementById('detail-direct-contact').value = order.directContact ? 'yes' : 'no';
    document.getElementById('detail-order-date').value = order.orderDate || '';
    document.getElementById('detail-delivery-date').value = order.deliveryDate || '';
    document.getElementById('detail-raw-link').value = order.rawPhotosLink || '';
    document.getElementById('detail-final-link').value = order.googleDriveLink || '';
    document.getElementById('detail-notes').value = order.notes || '';

    // Totals
    document.getElementById('detail-gross-amount').innerText = '₹' + fin.gross.toLocaleString('en-IN');
    document.getElementById('detail-received-amount').innerText = '₹' + fin.received.toLocaleString('en-IN');
    document.getElementById('detail-balance-amount').innerText = '₹' + fin.balance.toLocaleString('en-IN');

    // Pre-fill Bill Slip requested amount input box with outstanding balance if empty
    const requestInput = document.getElementById('billRequestAmount');
    if (!requestInput.dataset.edited || requestInput.dataset.orderId !== orderId) {
      requestInput.value = fin.balance;
      requestInput.dataset.orderId = orderId;
      delete requestInput.dataset.edited;
      order.requestAmount = fin.balance;
    }

    // Render itemized albums cards
    this.renderAlbumEditorCards(order);
    this.renderPaymentLedger(order);
    this.renderBillSlip();
  }

  // Render album list in details view
  renderAlbumEditorCards(order) {
    const list = document.getElementById('itemizedAlbumsList');
    list.innerHTML = '';

    if (!order.albums || order.albums.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 0.95rem;">No albums added to this project yet.</div>`;
      return;
    }

    order.albums.forEach((album, idx) => {
      const card = document.createElement('div');
      card.className = 'album-item-card';
      
      const typeOptions = this.albumTypes.map(t => `<option value="${t}" ${album.type === t ? 'selected' : ''}>${t}</option>`).join('');
      const sizeOptions = this.albumSizes.map(s => `<option value="${s}" ${album.size === s ? 'selected' : ''}>${s}</option>`).join('');

      card.innerHTML = `
        <div class="album-item-header">
          <strong style="font-size: 0.95rem;">Album #${idx + 1}</strong>
          <button class="remove-album-btn" onclick="app.removeAlbumItem(${idx})" title="Remove Album">
            <i data-lucide="trash" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
        <div class="album-item-grid">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.65rem;">Album Type</label>
            <select class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" onchange="app.updateAlbumField(${idx}, 'type', this.value)">
              ${typeOptions}
              <option value="Other" ${!this.albumTypes.includes(album.type) ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.65rem;">Size</label>
            <select class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" onchange="app.updateAlbumField(${idx}, 'size', this.value)">
              ${sizeOptions}
              <option value="Other" ${!this.albumSizes.includes(album.size) ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.65rem;">Pages (Sheets)</label>
            <input type="number" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" value="${album.pages}" onchange="app.updateAlbumField(${idx}, 'pages', this.value)">
          </div>
        </div>
        
        <!-- Custom text prompts if "Other" is selected -->
        <div class="form-row" style="margin-top: 4px;">
          ${!this.albumTypes.includes(album.type) ? `
            <div class="form-group" style="margin-bottom: 8px;">
              <input type="text" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" placeholder="Custom Album Type..." value="${album.type === 'Other' ? '' : album.type}" onchange="app.updateAlbumField(${idx}, 'type', this.value)">
            </div>
          ` : ''}
          ${!this.albumSizes.includes(album.size) ? `
            <div class="form-group" style="margin-bottom: 8px;">
              <input type="text" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" placeholder="Custom Size..." value="${album.size === 'Other' ? '' : album.size}" onchange="app.updateAlbumField(${idx}, 'size', this.value)">
            </div>
          ` : ''}
        </div>

        <div class="album-item-grid" style="margin-top: 8px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.65rem;">Rate per Page (₹)</label>
            <input type="number" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" value="${album.rate}" onchange="app.updateAlbumField(${idx}, 'rate', this.value)">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.65rem;">Received (₹)</label>
            <input type="number" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" value="${album.received || 0}" onchange="app.updateAlbumField(${idx}, 'received', this.value)">
          </div>
          <div class="form-group" style="margin-bottom: 0; display:flex; align-items:center; justify-content:space-between; height: 100%;">
            <div style="display:flex; flex-direction:column;">
              <span style="font-size: 0.65rem; font-weight:500; color:var(--text-secondary);">Cover Design</span>
              <span style="font-size: 0.55rem; color:var(--text-secondary);">₹${album.coverCharge}</span>
            </div>
            <label class="switch" style="transform: scale(0.85);">
              <input type="checkbox" ${album.coverIncluded ? 'checked' : ''} onchange="app.updateAlbumField(${idx}, 'coverIncluded', this.checked)">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="album-item-totals">
          <span class="album-total-text" style="font-size: 0.85rem;">Total Amount: ₹${album.total}</span>
          <span class="album-bal-text" style="font-size: 0.85rem;">Bal: ₹${album.total - (album.received || 0)}</span>
        </div>
      `;

      list.appendChild(card);
    });

    lucide.createIcons();
  }

  renderPaymentLedger(order) {
    const list = document.getElementById('paymentLedgerRows');
    list.innerHTML = '';

    const orderPayments = this.payments.filter(p => p.orderId === order.id);

    if (orderPayments.length === 0) {
      list.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 12px;">No payments recorded.</td></tr>`;
      return;
    }

    orderPayments.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.date || 'N/A'}</td>
        <td><span class="badge badge-success">${p.type}</span></td>
        <td>${p.notes || ''}</td>
        <td class="num">₹${Number(p.amount).toLocaleString('en-IN')}</td>
      `;
      list.appendChild(tr);
    });
  }

  // 7. Operations on Album item arrays
  addNewAlbumItem() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    if (!order.albums) order.albums = [];

    order.albums.push({
      type: 'Bride Album',
      size: '12×36 Inch',
      pages: 40,
      rate: 35,
      coverIncluded: true,
      coverCharge: 35,
      received: 0,
      total: 1435
    });

    this.saveOrderDetails(order);
  }

  removeAlbumItem(idx) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    if (confirm("Are you sure you want to delete this album item?")) {
      order.albums.splice(idx, 1);
      this.saveOrderDetails(order);
    }
  }

  updateAlbumField(idx, field, value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    if (field === 'pages' || field === 'rate' || field === 'received') {
      order.albums[idx][field] = Number(value);
    } else {
      order.albums[idx][field] = value;
    }

    // Force cover charge to equal per-page rate
    order.albums[idx].coverCharge = order.albums[idx].rate;

    // Recalculate individual album total
    const pages = Number(order.albums[idx].pages) || 0;
    const rate = Number(order.albums[idx].rate) || 0;
    const coverDesign = order.albums[idx].coverIncluded;
    const coverCharge = coverDesign ? rate : 0;
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.

    order.albums[idx].total = (pages * rate) + coverCharge;


    this.saveOrderDetails(order);
  }

  updateOrderMeta(field, value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    order[field] = value;
    this.saveOrderDetails(order);
  }

  updateDriveLink(value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    order.googleDriveLink = value.trim();
    this.saveOrderDetailsSilent(order);

    // Show visual feedback
    const feedback = document.getElementById('driveLinkFeedback');
    if (feedback) {
      feedback.style.display = 'inline';
      clearTimeout(this.driveLinkFeedbackTimeout);
      this.driveLinkFeedbackTimeout = setTimeout(() => {
        feedback.style.display = 'none';
      }, 1500);
    }
  }

  async saveOrderDetailsSilent(order) {
    if (!this.isDemoMode) {
      try {
        await this.db.collection('orders').doc(order.id).update(order);
      } catch (err) {
        console.error("Error writing to Firestore:", err);
      }
    } else {
      const idx = this.orders.findIndex(o => o.id === order.id);
      if (idx !== -1) {
        this.orders[idx] = order;
        this.saveDemoDataToLocalStorage();
      }
    }
  }

  updateOrderStatus(value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    if (value === 'Other') {
      document.getElementById('detail-custom-status').style.display = 'block';
    } else {
      document.getElementById('detail-custom-status').style.display = 'none';
      order.status = value;
      this.saveOrderDetails(order);
    }
  }

  updateOrderCustomStatus(value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    order.status = value;
    this.saveOrderDetails(order);
  }

  async saveOrderDetails(order) {
    // Recalculate totals
    const fin = this.calculateOrderFinancials(order);
    
    if (!this.isDemoMode) {
      // Write to Firestore
      try {
        await this.db.collection('orders').doc(order.id).update(order);
      } catch (err) {
        console.error("Error writing to Firestore:", err);
      }
    } else {
      // Update local storage
      const idx = this.orders.findIndex(o => o.id === order.id);
      if (idx !== -1) {
        this.orders[idx] = order;
        this.saveDemoDataToLocalStorage();
        this.renderOrderDetails(order.id);
      }
    }
  }

  // 8. Printable Bill Slip receipt rendering
  renderBillSlip() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);
    const includeQR = document.getElementById('toggleIncludeQR').checked;

    const upiId = this.settings.upiId || 'photosgiftsbynf@sbi';
    const bizName = this.settings.businessName || 'NF PHOTOS GIFTS';

    // Fill common elements
    const studioNameEl = document.getElementById('bill-studio-name-top');
    if (studioNameEl) studioNameEl.innerText = bizName;

    // Check if combined invoice
    const isCombined = order.id === 'combined_temp';

    // Hide or show appropriate sections based on invoice type
    const billMetaRow = document.getElementById('billMetaRow');
    const billMetaRowCombined = document.getElementById('billMetaRowCombined');
    const billDetailsTitle = document.getElementById('billDetailsTitle');
    const billDetailsTable = document.getElementById('billDetailsTable');
    const billCombinedTableContainer = document.getElementById('billCombinedTableContainer');
    const billDividerAfterDetails = document.getElementById('billDividerAfterDetails');
    const billAlbumsTitle = document.getElementById('billAlbumsTitle');
    const billAlbumsContainer = document.getElementById('billAlbumsContainer');
    const billDividerAfterAlbums = document.getElementById('billDividerAfterAlbums');
    
    // Labels inside the summary card
    const grossLabelEl = document.getElementById('billGrossLabel');
    const paidLabelEl = document.getElementById('billPaidLabel');
    const balanceLabelEl = document.getElementById('billBalanceLabel');
    
    // Set labels using simple words
    if (grossLabelEl) grossLabelEl.innerText = 'Total Bill';
    if (paidLabelEl) paidLabelEl.innerText = 'Total Paid';
    if (balanceLabelEl) balanceLabelEl.innerText = 'Total Balance';

    // Set header subtitle & type badge
    const studioSubEl = document.getElementById('bill-studio-sub-top');
    const typeBadgeEl = document.getElementById('bill-type-badge');
    
    // QR labels
    const qrTitleEl = document.getElementById('billQrTitle');
    const qrAmountRowEl = document.getElementById('billQrAmountRow');
    const qrSubtextEl = document.getElementById('billQrSubtext');
    const footerCombinedInfoEl = document.getElementById('billFooterCombinedInfo');

    if (isCombined) {
      // 1. Combined statement styling
      if (studioSubEl) studioSubEl.innerText = 'Combined Studio Statement';
      if (typeBadgeEl) typeBadgeEl.innerText = 'COMBINED';

      if (billMetaRow) billMetaRow.style.display = 'none';
      if (billMetaRowCombined) {
        billMetaRowCombined.style.display = 'flex';
        
        // Find photographer info
        const photog = this.photographers.find(p => p.id === order.photographerId);
        document.getElementById('bill-combined-studio').innerText = order.photographerName;
        document.getElementById('bill-combined-phone').innerText = photog ? (photog.mobile || '') : '';
        const combD = new Date();
        const combMonth = combD.toLocaleString('en-US', { month: 'short' });
        document.getElementById('bill-combined-date').innerText = `${combD.getDate()}${combMonth}${combD.getFullYear()}`;
        document.getElementById('bill-combined-projects-count').innerText = order.orders ? order.orders.length : 0;
      }

      if (billDetailsTitle) billDetailsTitle.style.display = 'none';
      if (billDetailsTable) billDetailsTable.style.display = 'none';
      
      // Render active projects table
      if (billCombinedTableContainer) {
        billCombinedTableContainer.style.display = 'block';
        
        let tableHtml = `
          <div class="invoice-section-title">ACTIVE CLIENT PROJECTS</div>
          <table class="statement-table">
            <thead>
              <tr>
                <th align="left">Client Name</th>
                <th align="center">Bill No.</th>
                <th align="right">Gross</th>
                <th align="right">Paid</th>
                <th align="right">Balance</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        if (order.orders && order.orders.length > 0) {
          order.orders.forEach(o => {
            // Calculate total sheets breakdown and cover count
            const albums = o.albums || [];
            const totalSheets = albums.reduce((sum, al) => sum + Number(al.pages || 0), 0);
            const sheetsBreakdown = albums.map(al => al.pages).join('+');
            const totalCovers = albums.reduce((sum, al) => sum + (al.coverIncluded ? 1 : 0), 0);
            
            // Format subtext string e.g., "90 Sheets (40+40+10) | 3 Covers"
            let subtext = '';
            if (albums.length > 0) {
              const coverText = albums.length === 1 ? 'Cover' : 'Covers';
              subtext = `${totalSheets} Sheets (${sheetsBreakdown}) | ${coverText}`;
            } else {
              subtext = `0 Sheets | Covers`;
            }

            const subBadgeColor = o.balance <= 0 ? '#2E7D32' : (o.received > 0 ? '#E65100' : '#C62828');
            const subBadgeText = o.balance <= 0 ? 'PAID' : (o.received > 0 ? 'PART-PAID' : 'UNPAID');

            tableHtml += `
              <tr>
                <td class="client-cell">
                  ${o.clientName}
                  <span class="event-subtext">${subtext}</span>
                </td>
                <td align="center">
                  <span class="bill-badge" style="font-weight:700;">${o.invoiceNumber}</span>
                  <div style="font-size:0.58rem; font-weight:700; color:${subBadgeColor}; margin-top:2px; letter-spacing:0.02em;">${subBadgeText}</div>
                </td>
                <td align="right" class="num-cell">Rs ${o.gross.toLocaleString('en-IN')}</td>
                <td align="right" class="paid-cell">Rs ${o.received.toLocaleString('en-IN')}</td>
                <td align="right" class="balance-cell">Rs ${o.balance.toLocaleString('en-IN')}</td>
              </tr>
            `;
          });
        } else {
          tableHtml += `<tr><td colspan="5" align="center">No active projects found</td></tr>`;
        }

        tableHtml += `
            </tbody>
          </table>
        `;
        
        billCombinedTableContainer.innerHTML = tableHtml;
      }

      if (billDividerAfterDetails) billDividerAfterDetails.style.display = 'block';
      if (billAlbumsTitle) billAlbumsTitle.style.display = 'none';
      if (billAlbumsContainer) {
        billAlbumsContainer.style.display = 'none';
        billAlbumsContainer.innerHTML = '';
      }
      if (billDividerAfterAlbums) billDividerAfterAlbums.style.display = 'none';

      // QR section tweaks for combined
      if (qrTitleEl) qrTitleEl.innerText = 'SCAN TO PAY COMPLETE PACKAGE';
      if (qrSubtextEl) qrSubtextEl.style.display = 'block';
      if (footerCombinedInfoEl) {
        footerCombinedInfoEl.style.display = 'block';
        footerCombinedInfoEl.innerText = `This is a combined statement for all active projects under ${order.photographerName}`;
      }

    } else {
      // 2. Single invoice styling
      if (studioSubEl) studioSubEl.innerText = 'Wedding Album Specialists';
      if (typeBadgeEl) typeBadgeEl.innerText = 'INVOICE';

      if (billMetaRow) billMetaRow.style.display = 'flex';
      if (billMetaRowCombined) billMetaRowCombined.style.display = 'none';
      
      document.getElementById('bill-invoice-no').innerText = order.invoiceNumber;
      const sngD = order.orderDate ? new Date(order.orderDate) : new Date();
      const sngMonth = sngD.toLocaleString('en-US', { month: 'short' });
      document.getElementById('bill-invoice-date').innerText = `${sngD.getDate()}${sngMonth}${sngD.getFullYear()}`;

      // Set Order and Payment Status for Single Invoice
      const orderStatusEl = document.getElementById('bill-order-status');
      if (orderStatusEl) {
        orderStatusEl.innerText = order.status || 'Order Received';
        if (order.status === 'Completed' || order.status === 'Google Drive Link Sent' || order.status === 'Approved') {
          orderStatusEl.style.color = '#2E7D32';
        } else if (order.status === 'Changes Requested') {
          orderStatusEl.style.color = '#C62828';
        } else {
          orderStatusEl.style.color = '#EF6C00';
        }
      }

      const payStatusEl = document.getElementById('bill-payment-status');
      if (payStatusEl) {
        if (fin.balance <= 0) {
          payStatusEl.innerText = 'PAID';
          payStatusEl.style.backgroundColor = '#E8F5E9';
          payStatusEl.style.color = '#2E7D32';
          payStatusEl.style.borderColor = '#A5D6A7';
        } else if (fin.received > 0) {
          payStatusEl.innerText = 'PART PAID';
          payStatusEl.style.backgroundColor = '#FFF3E0';
          payStatusEl.style.color = '#E65100';
          payStatusEl.style.borderColor = '#FFCC80';
        } else {
          payStatusEl.innerText = 'UNPAID';
          payStatusEl.style.backgroundColor = '#FFEBEE';
          payStatusEl.style.color = '#C62828';
          payStatusEl.style.borderColor = '#FFCDD2';
        }
      }

      if (billDetailsTitle) billDetailsTitle.style.display = 'block';
      if (billDetailsTable) {
        billDetailsTable.style.display = 'flex';
        document.getElementById('bill-photographer').innerText = order.photographerName;
        document.getElementById('bill-client').innerText = order.clientName;
        document.getElementById('bill-event').innerText = order.eventType;
      }

      if (billCombinedTableContainer) {
        billCombinedTableContainer.style.display = 'none';
        billCombinedTableContainer.innerHTML = '';
      }

      if (billDividerAfterDetails) billDividerAfterDetails.style.display = 'block';
      if (billAlbumsTitle) billAlbumsTitle.style.display = 'block';
      
      // Render compact table for album details
      if (billAlbumsContainer) {
        billAlbumsContainer.style.display = 'block';
        if (order.albums && order.albums.length > 0) {
          let tableHtml = `
            <table class="statement-table" style="margin-top: 4px; width: 100%;">
              <thead>
                <tr>
                  <th align="left">Album Details</th>
                  <th align="center">Pages</th>
                  <th align="right">Rate</th>
                  <th align="right">Total</th>
                </tr>
              </thead>
              <tbody>
          `;
          
          order.albums.forEach(album => {
            const grossVal = album.pages * album.rate;
            const subtext = album.coverIncluded ? `Cover design included (Rs ${album.coverCharge})` : 'No cover design charge';
            const totalRow = grossVal + (album.coverIncluded ? album.coverCharge : 0);
            
            tableHtml += `
              <tr>
                <td class="client-cell" align="left">
                  ${album.type} <span style="font-size:0.65rem; color:#7A6F65; font-weight:normal;">(${album.size || 'N/A'})</span>
                  <div style="font-size:0.62rem; color:#7A6F65; font-weight:normal; margin-top:2px;">${subtext}</div>
                </td>
                <td align="center" class="num-cell">${album.pages}</td>
                <td align="right" class="num-cell">Rs ${album.rate}</td>
                <td align="right" class="num-cell" style="font-weight:700;">Rs ${totalRow.toLocaleString('en-IN')}</td>
              </tr>
            `;
          });
          
          tableHtml += `
              </tbody>
            </table>
          `;
          billAlbumsContainer.innerHTML = tableHtml;
        } else {
          billAlbumsContainer.innerHTML = '<p style="font-size:0.75rem; text-align:center; padding:10px;">No albums added yet.</p>';
        }
      }
      if (billDividerAfterAlbums) billDividerAfterAlbums.style.display = 'block';

      // QR section tweaks for single
      if (qrTitleEl) qrTitleEl.innerText = 'SCAN TO PAY VIA PHONEPE / GPAY / PAYTM';
      if (qrSubtextEl) qrSubtextEl.style.display = 'none';
      if (footerCombinedInfoEl) footerCombinedInfoEl.style.display = 'none';
    }

    // Gross & Received & Outstanding & Balance (Use Rs instead of symbol)
    const currencyStr = 'Rs ';
    document.getElementById('bill-gross-total').innerText = currencyStr + fin.gross.toLocaleString('en-IN');
    document.getElementById('bill-received').innerText = currencyStr + fin.received.toLocaleString('en-IN');
    document.getElementById('bill-balance-total').innerText = currencyStr + fin.balance.toLocaleString('en-IN');

    // QR generation block
    const qrSection = document.getElementById('billQrCodeSection');
    if (qrSection) {
      if (includeQR && order.requestAmount > 0) {
        qrSection.style.display = 'flex';
        
        const reqAmount = order.requestAmount;
        const upiLink = this.getUpiLink(order, reqAmount);
        
        const qrAmountTextEl = document.getElementById('billQrAmountText');
        if (qrAmountTextEl) {
          qrAmountTextEl.innerText = currencyStr + Number(reqAmount).toLocaleString('en-IN');
        }

        if (qrAmountRowEl) {
          if (isCombined) {
            qrAmountRowEl.innerHTML = `Total: <span id="billQrAmountText" style="font-weight:700;">${currencyStr}${Number(reqAmount).toLocaleString('en-IN')}</span>`;
          } else {
            qrAmountRowEl.innerHTML = `Amount: <span id="billQrAmountText" style="font-weight:700;">${currencyStr}${Number(reqAmount).toLocaleString('en-IN')}</span>`;
          }
        }

        const footerUpiEl = document.getElementById('footer-upi-id');
        if (footerUpiEl) footerUpiEl.innerText = upiId;

        const qrMerchantEl = document.getElementById('billQrMerchantId');
        if (qrMerchantEl) qrMerchantEl.innerText = upiId;

        // Generate canvas QR code
        const canvasEl = document.getElementById('upiQrCanvas');
        if (canvasEl) {
          new QRious({
            element: canvasEl,
            value: upiLink,
            size: 140,
            level: 'H'
          });
        }
      } else {
        qrSection.style.display = 'none';
      }
    }
  }

  updateRequestAmount(value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    order.requestAmount = Number(value) || 0;
    
    // Set custom flag
    document.getElementById('billRequestAmount').dataset.edited = "true";

    this.renderBillSlip();
  }

  // 9. Payment recording modal
  openQuickPayModal(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);

    document.getElementById('payment-order-id').value = order.id;
    document.getElementById('payment-invoice-number').value = order.invoiceNumber;
    document.getElementById('payment-client-name').value = order.clientName;
    document.getElementById('payment-balance-label').innerText = `Outstanding Balance: ₹${fin.balance.toLocaleString('en-IN')}`;
    
    document.getElementById('payment-amount').value = fin.balance;
    document.getElementById('payment-date').value = new Date().toISOString().substring(0, 10);
    document.getElementById('payment-notes').value = 'GPay / UPI Online';
    document.getElementById('payment-type').value = 'Partial';

    document.getElementById('recordPaymentModal').classList.add('active');
  }

  openRecordPaymentModal() {
    this.openQuickPayModal(this.activeOrderId);
  }

  closeRecordPaymentModal() {
    document.getElementById('recordPaymentModal').classList.remove('active');
  }

  async savePayment() {
    const orderId = document.getElementById('payment-order-id').value;
    const amount = Number(document.getElementById('payment-amount').value);
    const type = document.getElementById('payment-type').value;
    const date = document.getElementById('payment-date').value;
    const notes = document.getElementById('payment-notes').value.trim();

    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const newPayment = {
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      clientName: order.clientName,
      photographerId: order.photographerId,
      amount,
      date,
      type,
      notes,
      createdAt: new Date().toISOString()
    };

    if (!this.isDemoMode) {
      // Save to Firestore
      try {
        await this.db.collection('payments').add(newPayment);
        
        // Check if fully paid now and update order status or request amount
        const fin = this.calculateOrderFinancials(order);
        const updatedBal = fin.balance - amount;
        
        await this.db.collection('orders').doc(order.id).update({
          requestAmount: updatedBal > 0 ? updatedBal : 0
        });

        alert("Payment recorded successfully!");
        this.closeRecordPaymentModal();

        // Auto-trigger WhatsApp Drive Share if payment is finalized and Final Link exists
        if (updatedBal <= 0 && order.googleDriveLink) {
          setTimeout(() => {
            if (confirm("Payment fully settled! Would you like to share the Final Album Drive Link via WhatsApp now?")) {
              this.sendWhatsAppDriveLink();
            }
          }, 500);
        }
      } catch (err) {
        console.error("Error writing payment:", err);
      }
    } else {
      // Save to local storage
      newPayment.id = 'pay_' + Date.now();
      this.payments.push(newPayment);
      
      // Update order requestAmount
      const fin = this.calculateOrderFinancials(order);
      const updatedBal = fin.balance - amount;
      order.requestAmount = updatedBal > 0 ? updatedBal : 0;
      
      const idx = this.orders.findIndex(o => o.id === order.id);
      if (idx !== -1) {
        this.orders[idx] = order;
      }

      this.saveDemoDataToLocalStorage();
      alert("Payment recorded successfully!");
      this.closeRecordPaymentModal();
      this.renderAll();
      if (this.activeOrderId) {
        this.renderOrderDetails(this.activeOrderId);
      }

      // Auto-trigger WhatsApp Drive Share if payment is finalized and Final Link exists
      if (updatedBal <= 0 && order.googleDriveLink) {
        setTimeout(() => {
          if (confirm("Payment fully settled! Would you like to share the Final Album Drive Link via WhatsApp now?")) {
            this.sendWhatsAppDriveLink();
          }
        }, 500);
      }
    }
  }

  // 10. Photographer CRUD & aggregate list
  renderPhotographers() {
    this.selectedOrderIdsForSettlement = this.selectedOrderIdsForSettlement || new Set();
    const tbody = document.getElementById('photographersTableBody');
    tbody.innerHTML = '';

    if (this.photographers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 40px;">No photographers added yet.</td></tr>`;
      return;
    }

    this.photographers.forEach(p => {
      // Calculate photographer dashboard aggregate statistics
      const pOrders = this.orders.filter(o => o.photographerId === p.id && o.id !== 'combined_temp');
      const totalOrders = pOrders.length;
      
      let earnings = 0;
      let received = 0;
      let pending = 0;

      pOrders.forEach(order => {
        const fin = this.calculateOrderFinancials(order);
        earnings += fin.gross;
        received += fin.received;
        pending += fin.balance;
      });

      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.className = 'photographer-row';
      tr.onclick = () => {
        const subrow = document.getElementById(`subrow-${p.id}`);
        if (subrow) {
          subrow.style.display = subrow.style.display === 'none' ? 'table-row' : 'none';
        }
      };

      tr.innerHTML = `
        <td>
          <strong>${p.name}</strong> 
          <span style="font-size:0.75rem; color:var(--accent-gold-dark); display:block; margin-top:2px;">(Click to view client list)</span>
        </td>
        <td>
          <div style="font-size: 0.85rem;">Ph: ${p.mobile || 'N/A'}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${p.notes || ''}</div>
        </td>
        <td class="num">${totalOrders}</td>
        <td class="num">₹${earnings.toLocaleString('en-IN')}</td>
        <td class="num" style="color: var(--success-color);">₹${received.toLocaleString('en-IN')}</td>
        <td class="num" style="color: var(--pending-color); font-weight:600;">₹${pending.toLocaleString('en-IN')}</td>
        <td style="text-align: center;" onclick="event.stopPropagation();">
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button class="btn btn-secondary btn-icon" style="width: 32px; height: 32px; padding:0;" onclick="app.openEditPhotographerModal('${p.id}')" title="Edit">
              <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn btn-danger btn-icon" style="width: 32px; height: 32px; padding:0;" onclick="app.deletePhotographer('${p.id}')" title="Delete">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);

      // Collapsible row with list of projects
      const subrow = document.createElement('tr');
      subrow.id = `subrow-${p.id}`;
      subrow.style.display = 'none';
      subrow.style.backgroundColor = 'var(--bg-color)';
      
      let projectsHtml = '';
      if (pOrders.length === 0) {
        projectsHtml = `<div style="padding: 16px; color: var(--text-secondary); font-size: 0.85rem; text-align:center;">No client projects recorded.</div>`;
      } else {
        projectsHtml = `
          <div style="padding: 12px 16px;">
            <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary);">Select projects for Combined Settlement Invoice:</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${pOrders.map(o => {
                const fin = this.calculateOrderFinancials(o);
                const isChecked = this.selectedOrderIdsForSettlement.has(o.id) ? 'checked' : '';
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; background: var(--card-bg); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--card-border);">
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 0; cursor: pointer; text-transform: none; font-weight: normal; font-size: 0.9rem; color: var(--text-primary);">
                      <input type="checkbox" ${isChecked} onchange="app.toggleOrderSelection('${o.id}')" style="width: 16px; height: 16px; accent-color: var(--accent-gold);">
                      <span><strong>${o.invoiceNumber}</strong> - ${o.clientName} (${o.eventType})</span>
                    </label>
                    <div style="font-size: 0.85rem;">
                      <span>Total: ₹${fin.gross}</span> | 
                      <span style="color: var(--pending-color); font-weight: 500;">Due: ₹${fin.balance}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      subrow.innerHTML = `
        <td colspan="7" onclick="event.stopPropagation();">
          ${projectsHtml}
        </td>
      `;
      tbody.appendChild(subrow);
    });

    lucide.createIcons();
  }

  toggleOrderSelection(orderId) {
    this.selectedOrderIdsForSettlement = this.selectedOrderIdsForSettlement || new Set();
    if (this.selectedOrderIdsForSettlement.has(orderId)) {
      this.selectedOrderIdsForSettlement.delete(orderId);
    } else {
      this.selectedOrderIdsForSettlement.add(orderId);
    }
    this.updateCombinedSettlementBar();
  }

  updateCombinedSettlementBar() {
    const bar = document.getElementById('combinedSettlementBar');
    const countSpan = document.getElementById('selectedOrdersCount');
    const count = this.selectedOrderIdsForSettlement.size;
    if (count > 0) {
      bar.style.display = 'flex';
      countSpan.innerText = count;
    } else {
      bar.style.display = 'none';
    }
  }

  generateCombinedInvoice() {
    this.selectedOrderIdsForSettlement = this.selectedOrderIdsForSettlement || new Set();
    const selectedOrders = this.orders.filter(o => this.selectedOrderIdsForSettlement.has(o.id));
    if (selectedOrders.length === 0) return;

    const firstOrder = selectedOrders[0];
    const photographerId = firstOrder.photographerId;
    const photographerName = firstOrder.photographerName;

    // Combine all albums
    const combinedAlbums = [];
    selectedOrders.forEach(order => {
      if (order.albums) {
        order.albums.forEach(album => {
          combinedAlbums.push({
            ...album,
            type: `${order.clientName} - ${album.type}`
          });
        });
      }
    });

    // Create the temporary combined order
    const combinedOrder = {
      id: 'combined_temp',
      invoiceNumber: 'NF-COMBINED',
      invoiceSeq: 9999,
      photographerId,
      photographerName,
      clientName: `Settlement for ${photographerName}`,
      clientMobile: firstOrder.clientMobile || '',
      directContact: false,
      eventType: 'Settlement',
      orderDate: new Date().toISOString().substring(0, 10),
      deliveryDate: '',
      notes: `Combined settlement invoice containing orders: ${selectedOrders.map(o => o.invoiceNumber).join(', ')}`,
      status: 'Approved',
      googleDriveLink: '',
      albums: combinedAlbums,
      requestAmount: 0,
      createdAt: new Date().toISOString(),
      // Store individual orders details for combined statement table rendering
      orders: selectedOrders.map(o => {
        const oFin = this.calculateOrderFinancials(o);
        return {
          id: o.id,
          invoiceNumber: o.invoiceNumber,
          clientName: o.clientName,
          eventType: o.eventType,
          gross: oFin.gross,
          received: oFin.received,
          balance: oFin.balance,
          albums: o.albums || [], // Store albums to calculate sheets & covers counts
          status: o.status || 'Order Received'
        };
      })
    };

    // Recalculate totals
    const fin = this.calculateOrderFinancials(combinedOrder);
    combinedOrder.requestAmount = fin.balance;

    // Add or overwrite in local state
    const idx = this.orders.findIndex(o => o.id === 'combined_temp');
    if (idx !== -1) {
      this.orders[idx] = combinedOrder;
    } else {
      this.orders.push(combinedOrder);
    }

    // Clear selection
    this.selectedOrderIdsForSettlement.clear();
    this.updateCombinedSettlementBar();

    // Switch view and open details
    this.openOrderDetails('combined_temp');
  }

  openAddPhotographerModal() {
    document.getElementById('edit-photographer-id').value = '';
    document.getElementById('photographer-name').value = '';
    document.getElementById('photographer-mobile').value = '';
    document.getElementById('photographer-notes').value = '';
    document.getElementById('photographerModalTitle').innerText = 'Add New Photographer';
    document.getElementById('photographerModal').classList.add('active');
  }

  openEditPhotographerModal(id) {
    const p = this.photographers.find(photog => photog.id === id);
    if (!p) return;

    document.getElementById('edit-photographer-id').value = p.id;
    document.getElementById('photographer-name').value = p.name;
    document.getElementById('photographer-mobile').value = p.mobile || '';
    document.getElementById('photographer-notes').value = p.notes || '';
    document.getElementById('photographerModalTitle').innerText = 'Edit Photographer';
    document.getElementById('photographerModal').classList.add('active');
  }

  closePhotographerModal() {
    document.getElementById('photographerModal').classList.remove('active');
  }

  async savePhotographer() {
    const id = document.getElementById('edit-photographer-id').value;
    const name = document.getElementById('photographer-name').value.trim();
    const mobile = document.getElementById('photographer-mobile').value.trim();
    const notes = document.getElementById('photographer-notes').value.trim();

    if (!name) {
      alert("Photographer Name is required.");
      return;
    }
    if (!mobile) {
      alert("Photographer WhatsApp/Contact Number is required.");
      return;
    }

    const pData = {
      name,
      mobile,
      notes,
      createdAt: new Date().toISOString()
    };

    if (!this.isDemoMode) {
      // Save to Firebase
      try {
        if (id) {
          await this.db.collection('photographers').doc(id).update(pData);
        } else {
          await this.db.collection('photographers').add(pData);
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.

        }
        this.closePhotographerModal();
      } catch (err) {

        console.error("Error saving photographer:", err);
      }
    } else {
      // Local storage
      if (id) {
        const idx = this.photographers.findIndex(p => p.id === id);
        if (idx !== -1) {
          this.photographers[idx] = { id, ...pData };
        }
      } else {
        pData.id = 'p_' + Date.now();
        this.photographers.push(pData);
      }
      this.saveDemoDataToLocalStorage();
      this.closePhotographerModal();
      this.renderAll();
    }
  }

  async deletePhotographer(id) {
    const p = this.photographers.find(photog => photog.id === id);
    if (!p) return;

    if (confirm(`Are you sure you want to permanently delete photographer "${p.name}"? This photographer will be removed but their client project logs will remain.`)) {
      if (!this.isDemoMode) {
        try {
          await this.db.collection('photographers').doc(id).delete();
        } catch (err) {
          console.error("Firestore delete error:", err);
        }
      } else {
        this.photographers = this.photographers.filter(photog => photog.id !== id);
        this.saveDemoDataToLocalStorage();
        this.renderAll();
      }
    }
  }

  populatePhotographerDropdowns() {
    const createSelect = document.getElementById('order-photographer-select');
    if (!createSelect) return;
    
    createSelect.innerHTML = '<option value="">-- Choose Photographer --</option>';

    this.photographers.forEach(p => {
      const opt = `<option value="${p.id}">${p.name}</option>`;
      createSelect.innerHTML += opt;
    });
  }

  // 11. Creating new client project
  openAddOrderModal() {
    this.populatePhotographerDropdowns();
    document.getElementById('order-client-name').value = '';
    document.getElementById('order-client-mobile').value = '';
    document.getElementById('order-notes').value = '';
    document.getElementById('order-direct-contact').value = 'no';
    document.getElementById('order-date').value = new Date().toISOString().substring(0, 10);
    document.getElementById('order-delivery-date').value = '';
    document.getElementById('order-event-type').value = 'Wedding';
    document.getElementById('order-custom-event-type').style.display = 'none';
    document.getElementById('addOrderModal').classList.add('active');
  }

  closeAddOrderModal() {
    document.getElementById('addOrderModal').classList.remove('active');
  }

  checkCustomEvent(val) {
    const customInput = document.getElementById('order-custom-event-type');
    if (val === 'Other') {
      customInput.style.display = 'block';
    } else {
      customInput.style.display = 'none';
    }
  }

  async createOrder() {
    const photogId = document.getElementById('order-photographer-select').value;
    const clientName = document.getElementById('order-client-name').value.trim();
    const clientMobile = document.getElementById('order-client-mobile').value.trim();
    let eventType = document.getElementById('order-event-type').value;
    const directContact = document.getElementById('order-direct-contact').value === 'yes';
    const orderDate = document.getElementById('order-date').value;
    const deliveryDate = document.getElementById('order-delivery-date').value;
    const notes = document.getElementById('order-notes').value.trim();

    if (eventType === 'Other') {
      eventType = document.getElementById('order-custom-event-type').value.trim() || 'Custom';
    }

    if (!photogId || !clientName) {
      alert("Photographer and Client Name are required.");
      return;
    }

    const photog = this.photographers.find(p => p.id === photogId);
    const photographerName = photog ? photog.name : 'Unknown';

    // Auto-create initial single album
    const defaultAlbums = [
      {
        type: 'Bride Album',
        size: '12×36 Inch',
        pages: 40,
        rate: 35,
        coverIncluded: true,
        coverCharge: 35,
        received: 0,
        total: 1435
      }
    ];

    if (!this.isDemoMode) {
      // 1. Transactional Photographer-specific Invoice number counter in Firestore
      try {
        const orderRef = this.db.collection('orders').doc();
        const photographerRef = this.db.collection('photographers').doc(photogId);
        
        let invoiceNumber = '';
        let newInvoiceSeq = 1;

        await this.db.runTransaction(async (transaction) => {
          const photographerDoc = await transaction.get(photographerRef);
          if (!photographerDoc.exists) {
            throw new Error("Photographer does not exist!");
          }
          
          let lastSeq = photographerDoc.data().lastInvoiceSeq || 0;
          newInvoiceSeq = lastSeq + 1;
          invoiceNumber = `NF-${String(newInvoiceSeq).padStart(3, '0')}`;
          
          const orderPayload = {
            invoiceNumber,
            invoiceSeq: newInvoiceSeq,
            photographerId: photogId,
            photographerName,
            clientName,
            clientMobile,
            directContact,
            eventType,
            orderDate,
            deliveryDate,
            notes,
            status: 'Order Received',
            googleDriveLink: '',
            rawPhotosLink: '',
            albums: defaultAlbums,
            requestAmount: 1440,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          transaction.set(orderRef, orderPayload);
          transaction.update(photographerRef, { lastInvoiceSeq: newInvoiceSeq });
        });

        const viewDetails = confirm("Project Created successfully!\n\nClick OK to open Project Details and add albums.\nClick Cancel to return to Dashboard.");
        this.closeAddOrderModal();
        if (viewDetails) {
          this.openOrderDetails(orderRef.id);
        } else {
          this.switchView('dashboard');
        }
      } catch (err) {
        console.error("Error creating Firestore order transaction:", err);
      }
    } else {
      // 2. Demo Local Storage - Photographer-specific Invoice number
      const photogIdx = this.photographers.findIndex(p => p.id === photogId);
      let newSeq = 1;
      if (photogIdx !== -1) {
        const lastSeq = this.photographers[photogIdx].lastInvoiceSeq || 0;
        newSeq = lastSeq + 1;
        this.photographers[photogIdx].lastInvoiceSeq = newSeq;
        this.saveDemoDataToLocalStorage();
      } else {
        // Fallback to max sequence if photographer is somehow not found in state
        const maxSeq = this.orders.reduce((max, o) => Math.max(max, o.invoiceSeq || 0), 0);
        newSeq = maxSeq + 1;
      }
      const invoiceNumber = `NF-${String(newSeq).padStart(3, '0')}`;

      const newOrder = {
        id: 'ord_' + Date.now(),
        invoiceNumber,
        invoiceSeq: newSeq,
        photographerId: photogId,
        photographerName,
        clientName,
        clientMobile,
        directContact,
        eventType,
        orderDate,
        deliveryDate,
        notes,
        status: 'Order Received',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: defaultAlbums,
        requestAmount: 1440,
        createdAt: new Date().toISOString()
      };

      this.orders.push(newOrder);
      this.saveDemoDataToLocalStorage();
      
      const viewDetails = confirm("Project Created successfully!\n\nClick OK to open Project Details and add albums.\nClick Cancel to return to Dashboard.");
      this.closeAddOrderModal();
      this.renderAll();
      if (viewDetails) {
        this.openOrderDetails(newOrder.id);
      } else {
        this.switchView('dashboard');
      }
    }
  }

  async deleteCurrentOrder() {
    if (!this.activeOrderId) return;
    
    if (confirm("Are you sure you want to permanently delete this project record? This action cannot be undone.")) {
      if (!this.isDemoMode) {
        try {
          await this.db.collection('orders').doc(this.activeOrderId).delete();
          // Delete related payments
          const relatedPayments = this.payments.filter(p => p.orderId === this.activeOrderId);
          const batch = this.db.batch();
          const snapshot = await this.db.collection('payments').where('orderId', '==', this.activeOrderId).get();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          alert("Project deleted.");
          this.switchView('dashboard');
        } catch (err) {
          console.error("Firestore delete order error:", err);
        }
      } else {
        this.orders = this.orders.filter(o => o.id !== this.activeOrderId);
        this.payments = this.payments.filter(p => p.orderId !== this.activeOrderId);
        this.saveDemoDataToLocalStorage();
        alert("Project deleted.");
        this.switchView('dashboard');
      }
    }
  }

  // 12. Google Drive Link Helpers (Raw & Final Album Links)
  updateRawPhotosLink(value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    order.rawPhotosLink = value.trim();
    this.saveOrderDetailsSilent(order);

    // Show visual feedback
    const feedback = document.getElementById('rawPhotosFeedback');
    if (feedback) {
      feedback.style.display = 'inline';
      clearTimeout(this.rawPhotosFeedbackTimeout);
      this.rawPhotosFeedbackTimeout = setTimeout(() => {
        feedback.style.display = 'none';
      }, 1500);
    }
  }

  openRawPhotosLink() {
    const url = document.getElementById('detail-raw-link').value.trim();
    if (url) {
      window.open(url, '_blank');
    } else {
      alert("Please enter a Raw Photos Google Drive link first.");
    }
  }

  updateFinalDesignLink(value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    order.googleDriveLink = value.trim();
    this.saveOrderDetailsSilent(order);

    // Show visual feedback
    const feedback = document.getElementById('finalDesignFeedback');
    if (feedback) {
      feedback.style.display = 'inline';
      clearTimeout(this.finalDesignFeedbackTimeout);
      this.finalDesignFeedbackTimeout = setTimeout(() => {
        feedback.style.display = 'none';
      }, 1500);
    }
  }

  openFinalDesignLink() {
    const url = document.getElementById('detail-final-link').value.trim();
    if (url) {
      window.open(url, '_blank');
    } else {
      alert("Please enter a Final Design Google Drive link first.");
    }
  }

  // 13. Reports Page logic
  renderReports() {
    const reportYear = document.getElementById('reportYear').value;
    const reportMonth = document.getElementById('reportMonth').value;

    let filteredOrders = this.orders;
    let filteredPayments = this.payments;

    // Filter by date
    if (reportMonth !== 'all') {
      const targetMonthIndex = Number(reportMonth) - 1; // 0-11
      filteredOrders = this.orders.filter(o => {
        if (!o.orderDate) return false;
        const d = new Date(o.orderDate);
        return d.getFullYear().toString() === reportYear && d.getMonth() === targetMonthIndex;
      });
      filteredPayments = this.payments.filter(p => {
        if (!p.date) return false;
        const d = new Date(p.date);
        return d.getFullYear().toString() === reportYear && d.getMonth() === targetMonthIndex;
      });
    } else {
      filteredOrders = this.orders.filter(o => {
        if (!o.orderDate) return false;
        return new Date(o.orderDate).getFullYear().toString() === reportYear;
      });
      filteredPayments = this.payments.filter(p => {
        if (!p.date) return false;
        return new Date(p.date).getFullYear().toString() === reportYear;
      });
    }

    // Calculations
    let bookingsCount = filteredOrders.length;
    let billingTotal = 0;
    let paymentsTotal = 0;
    
    filteredOrders.forEach(o => {
      const fin = this.calculateOrderFinancials(o);
      billingTotal += fin.gross;
    });

    filteredPayments.forEach(p => {
      paymentsTotal += Number(p.amount);
    });

    const outstandingTotal = billingTotal - paymentsTotal;

    // Update Year Summary
    document.getElementById('report-yearly-bookings').innerText = bookingsCount;
    document.getElementById('report-yearly-billing').innerText = '₹' + billingTotal.toLocaleString('en-IN');
    document.getElementById('report-yearly-payments').innerText = '₹' + paymentsTotal.toLocaleString('en-IN');
    document.getElementById('report-yearly-outstanding').innerText = '₹' + (outstandingTotal > 0 ? outstandingTotal : 0).toLocaleString('en-IN');

    // Populate Monthly breakdown list
    const monthlyList = document.getElementById('reportMonthlyList');
    monthlyList.innerHTML = '';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach((m, idx) => {
      const monthOrders = this.orders.filter(o => {
        if (!o.orderDate) return false;
        const d = new Date(o.orderDate);
        return d.getFullYear().toString() === reportYear && d.getMonth() === idx;
      });

      if (monthOrders.length > 0) {
        let mGross = 0;
        let mReceived = 0;
        monthOrders.forEach(o => {
          const fin = this.calculateOrderFinancials(o);
          mGross += fin.gross;
          mReceived += fin.received;
        });

        const item = document.createElement('div');
        item.className = 'report-list-item';
        item.innerHTML = `
          <strong>${m} ${reportYear}</strong>
          <span style="color: var(--text-secondary);">${monthOrders.length} orders</span>
          <span>Earn: <strong>₹${mGross.toLocaleString('en-IN')}</strong></span>
          <span style="color: var(--pending-color);">Due: <strong>₹${(mGross - mReceived).toLocaleString('en-IN')}</strong></span>
        `;
        monthlyList.appendChild(item);
      }
    });

    if (monthlyList.innerHTML === '') {
      monthlyList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 12px;">No activity recorded for this period.</div>';
    }

    // Populate Weekly Payments list
    const weeklyList = document.getElementById('reportWeeklyList');
    weeklyList.innerHTML = '';

    // Group payments by week
    const weeklyPayments = {};
    filteredPayments.forEach(p => {
      if (!p.date) return;
      const date = new Date(p.date);
      // Get week number
      const oneJan = new Date(date.getFullYear(),0,1);
      const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
      const week = Math.ceil(( date.getDay() + 1 + numberOfDays) / 7);
      
      if (!weeklyPayments[week]) weeklyPayments[week] = { amount: 0, count: 0 };
      weeklyPayments[week].amount += Number(p.amount);
      weeklyPayments[week].count += 1;
    });

    Object.keys(weeklyPayments).forEach(w => {
      const item = document.createElement('div');
      item.className = 'report-list-item';
      item.innerHTML = `
        <strong>Week #${w}</strong>
        <span style="color: var(--text-secondary);">${weeklyPayments[w].count} deposits</span>
        <span style="color: var(--success-color); font-weight:600;">₹${weeklyPayments[w].amount.toLocaleString('en-IN')}</span>
      `;
      weeklyList.appendChild(item);
    });

    if (weeklyList.innerHTML === '') {
      weeklyList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 12px;">No collections recorded.</div>';
    }
  }

  exportReport(format) {
    if (format === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Invoice Number,Client Name,Photographer Name,Event Type,Booking Date,Status,Gross Total,Amount Paid,Amount Due\n";

      this.orders.forEach(o => {
        const fin = this.calculateOrderFinancials(o);
        const row = [
          o.invoiceNumber,
          o.clientName.replace(/,/g, ' '),
          o.photographerName.replace(/,/g, ' '),
          o.eventType,
          o.orderDate || '',
          o.status,
          fin.gross,
          fin.received,
          fin.balance
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `NF_PHOTOS_GIFTS_OMS_Report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // 14. WhatsApp Messaging Integration
  generateWhatsAppURL(mobile, message) {
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const prefix = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    return `https://wa.me/${prefix}?text=${encodeURIComponent(message)}`;
  }

  copyToClipboardAndOpenWhatsApp(canvas, mobile, message) {
    canvas.toBlob(blob => {
      try {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(() => {
          console.log("Invoice PNG copied to clipboard!");
        });
      } catch (err) {
        console.log("Clipboard write fallback:", err);
      }
    }, 'image/png');

    window.open(this.generateWhatsAppURL(mobile, message), '_blank');
  }

  sendWhatsAppInvoice() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    // Determine target mobile number: photographer (if not direct) or client
    const photog = this.photographers.find(p => p.id === order.photographerId);
    const mobile = (order.directContact || !photog) ? order.clientMobile : (photog.mobile || order.clientMobile);
    
    if (!mobile) {
      alert("Please configure a mobile number for this photographer or client first.");
      return;
    }

    const bizName = this.settings.businessName || 'NF PHOTOS GIFTS';
    const fin = this.calculateOrderFinancials(order);
    
    // 1. Temporarily show a loading banner or status in the button
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" style="animation: spin 1s linear infinite; width: 16px; height: 16px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Generating Image...`;
    lucide.createIcons();

    // Ensure the QR code and bill slip are fully rendered
    this.renderBillSlip();

    // 2. Render HTML to canvas
    const slipElement = document.getElementById('printableBillSlip');
    
    html2canvas(slipElement, {
      scale: 2, // Double quality
      useCORS: true,
      backgroundColor: '#FFFFFF'
    }).then(canvas => {
      // 3. Trigger image download
      const link = document.createElement('a');
      link.download = `Invoice_${order.invoiceNumber}_${order.clientName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const upiLink = this.getUpiLink(order, fin.balance);
      const message = fin.balance > 0 
        ? `👉 *Pay via UPI:* ${upiLink}`
        : `*Invoice No:* ${order.invoiceNumber} (Paid)`;

      // 4. Try Web Share API (native share with file support, perfect for mobile/tablets)
      canvas.toBlob(blob => {
        try {
          const file = new File([blob], `Invoice_${order.invoiceNumber}.png`, { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            btn.innerHTML = originalText;
            lucide.createIcons();
            
            navigator.share({
              files: [file],
              title: `Invoice ${order.invoiceNumber}`,
              text: message
            }).catch(err => {
              console.log("Native share cancelled or failed, falling back to window.open", err);
              this.copyToClipboardAndOpenWhatsApp(canvas, mobile, message);
            });
          } else {
            // Standard Fallback: Copy to clipboard and open whatsapp link (for PC/Laptop)
            btn.innerHTML = originalText;
            lucide.createIcons();
            this.copyToClipboardAndOpenWhatsApp(canvas, mobile, message);
          }
        } catch (shareErr) {
          console.log("Share API error, falling back:", shareErr);
          btn.innerHTML = originalText;
          lucide.createIcons();
          this.copyToClipboardAndOpenWhatsApp(canvas, mobile, message);
        }
      }, 'image/png');
      
    }).catch(err => {
      console.error("html2canvas error:", err);
      btn.innerHTML = originalText;
      lucide.createIcons();
      alert("Error generating invoice image. Opening WhatsApp chat with payment link...");
      
      const upiLink = this.getUpiLink(order, fin.balance);
      const message = fin.balance > 0 
        ? `👉 *Pay via UPI:* ${upiLink}`
        : `*Invoice No:* ${order.invoiceNumber} (Paid)`;
      window.open(this.generateWhatsAppURL(mobile, message), '_blank');
    });
  }

  sendWhatsAppReminder() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);
    const photog = this.photographers.find(p => p.id === order.photographerId);
    const mobile = (order.directContact || !photog) ? order.clientMobile : (photog.mobile || order.clientMobile);
    
    if (!mobile) {
      alert("Please configure a mobile number for this photographer or client first.");
      return;
    }

    if (fin.balance <= 0) {
      alert("Outstanding balance is ₹0. No reminder needed!");
      return;
    }

    const upiId = this.settings.upiId || 'photosgiftsbynf@sbi';
    const bizName = this.settings.businessName || 'NF PHOTOS GIFTS';
    const upiLink = this.getUpiLink(order, fin.balance);

    const message = `*Payment Reminder - ${bizName}*\n` +
      `-----------------------------\n` +
      `Dear *${order.clientName}*,\n` +
      `This is a friendly reminder that an outstanding balance of *₹${fin.balance}* is pending on your album order *${order.invoiceNumber}* (${order.eventType}).\n\n` +
      `Please pay using the UPI checkout link below:\n` +
      `👉 ${upiLink}\n\n` +
      `Thank you for your cooperation!`;

    window.open(this.generateWhatsAppURL(mobile, message), '_blank');
  }

  sendWhatsAppDriveLink() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);
    const driveLink = order.googleDriveLink;

    if (!driveLink) {
      alert("Please save a Google Drive link first.");
      return;
    }

    const photog = this.photographers.find(p => p.id === order.photographerId);
    const mobile = (order.directContact || !photog) ? order.clientMobile : (photog.mobile || order.clientMobile);

    if (!mobile) {
      alert("Please configure a mobile number for this photographer or client first.");
      return;
    }

    const isDirect = order.directContact || !photog;
    const recipientName = isDirect ? order.clientName : (photog.name || order.photographerName);
    const clientAlbumText = isDirect 
      ? `your album designs are ready for review/download!`
      : `the album designs for client *${order.clientName}* are ready for review/download!`;

    const message = `*Wedding Album Files Ready - NF PHOTOS GIFTS*\n` +
      `-----------------------------\n` +
      `Dear *${recipientName}*,\n` +
      `We are pleased to inform you that ${clientAlbumText}\n\n` +
      `📂 *Google Drive Delivery Link*:\n` +
      `${driveLink}\n\n` +
      `*Outstanding Balance:* ₹${fin.balance}\n\n` +
      `Kindly check the designs and let us know if any changes are requested. Thank you!`;

    window.open(this.generateWhatsAppURL(mobile, message), '_blank');
  }

  // 15. PDF Download trigger using native browser printing wrapper
  downloadInvoicePDF() {
    window.print(); // Native PDF print wrapper is fully responsive and layout-preserved
  }

  // 16. Studio settings modal
  openSettingsModal() {
    document.getElementById('settings-business-name').value = this.settings.businessName || 'NF PHOTOS GIFTS';
    document.getElementById('settings-upi-id').value = this.settings.upiId || 'photosgiftsbynf@sbi';
    document.getElementById('settings-cover-charge').value = this.settings.coverDesignCharge || 40;
    document.getElementById('settings-gemini-key').value = this.settings.geminiApiKey || '';
    document.getElementById('settingsModal').classList.add('active');
  }

  closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
  }

  async saveSettings() {
    const biz = document.getElementById('settings-business-name').value.trim();
    const upi = document.getElementById('settings-upi-id').value.trim();
    const cover = Number(document.getElementById('settings-cover-charge').value);
    const gemini = document.getElementById('settings-gemini-key').value.trim();

    this.settings = {
      businessName: biz || 'NF PHOTOS GIFTS',
      upiId: upi || 'photosgiftsbynf@sbi',
      coverDesignCharge: cover || 40,
      geminiApiKey: gemini
    };

    if (!this.isDemoMode) {
      try {
        await this.db.collection('system_settings').doc('config').update(this.settings);
      } catch (err) {
        console.error("Firestore settings save error:", err);
      }
    } else {
      this.saveDemoDataToLocalStorage();
      this.renderAll();
      if (this.activeOrderId) {
        this.renderOrderDetails(this.activeOrderId);
      }
    }

    alert("Settings saved successfully!");
    this.closeSettingsModal();
  }

  // 17. Google AI Studio (Gemini) auto fill
  async runAiAutoFill() {
    const rawText = document.getElementById('aiPasteText').value.trim();
    const key = this.settings.geminiApiKey;

    if (!rawText) {
      alert("Please paste some raw chat details first.");
      return;
    }

    // Seed/Mock fallback helper if no API key is specified
    if (!key) {
      document.getElementById('aiLoader').style.display = 'block';
      setTimeout(() => {
        // Fallback Mock parser matching typical inputs to demonstrate functionality
        document.getElementById('order-client-name').value = 'Rajesh & Sonu';
        document.getElementById('order-client-mobile').value = '9876543210';
        document.getElementById('order-event-type').value = 'Wedding';
        document.getElementById('order-notes').value = 'Extracted: Bride Album (40 sheets), Groom Album (40 sheets), Premium Cover design.';
        document.getElementById('aiLoader').style.display = 'none';
        alert("Demo AI Fill Success! (Setup Gemini API Key in settings for live parsing of any custom pasted text)");
      }, 1000);
      return;
    }

    document.getElementById('aiLoader').style.display = 'block';
    
    const promptText = `
      Extract client details, event category, mobile numbers and photoshoot requirements from this text into a structured JSON object.
      
      Text: "${rawText}"
      
      JSON schema layout must be exactly:
      {
        "clientName": "Client name string",
        "clientMobile": "10 digit mobile string",
        "eventType": "Wedding" | "Birthday" | "Anniversary" | "Baby Shoot" | "Corporate" | "Other",
        "notes": "Consolidated summary notes"
      }
      
      Return ONLY valid JSON output.
    `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      const data = await response.json();
      const extractedText = data.candidates[0].content.parts[0].text;
      const parsedJson = JSON.parse(extractedText);

      // Pre-fill input forms
      if (parsedJson.clientName) document.getElementById('order-client-name').value = parsedJson.clientName;
      if (parsedJson.clientMobile) document.getElementById('order-client-mobile').value = parsedJson.clientMobile;
      if (parsedJson.eventType) document.getElementById('order-event-type').value = parsedJson.eventType;
      if (parsedJson.notes) document.getElementById('order-notes').value = parsedJson.notes;

      alert("AI successfully parsed and pre-filled order details!");
    } catch (err) {
      console.error("AI Auto fill parsing error:", err);
      alert("Error parsing text using Gemini AI. Verify your API key and network connection.");
    } finally {
      document.getElementById('aiLoader').style.display = 'none';
    }
  }
}

// Instantiate and start app global context
const app = new WeddingAlbumOMS();
window.onload = () => {
  app.init();
};


The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
