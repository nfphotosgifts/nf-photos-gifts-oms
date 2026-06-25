// NF PHOTOS GIFTS – Wedding Album OMS
// Core Application Script (Firebase Firestore + LocalStorage Offline Demo Mode)

class WeddingAlbumOMS {
  constructor() {
    this.db = null;
    this.isDemoMode = true;
    this.theme = 'light';

    // Core data structures in memory
    this.photographers = [];
    this.orders = [];
    this.payments = [];
    this.settings = {
      businessName: 'NF PHOTOS GIFTS',
      upiId: 'photosgiftsbynf@sbi',
      coverDesignCharge: 40,
      geminiApiKey: ''
    };

    this.currentView = 'dashboard';
    this.activeOrderId = null;
    this.statusFilter = 'all';
    this.renderTimeout = null;
    this.isEditingAlbum = false;

    // Default album sizes and types
    this.albumTypes = [
      'Bride Album', 'Groom Album', 'Mixed Album', 'Reception Album',
      'Engagement Album', 'Anniversary Album', 'Birthday Album'
    ];
    this.albumSizes = ['12×36 Inch', '14×40 Inch'];
    this.eventTypes = ['Wedding', 'Birthday', 'Anniversary', 'Baby Shoot', 'Corporate'];
  }

  async init() {
    this.loadTheme();
    this.checkFirebaseConfig();
    this.initializeUI();

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker registered successfully:', reg.scope))
          .catch(err => console.log('Service Worker registration failed:', err));
      });
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('nf_oms_theme');
    if (savedTheme) {
      this.theme = savedTheme;
      document.documentElement.setAttribute('data-theme', this.theme);
      this.updateThemeButtonIcon();
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('nf_oms_theme', this.theme);
    this.updateThemeButtonIcon();
  }

  updateThemeButtonIcon() {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = this.theme === 'light'
        ? '<i data-lucide="moon"></i>'
        : '<i data-lucide="sun"></i>';
      lucide.createIcons();
    }
  }

  checkFirebaseConfig() {
    const configStr = localStorage.getItem('nf_oms_firebase_config');
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        // Initialize Firebase Compat
        firebase.initializeApp(config);
        this.db = firebase.firestore();
        this.isDemoMode = false;
        document.getElementById('demoBanner').style.display = 'none';
        this.setupFirestoreListeners();
      } catch (err) {
        console.error("Firebase config error, falling back to Demo Mode:", err);
        this.isDemoMode = true;
        document.getElementById('demoBanner').style.display = 'flex';
        this.setupDemoMode();
      }
    } else {
      this.isDemoMode = true;
      document.getElementById('demoBanner').style.display = 'flex';
      this.setupDemoMode();
    }
  }

  setupDemoMode() {
    // Check if demo data exists in local storage, otherwise seed it
    const seeded = localStorage.getItem('nf_oms_seeded_spreadsheet_v9');
    if (!seeded) {
      this.seedMockData();
    } else {
      this.loadDemoData();
    }
    this.runDataMigrations();
    this.queueRender();
  }

  runDataMigrations() {
    // 1. Local Storage Migration
    let localUpdated = false;
    if (this.payments && this.payments.length > 0) {
      this.payments.forEach(p => {
        if (Number(p.amount) === 1435 && p.date === '2026-06-25') {
          p.date = '2026-04-15';
          localUpdated = true;
        }
      });
      if (localUpdated) {
        this.saveDemoDataToLocalStorage();
        console.log("Local Storage migration: payment date updated successfully.");
      }
    }

    // 2. Firestore Migration (if active/configured)
    if (!this.isDemoMode && this.db) {
      this.db.collection('payments')
        .where('amount', '==', 1435)
        .where('date', '==', '2026-06-25')
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            doc.ref.update({ date: '2026-04-15' })
              .then(() => {
                console.log("Firestore migration: payment date updated successfully.");
              })
              .catch(err => console.error("Firestore migration update error:", err));
          });
        })
        .catch(err => console.error("Firestore migration get error:", err));
    }
  }

  seedMockData() {
    console.log("Seeding mock data for OMS preview...");

    // Seed Photographers
    this.photographers = [
      {
        id: 'p1',
        name: 'EVENT PLANNER',
        mobile: '9871498254',
        notes: 'Regular wedding planner studio client.',
        defaultRate: 35,
        defaultCoverCharge: 35,
        createdAt: new Date().toISOString()
      },
      {
        id: 'p2',
        name: 'OTHER',
        mobile: '9111222333',
        notes: 'General other photographers category.',
        defaultRate: 35,
        defaultCoverCharge: 35,
        createdAt: new Date().toISOString()
      },
      {
        id: 'p3',
        name: 'RAHUL P GRAPHY',
        mobile: '9444555666',
        notes: 'Rahul photography agency contact.',
        defaultRate: 35,
        defaultCoverCharge: 35,
        createdAt: new Date().toISOString()
      },
      {
        id: 'p4',
        name: 'PIXLWAY',
        mobile: '9777888999',
        notes: 'Pixlway photography client contacts.',
        defaultRate: 35,
        defaultCoverCharge: 35,
        createdAt: new Date().toISOString()
      }
    ];

    // Seed Orders based on spreadsheet rows
    this.orders = [
      {
        id: 'order1',
        invoiceNumber: 'NF-001',
        invoiceSeq: 1,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Nitya & Tarun',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-11-24',
        showClientMobile: true,
        orderDate: '2026-03-25',
        deliveryDate: '2026-03-30',
        notes: 'Photos Clicked From: Mix',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/1pLfoSMWKUxPT1U4ZHSKkiXVasDyGJDrs',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 82,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 2905,
            total: 2905
          }
        ],
        requestAmount: 0,
        createdAt: '2026-03-25T10:00:00.000Z'
      },
      {
        id: 'order2',
        invoiceNumber: 'NF-002',
        invoiceSeq: 2,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Vipashya & Animesh',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2026-02-04',
        showClientMobile: true,
        orderDate: '2026-04-02',
        deliveryDate: '2026-04-06',
        notes: 'Photos Clicked From: Mix. Vipashya Mishra / Animesh Awasthi',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/17hK-t0RQ1oc2Sjbjc_0eb0pP5cOAfzPZ',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 82,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 2905,
            total: 2905
          }
        ],
        requestAmount: 0,
        createdAt: '2026-04-02T10:00:00.000Z'
      },
      {
        id: 'order3',
        invoiceNumber: 'NF-003',
        invoiceSeq: 3,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Varsha & Jitendra (Groom)',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-11-22',
        showClientMobile: true,
        orderDate: '2026-04-04',
        deliveryDate: '2026-04-14',
        notes: 'Photos Clicked From: Groom',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/194WZ2_9UW5W7HwYNwCifmKchYOVtHYIz',
        albums: [
          {
            type: 'Groom Album',
            size: '12×36 Inch',
            pages: 41,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 1470,
            total: 1470
          }
        ],
        requestAmount: 0,
        createdAt: '2026-04-04T10:00:00.000Z'
      },
      {
        id: 'order4',
        invoiceNumber: 'NF-004',
        invoiceSeq: 4,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Varsha & Jitendra (Bride)',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-11-22',
        showClientMobile: true,
        orderDate: '2026-04-04',
        deliveryDate: '2026-04-14',
        notes: 'Photos Clicked From: Bride',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/1eUyK4-ibab2Lf-w1LHMdV__hX2P22NN2',
        albums: [
          {
            type: 'Bride Album',
            size: '12×36 Inch',
            pages: 42,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 1505,
            total: 1505
          }
        ],
        requestAmount: 0,
        createdAt: '2026-04-04T10:00:00.000Z'
      },
      {
        id: 'order5',
        invoiceNumber: 'NF-001',
        invoiceSeq: 1,
        photographerId: 'p2',
        photographerName: 'OTHER',
        clientName: 'Devika & Viru',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-11-12',
        showClientMobile: true,
        orderDate: '2026-04-14',
        deliveryDate: '2026-04-16',
        notes: 'Photos Clicked From: Mix',
        status: 'Designing',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/1_iK7YZbwzuwRsH9sVGE4tL5oYXKLgA93?usp=sharing',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 31,
            rate: 30,
            coverIncluded: true,
            coverCharge: 30,
            received: 0,
            total: 960
          }
        ],
        requestAmount: 960,
        createdAt: '2026-04-14T10:00:00.000Z'
      },
      {
        id: 'order6',
        invoiceNumber: 'NF-001',
        invoiceSeq: 1,
        photographerId: 'p3',
        photographerName: 'RAHUL P GRAPHY',
        clientName: 'Sapna & Keshav',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-11-19',
        showClientMobile: true,
        orderDate: '2026-04-15',
        deliveryDate: '2026-04-16',
        notes: 'Photos Clicked From: Mix',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 31,
            rate: 40,
            coverIncluded: true,
            coverCharge: 40,
            received: 1280,
            total: 1280
          }
        ],
        requestAmount: 0,
        createdAt: '2026-04-15T10:00:00.000Z'
      },
      {
        id: 'order7',
        invoiceNumber: 'NF-005',
        invoiceSeq: 5,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Aishwarya & Manu',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-11-25',
        showClientMobile: true,
        orderDate: '2026-04-17',
        deliveryDate: '2026-04-24',
        notes: 'Photos Clicked From: Mix. Instruction: hold',
        status: 'Changes Requested',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/1yoZ-iURRXmLP7OupR041Ez-RHWzf520A',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 82,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 0,
            total: 2905
          }
        ],
        requestAmount: 2905,
        createdAt: '2026-04-17T10:00:00.000Z'
      },
      {
        id: 'order8',
        invoiceNumber: 'NF-002',
        invoiceSeq: 2,
        photographerId: 'p3',
        photographerName: 'RAHUL P GRAPHY',
        clientName: 'Vidya & Ritesh',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-11-26',
        showClientMobile: true,
        orderDate: '2026-04-19',
        deliveryDate: '2026-04-23',
        notes: 'Photos Clicked From: Mix',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 62,
            rate: 40,
            coverIncluded: true,
            coverCharge: 40,
            received: 2520,
            total: 2520
          }
        ],
        requestAmount: 0,
        createdAt: '2026-04-19T10:00:00.000Z'
      },
      {
        id: 'order9',
        invoiceNumber: 'NF-003',
        invoiceSeq: 3,
        photographerId: 'p3',
        photographerName: 'RAHUL P GRAPHY',
        clientName: 'Rajni & Suraj',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2025-12-02',
        showClientMobile: true,
        orderDate: '2026-04-29',
        deliveryDate: '2026-05-07',
        notes: 'Photos Clicked From: Mix',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 37,
            rate: 40,
            coverIncluded: true,
            coverCharge: 40,
            received: 1520,
            total: 1520
          }
        ],
        requestAmount: 0,
        createdAt: '2026-04-29T10:00:00.000Z'
      },
      {
        id: 'order10',
        invoiceNumber: 'NF-006',
        invoiceSeq: 6,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Pragati & Rahul',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2026-01-15',
        showClientMobile: true,
        orderDate: '2026-05-13',
        deliveryDate: '2026-05-16',
        notes: 'Photos Clicked From: Mix',
        status: 'Designing',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/19e74O8CeJtZJCrtt-tTYo3R5sL7B7oj3',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 31,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 0,
            total: 1120
          }
        ],
        requestAmount: 1120,
        createdAt: '2026-05-13T10:00:00.000Z'
      },
      {
        id: 'order11',
        invoiceNumber: 'NF-007',
        invoiceSeq: 7,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Kajal & Rajesh',
        clientMobile: '',
        eventType: 'Other',
        eventDate: '2026-01-20',
        showClientMobile: true,
        orderDate: '2026-05-16',
        deliveryDate: '2026-05-21',
        notes: 'Photos Clicked From: Mix',
        status: 'Delivered',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 42,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 1505,
            total: 1505
          }
        ],
        requestAmount: 0,
        createdAt: '2026-05-16T10:00:00.000Z'
      },
      {
        id: 'order12',
        invoiceNumber: 'NF-001',
        invoiceSeq: 1,
        photographerId: 'p4',
        photographerName: 'PIXLWAY',
        clientName: 'Neha & Anand',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2026-02-08',
        showClientMobile: true,
        orderDate: '2026-05-25',
        deliveryDate: '2026-05-28',
        notes: 'Photos Clicked From: Mix. Instruction: Advance 500',
        status: 'Designing',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/1109pMJqxl-dYASUrMLsKgsAo7kZGBLUC?usp=sharing',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 51,
            rate: 40,
            coverIncluded: true,
            coverCharge: 40,
            received: 500,
            total: 2080
          }
        ],
        requestAmount: 1580,
        createdAt: '2026-05-25T10:00:00.000Z'
      },
      {
        id: 'order13',
        invoiceNumber: 'NF-002',
        invoiceSeq: 2,
        photographerId: 'p4',
        photographerName: 'PIXLWAY',
        clientName: 'Swati & Vivek',
        clientMobile: '',
        eventType: 'Engagement / Ring Ceremony',
        eventDate: '2026-02-12',
        showClientMobile: true,
        orderDate: '2026-05-28',
        deliveryDate: '2026-06-01',
        notes: 'Photos Clicked From: Mix',
        status: 'Designing',
        googleDriveLink: '',
        rawPhotosLink: 'https://drive.google.com/drive/folders/1CQhPxWjXsY37IRlzFoZhkIpLaVISqte4',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 41,
            rate: 40,
            coverIncluded: true,
            coverCharge: 40,
            received: 0,
            total: 1680
          }
        ],
        requestAmount: 1680,
        createdAt: '2026-05-28T10:00:00.000Z'
      },
      {
        id: 'order14',
        invoiceNumber: 'NF-004',
        invoiceSeq: 4,
        photographerId: 'p3',
        photographerName: 'RAHUL P GRAPHY',
        clientName: 'Roma & Amit (41 Sheets)',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2026-02-22',
        showClientMobile: true,
        orderDate: '2026-05-30',
        deliveryDate: '2026-06-11',
        notes: 'Photos Clicked From: Mix. Rahul photography (amit roma)',
        status: 'Designing',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 41,
            rate: 40,
            coverIncluded: true,
            coverCharge: 40,
            received: 0,
            total: 1680
          }
        ],
        requestAmount: 1680,
        createdAt: '2026-05-30T10:00:00.000Z'
      },
      {
        id: 'order15',
        invoiceNumber: 'NF-005',
        invoiceSeq: 5,
        photographerId: 'p3',
        photographerName: 'RAHUL P GRAPHY',
        clientName: 'Roma & Amit (11 Sheets)',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2026-02-22',
        showClientMobile: true,
        orderDate: '2026-05-30',
        deliveryDate: '2026-06-11',
        notes: 'Photos Clicked From: Mix. Rahul photography (Roma Amit)',
        status: 'Designing',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Mixed Album',
            size: '12×36 Inch',
            pages: 11,
            rate: 40,
            coverIncluded: true,
            coverCharge: 40,
            received: 0,
            total: 480
          }
        ],
        requestAmount: 480,
        createdAt: '2026-05-30T10:00:00.000Z'
      },
      {
        id: 'order16',
        invoiceNumber: 'NF-008',
        invoiceSeq: 8,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Prerna & Minal (Bride)',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2026-03-01',
        showClientMobile: true,
        orderDate: '2026-06-04',
        deliveryDate: '2026-06-17',
        notes: 'Photos Clicked From: Bride',
        status: 'Order Received',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Bride Album',
            size: '12×36 Inch',
            pages: 31,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 0,
            total: 1120
          }
        ],
        requestAmount: 1120,
        createdAt: '2026-06-04T10:00:00.000Z'
      },
      {
        id: 'order17',
        invoiceNumber: 'NF-009',
        invoiceSeq: 9,
        photographerId: 'p1',
        photographerName: 'EVENT PLANNER',
        clientName: 'Prerna & Minal (Groom)',
        clientMobile: '',
        eventType: 'Wedding',
        eventDate: '2026-03-01',
        showClientMobile: true,
        orderDate: '2026-06-04',
        deliveryDate: '2026-06-17',
        notes: 'Photos Clicked From: Groom',
        status: 'Order Received',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: [
          {
            type: 'Groom Album',
            size: '12×36 Inch',
            pages: 51,
            rate: 35,
            coverIncluded: true,
            coverCharge: 35,
            received: 0,
            total: 1820
          }
        ],
        requestAmount: 1820,
        createdAt: '2026-06-04T10:00:00.000Z'
      }
    ];

    this.payments = [
      {
        id: 'pay1',
        orderId: 'order1',
        invoiceNumber: 'NF-001',
        clientName: 'Nitya & Tarun',
        photographerId: 'p1',
        amount: 2905,
        date: '2026-03-25',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay2',
        orderId: 'order2',
        invoiceNumber: 'NF-002',
        clientName: 'Vipashya & Animesh',
        photographerId: 'p1',
        amount: 2905,
        date: '2026-04-02',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay3',
        orderId: 'order3',
        invoiceNumber: 'NF-003',
        clientName: 'Varsha & Jitendra (Groom)',
        photographerId: 'p1',
        amount: 1470,
        date: '2026-04-04',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay4',
        orderId: 'order4',
        invoiceNumber: 'NF-004',
        clientName: 'Varsha & Jitendra (Bride)',
        photographerId: 'p1',
        amount: 1505,
        date: '2026-04-04',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay5',
        orderId: 'order6',
        invoiceNumber: 'NF-001',
        clientName: 'Sapna & Keshav',
        photographerId: 'p3',
        amount: 1280,
        date: '2026-04-15',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay6',
        orderId: 'order8',
        invoiceNumber: 'NF-002',
        clientName: 'Vidya & Ritesh',
        photographerId: 'p3',
        amount: 2520,
        date: '2026-04-19',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay7',
        orderId: 'order9',
        invoiceNumber: 'NF-003',
        clientName: 'Rajni & Suraj',
        photographerId: 'p3',
        amount: 1520,
        date: '2026-04-29',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay8',
        orderId: 'order11',
        invoiceNumber: 'NF-007',
        clientName: 'Kajal & Rajesh',
        photographerId: 'p1',
        amount: 1505,
        date: '2026-05-16',
        type: 'Full',
        notes: 'Settle Payment',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pay9',
        orderId: 'order12',
        invoiceNumber: 'NF-001',
        clientName: 'Neha & Anand',
        photographerId: 'p4',
        amount: 500,
        date: '2026-05-25',
        type: 'Advance',
        notes: 'Advance Payment',
        createdAt: new Date().toISOString()
      }
    ];
    this.saveDemoDataToLocalStorage();
    localStorage.setItem('nf_oms_seeded_spreadsheet_v9', 'true');
  }

  loadDemoData() {
    this.photographers = JSON.parse(localStorage.getItem('nf_oms_photographers')) || [];
    this.orders = JSON.parse(localStorage.getItem('nf_oms_orders')) || [];
    this.payments = JSON.parse(localStorage.getItem('nf_oms_payments')) || [];
    this.settings = JSON.parse(localStorage.getItem('nf_oms_settings')) || this.settings;
    if (this.settings && this.settings.upiId === 'nfphotosgifts@upi') {
      this.settings.upiId = 'photosgiftsbynf@sbi';
      this.saveDemoDataToLocalStorage();
    }
  }

  saveDemoDataToLocalStorage() {
    localStorage.setItem('nf_oms_photographers', JSON.stringify(this.photographers));
    localStorage.setItem('nf_oms_orders', JSON.stringify(this.orders));
    localStorage.setItem('nf_oms_payments', JSON.stringify(this.payments));
    localStorage.setItem('nf_oms_settings', JSON.stringify(this.settings));
  }

  resetDemoData() {
    if (confirm("Are you sure you want to restore the demo mock data? This will overwrite your local changes.")) {
      localStorage.removeItem('nf_oms_seeded_spreadsheet_v9');
      this.seedMockData();
      this.loadDemoData();
      this.queueRender();
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
      this.queueRender();
    });

    // Photographers listener
    this.db.collection('photographers').orderBy('name').onSnapshot((snapshot) => {
      this.photographers = [];
      snapshot.forEach(doc => {
        this.photographers.push({ id: doc.id, ...doc.data() });
      });
      this.queueRender();
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
      this.queueRender();
    });

    // Payments listener
    this.db.collection('payments').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
      this.payments = [];
      snapshot.forEach(doc => {
        this.payments.push({ id: doc.id, ...doc.data() });
      });
      this.runDataMigrations();
      if (this.activeOrderId) {
        this.renderOrderDetails(this.activeOrderId);
      }
      this.queueRender();
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
    this.isEditingAlbum = false;

    // Toggle active state in sidebar drawer items
    document.querySelectorAll('.drawer-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeDrawerItem = document.getElementById(`drawer-item-${viewId}`);
    if (activeDrawerItem) activeDrawerItem.classList.add('active');

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
    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) viewEl.style.display = 'block';

    if (viewId === 'dashboard') {
      this.activeOrderId = null;
      this.renderDashboard();
    } else if (viewId === 'photographers') {
      this.renderPhotographers();
    } else if (viewId === 'reports') {
      this.renderReports();
    } else if (viewId === 'invoices') {
      this.renderInvoiceList();
    }

    lucide.createIcons();
  }

  scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-triangle' : 'info');
    toast.innerHTML = `<i data-lucide="${icon}" style="width: 18px; height: 18px;"></i><span>${message}</span>`;
    
    document.body.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 2000);
  }

  toggleSidebarMenu(forceState) {
    const drawer = document.getElementById('sidebarMenuDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (!drawer || !overlay) return;

    let show = !drawer.classList.contains('open');
    if (typeof forceState !== 'undefined') {
      show = forceState;
    }

    if (show) {
      drawer.classList.add('open');
      overlay.classList.add('open');
    } else {
      drawer.classList.remove('open');
      overlay.classList.open ? overlay.classList.remove('open') : overlay.classList.remove('open');
    }
  }

  handleDrawerItemClick(viewId) {
    this.toggleSidebarMenu(false); // Close drawer
    
    if (viewId === 'settings') {
      this.openSettingsModal();
    } else {
      this.switchView(viewId);
    }
  }

  populateInvoicePhotographerDropdown() {
    const select = document.getElementById('invoicePhotographerSelect');
    if (!select) return;
    
    const currentSelection = select.value;
    select.innerHTML = '<option value="">-- Select Photographer --</option>';
    
    this.photographers.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.innerText = p.name;
      select.appendChild(opt);
    });
    
    if (currentSelection) {
      select.value = currentSelection;
    }
  }

  renderInvoiceList() {
    const select = document.getElementById('invoicePhotographerSelect');
    const container = document.getElementById('invoiceOrdersList');
    if (!select || !container) return;
    
    const pid = select.value;
    container.innerHTML = '';
    
    if (!pid) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">Select a photographer to see pending projects.</div>';
      return;
    }
    
    // Filter pending projects (due > 0, status is not Delivered, Cancelled, Archived)
    const pendingOrders = this.orders.filter(order => {
      if (order.photographerId !== pid) return false;
      if (order.status === 'Delivered' || order.status === 'Cancelled' || order.status === 'Archived') return false;
      const fin = this.calculateOrderFinancials(order);
      return fin.balance > 0;
    });
    
    if (pendingOrders.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No pending projects found for this photographer. All projects are fully paid or delivered!</div>';
      return;
    }
    
    pendingOrders.forEach(order => {
      const fin = this.calculateOrderFinancials(order);
      const isChecked = this.selectedOrderIdsForInvoices && this.selectedOrderIdsForInvoices.has(order.id);
      
      const card = document.createElement('div');
      card.className = 'order-card';
      
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; width: 100%;">
          <!-- Checkbox for combined invoice select -->
          <div onclick="event.stopPropagation();" style="display: flex; align-items: center;">
            <input type="checkbox" class="invoice-select-checkbox" data-order-id="${order.id}" onchange="app.handleInvoiceSelectionChange(this)" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--accent-gold);">
          </div>
          
          <!-- Info block -->
          <div class="order-main-info" style="flex: 1;">
            <div class="order-header">
              <span class="order-id">${order.invoiceNumber}</span>
              <span class="order-title">${order.clientName}</span>
              <span class="badge badge-pending">${order.status}</span>
            </div>
            <div class="order-meta">
              <span><i data-lucide="calendar" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i>Order Date: ${order.orderDate || 'N/A'}</span>
              <span>•</span>
              <span><i data-lucide="tag" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"></i>Event: ${order.eventType || 'N/A'}</span>
            </div>
          </div>
          
          <!-- Financials and actions -->
          <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
            <div class="order-financials">
              <div class="order-amt-block">
                <span class="order-amt-label">Gross</span>
                <div class="order-amt-val">₹${fin.gross.toLocaleString('en-IN')}</div>
              </div>
              <div class="order-amt-block">
                <span class="order-amt-label">Paid</span>
                <div class="order-amt-val" style="color: var(--success-color);">₹${fin.received.toLocaleString('en-IN')}</div>
              </div>
              <div class="order-amt-block">
                <span class="order-amt-label">Due</span>
                <div class="order-amt-val due">₹${fin.balance.toLocaleString('en-IN')}</div>
              </div>
            </div>
            
            <div style="display: flex; gap: 8px;" onclick="event.stopPropagation();">
              <button class="btn btn-secondary" onclick="app.openOrderDetails('${order.id}')" title="Individual Invoice/Details" style="padding: 8px 12px; font-size: 0.85rem;">
                <i data-lucide="file-text"></i> Invoice
              </button>
              <button class="btn btn-primary" onclick="app.openRecordPaymentModal('${order.id}')" title="Record Payment" style="padding: 8px 12px; font-size: 0.85rem;">
                <i data-lucide="plus"></i> Pay
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Clicking the card anywhere checks the checkbox
      card.onclick = () => {
        const cb = card.querySelector('.invoice-select-checkbox');
        if (cb) {
          cb.checked = !cb.checked;
          this.handleInvoiceSelectionChange(cb);
        }
      };
      
      container.appendChild(card);
    });
    
    lucide.createIcons();
  }

  handleInvoiceSelectionChange(checkbox) {
    const orderId = checkbox.dataset.orderId;
    this.selectedOrderIdsForInvoices = this.selectedOrderIdsForInvoices || new Set();
    
    if (checkbox.checked) {
      this.selectedOrderIdsForInvoices.add(orderId);
    } else {
      this.selectedOrderIdsForInvoices.delete(orderId);
    }
    
    this.updateInvoiceCombinedActionBar();
  }

  updateInvoiceCombinedActionBar() {
    const bar = document.getElementById('invoiceCombinedActionBar');
    const countSpan = document.getElementById('selectedInvoiceCount');
    if (!bar || !countSpan) return;

    this.selectedOrderIdsForInvoices = this.selectedOrderIdsForInvoices || new Set();
    const count = this.selectedOrderIdsForInvoices.size;
    
    if (count > 0) {
      bar.style.display = 'flex';
      countSpan.innerText = count;
    } else {
      bar.style.display = 'none';
    }
  }

  clearInvoiceSelection() {
    this.selectedOrderIdsForInvoices = new Set();
    document.querySelectorAll('.invoice-select-checkbox').forEach(cb => {
      cb.checked = false;
    });
    this.updateInvoiceCombinedActionBar();
  }

  generateCombinedInvoiceFromSelection() {
    this.selectedOrderIdsForInvoices = this.selectedOrderIdsForInvoices || new Set();
    if (this.selectedOrderIdsForInvoices.size === 0) return;
    
    // Copy selection to settlement set used by generateCombinedInvoice
    this.selectedOrderIdsForSettlement = new Set(this.selectedOrderIdsForInvoices);
    
    // Clear invoice selections
    this.clearInvoiceSelection();
    
    // Generate combined invoice using the existing system
    this.generateCombinedInvoice();
  }

  handlePaymentAmountInput() {
    const orderId = document.getElementById('payment-order-id').value;
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);
    const enteredAmount = Number(document.getElementById('payment-amount').value) || 0;
    const remaining = fin.balance - enteredAmount;

    const balLabel = document.getElementById('payment-balance-label');
    if (balLabel) {
      if (remaining > 0) {
        balLabel.innerText = `Outstanding Balance: ₹${fin.balance.toLocaleString('en-IN')} (Remaining: ₹${remaining.toLocaleString('en-IN')})`;
        balLabel.style.color = 'var(--pending-color)';
      } else if (remaining === 0) {
        balLabel.innerText = `Outstanding Balance: ₹${fin.balance.toLocaleString('en-IN')} (Fully Paid)`;
        balLabel.style.color = 'var(--success-color)';
      } else {
        balLabel.innerText = `Outstanding Balance: ₹${fin.balance.toLocaleString('en-IN')} (Excess: ₹${Math.abs(remaining).toLocaleString('en-IN')})`;
        balLabel.style.color = 'var(--success-color)';
      }
    }
  }

  handleClientNameSpace(event) {
    const input = event.target;
    const val = input.value;
    
    // Check if user pressed spacebar
    if (event.key === ' ') {
      const trimmed = val.trim();
      // If there's exactly one word typed and no spaces or ampersands exist yet
      if (trimmed && !val.includes(' ') && !val.includes('&')) {
        event.preventDefault(); // Prevent standard space character insertion
        input.value = trimmed + ' & ';
        
        // Trigger input event to update any bound UI variables or validators
        input.dispatchEvent(new Event('input'));
      }
    }
  }

  queueRender() {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    this.renderTimeout = setTimeout(() => {
      this.renderAll();
      this.renderTimeout = null;
    }, 50);
  }

  renderAll() {
    if (this.currentView === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentView === 'photographers') {
      this.renderPhotographers();
    } else if (this.currentView === 'reports') {
      this.renderReports();
    } else if (this.currentView === 'invoices') {
      this.renderInvoiceList();
    }
    this.populatePhotographerDropdowns();
    this.populateInvoicePhotographerDropdown();
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
    this.populateStudioOrClientFilter();

    // 1. Calculations KPIs (All-Time)
    let totalProjects = this.orders.length;
    let activeAlbums = 0;
    let totalPending = 0; // Net Outstanding Balance (overall)
    let totalBusiness = 0;
    let totalReceived = 0;

    this.orders.forEach(order => {
      const fin = this.calculateOrderFinancials(order);
      totalPending += fin.balance;
      totalBusiness += fin.gross;
      totalReceived += fin.received;

      // Count active albums (not counting Delivered, Cancelled, or Archived status)
      if (order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Archived') {
        if (order.albums) {
          activeAlbums += order.albums.length;
        }
      }
    });

    // Update Dom defensively
    const setElText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    setElText('kpi-total-projects', totalProjects);
    setElText('kpi-active-albums', activeAlbums);
    setElText('kpi-total-business', '₹' + totalBusiness.toLocaleString('en-IN'));
    setElText('kpi-total-received', '₹' + totalReceived.toLocaleString('en-IN'));
    setElText('kpi-net-outstanding', '₹' + totalPending.toLocaleString('en-IN'));

    // Color code outstanding balance card
    const outstandingCard = document.getElementById('kpi-outstanding-card');
    if (outstandingCard) {
      if (totalPending > 0) {
        outstandingCard.classList.remove('fully-paid');
      } else {
        outstandingCard.classList.add('fully-paid');
      }
    }

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
    const studioOrClient = document.getElementById('filterStudioOrClient')
      ? document.getElementById('filterStudioOrClient').value
      : 'all';

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
      const matchesStatus = this.statusFilter === 'all'
        ? order.status !== 'Delivered'
        : order.status === this.statusFilter;

      // 3. Payment Filter
      let matchesPayment = true;
      if (payStatus === 'pending') {
        matchesPayment = fin.balance > 0;
      } else if (payStatus === 'fully-paid') {
        matchesPayment = fin.balance <= 0;
      }

      // 4. Studio or Client Filter
      let matchesStudioOrClient = true;
      if (studioOrClient !== 'all') {
        if (studioOrClient.startsWith('photog_')) {
          const pid = studioOrClient.substring(7);
          matchesStudioOrClient = (order.photographerId === pid);
        } else if (studioOrClient.startsWith('client_')) {
          const cname = studioOrClient.substring(7);
          matchesStudioOrClient = (order.clientName === cname);
        }
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesStudioOrClient;
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
      if (order.status === 'Delivered') statusClass = 'badge-success';
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

    // Filter orders with balance > 0 and status in ['Approved', 'Google Drive Link Sent', 'Delivered']
    const pendingOrders = this.orders.filter(o => {
      if (o.id === 'combined_temp') return false;
      const fin = this.calculateOrderFinancials(o);
      const isAllowedStatus = ['Approved', 'Google Drive Link Sent', 'Delivered'].includes(o.status);
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
      if (o.status === 'Delivered') statusClass = 'badge-success';
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
    const mobile = (photog && photog.mobile) ? photog.mobile : order.clientMobile;

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
    const mobile = (photog && photog.mobile) ? photog.mobile : order.clientMobile;

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
    const validStatuses = [
      'Order Received', 'Designing', 'PDF Sent', 'Changes Requested', 'Approved', 
      'Google Drive Link Sent', 'Delivered', 'Hold', 'Cancelled', 'Archived'
    ];
    
    // Set status
    const statusSelect = document.getElementById('detail-status');
    if (validStatuses.includes(order.status)) {
      statusSelect.value = order.status;
      document.getElementById('detail-custom-status').style.display = 'none';
    } else {
      statusSelect.value = 'Other';
      const customStatusInput = document.getElementById('detail-custom-status');
      customStatusInput.style.display = 'block';
      customStatusInput.value = order.status;
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) {
        el.value = val || '';
      }
    };

    setVal('detail-client-mobile', order.clientMobile);
    setVal('detail-order-date', order.orderDate);
    setVal('detail-event-date', order.eventDate);
    setVal('detail-delivery-date', order.deliveryDate);
    setVal('detail-raw-link', order.rawPhotosLink);
    setVal('detail-final-link', order.googleDriveLink);
    setVal('detail-notes', order.notes);

    // Handle show/hide client mobile visibility
    const showClientMobile = order.showClientMobile !== false;
    document.getElementById('detail-show-client-mobile').checked = showClientMobile;
    document.getElementById('client-mobile-container').style.display = showClientMobile ? 'flex' : 'none';

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
    if (!list) return;

    if (this.isEditingAlbum) return;

    // Prevent full redraw if the user is currently focused/typing in a text, number, or date input field
    const activeEl = document.activeElement;
    if (activeEl && list.contains(activeEl)) {
      const tag = activeEl.tagName.toLowerCase();
      const type = activeEl.type ? activeEl.type.toLowerCase() : '';
      if (tag === 'textarea' || (tag === 'input' && (type === 'text' || type === 'number' || type === 'date'))) {
        return;
      }
    }

    list.innerHTML = '';

    if (!order.albums || order.albums.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 0.95rem;">No albums added to this project yet.</div>`;
      return;
    }

    order.albums.forEach((album, idx) => {
      const card = document.createElement('div');
      card.className = 'album-item-card';
      
      const typeOptions = this.albumTypes.map(t => `<option value="${t}" ${album.type === t ? 'selected' : ''}>${t}</option>`).join('');
      const sizeOptions = this.albumSizes.map(s => `<option value="${s}" ${album.size === s ? 'selected' : ''}>&nbsp;${s}</option>`).join('');

      const isWeddingAlbum = ['Bride Album', 'Groom Album', 'Mixed Album', 'Reception Album'].includes(album.type);

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
        
        <!-- Custom text prompts if "Other" is selected, and Album Event Date if non-wedding -->
        <div class="form-row" style="margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap;">
          ${!this.albumTypes.includes(album.type) ? `
            <div class="form-group" style="margin-bottom: 8px; flex: 1; min-width: 120px;">
              <input type="text" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" placeholder="Custom Album Type..." value="${album.type === 'Other' ? '' : album.type}" onchange="app.updateAlbumField(${idx}, 'type', this.value)">
            </div>
          ` : ''}
          ${!this.albumSizes.includes(album.size) ? `
            <div class="form-group" style="margin-bottom: 8px; flex: 1; min-width: 120px;">
              <input type="text" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" placeholder="Custom Size..." value="${album.size === 'Other' ? '' : album.size}" onchange="app.updateAlbumField(${idx}, 'size', this.value)">
            </div>
          ` : ''}
          ${!isWeddingAlbum ? `
            <div class="form-group" style="margin-bottom: 8px; flex: 1; min-width: 120px;">
              <label style="font-size: 0.65rem; display: block; margin-bottom: 2px;">Album Event Date</label>
              <input type="date" class="form-control" style="padding: 8px 10px; font-size: 0.85rem;" value="${album.eventDate || ''}" onchange="app.updateAlbumField(${idx}, 'eventDate', this.value)">
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
              <span class="album-cover-price" style="font-size: 0.55rem; color:var(--text-secondary);">₹${album.coverCharge}</span>
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

    const photog = this.photographers.find(p => p.id === order.photographerId);
    const rate = (photog && typeof photog.defaultRate !== 'undefined') ? Number(photog.defaultRate) : 35;
    const coverCharge = (photog && typeof photog.defaultCoverCharge !== 'undefined') ? Number(photog.defaultCoverCharge) : rate;
    const total = (40 * rate) + coverCharge;

    order.albums.push({
      type: 'Bride Album',
      size: '12×36 Inch',
      pages: 40,
      rate: rate,
      coverIncluded: true,
      coverCharge: coverCharge,
      received: 0,
      total: total
    });

    this.isEditingAlbum = false;
    this.saveOrderDetails(order);
  }

  removeAlbumItem(idx) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    if (confirm("Are you sure you want to delete this album item?")) {
      order.albums.splice(idx, 1);
      this.isEditingAlbum = false;
      this.saveOrderDetails(order);
    }
  }

  updateAlbumCardUI(idx, album) {
    const list = document.getElementById('itemizedAlbumsList');
    if (!list) return;
    const cards = list.getElementsByClassName('album-item-card');
    const card = cards[idx];
    if (!card) return;

    const coverPriceEl = card.querySelector('.album-cover-price');
    if (coverPriceEl) coverPriceEl.innerText = `₹${album.coverCharge}`;

    const totalEl = card.querySelector('.album-total-text');
    if (totalEl) totalEl.innerText = `Total Amount: ₹${album.total}`;

    const balEl = card.querySelector('.album-bal-text');
    if (balEl) balEl.innerText = `Bal: ₹${album.total - (album.received || 0)}`;
  }

  updateAlbumField(idx, field, value) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    this.isEditingAlbum = true;

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

    order.albums[idx].total = (pages * rate) + coverCharge;

    // Update specific card UI directly in the DOM
    this.updateAlbumCardUI(idx, order.albums[idx]);

    // Recalculate overall order financials and update top-level cards directly
    const fin = this.calculateOrderFinancials(order);
    
    const grossEl = document.getElementById('detail-gross-amount');
    if (grossEl) grossEl.innerText = '₹' + fin.gross.toLocaleString('en-IN');
    const recEl = document.getElementById('detail-received-amount');
    if (recEl) recEl.innerText = '₹' + fin.received.toLocaleString('en-IN');
    const balEl = document.getElementById('detail-balance-amount');
    if (balEl) balEl.innerText = '₹' + fin.balance.toLocaleString('en-IN');

    // Update Bill Slip request amount input if not custom edited
    const requestInput = document.getElementById('billRequestAmount');
    if (requestInput && (!requestInput.dataset.edited || requestInput.dataset.orderId !== order.id)) {
      requestInput.value = fin.balance;
      order.requestAmount = fin.balance;
    }

    // Render payment ledger and bill slip
    this.renderPaymentLedger(order);
    this.renderBillSlip();

    // Silent save to write to DB without list redraw
    this.saveOrderDetailsSilent(order);
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
        this.queueRender();
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

    // Set badge text and header subtitle
    const typeBadgeEl = document.getElementById('bill-type-badge');
    const studioSubEl = document.getElementById('bill-studio-sub-top');
    if (typeBadgeEl) typeBadgeEl.innerText = isCombined ? 'COMBINED' : 'INVOICE';
    if (studioSubEl) studioSubEl.innerText = isCombined ? 'Combined Studio Statement' : 'Studio Invoice Statement';

    // Setup metadata
    const photog = this.photographers.find(p => p.id === order.photographerId || p.name === order.photographerName);
    const phone = photog ? (photog.mobile || '') : '';
    const studioName = order.photographerName || 'rp';

    const studioValEl = document.getElementById('bill-combined-studio');
    const studioPhoneEl = document.getElementById('bill-combined-phone');
    if (studioValEl) studioValEl.innerText = studioName;
    if (studioPhoneEl) studioPhoneEl.innerText = phone;

    // Format date as e.g. "23Jun2026"
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${d.getDate()}${months[d.getMonth()]}${d.getFullYear()}`;
    const dateValEl = document.getElementById('bill-combined-date');
    if (dateValEl) dateValEl.innerText = formattedDate;

    // Project Count
    const projectCount = isCombined ? (order.orders ? order.orders.length : 0) : 1;
    const projectCountEl = document.getElementById('bill-combined-projects-count');
    if (projectCountEl) projectCountEl.innerText = projectCount;

    const projectsLabelEl = document.getElementById('billProjectsLabel');
    if (projectsLabelEl) projectsLabelEl.innerText = isCombined ? 'ACTIVE PROJECTS' : 'PROJECTS';

    // Map projects list
    const activeOrders = isCombined ? (order.orders || []) : [order];

    // Render table
    let tableHtml = `
      <table class="statement-table">
        <thead>
          <tr>
            <th align="left">Client Name</th>
            <th align="center">Bill No.</th>
            <th align="right">Rate</th>
            <th align="right">Gross</th>
            <th align="right">Paid</th>
            <th align="right">Balance</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (activeOrders.length > 0) {
      activeOrders.forEach(o => {
        // Fetch or calculate financials dynamically for this order item
        const oFin = (o.gross !== undefined && o.received !== undefined && o.balance !== undefined) 
          ? o 
          : this.calculateOrderFinancials(o);

        // Fetch the rate from the first album
        const rateVal = o.albums && o.albums[0] ? (Number(o.albums[0].rate) || 0) : 35;

        // Calculate total sheets breakdown and cover count
        const albums = o.albums || [];
        const totalSheets = albums.reduce((sum, al) => sum + Number(al.pages || 0), 0);
        const sheetsBreakdown = albums.map(al => al.pages).join('+');
        const coverCount = albums.filter(al => al.coverIncluded).length;
        const coverStr = coverCount === 1 ? '1 Cover' : `${coverCount} Covers`;

        // Format subtext string e.g., "90 Sheets (40+40+10) | 3 Covers"
        let subtext = '';
        if (albums.length > 0) {
          subtext = `${totalSheets} Sheets (${sheetsBreakdown}) | ${coverStr}`;
        } else {
          subtext = `0 Sheets | 0 Covers`;
        }

        const subBadgeColor = oFin.balance <= 0 ? '#2E7D32' : (oFin.received > 0 ? '#E65100' : '#C62828');
        const subBadgeText = oFin.balance <= 0 ? 'PAID' : (oFin.received > 0 ? 'PART-PAID' : 'UNPAID');

        tableHtml += `
          <tr>
            <td class="client-cell">
              ${o.clientName}
              <div class="event-subtext">${subtext}</div>
            </td>
            <td align="center">
              <span class="bill-badge" style="font-weight:700;">${o.invoiceNumber}</span>
              <div style="font-size:0.58rem; font-weight:700; color:${subBadgeColor}; margin-top:2px; letter-spacing:0.02em;">${subBadgeText}</div>
            </td>
            <td align="right" class="num-cell">Rs ${rateVal}</td>
            <td align="right" class="num-cell">Rs ${oFin.gross.toLocaleString('en-IN')}</td>
            <td align="right" class="paid-cell">Rs ${oFin.received.toLocaleString('en-IN')}</td>
            <td align="right" class="balance-cell">Rs ${oFin.balance.toLocaleString('en-IN')}</td>
          </tr>
        `;
      });
    } else {
      tableHtml += `<tr><td colspan="6" align="center">No active projects found</td></tr>`;
    }

    tableHtml += `
        </tbody>
      </table>
    `;

    const tableContainer = document.getElementById('billCombinedTableContainer');
    if (tableContainer) tableContainer.innerHTML = tableHtml;

    // Gross & Received & Balance (Use Rs instead of symbol)
    const currencyStr = 'Rs ';
    const grossTotalEl = document.getElementById('bill-gross-total');
    const receivedEl = document.getElementById('bill-received');
    const balanceTotalEl = document.getElementById('bill-balance-total');
    if (grossTotalEl) grossTotalEl.innerText = currencyStr + fin.gross.toLocaleString('en-IN');
    if (receivedEl) receivedEl.innerText = currencyStr + fin.received.toLocaleString('en-IN');
    if (balanceTotalEl) balanceTotalEl.innerText = currencyStr + fin.balance.toLocaleString('en-IN');

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

        const qrAmountRowEl = document.getElementById('billQrAmountRow');
        if (qrAmountRowEl) {
          qrAmountRowEl.innerHTML = `Total <span id="billQrAmountText" style="font-weight:800;">${currencyStr}${Number(reqAmount).toLocaleString('en-IN')}</span>`;
        }

        const footerUpiEl = document.getElementById('footer-upi-id');
        if (footerUpiEl) footerUpiEl.innerText = upiId;

        const qrMerchantEl = document.getElementById('billQrMerchantId');
        if (qrMerchantEl) qrMerchantEl.innerText = upiId;

        const qrSubtextEl = document.getElementById('billQrSubtext');
        if (qrSubtextEl) {
          qrSubtextEl.style.display = isCombined ? 'block' : 'none';
        }

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

    // Footer Text
    const footerThankYouEl = document.getElementById('billFooterThankYou');
    const footerSubInfoEl = document.getElementById('billFooterSubInfo');
    if (footerThankYouEl) {
      footerThankYouEl.innerText = isCombined ? 'Thank you for your rest statement.' : 'Thank you for choosing NF PHOTOS GIFTS!';
    }
    if (footerSubInfoEl) {
      footerSubInfoEl.innerText = isCombined 
        ? `This is a combined statement for all active projects under ${studioName}.`
        : `This is a statement for the active project under ${studioName}.`;
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

  openRecordPaymentModal(orderId) {
    const id = orderId || this.activeOrderId;
    this.openQuickPayModal(id);
  }

  closeRecordPaymentModal() {
    document.getElementById('recordPaymentModal').classList.remove('active');
  }

  handlePaymentTypeChange(type) {
    if (type === 'Full') {
      const orderId = document.getElementById('payment-order-id').value;
      const order = this.orders.find(o => o.id === orderId);
      if (order) {
        const fin = this.calculateOrderFinancials(order);
        const amount = Math.max(0, fin.balance);
        document.getElementById('payment-amount').value = amount;
        
        // Auto-finalize the payment
        this.savePayment();
      }
    }
  }

  async savePayment() {
    const orderId = document.getElementById('payment-order-id').value;
    const type = document.getElementById('payment-type').value;
    const date = document.getElementById('payment-date').value;
    const notes = document.getElementById('payment-notes').value.trim();

    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);
    let amount = Number(document.getElementById('payment-amount').value);

    if (type === 'Full') {
      amount = Math.max(0, fin.balance);
      document.getElementById('payment-amount').value = amount;
    }

    if (type !== 'Full' && (!amount || amount <= 0)) {
      alert("Please enter a valid payment amount.");
      return;
    }

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

        this.showToast("Payment recorded successfully!");
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
      this.showToast("Payment recorded successfully!");
      this.closeRecordPaymentModal();
      this.queueRender();
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
    document.getElementById('photographer-default-rate').value = '35';
    document.getElementById('photographer-default-cover-charge').value = '35';
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
    document.getElementById('photographer-default-rate').value = p.defaultRate || '35';
    document.getElementById('photographer-default-cover-charge').value = p.defaultCoverCharge || '35';
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
    const defaultRate = Number(document.getElementById('photographer-default-rate').value) || 35;
    const defaultCoverCharge = Number(document.getElementById('photographer-default-cover-charge').value) || 35;
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
      defaultRate,
      defaultCoverCharge,
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
        }
        this.showToast("Photographer details saved successfully!");
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
      this.showToast("Photographer details saved successfully!");
      this.queueRender();
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
        this.queueRender();
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

    this.populateInvoicePhotographerDropdown();
  }

  populateStudioOrClientFilter() {
    const selectEl = document.getElementById('filterStudioOrClient');
    if (!selectEl) return;

    const currentVal = selectEl.value;

    let html = '<option value="all">All Studios & Clients</option>';

    // Group 1: Studios (Photographers)
    if (this.photographers && this.photographers.length > 0) {
      html += '<optgroup label="Studios (Photographers)">';
      this.photographers.forEach(p => {
        html += `<option value="photog_${p.id}">Studio: ${p.name}</option>`;
      });
      html += '</optgroup>';
    }

    // Group 2: Clients (Unique names from orders)
    const clientNames = Array.from(new Set(this.orders.map(o => o.clientName).filter(Boolean))).sort();
    if (clientNames.length > 0) {
      html += '<optgroup label="Clients">';
      clientNames.forEach(name => {
        html += `<option value="client_${name}">Client: ${name}</option>`;
      });
      html += '</optgroup>';
    }

    selectEl.innerHTML = html;

    // Restore previous selection if it still exists
    if (currentVal && selectEl.querySelector(`option[value="${currentVal}"]`)) {
      selectEl.value = currentVal;
    } else {
      selectEl.value = 'all';
    }
  }

  // 11. Creating new client project
  openAddOrderModal() {
    this.populatePhotographerDropdowns();
    document.getElementById('order-client-name').value = '';
    document.getElementById('order-client-mobile').value = '';
    document.getElementById('order-notes').value = '';
    document.getElementById('order-event-date').value = '';
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
    const eventDate = document.getElementById('order-event-date').value;
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
    const rate = (photog && typeof photog.defaultRate !== 'undefined') ? Number(photog.defaultRate) : 35;
    const coverCharge = (photog && typeof photog.defaultCoverCharge !== 'undefined') ? Number(photog.defaultCoverCharge) : rate;
    const total = (40 * rate) + coverCharge;

    // Auto-create initial single album with cover design ticked by default
    const defaultAlbums = [
      {
        type: 'Bride Album',
        size: '12×36 Inch',
        pages: 40,
        rate: rate,
        coverIncluded: true,
        coverCharge: coverCharge,
        received: 0,
        total: total
      }
    ];

    const showClientMobile = clientMobile !== '';

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
            eventType,
            eventDate,
            showClientMobile,
            orderDate,
            deliveryDate,
            notes,
            status: 'Order Received',
            googleDriveLink: '',
            rawPhotosLink: '',
            albums: defaultAlbums,
            requestAmount: 1470,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          transaction.set(orderRef, orderPayload);
          transaction.update(photographerRef, { lastInvoiceSeq: newInvoiceSeq });
        });

        const viewDetails = confirm("Project Created successfully!\n\nClick OK to open Project Details and add albums.\nClick Cancel to return to Dashboard.");
        this.closeAddOrderModal();
        this.showToast("Project created successfully!");
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
        eventType,
        eventDate,
        showClientMobile,
        orderDate,
        deliveryDate,
        notes,
        status: 'Order Received',
        googleDriveLink: '',
        rawPhotosLink: '',
        albums: defaultAlbums,
        requestAmount: 1470,
        createdAt: new Date().toISOString()
      };

      this.orders.push(newOrder);
      this.saveDemoDataToLocalStorage();
      
      const viewDetails = confirm("Project Created successfully!\n\nClick OK to open Project Details and add albums.\nClick Cancel to return to Dashboard.");
      this.closeAddOrderModal();
      this.showToast("Project created successfully!");
      this.queueRender();
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

    // Populate All-Time Summary list
    const allTimeList = document.getElementById('reportAllTimeList');
    if (allTimeList) {
      allTimeList.innerHTML = '';

      let allTimeBusiness = 0;
      let allTimeReceived = 0;

      this.orders.forEach(o => {
        const fin = this.calculateOrderFinancials(o);
        allTimeBusiness += fin.gross;
        allTimeReceived += fin.received;
      });

      const allTimeOutstanding = allTimeBusiness - allTimeReceived;

      const item1 = document.createElement('div');
      item1.className = 'report-list-item';
      item1.innerHTML = `
        <span>All-Time Business:</span>
        <strong>₹${allTimeBusiness.toLocaleString('en-IN')}</strong>
      `;
      allTimeList.appendChild(item1);

      const item2 = document.createElement('div');
      item2.className = 'report-list-item';
      item2.innerHTML = `
        <span>All-Time Received:</span>
        <strong style="color: var(--success-color);">₹${allTimeReceived.toLocaleString('en-IN')}</strong>
      `;
      allTimeList.appendChild(item2);

      const item3 = document.createElement('div');
      item3.className = 'report-list-item';
      item3.style.borderTop = '1px dashed var(--card-border)';
      item3.style.marginTop = '8px';
      item3.style.paddingTop = '12px';
      item3.innerHTML = `
        <span>All-Time Outstanding:</span>
        <strong style="color: var(--pending-color);">₹${(allTimeOutstanding > 0 ? allTimeOutstanding : 0).toLocaleString('en-IN')}</strong>
      `;
      allTimeList.appendChild(item3);
    }

    // Populate Studio-wise Summary list
    const studioList = document.getElementById('reportStudioList');
    if (studioList) {
      studioList.innerHTML = '';

      this.photographers.forEach(p => {
        let pBusiness = 0;
        let pReceived = 0;
        let pOrdersCount = 0;

        this.orders.forEach(o => {
          if (o.photographerId === p.id) {
            pOrdersCount++;
            const fin = this.calculateOrderFinancials(o);
            pBusiness += fin.gross;
            pReceived += fin.received;
          }
        });

        const pPending = pBusiness - pReceived;

        const item = document.createElement('div');
        item.className = 'report-list-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
        item.style.gap = '4px';
        item.style.borderBottom = '1px solid var(--card-border)';
        item.style.paddingBottom = '12px';
        item.style.marginBottom = '12px';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <strong>${p.name}</strong>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${pOrdersCount} orders</span>
          </div>
          <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.75rem;">
            <span>Business: <strong>₹${pBusiness.toLocaleString('en-IN')}</strong></span>
            <span>Received: <strong style="color: var(--success-color);">₹${pReceived.toLocaleString('en-IN')}</strong></span>
            <span>Due: <strong style="color: var(--pending-color);">₹${(pPending > 0 ? pPending : 0).toLocaleString('en-IN')}</strong></span>
          </div>
        `;
        studioList.appendChild(item);
      });

      if (studioList.innerHTML === '') {
        studioList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 12px;">No studio activity recorded.</div>';
      }
    }
  }

  exportReport(format) {
    if (format === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Invoice Number,Client Name,Photographer Name,Event Type,Order Date,Status,Gross Total,Amount Paid,Amount Due\n";

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

    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const prefix = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    
    const whatsappAppUrl = `whatsapp://send?phone=${prefix}&text=${encodeURIComponent(message)}`;
    const webWhatsappUrl = `https://wa.me/${prefix}?text=${encodeURIComponent(message)}`;
    
    const start = Date.now();
    window.location.href = whatsappAppUrl;
    
    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(webWhatsappUrl, '_blank');
      }
    }, 1500);
  }

  async sendWhatsAppInvoice() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    // Determine target mobile number: photographer (if not direct) or client
    const photog = this.photographers.find(p => p.id === order.photographerId);
    const mobile = (photog && photog.mobile) ? photog.mobile : order.clientMobile;

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
    try {
      const canvas = await html2canvas(document.querySelector("#invoice-container"), {
        scale: 3, // High-Quality PNG
        useCORS: true,
        backgroundColor: '#FAF8F2' // Cream background tone
      });

      // 3. Trigger image download
      const link = document.createElement('a');
      link.download = `Invoice_${order.invoiceNumber}_${order.clientName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast("Invoice image generated! Opening WhatsApp...", "success");

      const upiLink = this.getUpiLink(order, fin.balance);
      const message = `✨ NF PHOTOS GIFTS ✨\nTotal Balance: Rs ${fin.balance.toLocaleString('en-IN')}\nTap and Pay here: ${upiLink}\n(Scan QR in bill to pay)`;

      // Convert base64 data URL to Blob
      const response = await fetch(link.href);
      const blob = await response.blob();
      const file = new File([blob], `Invoice_${order.invoiceNumber}.png`, { type: 'image/png' });

      const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const shareData = {
        files: [file],
        title: `Invoice ${order.invoiceNumber}`,
        text: 'Please paste the payment details below.'
      };

      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.clipboard.writeText(message);
        } catch (clipErr) {
          console.warn("Clipboard write failed:", clipErr);
        }
        btn.innerHTML = originalText;
        lucide.createIcons();
        await navigator.share(shareData);
      } else {
        // Standard Fallback: Copy to clipboard and open whatsapp link (for PC/Laptop)
        btn.innerHTML = originalText;
        lucide.createIcons();
        this.copyToClipboardAndOpenWhatsApp(canvas, mobile, message);
      }
    } catch (err) {
      console.error("html2canvas/share error:", err);
      btn.innerHTML = originalText;
      lucide.createIcons();
      alert("Error generating invoice image. Opening WhatsApp chat with payment link...");

      const upiLink = this.getUpiLink(order, fin.balance);
      const message = `✨ NF PHOTOS GIFTS ✨\nTotal Balance: Rs ${fin.balance.toLocaleString('en-IN')}\nTap and Pay here: ${upiLink}\n(Scan QR in bill to pay)`;
      window.open(this.generateWhatsAppURL(mobile, message), '_blank');
    }
  }

  sendWhatsAppReminder() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;

    const fin = this.calculateOrderFinancials(order);
    const photog = this.photographers.find(p => p.id === order.photographerId);
    const mobile = (photog && photog.mobile) ? photog.mobile : order.clientMobile;

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
    const mobile = (photog && photog.mobile) ? photog.mobile : order.clientMobile;

    if (!mobile) {
      alert("Please configure a mobile number for this photographer or client first.");
      return;
    }

    const isDirect = !photog || !photog.mobile;
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
      this.queueRender();
      if (this.activeOrderId) {
        this.renderOrderDetails(this.activeOrderId);
      }
    }

    this.showToast("Settings saved successfully!");
    this.closeSettingsModal();
  }

  // 17. Google AI Studio (Gemini) auto fill
  toggleHeaderSearch() {
    const overlay = document.getElementById('headerSearchOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      const input = document.getElementById('headerSearchInput');
      if (input) {
        input.focus();
      }
    }
  }

  closeHeaderSearch() {
    const overlay = document.getElementById('headerSearchOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    const input = document.getElementById('headerSearchInput');
    if (input) {
      input.value = '';
    }
    this.handleHeaderSearch('');
  }

  handleHeaderSearch(value) {
    const dashSearch = document.getElementById('dashboardSearch');
    if (dashSearch) {
      dashSearch.value = value;
    }
    this.filterOrders();
  }

  toggleClientMobile(checked) {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order) return;
    order.showClientMobile = checked;
    const container = document.getElementById('client-mobile-container');
    if (container) {
      container.style.display = checked ? 'flex' : 'none';
    }
    this.saveOrderDetails(order);
  }

  openClientWhatsAppChat() {
    const order = this.orders.find(o => o.id === this.activeOrderId);
    if (!order || !order.clientMobile) {
      alert("Please enter a client mobile number first.");
      return;
    }
    const message = `Hello ${order.clientName}, we are sending the album designs for your review. Please check the PDF / designs and let us know if any changes are requested.`;
    window.open(this.generateWhatsAppURL(order.clientMobile, message), '_blank');
  }


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
