import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  getDocs
} from 'firebase/firestore';

// --- React Environment Normalization Patch ---
if (typeof window !== 'undefined' && typeof Symbol !== 'undefined' && Symbol.for) {
  const REACT_ELEMENT_TYPE = Symbol.for('react.element');
  const originalCreateElement = React.createElement;
  React.createElement = function () {
    const el = originalCreateElement.apply(this, arguments);
    if (el && typeof el === 'object' && el.$$typeof !== REACT_ELEMENT_TYPE) {
      el.$$typeof = REACT_ELEMENT_TYPE;
    }
    return el;
  };
}

// --- Safe String Helper ---
const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.$$typeof || val.type || val.props) return ''; 
    if (val.name && typeof val.name === 'string') return val.name;
    if (val.id && typeof val.id === 'string') return val.id;
    if (val.title && typeof val.title === 'string') return val.title;
    if (val.text && typeof val.text === 'string') return val.text;
  }
  return '';
};

// --- Pure Native SVG Icon Components ---
const Icon = ({ name, size = 20, className = "" }) => {
  switch (safeString(name)) {
    case 'users': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 1 0-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'swords': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="4" y1="20" x2="8" y2="16"/><line x1="3" y1="19" x2="5" y2="21"/></svg>;
    case 'wallet': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>;
    case 'settings': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'plus': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'trash': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
    case 'check': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'x': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case 'minus': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'save': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
    case 'check-square': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case 'edit': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case 'download': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
    case 'upload': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
    case 'qrcode': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
    case 'arrow-left': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
    case 'chevron-left': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"/></svg>;
    case 'chevron-right': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>;
    case 'camera': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
    case 'logout': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case 'mail': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
    case 'lock': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'alert': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'info': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
    case 'calendar': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'check-circle': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'circle': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/></svg>;
    case 'eye': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'user-check': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>;
    case 'refresh': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-8.21l-3.25 3.25"/></svg>;
    default: return null;
  }
};

// =========================================================================
// ⚠️ KONFIGURASI FIREBASE PB APASIH ⚠️
// =========================================================================
let firebaseConfig = {
  apiKey: "AIzaSyAMBL9HXEUGVKpEUw9Q95g6IMoDZMHlU6s",
  authDomain: "pb-apasih.firebaseapp.com",
  projectId: "pb-apasih",
  storageBucket: "pb-apasih.firebasestorage.app",
  messagingSenderId: "801177505066",
  appId: "1:801177505066:web:1ac36c0fcece357ea2a253"
};

if (typeof __firebase_config !== 'undefined') {
  firebaseConfig = JSON.parse(__firebase_config);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'pb-apasih-app';

let app, auth, db;
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error("Firebase Init Error:", err);
  }
}

// Helper untuk format rupiah
const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

// Dynamic Script Loader untuk jsPDF & AutoTable
const loadPdfScripts = () => {
  return new Promise((resolve, reject) => {
    const loadScript = (src) => {
      return new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) return res();
        const s = document.createElement('script');
        s.src = src;
        s.onload = res;
        s.onerror = rej;
        document.body.appendChild(s);
      });
    };

    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js')
    ]).then(resolve).catch(reject);
  });
};

// Helper untuk membuat file PDF Rekap Pembayaran Sesi
const generatePDF = async (titleDate, billingData, payments) => {
  try {
    await loadPdfScripts();
    const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDFClass) return;
    const doc = new jsPDFClass();

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`REKAP PEMBAYARAN TANGGAL ${safeString(titleDate).toUpperCase()}`, 14, 18);

    const tableColumn = ["No", "Nama Pemain", "Status", "Jml Bola", "Biaya Bola", "Biaya Visit", "Total Tagihan", "Metode"];
    const tableRows = [];

    (billingData || []).forEach((row, i) => {
      const currentMethod = safeString(payments?.[row.id]) || 'Belum Bayar';
      const rowData = [
        i + 1,
        safeString(row.name),
        row.isVisit ? 'Tamu' : 'Member',
        (row.ballsUsed || 0).toFixed(1),
        `Rp ${(row.ballCost || 0).toLocaleString('id-ID')}`,
        `Rp ${(row.visitCost || 0).toLocaleString('id-ID')}`,
        `Rp ${(row.totalCost || 0).toLocaleString('id-ID')}`,
        safeString(currentMethod)
      ];
      tableRows.push(rowData);
    });

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' },
          7: { halign: 'center' }
        }
      });
    }

    const totalAll = (billingData || []).reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const totalVisit = (billingData || []).reduce((acc, r) => acc + (r.visitCost || 0), 0);
    const totalBall = (billingData || []).reduce((acc, r) => acc + (r.ballCost || 0), 0);

    const totalCash = (billingData || []).filter(r => safeString(payments?.[r.id]) === 'Cash').reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const totalQR = (billingData || []).filter(r => safeString(payments?.[r.id]) === 'QR').reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const totalTrf = (billingData || []).filter(r => safeString(payments?.[r.id]) === 'Trf').reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const totalUnpaid = (billingData || []).filter(r => !payments?.[r.id] || safeString(payments?.[r.id]) === 'Belum Bayar').reduce((acc, r) => acc + (r.totalCost || 0), 0);

    const finalY = (doc.lastAutoTable?.finalY || 100) + 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PENERIMAAN SESI: Rp ${totalAll.toLocaleString('id-ID')}`, 14, finalY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`RINCIAN BIAYA:`, 14, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Visit : Rp ${totalVisit.toLocaleString('id-ID')}`, 18, finalY + 12);
    doc.text(`• Bola  : Rp ${totalBall.toLocaleString('id-ID')}`, 18, finalY + 17);

    doc.setFont('helvetica', 'bold');
    doc.text(`METODE PEMBAYARAN:`, 110, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Cash          : Rp ${totalCash.toLocaleString('id-ID')}`, 114, finalY + 12);
    doc.text(`• QR             : Rp ${totalQR.toLocaleString('id-ID')}`, 114, finalY + 17);
    doc.text(`• Trf            : Rp ${totalTrf.toLocaleString('id-ID')}`, 114, finalY + 22);
    doc.text(`• Belum Bayar : Rp ${totalUnpaid.toLocaleString('id-ID')}`, 114, finalY + 27);

    doc.save(`Rekap_Pembayaran_${safeString(titleDate).replace(/ /g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation failed", err);
  }
};

// Helper untuk membuat file PDF Rekap Kas Bulanan
const generateKasPDF = async (filterMonth, transactions, balance) => {
  try {
    await loadPdfScripts();
    const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDFClass) return;
    const doc = new jsPDFClass();

    const dateObj = new Date(`${filterMonth}-01`);
    const monthTitle = isNaN(dateObj.getTime()) 
      ? filterMonth 
      : dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`REKAP KAS BULAN ${safeString(monthTitle).toUpperCase()}`, 14, 18);

    const tableColumn = ["No", "Tanggal", "Keterangan", "Tipe", "Nominal"];
    const tableRows = [];

    let totalMasuk = 0;
    let totalKeluar = 0;

    (transactions || []).forEach((t, i) => {
      const dateStr = new Date(t.timestamp || Date.now()).toLocaleDateString('id-ID');
      if (t.type === 'masuk') totalMasuk += (t.amount || 0);
      else totalKeluar += (t.amount || 0);

      tableRows.push([
        i + 1,
        dateStr,
        safeString(t.description) || '-',
        t.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        `Rp ${(t.amount || 0).toLocaleString('id-ID')}`
      ]);
    });

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { halign: 'right', fontStyle: 'bold' }
        }
      });
    }

    const finalY = (doc.lastAutoTable?.finalY || 100) + 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PEMASUKAN   : Rp ${totalMasuk.toLocaleString('id-ID')}`, 14, finalY);
    doc.text(`TOTAL PENGELUARAN : Rp ${totalKeluar.toLocaleString('id-ID')}`, 14, finalY + 6);
    doc.text(`SALDO AKHIR BULAN : Rp ${balance.toLocaleString('id-ID')}`, 14, finalY + 12);

    doc.save(`Rekap_Kas_${filterMonth}.pdf`);
    return true;
  } catch (err) {
    console.error("Kas PDF generation failed", err);
  }
};

// --- Komponen UI Reusable ---
const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya", isAlert = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-2">
          <Icon name={isAlert ? 'info' : 'alert'} size={24} className={isAlert ? "text-blue-500" : "text-red-500"} />
          <h3 className="font-bold text-lg text-gray-900">{safeString(title)}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-6 mt-2">{safeString(message)}</p>
        <div className="flex gap-3">
          {!isAlert && (
            <button onClick={onCancel} className="flex-1 p-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              Batal
            </button>
          )}
          <button onClick={onConfirm} className={`flex-1 p-3.5 rounded-xl font-bold text-white transition ${isAlert ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {safeString(confirmText)}
          </button>
        </div>
      </div>
    </div>
  );
};

const FirebaseWarning = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 p-6 md:max-w-md md:mx-auto">
    <div className="bg-red-50 border-2 border-red-500 p-6 rounded-2xl shadow-xl text-center">
      <Icon name="alert" size={48} className="text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-red-700 mb-2">Konfigurasi Firebase Kosong!</h2>
      <p className="text-gray-700 text-sm mb-4">
        Anda belum memasukkan kode Firebase. Aplikasi tidak bisa tersambung ke database.
      </p>
    </div>
  </div>
);

const NavItem = ({ iconType, label, isActive, onClick, widthClass = "w-1/4" }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 ${widthClass} transition-colors duration-200 ${isActive ? 'text-white font-bold' : 'text-blue-300 hover:text-blue-100'}`}
    >
      <div className={`${isActive ? 'scale-110 mb-1 transition-transform' : 'mb-1'}`}>
        <Icon name={safeString(iconType)} size={24} />
      </div>
      <span className="text-[10px] uppercase tracking-wider">{safeString(label)}</span>
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 ${className}`}>
    {children}
  </div>
);

// --- PlayerSelect Component ---
const PlayerSelect = ({ courtId, field, placeholder, c, availablePlayers, updateCourt }) => {
  const selectedInOtherSlots = ['p1', 'p2', 'p3', 'p4']
    .filter(f => f !== field)
    .map(f => safeString(c[f]))
    .filter(Boolean);

  const selectablePlayers = availablePlayers.filter(p => !selectedInOtherSlots.includes(p.id));

  return (
    <select 
      value={safeString(c[field])} 
      onChange={(e) => updateCourt(courtId, field, e.target.value)} 
      className="w-full p-2.5 text-xs border border-gray-300 rounded-lg bg-white mb-2 shadow-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
    >
      <option value="">{placeholder}</option>
      {selectablePlayers.map(p => (
        <option key={p.id} value={p.id}>
          {safeString(p.name)}
        </option>
      ))}
    </select>
  );
};

// --- Custom Calendar Picker Component ---
const CustomCalendarPicker = ({ selectedDate, onChangeDate, activeDates = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const formattedDisplayDate = useMemo(() => {
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return selectedDate;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [selectedDate]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs shadow-sm hover:bg-blue-100 transition"
      >
        <Icon name="calendar" size={14} className="text-blue-600" />
        <span className="font-bold text-blue-900">{formattedDisplayDate}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 w-72 animate-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center mb-3">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
              <Icon name="chevron-left" size={18} />
            </button>
            <span className="font-bold text-sm text-gray-800">
              {monthNames[month]} {year}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
              <Icon name="chevron-right" size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2">
            <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const formattedMonth = String(month + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

              const isSelected = dateStr === selectedDate;
              const hasSession = activeDates.includes(dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    onChangeDate(dateStr);
                    setIsOpen(false);
                  }}
                  className={`h-8 w-8 mx-auto rounded-full flex flex-col items-center justify-center font-medium relative transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-bold shadow-md' 
                      : hasSession 
                        ? 'bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasSession && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-600 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
              <span>Ada Jadwal Main</span>
            </div>
            <button 
              type="button"
              onClick={() => {
                const today = new Date().toLocaleDateString('en-CA');
                onChangeDate(today);
                setIsOpen(false);
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Komponen Login ---
const AuthView = ({ auth, onLoginMember }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Auth Exception:", err);
      const code = err.code || 'unknown';
      if (code === 'auth/invalid-email') {
        setErrorMsg('Format email tidak valid.');
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Email atau password salah.');
      } else {
        setErrorMsg(`Gagal masuk: ${err.message || code}`);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4 md:max-w-md md:mx-auto">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg border-4 border-blue-100">
            PB
          </div>
          <h2 className="text-2xl font-bold text-gray-800">PB APASIH</h2>
          <p className="text-gray-500 text-xs mt-1 font-medium">Badminton Club System</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100 text-center font-medium">
            {safeString(errorMsg)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon name="mail" size={18} className="text-gray-400" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Admin"
              className="w-full pl-12 p-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 text-sm"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon name="lock" size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password Admin"
              className="w-full pl-12 p-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-800 text-white p-3.5 rounded-2xl font-bold hover:bg-blue-900 transition-colors mt-2 shadow-lg disabled:opacity-70 text-sm flex items-center justify-center gap-2"
          >
            <Icon name="user-check" size={18} />
            {isLoading ? 'Memproses...' : 'Login Admin'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400 font-semibold">Atau</span></div>
        </div>

        <button
          type="button"
          onClick={onLoginMember}
          className="w-full bg-emerald-600 text-white p-3.5 rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-md text-sm flex items-center justify-center gap-2"
        >
          <Icon name="eye" size={18} />
          Login Member
        </button>
      </div>
    </div>
  );
};

// --- 1. Member View ---
const MemberView = ({ user, settings, isMember = false }) => {
  const [members, setMembers] = useState([]);
  const [newName, setNewName] = useState('');
  const [newJadwal, setNewJadwal] = useState('Jadwal 1');
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewJadwal, setViewJadwal] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editJadwal, setEditJadwal] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const availableSchedules = Array.from({ length: settings?.jumlahJadwal || 2 }, (_, i) => `Jadwal ${i + 1}`);

  useEffect(() => {
    if (!db) return;
    const membersRef = collection(db, 'artifacts', appId, 'public', 'data', 'members');
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const membersData = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() || {};
        membersData.push({
          id: docSnap.id,
          name: safeString(d.name),
          jadwal: safeString(d.jadwal),
          createdAt: d.createdAt || Date.now()
        });
      });
      membersData.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(membersData);
      setIsLoading(false);
    }, (err) => {
      console.error("Firestore Member Error:", err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addMember = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !db || !user || isMember) return;
    try {
      const membersRef = collection(db, 'artifacts', appId, 'public', 'data', 'members');
      await addDoc(membersRef, { name: newName.trim(), jadwal: newJadwal, createdAt: Date.now() });
      setNewName('');
      setViewJadwal(newJadwal);
    } catch (err) { console.error(err); }
  };

  const saveEdit = async (id) => {
    if (!db || !user || !editName.trim() || isMember) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', id), {
        name: editName.trim(), jadwal: editJadwal
      });
      setEditingId(null);
    } catch (err) { console.error(err); }
  };

  const deleteMember = async () => {
    if (!db || !user || !deleteModal.id || isMember) return;
    try { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', deleteModal.id)); 
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) { console.error(err); }
  };

  const filteredMembers = viewJadwal ? members.filter(m => m.jadwal === viewJadwal) : [];

  if (isLoading) return <div className="text-center p-4">Loading data...</div>;

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
        <Icon name="users" size={20} className="text-blue-600" /> Daftar Member
      </h2>
      
      {!isMember && (
        <Card>
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Tambah Member Baru</h3>
          <form onSubmit={addMember} className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Nama Lengkap" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              required
            />
            <div className="flex gap-2">
              <select 
                value={newJadwal}
                onChange={(e) => setNewJadwal(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                {availableSchedules.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 font-medium px-6 text-sm">
                <Icon name="plus" size={18} /> Tambah
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="bg-gray-50 border-gray-200">
        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Jadwal:</label>
        <select 
          value={viewJadwal}
          onChange={(e) => setViewJadwal(e.target.value)}
          className="w-full p-3 border border-blue-300 rounded-lg bg-white text-blue-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm text-sm"
        >
          <option value="">-- Pilih Jadwal --</option>
          {availableSchedules.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
      </Card>

      {viewJadwal ? (
        <div className="space-y-2 mt-2">
          <p className="text-xs text-gray-500 mb-2 px-1">Total: <strong>{filteredMembers.length}</strong> orang di {viewJadwal}</p>
          {filteredMembers.length === 0 ? (
            <p className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed">Belum ada member.</p>
          ) : (
            filteredMembers.map(member => (
              <div key={member.id} className="p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                {editingId === member.id && !isMember ? (
                  <div className="flex flex-col gap-2">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="p-2 text-sm border rounded" />
                    <select value={editJadwal} onChange={(e) => setEditJadwal(e.target.value)} className="p-2 text-sm border rounded">
                      {availableSchedules.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => saveEdit(member.id)} className="flex-1 bg-green-500 text-white p-2 rounded text-xs font-bold shadow-sm">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded text-xs font-bold shadow-sm">Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{safeString(member.name)}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block bg-blue-50 text-blue-700 font-medium border border-blue-100">
                        {safeString(member.jadwal)}
                      </span>
                    </div>
                    {!isMember && (
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingId(member.id); setEditName(member.name); setEditJadwal(member.jadwal); }} className="text-blue-500 p-2 hover:bg-blue-50 rounded-full">
                          <Icon name="edit" size={16} />
                        </button>
                        <button onClick={() => setDeleteModal({ isOpen: true, id: member.id })} className="text-red-400 p-2 hover:bg-red-50 rounded-full">
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-10 opacity-50">
          <Icon name="users" size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm">Silakan pilih jadwal terlebih dahulu.</p>
        </div>
      )}

      <Modal 
        isOpen={deleteModal.isOpen} 
        title="Hapus Member?" 
        message="Member yang dihapus tidak bisa dikembalikan lagi."
        confirmText="Hapus"
        onConfirm={deleteMember} 
        onCancel={() => setDeleteModal({ isOpen: false, id: null })} 
      />
    </div>
  );
};

// --- 2. Pertandingan (Main) View ---
const PertandinganView = ({ user, settings, isMember = false }) => {
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [subTab, setSubTab] = useState(isMember ? 'rekapan' : 'lapangan');
  const [activeSessionDates, setActiveSessionDates] = useState([]);
  
  const [session, setSession] = useState({
    id: todayStr, 
    date: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    jadwal: 'Jadwal 1',
    numCourts: 1,
    presentMembers: {}, 
    visitors: [],
    payments: {}
  });

  const [courts, setCourts] = useState({});

  // Fetch semua tanggal yang memiliki sesi bermain untuk highlight di Custom Calendar
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), (snapshot) => {
      const dates = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id) dates.push(docSnap.id);
      });
      setActiveSessionDates(dates);
    }, (err) => console.error("Active sessions fetch error:", err));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isMember && !['rekapan', 'bayar'].includes(subTab)) {
      setSubTab('rekapan');
    }
  }, [isMember, subTab]);

  useEffect(() => {
    if (!db) return;
    const sessionDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', selectedDate);
    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      const formattedDateText = new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (docSnap.exists()) {
        const data = docSnap.data() || {};
        setSession({
          id: selectedDate,
          date: safeString(data.date) || formattedDateText,
          jadwal: safeString(data.jadwal) || 'Jadwal 1',
          numCourts: Number(data.numCourts) || 1,
          presentMembers: data.presentMembers && typeof data.presentMembers === 'object' ? data.presentMembers : {},
          visitors: Array.isArray(data.visitors) ? data.visitors : [],
          payments: data.payments && typeof data.payments === 'object' ? data.payments : {}
        });
      } else {
        setSession({
          id: selectedDate,
          date: formattedDateText,
          jadwal: 'Jadwal 1',
          numCourts: 1,
          presentMembers: {},
          visitors: [],
          payments: {}
        });
      }
    }, (err) => console.error("Session Error:", err));
    return () => unsubscribe();
  }, [selectedDate]);

  const updateSessionState = async (newSessionState) => {
    setSession(newSessionState);
    if (!db || !user || isMember) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', newSessionState.id), {
        date: safeString(newSessionState.date),
        jadwal: safeString(newSessionState.jadwal),
        numCourts: Number(newSessionState.numCourts) || 1,
        presentMembers: newSessionState.presentMembers || {},
        visitors: newSessionState.visitors || [],
        payments: newSessionState.payments || {},
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving session to firestore:", err);
    }
  };

  useEffect(() => {
    setCourts(prev => {
      const newCourts = { ...prev };
      for (let i = 1; i <= session.numCourts; i++) {
        if (!newCourts[i]) {
          newCourts[i] = { p1: '', p2: '', p3: '', p4: '', balls: 0 };
        }
      }
      return newCourts;
    });
  }, [session.numCourts]);

  const availableSubTabs = isMember ? ['rekapan', 'bayar'] : ['lapangan', 'pemain', 'pertandingan', 'rekapan', 'bayar'];

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-full">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon name="swords" size={20} className="text-blue-600" /> Sesi Bermain
        </h2>
        {/* Custom Calendar Picker */}
        <CustomCalendarPicker 
          selectedDate={selectedDate} 
          onChangeDate={setSelectedDate} 
          activeDates={activeSessionDates} 
        />
      </div>
      <p className="text-xs text-gray-500 mb-3">{safeString(session.date)}</p>
      
      <div className="flex bg-white rounded-xl p-1 shadow-sm mb-4 border border-gray-200 overflow-x-auto">
        {availableSubTabs.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg capitalize transition-all ${subTab === t ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {!isMember && subTab === 'lapangan' && <MatchSetup session={session} updateSessionState={updateSessionState} onNext={() => setSubTab('pemain')} settings={settings} />}
        {!isMember && subTab === 'pemain' && <MatchAttendance user={user} session={session} updateSessionState={updateSessionState} onNext={() => setSubTab('pertandingan')} />}
        {!isMember && subTab === 'pertandingan' && <MatchPlay user={user} session={session} courts={courts} setCourts={setCourts} />}
        {subTab === 'rekapan' && <MatchRecap user={user} sessionId={session.id} isMember={isMember} />}
        {subTab === 'bayar' && <MatchPayment user={user} session={session} updateSessionState={updateSessionState} settings={settings} isMember={isMember} />}
      </div>
    </div>
  );
};

const MatchSetup = ({ session, updateSessionState, onNext, settings }) => {
  const availableSchedules = Array.from({ length: settings?.jumlahJadwal || 2 }, (_, i) => `Jadwal ${i + 1}`);
  return (
    <Card className="animate-in slide-in-from-left-4 duration-300">
      <h3 className="font-semibold mb-4 text-gray-700 border-b pb-2">Pengaturan Sesi</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tanggal</label>
          <div className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium">
            {safeString(session.date)}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pilih Jadwal</label>
          <select value={session.jadwal} onChange={(e) => updateSessionState({...session, jadwal: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-blue-900">
            {availableSchedules.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jumlah Lapangan</label>
          <select value={session.numCourts} onChange={(e) => updateSessionState({...session, numCourts: parseInt(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-blue-900">
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Lapangan</option>)}
          </select>
        </div>
        <button onClick={onNext} className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold mt-2 shadow-md hover:bg-blue-700">
          Lanjut ke Pemain &rarr;
        </button>
      </div>
    </Card>
  );
};

const MatchAttendance = ({ user, session, updateSessionState, onNext }) => {
  const [members, setMembers] = useState([]);
  const [newVisitor, setNewVisitor] = useState('');

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (snapshot) => {
      const m = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() || {};
        m.push({ id: docSnap.id, name: safeString(data.name), jadwal: safeString(data.jadwal) });
      });
      setMembers(m.filter(x => x.jadwal === session.jadwal).sort((a,b) => a.name.localeCompare(b.name)));
    }, (err) => console.error("Attendance Error:", err));
    return () => unsubscribe();
  }, [session.jadwal]);

  const togglePresence = (id) => {
    const updatedPresent = { ...(session.presentMembers || {}), [id]: !(session.presentMembers || {})[id] };
    updateSessionState({ ...session, presentMembers: updatedPresent });
  };

  const isAllSelected = useMemo(() => {
    if (members.length === 0) return false;
    return members.every(m => (session.presentMembers || {})[m.id]);
  }, [members, session.presentMembers]);

  const toggleSelectAll = () => {
    const updatedPresent = { ...(session.presentMembers || {}) };
    const targetState = !isAllSelected;
    members.forEach(m => {
      updatedPresent[m.id] = targetState;
    });
    updateSessionState({ ...session, presentMembers: updatedPresent });
  };
  
  const addVisitor = (e) => {
    e.preventDefault();
    if (!newVisitor.trim()) return;
    const updatedVisitors = [...(session.visitors || []), { id: `v_${Date.now()}`, name: `${newVisitor.trim()} (Tamu)`, isVisit: true }];
    updateSessionState({ ...session, visitors: updatedVisitors });
    setNewVisitor('');
  };
  
  const removeVisitor = (id) => {
    const updatedVisitors = (session.visitors || []).filter(v => {
      const vId = typeof v === 'object' && v !== null ? safeString(v.id) : safeString(v);
      return vId !== id;
    });
    updateSessionState({ ...session, visitors: updatedVisitors });
  };

  const presentCount = Object.values(session.presentMembers || {}).filter(Boolean).length + (session.visitors || []).length;

  return (
    <div className="animate-in slide-in-from-left-4 duration-300 space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h3 className="font-semibold text-gray-700">Ceklist Member</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isAllSelected 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Icon name={isAllSelected ? 'check-circle' : 'circle'} size={14} />
              {isAllSelected ? 'Batal Semua' : 'Pilih Semua'}
            </button>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">{safeString(session.jadwal)}</span>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1 mb-2">
          {members.length===0 && <p className="text-xs text-gray-500 text-center py-4">Tidak ada member di {safeString(session.jadwal)}.</p>}
          {members.map(m => {
            const isP = Boolean((session.presentMembers || {})[m.id]);
            return (
              <div key={m.id} onClick={() => togglePresence(m.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isP ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isP ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                  {isP && <Icon name="check" size={14} />}
                </div>
                <span className={`text-sm ${isP ? 'font-bold text-blue-900' : 'text-gray-700'}`}>{safeString(m.name)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3 text-gray-700 border-b pb-2">Tambah Tamu (Visit)</h3>
        <form onSubmit={addVisitor} className="flex gap-2 mb-3">
          <input type="text" placeholder="Nama Tamu" value={newVisitor} onChange={(e) => setNewVisitor(e.target.value)} className="flex-1 p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"/>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">Tambah</button>
        </form>
        <div className="space-y-2">
          {(session.visitors || []).map((v, idx) => {
            const vId = typeof v === 'object' && v !== null ? safeString(v.id || `v_${idx}`) : safeString(v || idx);
            const vName = typeof v === 'object' && v !== null ? safeString(v.name || 'Tamu') : safeString(v || 'Tamu');
            return (
              <div key={vId} className="flex justify-between items-center bg-gray-100 p-3 rounded-xl border border-gray-200">
                <span className="text-sm font-medium text-gray-800">{vName}</span>
                <button onClick={() => removeVisitor(vId)} className="text-red-400 p-1"><Icon name="x" size={16} /></button>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="sticky bottom-0 bg-gray-50 pt-2 pb-2 z-10">
        <button onClick={onNext} className="w-full bg-green-600 text-white p-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-green-700 text-sm">
          ({presentCount} Hadir) Lanjut Pertandingan &rarr;
        </button>
      </div>
    </div>
  );
};

const MatchPlay = ({ user, session, courts, setCourts }) => {
  const [members, setMembers] = useState([]);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (snapshot) => {
      const m = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() || {};
        m.push({ id: docSnap.id, name: safeString(data.name) });
      });
      setMembers(m);
    }, (err) => console.error("MatchPlay Member Error:", err));
    return () => unsubscribe();
  }, []);

  const availablePlayers = useMemo(() => {
    const presentMems = members
      .filter(m => m && session.presentMembers && session.presentMembers[m.id])
      .map(m => ({ id: safeString(m.id), name: safeString(m.name) }));
    
    const visitors = (session.visitors || []).map((v, idx) => {
      if (typeof v === 'object' && v !== null) {
        return { id: safeString(v.id || `v_${idx}`), name: safeString(v.name || 'Tamu') };
      }
      return { id: `v_${v}`, name: `${v} (Tamu)` };
    });

    return [...presentMems, ...visitors].sort((a, b) => a.name.localeCompare(b.name));
  }, [members, session.presentMembers, session.visitors]);

  const updateCourt = (courtId, field, value) => setCourts(p => ({ ...p, [courtId]: { ...p[courtId], [field]: value } }));

  const finishMatch = async (courtId) => {
    if (!db || !user) return;
    const c = courts[courtId] || {};
    const players = [c.p1, c.p2, c.p3, c.p4].filter(Boolean);
    if (players.length < 4) {
      setAlertModal({ isOpen: true, message: 'Harap lengkapi ke-4 pemain di lapangan ini sebelum menyimpan pertandingan.' });
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), {
        sessionId: session.id, date: session.date, courtId, jadwal: session.jadwal,
        players: players, 
        playerNames: players.map(pid => safeString(availablePlayers.find(ap => ap.id === pid)?.name) || 'Unknown'),
        balls: Number(c.balls) || 0, timestamp: Date.now()
      });
      ['p1','p2','p3','p4'].forEach(p => updateCourt(courtId, p, ''));
      updateCourt(courtId, 'balls', 0);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      {Array.from({ length: session.numCourts }).map((_, i) => {
        const courtId = i + 1;
        const c = courts[courtId] || { p1: '', p2: '', p3: '', p4: '', balls: 0 };

        return (
          <Card key={courtId} className="border-t-4 border-t-blue-600 shadow-md">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Lapangan {courtId}</h3>
            <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1.5 text-center bg-gray-200 rounded py-0.5">Tim A</span>
                <PlayerSelect courtId={courtId} field="p1" placeholder="Pemain 1" c={c} availablePlayers={availablePlayers} updateCourt={updateCourt} />
                <PlayerSelect courtId={courtId} field="p2" placeholder="Pemain 2" c={c} availablePlayers={availablePlayers} updateCourt={updateCourt} />
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1.5 text-center bg-gray-200 rounded py-0.5">Tim B</span>
                <PlayerSelect courtId={courtId} field="p3" placeholder="Pemain 3" c={c} availablePlayers={availablePlayers} updateCourt={updateCourt} />
                <PlayerSelect courtId={courtId} field="p4" placeholder="Pemain 4" c={c} availablePlayers={availablePlayers} updateCourt={updateCourt} />
              </div>
            </div>

            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100">
              <label className="text-sm font-bold text-blue-900">Bola per Orang:</label>
              <div className="flex items-center gap-3">
                <button onClick={() => updateCourt(courtId, 'balls', Math.max(0, (c.balls || 0) - 1))} className="w-8 h-8 bg-white text-red-500 rounded-full shadow border border-red-100 flex items-center justify-center"><Icon name="minus" size={16} /></button>
                <span className="font-black text-xl w-6 text-center text-blue-900">{c.balls || 0}</span>
                <button onClick={() => updateCourt(courtId, 'balls', (c.balls || 0) + 1)} className="w-8 h-8 bg-blue-600 text-white rounded-full shadow flex items-center justify-center"><Icon name="plus" size={16} /></button>
              </div>
            </div>

            <button onClick={() => finishMatch(courtId)} disabled={![c.p1, c.p2, c.p3, c.p4].every(Boolean)} className="w-full bg-blue-800 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 disabled:opacity-50 text-sm shadow-md">
              <Icon name="check-square" size={18} /> Selesai & Simpan
            </button>
          </Card>
        );
      })}

      <Modal 
        isOpen={alertModal.isOpen} 
        title="Info" 
        message={alertModal.message}
        isAlert={true}
        confirmText="Tutup"
        onConfirm={() => setAlertModal({ isOpen: false, message: '' })} 
      />
    </div>
  );
};

// Rekapan Match dengan Tombol Edit Bola
const MatchRecap = ({ user, sessionId, isMember = false }) => {
  const [matches, setMatches] = useState([]);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editBalls, setEditBalls] = useState(0);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (snapshot) => {
      const m = [];
      snapshot.forEach(docSnap => {
        if (docSnap.data().sessionId === sessionId) {
          const data = docSnap.data() || {};
          const playerNames = Array.isArray(data.playerNames) 
            ? data.playerNames.map(pn => safeString(pn)) 
            : [];
          m.push({ id: docSnap.id, ...data, playerNames });
        }
      });
      setMatches(m.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => console.error("MatchRecap Error:", err));
    return () => unsubscribe();
  }, [sessionId]);

  const saveEditBola = async (matchId) => {
    if (!db || !user || isMember) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), {
        balls: Number(editBalls) || 0
      });
      setEditingMatchId(null);
    } catch (err) {
      console.error("Error updating balls:", err);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-3">
      <div className="flex justify-between items-center bg-gray-800 text-white p-3 rounded-xl shadow">
        <h3 className="font-bold text-sm">Rekapan Sesi</h3>
        <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">{matches.length} Laga</span>
      </div>
      {matches.length === 0 ? (
        <p className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed text-sm">Belum ada laga selesai di sesi ini.</p>
      ) : (
        matches.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-200 border-l-4 border-l-green-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">Jam {new Date(m.timestamp || Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • Lap {m.courtId}</span>
              
              {editingMatchId === m.id && !isMember ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    step="0.5" 
                    value={editBalls} 
                    onChange={(e) => setEditBalls(e.target.value)} 
                    className="w-14 p-1 text-xs border border-blue-400 rounded text-center font-bold"
                  />
                  <button onClick={() => saveEditBola(m.id)} className="bg-green-600 text-white p-1 rounded text-[10px] font-bold">Simpan</button>
                  <button onClick={() => setEditingMatchId(null)} className="bg-gray-200 text-gray-700 p-1 rounded text-[10px] font-bold">Batal</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-1 rounded-full">{m.balls || 0} Bola/org</span>
                  {!isMember && (
                    <button 
                      onClick={() => { setEditingMatchId(m.id); setEditBalls(m.balls || 0); }} 
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                      title="Edit Jumlah Bola"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="font-bold text-gray-600 mb-1 border-b pb-1 text-[10px]">TIM A</p>
                <p className="truncate">{safeString(m.playerNames?.[0])}</p>
                <p className="truncate">{safeString(m.playerNames?.[1])}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="font-bold text-gray-600 mb-1 border-b pb-1 text-[10px]">TIM B</p>
                <p className="truncate">{safeString(m.playerNames?.[2])}</p>
                <p className="truncate">{safeString(m.playerNames?.[3])}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Menu Pembayaran
const MatchPayment = ({ user, session, updateSessionState, settings, isMember = false }) => {
  const [matches, setMatches] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (snapshot) => {
      const m = [];
      snapshot.forEach(docSnap => {
        if (docSnap.data().sessionId === session.id) {
          const data = docSnap.data() || {};
          m.push({ id: docSnap.id, ...data });
        }
      });
      setMatches(m);
    }, (err) => console.error("MatchPayment Error:", err));
    return () => unsubscribe();
  }, [session.id]);

  const billingData = useMemo(() => {
    const stats = {};
    const hargaBola = Number(settings?.hargaBola) || 0;
    const hargaVisit = Number(settings?.hargaVisit) || 0;
    
    (session.visitors || []).forEach((v, idx) => {
      const vId = typeof v === 'object' && v !== null ? safeString(v.id || `v_${idx}`) : safeString(v || idx);
      const vName = typeof v === 'object' && v !== null ? safeString(v.name || 'Tamu') : safeString(v || 'Tamu');
      stats[vId] = { name: vName, isVisit: true, ballsUsed: 0 };
    });

    Object.keys(session.presentMembers || {}).forEach(mid => { 
      if ((session.presentMembers || {})[mid]) stats[mid] = { name: 'Member', isVisit: false, ballsUsed: 0 }; 
    });
    
    matches.forEach(m => {
      const ballsPerPerson = Number(m.balls) || 0;
      (m.players || []).forEach((pid, index) => {
        const pName = safeString(m.playerNames?.[index]) || 'Unknown';
        const isTamu = String(pid).startsWith('v_') || pName.includes('(Tamu)');
        
        if (!stats[pid]) {
          stats[pid] = { name: pName, isVisit: isTamu, ballsUsed: 0 };
        } else if (stats[pid].name === 'Member') {
          stats[pid].name = pName;
        }
        if (isTamu) stats[pid].isVisit = true;
        stats[pid].ballsUsed += ballsPerPerson;
      });
    });
    
    return Object.keys(stats).map(pid => {
      const stat = stats[pid] || {};
      const ballCost = (stat.ballsUsed || 0) * hargaBola;
      const visitCost = stat.isVisit ? hargaVisit : 0;
      const totalCost = ballCost + visitCost;
      
      return { 
        id: safeString(pid), 
        name: safeString(stat.name), 
        ballsUsed: Number(stat.ballsUsed) || 0, 
        isVisit: Boolean(stat.isVisit),
        ballCost,
        visitCost,
        totalCost 
      };
    }).sort((a, b) => a.name.localeCompare(b.name)); // Diurutkan berdasarkan abjad nama pemain (A-Z)
  }, [matches, session.visitors, session.presentMembers, settings]);

  const handlePaymentChange = (personId, method) => {
    if (isMember) return;
    const updatedPayments = { ...(session.payments || {}), [personId]: method };
    updateSessionState({ ...session, payments: updatedPayments });
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    await generatePDF(session.date, billingData, session.payments || {});
    setIsGeneratingPDF(false);
  };

  if (showQR && !isMember) return (
    <div className="absolute inset-0 bg-white z-50 p-4 flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-200">
      <button onClick={() => setShowQR(false)} className="absolute top-4 left-4 flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 transition">
        <Icon name="arrow-left" size={16} /> Tutup
      </button>
      <h2 className="text-xl font-bold mb-6 text-gray-800">Scan QRIS</h2>
      {settings?.qrCodeBase64 ? <img src={settings.qrCodeBase64} alt="QR" className="max-w-[80%] rounded-2xl shadow-2xl border-4 border-blue-500" /> : <p className="text-gray-500">QR Code belum diupload di Pengaturan.</p>}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex gap-2 mb-4">
        {!isMember && (
          <button onClick={() => setShowQR(true)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 shadow text-sm transition">
            <Icon name="qrcode" size={18} /> SCAN QR
          </button>
        )}
        <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className={`flex-1 bg-green-600 text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-700 shadow text-sm transition disabled:opacity-50 ${isMember ? 'w-full' : ''}`}>
          <Icon name="download" size={18} /> {isGeneratingPDF ? 'Mencetak...' : 'UNDUH PDF'}
        </button>
      </div>
      <Card className="p-0 overflow-hidden border-gray-200">
        <div className="bg-gray-800 text-white p-3 text-center text-xs font-bold uppercase tracking-wider">
          REKAP PEMBAYARAN TANGGAL {safeString(session.date).toUpperCase()}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-600 uppercase">
              <tr><th className="p-3">Nama</th><th className="p-3 text-center">Bola</th><th className="p-3 text-right">Total</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {billingData.length===0 && <tr><td colSpan="4" className="text-center p-6 text-gray-500">Belum ada data tagihan di sesi ini.</td></tr>}
              {billingData.map((row) => {
                const currentMethod = safeString((session.payments || {})[row.id]) || 'Belum Bayar';
                const isUnpaid = currentMethod === 'Belum Bayar' || !currentMethod;

                return (
                  <tr key={row.id} className={`border-b transition-colors ${isUnpaid ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-gray-100'}`}>
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{safeString(row.name)}</div>
                      {row.isVisit && (
                        <div className="mt-1 text-[9px] text-orange-600 font-bold bg-orange-50 border border-orange-200 inline-block px-1.5 py-0.5 rounded shadow-sm">
                          +Visit {formatRp(row.visitCost)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-700">{row.ballsUsed.toFixed(1)}</td>
                    <td className="p-3 text-right font-bold text-red-600">{formatRp(row.totalCost)}</td>
                    <td className="p-2">
                      <select 
                        value={currentMethod} 
                        disabled={isMember}
                        onChange={(e) => handlePaymentChange(row.id, e.target.value)} 
                        className={`w-full p-2 border rounded font-semibold text-xs transition-colors ${
                          isUnpaid 
                            ? 'bg-amber-100 text-amber-900 border-amber-300 focus:ring-amber-400' 
                            : 'bg-gray-50 text-gray-800 border-gray-200 focus:ring-blue-500'
                        }`}
                      >
                        <option value="Belum Bayar">Belum Bayar</option>
                        <option value="Cash">Cash</option>
                        <option value="QR">QR</option>
                        <option value="Trf">Trf</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- 3. Kas (Cash Flow) View ---
const KasView = ({ user, isMember = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('masuk');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), (snapshot) => {
      const t = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() || {};
        t.push({
          id: docSnap.id,
          ...data,
          description: safeString(data.description),
          amount: Number(data.amount) || 0,
          type: safeString(data.type) || 'masuk'
        });
      });
      setTransactions(t.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => console.error("Kas Error:", err));
    return () => unsubscribe();
  }, []);

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!desc || !amount || !db || !user || isMember) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
        description: desc, amount: parseInt(amount, 10), type, timestamp: Date.now()
      });
      setDesc(''); setAmount('');
    } catch (err) { console.error(err); }
  };

  const delTransaction = async () => { 
    if(!deleteModal.id || isMember || !db || !user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', deleteModal.id)); 
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) { console.error(err); }
  };

  const filtered = transactions.filter(t => {
    const d = new Date(t.timestamp || Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
  });
  const balance = filtered.reduce((acc, curr) => curr.type === 'masuk' ? acc + (curr.amount || 0) : acc - (curr.amount || 0), 0);

  const handleDownloadKasPDF = async () => {
    setIsGeneratingPDF(true);
    await generateKasPDF(filterMonth, filtered, balance);
    setIsGeneratingPDF(false);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><Icon name="wallet" size={20} className="text-blue-600" /> Buku Kas</h2>
      <div className="flex gap-2 mb-4">
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-xl bg-white shadow-sm text-sm font-bold text-gray-700"/>
        <button onClick={handleDownloadKasPDF} disabled={isGeneratingPDF} className="bg-green-600 text-white px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm font-bold text-xs hover:bg-green-700 transition disabled:opacity-50">
          <Icon name="download" size={16} /> {isGeneratingPDF ? 'Mencetak...' : 'Rekap Kas'}
        </button>
      </div>

      <div className={`rounded-2xl p-6 text-white shadow-lg mb-6 ${balance >= 0 ? 'bg-gradient-to-br from-blue-700 to-blue-900' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
        <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Saldo Kas Bulan Ini</p>
        <h3 className="text-3xl font-black">{formatRp(balance)}</h3>
      </div>

      {!isMember && (
        <Card>
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Catat Transaksi</h3>
          <form onSubmit={addTransaction} className="space-y-3">
            <input type="text" placeholder="Keterangan (ex: Beli Bola)" value={desc} onChange={(e)=>setDesc(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl text-sm" required/>
            <div className="flex gap-2">
              <select value={type} onChange={(e)=>setType(e.target.value)} className="w-1/3 p-3 border border-gray-300 rounded-xl text-sm"><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select>
              <input type="number" placeholder="Nominal Rp" value={amount} onChange={(e)=>setAmount(e.target.value)} className="w-2/3 p-3 border border-gray-300 rounded-xl text-sm" required/>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold flex justify-center gap-2 text-sm hover:bg-blue-700"><Icon name="plus" size={18} /> Simpan Transaksi</button>
          </form>
        </Card>
      )}

      <div className="space-y-2 mt-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Riwayat Transaksi</h3>
        {filtered.length===0 && <p className="text-xs text-center text-gray-500 py-4">Belum ada transaksi di bulan ini.</p>}
        {filtered.map(t => (
          <div key={t.id} className="flex justify-between items-center p-3.5 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${t.type === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'masuk' ? <Icon name="plus" size={16} /> : <Icon name="minus" size={16} />}</div>
              <div><p className="font-bold text-gray-800 text-xs">{safeString(t.description)}</p><p className="text-[10px] text-gray-400 mt-0.5">{new Date(t.timestamp || Date.now()).toLocaleDateString('id-ID')}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-black text-sm ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'masuk' ? '+' : '-'}{formatRp(t.amount)}</span>
              {!isMember && (
                <button onClick={() => setDeleteModal({ isOpen: true, id: t.id })} className="text-gray-300 hover:text-red-500 transition"><Icon name="trash" size={16} /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={deleteModal.isOpen} 
        title="Hapus Transaksi?" 
        message="Riwayat transaksi yang dihapus akan mempengaruhi saldo secara otomatis."
        confirmText="Hapus"
        onConfirm={delTransaction} 
        onCancel={() => setDeleteModal({ isOpen: false, id: null })} 
      />
    </div>
  );
};

// --- 4. Database / Settings View ---
const DatabaseView = ({ user, settings: currentSettings }) => {
  const [localSettings, setLocalSettings] = useState(currentSettings || {
    jumlahJadwal: 2, hargaMember: { "Jadwal 1": 0, "Jadwal 2": 0 }, hargaBola: 0, hargaVisit: 0, qrCodeBase64: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => { if (currentSettings) setLocalSettings(p => ({...p, ...currentSettings})); }, [currentSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSaving(true);
    setSaveMsg('');
    try {
      const dataToSave = {
        jumlahJadwal: Number(localSettings.jumlahJadwal) || 2,
        hargaMember: localSettings.hargaMember || { "Jadwal 1": 0, "Jadwal 2": 0 },
        hargaBola: Number(localSettings.hargaBola) || 0,
        hargaVisit: Number(localSettings.hargaVisit) || 0,
        qrCodeBase64: localSettings.qrCodeBase64 || '',
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), dataToSave);
      setSaveMsg('✅ Pengaturan Berhasil Disimpan!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { 
      console.error("Error saving settings:", err);
      setSaveMsg(`❌ Gagal Menyimpan: ${err.message || 'Periksa koneksi database'}`); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleMigrateData = async () => {
    if (!db || !user) return;
    if (!window.confirm("PENTING: Apakah Anda yakin ingin memulihkan data lama? Proses ini akan menyalin data dari penyimpanan lama ke penyimpanan publik yang baru.")) return;

    setIsSaving(true);
    setSaveMsg('Sedang menarik data lama...');

    try {
      const collectionsToMigrate = ['members', 'sessions', 'matches', 'transactions'];
      let totalMigrated = 0;

      for (const col of collectionsToMigrate) {
        const oldRef = collection(db, 'artifacts', appId, 'users', user.uid, col);
        const newRef = collection(db, 'artifacts', appId, 'public', 'data', col);
        
        const snap = await getDocs(oldRef);
        const promises = [];
        
        snap.forEach(d => {
          promises.push(setDoc(doc(newRef, d.id), d.data(), { merge: true }));
        });
        
        await Promise.all(promises);
        totalMigrated += promises.length;
      }
      
      if (totalMigrated > 0) {
        setSaveMsg('✅ Data lama berhasil dipulihkan!');
      } else {
        setSaveMsg('ℹ️ Tidak ada data lama yang ditemukan.');
      }
      
    } catch (err) {
      console.error("Migration Error:", err);
      setSaveMsg('❌ Gagal menarik data. Periksa koneksi internet.');
    } finally {
      setTimeout(() => setSaveMsg(''), 4000);
      setIsSaving(false);
    }
  };

  const handleJadwal = (e) => {
    const c = parseInt(e.target.value);
    const hm = { ...(localSettings.hargaMember || {}) };
    for (let i = 1; i <= c; i++) if (hm[`Jadwal ${i}`] === undefined) hm[`Jadwal ${i}`] = 0;
    setLocalSettings({...localSettings, jumlahJadwal: c, hargaMember: hm});
  };

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onloadend = () => {
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scaleSize = MAX_WIDTH / (img.width || 400);
        canvas.width = MAX_WIDTH;
        canvas.height = (img.height || 400) * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setLocalSettings(p => ({...p, qrCodeBase64: resizedBase64}));
      };
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10">
      <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><Icon name="settings" size={20} className="text-blue-600" /> Pengaturan</h2>
      
      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Jadwal & Iuran</h3>
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 mb-1">Jml Jadwal Sebulan</label>
            <select value={localSettings.jumlahJadwal} onChange={handleJadwal} className="w-full p-3 border rounded-xl text-sm bg-gray-50">
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Jadwal</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {Array.from({ length: localSettings.jumlahJadwal }).map((_, i) => {
              const jk = `Jadwal ${i + 1}`;
              return (
                <div key={jk} className="flex items-center gap-2">
                  <span className="w-1/3 text-xs font-bold text-gray-600">{jk}</span>
                  <input 
                    type="number" 
                    value={localSettings.hargaMember?.[jk] ?? ''} 
                    onChange={(e) => setLocalSettings(p => ({...p, hargaMember: {...(p.hargaMember || {}), [jk]: Number(e.target.value)}}))} 
                    className="flex-1 p-2.5 border rounded-lg text-sm" 
                    placeholder="Iuran Rp"
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Tarif Main</h3>
          <div className="space-y-3">
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Harga 1 Bola (Rp)</label><input type="number" value={localSettings.hargaBola || ''} onChange={(e) => setLocalSettings({...localSettings, hargaBola: e.target.value})} className="w-full p-3 border rounded-xl text-sm"/></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">Tarif Tamu / Visit (Rp)</label><input type="number" value={localSettings.hargaVisit || ''} onChange={(e) => setLocalSettings({...localSettings, hargaVisit: e.target.value})} className="w-full p-3 border rounded-xl text-sm"/></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2"><Icon name="qrcode" size={16} /> QRIS Pembayaran</h3>
          <div className="flex flex-col items-center gap-3">
            {localSettings.qrCodeBase64 ? (
              <div className="relative"><img src={localSettings.qrCodeBase64} alt="QR" className="w-32 h-32 object-cover rounded-xl border-2" /><button type="button" onClick={() => setLocalSettings({...localSettings, qrCodeBase64: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Icon name="x" size={14} /></button></div>
            ) : (
              <div className="w-full border-2 border-dashed border-gray-300 p-4 rounded-xl flex flex-col items-center text-gray-400 bg-gray-50"><Icon name="camera" size={24} className="mb-1" /><p className="text-xs font-bold">Upload QR</p></div>
            )}
            <div className="w-full relative overflow-hidden"><button type="button" className="w-full bg-gray-800 hover:bg-gray-900 transition text-white p-3 rounded-xl font-bold text-sm flex justify-center gap-2"><Icon name="upload" size={16} /> Pilih Gambar</button><input type="file" accept="image/*" onChange={handleImage} className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"/></div>
          </div>
        </Card>

        <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 flex justify-center gap-2 transition-all sticky bottom-4 z-10">
          <Icon name="save" size={20} /> {isSaving ? 'Menyimpan...' : 'SIMPAN SEMUA'}
        </button>
        {saveMsg && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-bold animate-in slide-in-from-top-4">{safeString(saveMsg)}</div>}
      </form>
      
      <Card className="border-red-200 bg-red-50 mt-8">
        <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2"><Icon name="refresh" size={16} /> Zona Pemulihan Data</h3>
        <p className="text-xs text-red-600 mb-4 leading-relaxed">
          Gunakan tombol ini <strong>HANYA JIKA</strong> Anda ingin mengembalikan semua data lama (Member, Kas, Riwayat Main) yang tidak muncul setelah pembaruan sistem hari ini.
        </p>
        <button 
          type="button" 
          onClick={handleMigrateData} 
          disabled={isSaving} 
          className="w-full bg-red-600 text-white p-3 rounded-xl font-bold text-sm shadow hover:bg-red-700 transition disabled:opacity-50"
        >
          {isSaving ? 'Menarik Data...' : 'TARIK DATA LAMA'}
        </button>
      </Card>
    </div>
  );
};

// Komponen Utama Aplikasi
function MainApp({ user, isMemberMode, onExitMemberMode }) {
  const [activeTab, setActiveTab] = useState('pertandingan');
  const [globalSettings, setGlobalSettings] = useState(null);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    if (!db) return;
    const settingsDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master');
    const unsubscribe = onSnapshot(settingsDoc, (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data());
      } else {
        setGlobalSettings({
          jumlahJadwal: 2,
          hargaMember: { "Jadwal 1": 0, "Jadwal 2": 0 },
          hargaBola: 0,
          hargaVisit: 0,
          qrCodeBase64: ''
        });
      }
    }, (err) => console.error("Settings Error:", err));
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans md:max-w-md md:mx-auto md:shadow-2xl md:border-x relative overflow-hidden">
      <header className="bg-blue-800 text-white p-3 shadow-md sticky top-0 z-10 flex justify-between items-center border-b border-blue-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-800 font-bold shadow-sm flex-shrink-0">
            PB
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white">
               PB APASIH
            </h1>
            <p className="text-xs text-blue-200 font-medium">
              {isMemberMode ? 'Portal Member (View Only)' : 'Manajemen Badminton'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setLogoutModal(true)} 
          className="p-2 hover:bg-blue-700 rounded-full transition-colors" 
          title={isMemberMode ? "Keluar Mode Member" : "Keluar"}
        >
          <Icon name="logout" size={20} className="text-blue-100" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 p-4">
        {!isMemberMode && activeTab === 'member' && <MemberView user={user} settings={globalSettings} isMember={isMemberMode} />}
        {activeTab === 'pertandingan' && <PertandinganView user={user} settings={globalSettings} isMember={isMemberMode} />}
        {activeTab === 'kas' && <KasView user={user} isMember={isMemberMode} />}
        {!isMemberMode && activeTab === 'database' && <DatabaseView user={user} settings={globalSettings} />}
      </main>

      <nav className="fixed bottom-0 w-full md:max-w-md bg-blue-800 border-t border-blue-900 flex justify-around items-center pb-safe pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.2)] z-20">
        {!isMemberMode && <NavItem iconType="users" label="Member" isActive={activeTab === 'member'} onClick={() => setActiveTab('member')} widthClass="w-1/4" />}
        <NavItem iconType="swords" label="Main" isActive={activeTab === 'pertandingan'} onClick={() => setActiveTab('pertandingan')} widthClass={isMemberMode ? "w-1/2" : "w-1/4"} />
        <NavItem iconType="wallet" label="Kas" isActive={activeTab === 'kas'} onClick={() => setActiveTab('kas')} widthClass={isMemberMode ? "w-1/2" : "w-1/4"} />
        {!isMemberMode && <NavItem iconType="settings" label="Setelan" isActive={activeTab === 'database'} onClick={() => setActiveTab('database')} widthClass="w-1/4" />}
      </nav>

      <Modal 
        isOpen={logoutModal} 
        title={isMemberMode ? "Keluar Mode Member?" : "Keluar Aplikasi?"} 
        message={isMemberMode ? "Kembali ke halaman login." : "Anda harus login kembali untuk masuk ke sistem pengurus."}
        confirmText="Ya, Keluar"
        onConfirm={() => { 
          setLogoutModal(false); 
          if (isMemberMode) {
            onExitMemberMode(); 
          } else {
            signOut(auth); 
          }
        }} 
        onCancel={() => setLogoutModal(false)} 
      />
    </div>
  );
}

// Wrapper Utama & Top-Level Export
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMemberMode, setIsMemberMode] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginMember = async () => {
    setIsAuthLoading(true);
    try {
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.warn("Anonymous auth warning:", err);
    }
    setIsMemberMode(true);
    setIsAuthLoading(false);
  };

  if (!isConfigValid) {
    return <FirebaseWarning />;
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse font-medium text-sm">Memuat aplikasi...</p>
      </div>
    );
  }

  if (!user && !isMemberMode) {
    return <AuthView auth={auth} onLoginMember={handleLoginMember} />;
  }

  return (
    <MainApp 
      user={user}
      isMemberMode={isMemberMode} 
      onExitMemberMode={() => setIsMemberMode(false)} 
    />
  );
}