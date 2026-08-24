import { Participant, Registration, SymposiumEvent } from '../types';
import { EVENTS_DATA } from '../data/eventsData';

declare global {
  interface Window {
    google?: any;
  }
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  ownerEmail: string;
  updatedAt: string;
  accessToken?: string;
}

const OAUTH_CLIENT_ID = '563813518939-2c1pgomrtvi0k79vdt1dijsm3jtg2m6b.apps.googleusercontent.com';

// Request OAuth Access Token from Google Identity Services
export const requestSheetsAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK not loaded in browser'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response && response.access_token) {
            resolve(response.access_token);
          } else if (response && (response.error === 'popup_closed_by_user' || response.error === 'access_denied')) {
            reject(new Error('The authorization popup window was closed before completion. Please try again when ready.'));
          } else {
            reject(new Error(response?.error_description || response?.error || 'OAuth token request was cancelled or closed'));
          }
        },
        error_callback: (err: any) => {
          if (err?.message?.includes('closed') || err?.type === 'popup_closed') {
            reject(new Error('The authorization popup window was closed before completion. Please try again when ready.'));
          } else {
            reject(new Error(err?.message || 'OAuth error occurred during authentication'));
          }
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (e: any) {
      reject(e);
    }
  });
};

// Helper: Extract Google Spreadsheet ID from any sheet URL or raw ID
export const extractSpreadsheetId = (input: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9-_]{25,60}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

// Helper: Sanitize Event Title for Google Sheet Tab Name (max 100 chars, no invalid chars like * ? : / \ [ ])
export const getEventSheetTabName = (eventTitle: string): string => {
  if (!eventTitle) return 'Other Events';
  const clean = eventTitle.replace(/[*?:/\\[\]]/g, '').trim();
  return clean.substring(0, 50);
};

// Save a custom/pasted Google Sheet URL to the backend
export const saveManualGoogleSheetUrl = async (
  rawUrlOrId: string,
  ownerEmail: string = 'sarveshv6413@gmail.com'
): Promise<GoogleSheetsConfig> => {
  const spreadsheetId = extractSpreadsheetId(rawUrlOrId);
  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheet URL or ID format. Please paste a link like: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit');
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const configObj: GoogleSheetsConfig = {
    spreadsheetId,
    spreadsheetUrl,
    ownerEmail,
    updatedAt: new Date().toISOString()
  };

  const res = await fetch('/api/admin/google-sheets-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configObj),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to save Google Sheet configuration on server');
  }

  return configObj;
};

// Standard event headers for individual event tabs
export const EVENT_SPECIFIC_HEADERS = [
  'Registered At',
  'Registration ID',
  'Receipt Number',
  'Participant Name',
  'Email Address',
  'Mobile Phone',
  'College / Institution',
  'Department',
  'Year of Study',
  'Age',
  'Team Name',
  'Team Members',
  'Amount Paid (₹)',
  'Payment Gateway',
  'Transaction ID',
  'Payment Status',
  'Attendance Verified',
  'Check-in / Scanned At'
];

export const MASTER_REGISTRATION_HEADERS = [
  'Registered At',
  'Registration ID',
  'Receipt Number',
  'Participant Name',
  'Email Address',
  'Mobile Phone',
  'College / Institution',
  'Department',
  'Year of Study',
  'Age',
  'Event Title',
  'Event Category',
  'Event Day',
  'Event Time & Venue',
  'Team Name / Members',
  'Amount Paid (₹)',
  'Payment Gateway',
  'Transaction ID',
  'Payment Status',
  'Attendance Verified',
  'Check-in Timestamp'
];

export const MASTER_PARTICIPANT_HEADERS = [
  'Last Activity Timestamp',
  'Participant Name',
  'Email Address',
  'Mobile Phone',
  'College / Institution',
  'Department',
  'Year of Study',
  'Age',
  'Paid Events Count',
  'isRegisterd',
  'Account Ownership & Status'
];

/**
 * Generate formatted Count & Revenue Summary Row for an Event-Specific tab
 */
export const generateEventTabSummaryRow = (tabRegs: Registration[], tabTitle: string): any[][] => {
  const count = tabRegs.length;
  const totalRevenue = tabRegs.reduce((acc, r) => acc + (Number(r.amountPaid) || 0), 0);
  const totalAttended = tabRegs.filter(r => r.attended).length;

  return [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [
      `════ [${tabTitle.toUpperCase()}] SUMMARY ════`,
      `TOTAL REGISTRATIONS: ${count}`,
      `TOTAL AMOUNT: ₹${totalRevenue}`,
      `TOTAL ATTENDED: ${totalAttended}`,
      '',
      '',
      '',
      '',
      '',
      '',
      'STATISTICS:',
      `REGISTERED: ${count}`,
      Number(totalRevenue),
      'SUMMARY ROW',
      `STATUS: ${count > 0 ? 'ACTIVE' : 'NO REGISTRATIONS'}`,
      'VERIFIED PASSES',
      `${totalAttended} / ${count}`,
      new Date().toLocaleString()
    ]
  ];
};

/**
 * Generate formatted Master Summary Row for the Master 'Event Registrations' tab
 */
export const generateMasterTabSummaryRow = (allRegs: Registration[]): any[][] => {
  const count = allRegs.length;
  const totalRevenue = allRegs.reduce((acc, r) => acc + (Number(r.amountPaid) || 0), 0);
  const totalAttended = allRegs.filter(r => r.attended).length;

  return [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [
      '════ [IGNITEX 2026] MASTER SUMMARY ════',
      `TOTAL TICKETS ISSUED: ${count}`,
      `GROSS REVENUE: ₹${totalRevenue}`,
      `TOTAL CHECKED-IN: ${totalAttended}`,
      '',
      '',
      '',
      '',
      '',
      '',
      'ALL EVENTS TOTAL',
      'SYMPOSIUM GRAND TOTAL',
      'DAY 1 & 2',
      'ALL VENUES',
      `TOTAL REGISTRATIONS: ${count}`,
      Number(totalRevenue),
      'OFFICIAL PAYMENT AUDIT',
      'SYSTEM RECONCILED',
      `ATTENDANCE: ${totalAttended} / ${count}`,
      `${totalAttended} VERIFIED`,
      new Date().toLocaleString()
    ]
  ];
};

/**
 * Format a Registration into an array of values for the Master Event Registrations sheet
 */
export const formatRegistrationMasterRow = (r: Registration): any[] => [
  r.registeredAt || new Date().toISOString(),
  r.ticketHash,
  r.receiptNumber || `RCPT-${r.id}`,
  r.userName,
  r.userEmail,
  r.userPhone || '',
  r.userCollege || 'Sathyabama Institute of Science and Tech',
  r.department || 'Computer Science & Engineering',
  r.collegeYear || '3rd Year',
  r.userAge || '20',
  r.eventTitle,
  r.eventCategory,
  r.eventDay,
  `${r.eventTime} | ${r.eventVenue}`,
  r.teamName ? `${r.teamName} (${(r.teamMembers || []).join(', ')})` : 'Individual',
  Number(r.amountPaid) || 0,
  r.paymentGateway || 'Stripe',
  r.transactionId,
  r.paymentStatus || 'SUCCESS',
  r.attended ? 'VERIFIED' : 'PENDING',
  r.scannedAt || (r.attended ? 'Checked In' : '-')
];

/**
 * Format a Registration into an array of values for an Event-Specific tab
 */
export const formatRegistrationEventRow = (r: Registration): any[] => [
  r.registeredAt || new Date().toISOString(),
  r.ticketHash,
  r.receiptNumber || `RCPT-${r.id}`,
  r.userName,
  r.userEmail,
  r.userPhone || '',
  r.userCollege || 'Sathyabama Institute of Science and Tech',
  r.department || 'Computer Science & Engineering',
  r.collegeYear || '3rd Year',
  r.userAge || '20',
  r.teamName || 'Individual',
  Array.isArray(r.teamMembers) ? r.teamMembers.join(', ') : r.userName,
  Number(r.amountPaid) || 0,
  r.paymentGateway || 'Stripe',
  r.transactionId,
  r.paymentStatus || 'SUCCESS',
  r.attended ? 'VERIFIED' : 'PENDING',
  r.scannedAt || (r.attended ? 'Checked In' : '-')
];

// Helper: Ensure a sheet/tab exists in a Google Spreadsheet by title
export const ensureSheetTabExists = async (
  accessToken: string,
  spreadsheetId: string,
  tabTitle: string
): Promise<boolean> => {
  try {
    // 1. Get existing sheets
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) return false;
    const meta = await metaRes.json();
    const existingTitles = (meta.sheets || []).map((s: any) => s.properties?.title);

    if (existingTitles.includes(tabTitle)) {
      return true; // Already exists
    }

    // 2. Add sheet
    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: tabTitle,
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            }
          }
        ]
      })
    });

    if (addRes.ok) {
      // Write default header
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabTitle}'!A1:R1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [EVENT_SPECIFIC_HEADERS],
          }),
        }
      );
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`Error ensuring tab '${tabTitle}' exists:`, err);
    return false;
  }
};

/**
 * Create Official Google Spreadsheet in Drive with:
 * 1. "Event Registrations" (Master tab)
 * 2. "Master Participants" (Participant directory with isRegisterd column)
 * 3. Individual Event Tabs for each event in IgniteX '26
 */
export const createOfficialGoogleSheetInDrive = async (
  accessToken: string,
  ownerEmail: string,
  participants: Participant[] = [],
  registrations: Registration[] = []
): Promise<GoogleSheetsConfig> => {
  // 1. Define initial sheets to create
  const eventTabTitles = EVENTS_DATA.map(e => getEventSheetTabName(e.title));
  const uniqueEventTabs = Array.from(new Set(eventTabTitles));

  const allSheets = [
    { properties: { title: 'Event Registrations', gridProperties: { frozenRowCount: 1 } } },
    { properties: { title: 'Master Participants', gridProperties: { frozenRowCount: 1 } } },
    ...uniqueEventTabs.map(title => ({
      properties: { title, gridProperties: { frozenRowCount: 1 } }
    }))
  ];

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'IGNITEX 2026 - Official Event Registrations & Revenue Master',
      },
      sheets: allSheets,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Write Headers for "Event Registrations"
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Event Registrations'!A1:U1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [MASTER_REGISTRATION_HEADERS],
      }),
    }
  );

  // 3. Write Headers for "Master Participants"
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Master Participants'!A1:K1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [MASTER_PARTICIPANT_HEADERS],
      }),
    }
  );

  // 4. Write Headers for each event-specific tab
  for (const tabTitle of uniqueEventTabs) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabTitle}'!A1:R1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [EVENT_SPECIFIC_HEADERS],
          }),
        }
      );
    } catch (e) {
      console.warn(`Header write warning for tab ${tabTitle}:`, e);
    }
  }

  // 5. Set Drive File Permission: Read-Only (Viewer) for anyone with link
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: false,
      }),
    });
  } catch (pErr) {
    console.warn('Drive permission setting notice:', pErr);
  }

  // 6. Append existing registrations to Master and individual Event Tabs with Summary Counts at end
  if (registrations && registrations.length > 0) {
    // Write Master with summary rows at end
    const masterRows = registrations.map(formatRegistrationMasterRow);
    const masterSummary = generateMasterTabSummaryRow(registrations);
    const allMasterValues = [...masterRows, ...masterSummary];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Event Registrations'!A2:U?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: allMasterValues }),
      }
    );

    // Group and write to each Event Tab with count at the end
    for (const tabTitle of uniqueEventTabs) {
      const eventRegs = registrations.filter(r => getEventSheetTabName(r.eventTitle) === tabTitle);
      const eventRows = eventRegs.map(formatRegistrationEventRow);
      const eventSummary = generateEventTabSummaryRow(eventRegs, tabTitle);
      const allEventValues = [...eventRows, ...eventSummary];

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabTitle}'!A2:R?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: allEventValues }),
        }
      );
    }
  } else {
    // Write default empty summary rows for each event tab
    for (const tabTitle of uniqueEventTabs) {
      const emptySummary = generateEventTabSummaryRow([], tabTitle);
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabTitle}'!A2:R?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: emptySummary }),
        }
      );
    }
  }

  // 7. Append existing participants list
  if (participants && participants.length > 0) {
    const partRows = participants.map((p) => [
      p.lastRegisteredAt || new Date().toISOString(),
      p.name,
      p.email,
      p.phone || '',
      p.college || 'Sathyabama Institute of Science and Tech',
      p.department || 'Computer Science & Engineering',
      p.collegeYear || '3rd Year',
      p.age || '20',
      p.totalPaidRegistrations ?? 0,
      (p.totalPaidRegistrations ?? 0) > 0 ? 1 : 0,
      `Locked & Owned by ${ownerEmail || 'sarveshv6413@gmail.com'}`
    ]);

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Master Participants'!A2:K:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: partRows }),
      }
    );
  }

  const configObj: GoogleSheetsConfig = {
    spreadsheetId,
    spreadsheetUrl,
    ownerEmail: ownerEmail || 'sarveshv6413@gmail.com',
    updatedAt: new Date().toISOString(),
    accessToken,
  };

  // 8. Persist to App Server
  try {
    await fetch('/api/admin/google-sheets-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configObj),
    });
  } catch (sErr) {
    console.warn('Config save error:', sErr);
  }

  return configObj;
};

// Sync/Append new single event registration row to Google Sheet (both Master & Event Tab)
export const appendRegistrationRowToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  reg: Registration
) => {
  const masterRow = formatRegistrationMasterRow(reg);
  const eventRow = formatRegistrationEventRow(reg);
  const eventTab = getEventSheetTabName(reg.eventTitle);

  // 1. Append to Master 'Event Registrations'
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Event Registrations'!A2:U:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [masterRow] }),
    }
  );

  // 2. Ensure Event Tab exists and append
  await ensureSheetTabExists(accessToken, spreadsheetId, eventTab);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${eventTab}'!A2:R:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [eventRow] }),
    }
  );
};

// Update Registration Row in Google Sheet (e.g. on attendance scan or payment update)
export const updateRegistrationInGoogleSheetClient = async (
  accessToken: string,
  spreadsheetId: string,
  reg: Registration
) => {
  const eventTab = getEventSheetTabName(reg.eventTitle);

  // Search & update in Event Registrations
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Event Registrations'!A:U`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (res.ok) {
      const data = await res.json();
      const rows = data.values || [];
      const rowIndex = rows.findIndex((r: any[]) => r[1] === reg.ticketHash || r[0] === reg.registeredAt);

      if (rowIndex !== -1) {
        const rowNumber = rowIndex + 1;
        const updatedRow = formatRegistrationMasterRow(reg);
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Event Registrations'!A${rowNumber}:U${rowNumber}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [updatedRow] }),
          }
        );
      }
    }
  } catch (err) {
    console.warn('Master sheet update warning:', err);
  }

  // Search & update in Event-Specific Tab
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${eventTab}'!A:R`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (res.ok) {
      const data = await res.json();
      const rows = data.values || [];
      const rowIndex = rows.findIndex((r: any[]) => r[1] === reg.ticketHash);

      if (rowIndex !== -1) {
        const rowNumber = rowIndex + 1;
        const updatedRow = formatRegistrationEventRow(reg);
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${eventTab}'!A${rowNumber}:R${rowNumber}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [updatedRow] }),
          }
        );
      }
    }
  } catch (err) {
    console.warn(`Event tab '${eventTab}' update warning:`, err);
  }
};
