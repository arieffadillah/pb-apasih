import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  setDoc
} from 'firebase/firestore';
import { 
  Users, 
  Swords, 
  Wallet, 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Minus,
  Save,
  CheckSquare,
  Edit,
  Download,
  Upload,
  QrCode,
  ArrowLeft,
  Camera,
  LogOut,
  Mail,
  Lock,
  AlertTriangle,
  Info
} from 'lucide-react';

// =========================================================================
// ⚠️ MASUKKAN KONFIGURASI FIREBASE ANDA DI SINI ⚠️
// =========================================================================
//let firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "";//
const firebaseConfig = {
  apiKey: "AIzaSyAMBL9HXEUGVKpEUw9Q95g6IMoDZMHlU6s",
  authDomain: "pb-apasih.firebaseapp.com",
  projectId: "pb-apasih",
  storageBucket: "pb-apasih.firebasestorage.app",
  messagingSenderId: "801177505066",
  appId: "1:801177505066:web:1ac36c0fcece357ea2a253"
};

// Mode bypass untuk preview (Mencegah error saat config kosong di environment simulator)
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

// --- Komponen UI Reusable ---
const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya", isAlert = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-2">
          {isAlert ? <Info className="text-blue-500" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-6 mt-2">{message}</p>
        <div className="flex gap-3">
          {!isAlert && (
            <button onClick={onCancel} className="flex-1 p-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              Batal
            </button>
          )}
          <button onClick={onConfirm} className={`flex-1 p-3.5 rounded-xl font-bold text-white transition ${isAlert ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen Peringatan jika Firebase Kosong
const FirebaseWarning = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 p-6 md:max-w-md md:mx-auto">
    <div className="bg-red-50 border-2 border-red-500 p-6 rounded-2xl shadow-xl text-center">
      <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-red-700 mb-2">Konfigurasi Firebase Kosong!</h2>
      <p className="text-gray-700 text-sm mb-4">
        Anda belum memasukkan kode Firebase. Aplikasi tidak bisa tersambung ke database.
      </p>
      <div className="text-left bg-white p-3 rounded text-xs text-gray-600 border border-gray-200">
        Buka file <strong>src/App.jsx</strong>, cari tulisan <br/>
        <code>let firebaseConfig = {'{'} ... {'}'}</code> <br/>
        lalu isi kembali dengan konfigurasi milik Anda.
      </div>
    </div>
  </div>
);

// --- Komponen Login & Register ---
const AuthView = ({ auth }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === 'auth/invalid-email') setErrorMsg('Format email salah.');
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setErrorMsg('Email atau password salah.');
      else if (err.code === 'auth/email-already-in-use') setErrorMsg('Email ini sudah terdaftar.');
      else if (err.code === 'auth/weak-password') setErrorMsg('Password minimal 6 karakter.');
      else setErrorMsg('Terjadi kesalahan sistem. Coba lagi.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4 md:max-w-md md:mx-auto">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
            PB
          </div>
          <h2 className="text-2xl font-bold text-gray-800">PB APASIH</h2>
          <p className="text-gray-500 text-sm mt-1">{isLoginMode ? 'Login Pengurus' : 'Daftar Admin Baru'}</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
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
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-12 p-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-800 text-white p-3.5 rounded-2xl font-bold hover:bg-blue-900 transition-colors mt-2 shadow-lg disabled:opacity-70 text-sm"
          >
            {isLoading ? 'Memproses...' : (isLoginMode ? 'Masuk' : 'Buat Akun')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-500">
            {isLoginMode ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button 
              onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }} 
              className="text-blue-700 font-bold hover:underline"
            >
              {isLoginMode ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Komponen Utama Aplikasi
function MainApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pertandingan');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const settingsDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'master');
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
    });
    return () => unsubscribe();
  }, [user]);

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500 animate-pulse font-medium">Memuat aplikasi...</p></div>;
  }

  if (!user) {
    return <AuthView auth={auth} />;
  }

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
            <p className="text-xs text-blue-200 font-medium">Manajemen Badminton</p>
          </div>
        </div>
        <button onClick={() => setLogoutModal(true)} className="p-2 hover:bg-blue-700 rounded-full transition-colors" title="Keluar">
          <LogOut size={20} className="text-blue-100" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 p-4">
        {activeTab === 'member' && <MemberView user={user} settings={globalSettings} />}
        {activeTab === 'pertandingan' && <PertandinganView user={user} settings={globalSettings} />}
        {activeTab === 'kas' && <KasView user={user} />}
        {activeTab === 'database' && <DatabaseView user={user} settings={globalSettings} />}
      </main>

      <nav className="fixed bottom-0 w-full md:max-w-md bg-blue-800 border-t border-blue-900 flex justify-around items-center pb-safe pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.2)] z-20">
        <NavItem icon={<Users size={24} />} label="Member" isActive={activeTab === 'member'} onClick={() => setActiveTab('member')} />
        <NavItem icon={<Swords size={24} />} label="Main" isActive={activeTab === 'pertandingan'} onClick={() => setActiveTab('pertandingan')} />
        <NavItem icon={<Wallet size={24} />} label="Kas" isActive={activeTab === 'kas'} onClick={() => setActiveTab('kas')} />
        <NavItem icon={<Settings size={24} />} label="Setelan" isActive={activeTab === 'database'} onClick={() => setActiveTab('database')} />
      </nav>

      <Modal 
        isOpen={logoutModal} 
        title="Keluar Aplikasi?" 
        message="Anda harus login kembali untuk masuk ke sistem pengurus."
        confirmText="Ya, Keluar"
        onConfirm={() => { setLogoutModal(false); signOut(auth); }} 
        onCancel={() => setLogoutModal(false)} 
      />
    </div>
  );
}

// Wrapper Utama
export default function App() {
  if (!isConfigValid) {
    return <FirebaseWarning />;
  }
  return <MainApp />;
}

// --- Common Components ---
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 w-1/4 transition-colors duration-200 ${isActive ? 'text-white font-bold' : 'text-blue-300 hover:text-blue-100'}`}
  >
    <div className={`${isActive ? 'scale-110 mb-1 transition-transform' : 'mb-1'}`}>
      {icon}
    </div>
    <span className="text-[10px] uppercase tracking-wider">{label}</span>
  </button>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 ${className}`}>
    {children}
  </div>
);

// --- Helper Functions ---
const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

const downloadCSV = (filename, rows) => {
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- 1. Member View ---
const MemberView = ({ user, settings }) => {
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
    if (!user) return;
    const membersRef = collection(db, 'artifacts', appId, 'users', user.uid, 'members');
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const membersData = [];
      snapshot.forEach((doc) => membersData.push({ id: doc.id, ...doc.data() }));
      membersData.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(membersData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const addMember = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    try {
      const membersRef = collection(db, 'artifacts', appId, 'users', user.uid, 'members');
      await addDoc(membersRef, { name: newName.trim(), jadwal: newJadwal, createdAt: Date.now() });
      setNewName('');
      setViewJadwal(newJadwal);
    } catch (err) { console.error(err); }
  };

  const saveEdit = async (id) => {
    if (!user || !editName.trim()) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'members', id), {
        name: editName.trim(), jadwal: editJadwal
      });
      setEditingId(null);
    } catch (err) { console.error(err); }
  };

  const deleteMember = async () => {
    if (!user || !deleteModal.id) return;
    try { 
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'members', deleteModal.id)); 
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) { console.error(err); }
  };

  const filteredMembers = viewJadwal ? members.filter(m => m.jadwal === viewJadwal) : [];

  if (isLoading) return <div className="text-center p-4">Loading data...</div>;

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
        <Users size={20} className="text-blue-600"/> Daftar Member
      </h2>
      
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
              <Plus size={18} /> Tambah
            </button>
          </div>
        </form>
      </Card>

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
                {editingId === member.id ? (
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
                      <p className="font-semibold text-gray-800 text-sm">{member.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block bg-blue-50 text-blue-700 font-medium border border-blue-100">
                        {member.jadwal}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingId(member.id); setEditName(member.name); setEditJadwal(member.jadwal); }} className="text-blue-500 p-2 hover:bg-blue-50 rounded-full">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteModal({ isOpen: true, id: member.id })} className="text-red-400 p-2 hover:bg-red-50 rounded-full">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-10 opacity-50">
          <Users size={40} className="mx-auto mb-3 text-gray-400" />
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
const PertandinganView = ({ user, settings }) => {
  const [subTab, setSubTab] = useState('lapangan'); 
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  
  // State Sesi & Lapangan diangkat (Hoisted) agar tidak hilang saat ganti Tab
  const [session, setSession] = useState({
    id: todayStr, 
    date: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    jadwal: 'Jadwal 1',
    numCourts: 1,
    presentMembers: {}, 
    visitors: []
  });

  const [courts, setCourts] = useState({});
  
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

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-full">
      <h2 className="text-lg font-bold mb-1 text-gray-800 flex items-center gap-2">
        <Swords size={20} className="text-blue-600"/> Sesi Bermain
      </h2>
      <p className="text-xs text-gray-500 mb-3">{session.date}</p>
      
      <div className="flex bg-white rounded-xl p-1 shadow-sm mb-4 border border-gray-200 overflow-x-auto hide-scrollbar snap-x">
        {['lapangan', 'pemain', 'pertandingan', 'rekapan', 'bayar'].map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 min-w-[75px] snap-start py-2 px-1 text-xs font-semibold rounded-lg capitalize transition-all ${subTab === t ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {subTab === 'lapangan' && <MatchSetup session={session} setSession={setSession} onNext={() => setSubTab('pemain')} settings={settings} />}
        {subTab === 'pemain' && <MatchAttendance user={user} session={session} setSession={setSession} onNext={() => setSubTab('pertandingan')} />}
        {subTab === 'pertandingan' && <MatchPlay user={user} session={session} courts={courts} setCourts={setCourts} />}
        {subTab === 'rekapan' && <MatchRecap user={user} sessionId={session.id} />}
        {subTab === 'bayar' && <MatchPayment user={user} session={session} settings={settings} />}
      </div>
    </div>
  );
};

const MatchSetup = ({ session, setSession, onNext, settings }) => {
  const availableSchedules = Array.from({ length: settings?.jumlahJadwal || 2 }, (_, i) => `Jadwal ${i + 1}`);
  return (
    <Card className="animate-in slide-in-from-left-4 duration-300">
      <h3 className="font-semibold mb-4 text-gray-700 border-b pb-2">Pengaturan Sesi</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tanggal</label>
          <div className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm">
            {session.date}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pilih Jadwal</label>
          <select value={session.jadwal} onChange={(e) => setSession({...session, jadwal: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-sm">
            {availableSchedules.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jumlah Lapangan</label>
          <select value={session.numCourts} onChange={(e) => setSession({...session, numCourts: parseInt(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-sm">
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

const MatchAttendance = ({ user, session, setSession, onNext }) => {
  const [members, setMembers] = useState([]);
  const [newVisitor, setNewVisitor] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'members'), (snapshot) => {
      const m = [];
      snapshot.forEach(doc => m.push({ id: doc.id, ...doc.data() }));
      setMembers(m.filter(x => x.jadwal === session.jadwal).sort((a,b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [user, session.jadwal]);

  const togglePresence = (id) => setSession(p => ({...p, presentMembers: { ...p.presentMembers, [id]: !p.presentMembers[id] }}));
  
  const addVisitor = (e) => {
    e.preventDefault();
    if (!newVisitor.trim()) return;
    // Gunakan ID unik berawalan v_ agar terdeteksi permanen sebagai tamu di perhitungan bayar
    setSession(p => ({ ...p, visitors: [...p.visitors, { id: `v_${Date.now()}`, name: `${newVisitor.trim()} (Tamu)`, isVisit: true }] }));
    setNewVisitor('');
  };
  
  const removeVisitor = (id) => setSession(p => ({ ...p, visitors: p.visitors.filter(v => v.id !== id) }));
  const presentCount = Object.values(session.presentMembers).filter(Boolean).length + session.visitors.length;

  return (
    <div className="animate-in slide-in-from-left-4 duration-300 space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h3 className="font-semibold text-gray-700">Ceklist Member</h3>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">{session.jadwal}</span>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1 mb-2">
          {members.length===0 && <p className="text-xs text-gray-500 text-center py-4">Kosong.</p>}
          {members.map(m => {
            const isP = session.presentMembers[m.id];
            return (
              <div key={m.id} onClick={() => togglePresence(m.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isP ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isP ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                  {isP && <Check size={14} />}
                </div>
                <span className={`text-sm ${isP ? 'font-bold text-blue-900' : 'text-gray-700'}`}>{m.name}</span>
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
          {session.visitors.map(v => (
            <div key={v.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-xl border border-gray-200">
              <span className="text-sm font-medium text-gray-800">{v.name}</span>
              <button onClick={() => removeVisitor(v.id)} className="text-red-400 p-1"><X size={16}/></button>
            </div>
          ))}
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
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'members'), (snapshot) => {
      const m = [];
      snapshot.forEach(doc => m.push({ id: doc.id, name: doc.data().name }));
      setMembers(m);
    });
    return () => unsubscribe();
  }, [user]);

  const availablePlayers = useMemo(() => {
    const presentMems = members.filter(m => session.presentMembers[m.id]).map(m => ({ id: m.id, name: m.name }));
    return [...presentMems, ...session.visitors].sort((a,b) => a.name.localeCompare(b.name));
  }, [members, session.presentMembers, session.visitors]);

  const updateCourt = (courtId, field, value) => setCourts(p => ({ ...p, [courtId]: { ...p[courtId], [field]: value } }));

  const finishMatch = async (courtId) => {
    if (!user) return;
    const c = courts[courtId];
    const players = [c.p1, c.p2, c.p3, c.p4].filter(Boolean);
    if (players.length < 4) {
      setAlertModal({ isOpen: true, message: 'Harap lengkapi ke-4 pemain di lapangan ini sebelum menyimpan pertandingan.' });
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'matches'), {
        sessionId: session.id, date: session.date, courtId, jadwal: session.jadwal,
        players: players, 
        playerNames: players.map(pid => availablePlayers.find(ap => ap.id === pid)?.name || 'Unknown'),
        balls: c.balls, timestamp: Date.now()
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
        
        const PlayerSelect = ({ field, placeholder }) => (
          <select value={c[field]} onChange={(e) => updateCourt(courtId, field, e.target.value)} className="w-full p-2.5 text-xs border border-gray-300 rounded-lg bg-white mb-2 shadow-sm focus:ring-2 focus:ring-blue-500">
            <option value="">{placeholder}</option>
            {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        );

        return (
          <Card key={courtId} className="border-t-4 border-t-blue-600 shadow-md">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Lapangan {courtId}</h3>
            <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1.5 text-center bg-gray-200 rounded py-0.5">Tim A</span>
                <PlayerSelect field="p1" placeholder="Pemain 1" />
                <PlayerSelect field="p2" placeholder="Pemain 2" />
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1.5 text-center bg-gray-200 rounded py-0.5">Tim B</span>
                <PlayerSelect field="p3" placeholder="Pemain 3" />
                <PlayerSelect field="p4" placeholder="Pemain 4" />
              </div>
            </div>

            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100">
              <label className="text-sm font-bold text-blue-900">Bola per Orang:</label>
              <div className="flex items-center gap-3">
                <button onClick={() => updateCourt(courtId, 'balls', Math.max(0, c.balls - 1))} className="w-8 h-8 bg-white text-red-500 rounded-full shadow border border-red-100 flex items-center justify-center"><Minus size={16}/></button>
                <span className="font-black text-xl w-6 text-center text-blue-900">{c.balls}</span>
                <button onClick={() => updateCourt(courtId, 'balls', c.balls + 1)} className="w-8 h-8 bg-blue-600 text-white rounded-full shadow flex items-center justify-center"><Plus size={16}/></button>
              </div>
            </div>

            <button onClick={() => finishMatch(courtId)} disabled={![c.p1, c.p2, c.p3, c.p4].every(Boolean)} className="w-full bg-blue-800 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 disabled:opacity-50 text-sm shadow-md">
              <CheckSquare size={18} /> Selesai & Simpan
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

const MatchRecap = ({ user, sessionId }) => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'matches'), (snapshot) => {
      const m = [];
      snapshot.forEach(doc => { if (doc.data().sessionId === sessionId) m.push({ id: doc.id, ...doc.data() }); });
      setMatches(m.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
  }, [user, sessionId]);

  return (
    <div className="animate-in fade-in duration-300 space-y-3">
      <div className="flex justify-between items-center bg-gray-800 text-white p-3 rounded-xl shadow">
        <h3 className="font-bold text-sm">Rekapan Hari Ini</h3>
        <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">{matches.length} Laga</span>
      </div>
      {matches.length === 0 ? (
        <p className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed text-sm">Belum ada laga selesai.</p>
      ) : (
        matches.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-200 border-l-4 border-l-green-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">Jam {new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • Lap {m.courtId}</span>
              <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-1 rounded-full">{m.balls} Bola/org</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded-lg"><p className="font-bold text-gray-600 mb-1 border-b pb-1 text-[10px]">TIM A</p><p className="truncate">{m.playerNames?.[0]}</p><p className="truncate">{m.playerNames?.[1]}</p></div>
              <div className="bg-gray-50 p-2 rounded-lg"><p className="font-bold text-gray-600 mb-1 border-b pb-1 text-[10px]">TIM B</p><p className="truncate">{m.playerNames?.[2]}</p><p className="truncate">{m.playerNames?.[3]}</p></div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const MatchPayment = ({ user, session, settings }) => {
  const [matches, setMatches] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [payments, setPayments] = useState({});

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'matches'), (snapshot) => {
      const m = [];
      snapshot.forEach(doc => { if (doc.data().sessionId === session.id) m.push({ id: doc.id, ...doc.data() }); });
      setMatches(m);
    });
    return () => unsubscribe();
  }, [user, session.id]);

  const billingData = useMemo(() => {
    const stats = {};
    const hargaBola = Number(settings?.hargaBola) || 0;
    const hargaVisit = Number(settings?.hargaVisit) || 0;
    
    session.visitors.forEach(v => { stats[v.id] = { name: v.name, isVisit: true, ballsUsed: 0 }; });
    Object.keys(session.presentMembers).forEach(mid => { if (session.presentMembers[mid]) stats[mid] = { name: 'Member', isVisit: false, ballsUsed: 0 }; });
    
    matches.forEach(m => {
      const ballsPerPerson = Number(m.balls) || 0;
      (m.players || []).forEach((pid, index) => {
        const pName = m.playerNames?.[index] || 'Unknown';
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
      const stat = stats[pid];
      const ballCost = stat.ballsUsed * hargaBola;
      const visitCost = stat.isVisit ? hargaVisit : 0;
      const totalCost = ballCost + visitCost;
      
      return { 
        id: pid, 
        name: stat.name, 
        ballsUsed: stat.ballsUsed, 
        isVisit: stat.isVisit,
        ballCost,
        visitCost,
        totalCost 
      };
    }).sort((a,b) => b.totalCost - a.totalCost);
  }, [matches, session.visitors, session.presentMembers, settings]);

  const handleDownload = () => {
    const rows = [["No", "Nama", "Status", "Jml Bola", "Harga Bola (Rp)", "Biaya Visit (Rp)", "Total Tagihan (Rp)", "Metode"]];
    billingData.forEach((r, i) => rows.push([
      i+1, 
      r.name, 
      r.isVisit ? 'Tamu' : 'Member',
      r.ballsUsed.toFixed(1),
      r.ballCost,
      r.visitCost,
      r.totalCost, 
      payments[r.id]||'-'
    ]));
    downloadCSV(`Tagihan_${session.date}.csv`, rows);
  };

  if (showQR) return (
    <div className="absolute inset-0 bg-white z-50 p-4 flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-200">
      <button onClick={() => setShowQR(false)} className="absolute top-4 left-4 flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 transition">
        <ArrowLeft size={16} /> Tutup
      </button>
      <h2 className="text-xl font-bold mb-6 text-gray-800">Scan QRIS</h2>
      {settings?.qrCodeBase64 ? <img src={settings.qrCodeBase64} alt="QR" className="max-w-[80%] rounded-2xl shadow-2xl border-4 border-blue-500" /> : <p className="text-gray-500">QR Code belum diupload di Pengaturan.</p>}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowQR(true)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-700 shadow text-sm transition"><QrCode size={18} /> SCAN QR</button>
        <button onClick={handleDownload} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-green-700 shadow text-sm transition"><Download size={18} /> UNDUH</button>
      </div>
      <Card className="p-0 overflow-hidden border-gray-200">
        <div className="bg-gray-800 text-white p-3 text-center text-xs font-bold">TAGIHAN SESI INI</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-600 uppercase">
              <tr><th className="p-3">Nama</th><th className="p-3 text-center">Bola</th><th className="p-3 text-right">Total</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {billingData.length===0 && <tr><td colSpan="4" className="text-center p-6 text-gray-500">Kosong.</td></tr>}
              {billingData.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="p-3">
                    <div className="font-semibold text-gray-800">{row.name}</div>
                    {row.isVisit && (
                      <div className="mt-1 text-[9px] text-orange-600 font-bold bg-orange-50 border border-orange-200 inline-block px-1.5 py-0.5 rounded shadow-sm">
                        +Visit {formatRp(row.visitCost)}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono text-gray-700">{row.ballsUsed.toFixed(1)}</td>
                  <td className="p-3 text-right font-bold text-red-600">{formatRp(row.totalCost)}</td>
                  <td className="p-2">
                    <select value={payments[row.id] || ''} onChange={(e) => setPayments(p => ({...p, [row.id]: e.target.value}))} className="w-full p-2 bg-gray-50 border border-gray-200 rounded">
                      <option value="">--</option><option value="Cash">Cash</option><option value="QR">QR</option><option value="Trf">Trf</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};


// --- 3. Kas (Cash Flow) View ---
const KasView = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('masuk');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), (snapshot) => {
      const t = [];
      snapshot.forEach(doc => t.push({ id: doc.id, ...doc.data() }));
      setTransactions(t.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!desc || !amount || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
        description: desc, amount: parseInt(amount, 10), type, timestamp: Date.now()
      });
      setDesc(''); setAmount('');
    } catch (err) { console.error(err); }
  };

  const delTransaction = async () => { 
    if(!deleteModal.id) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', deleteModal.id)); 
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) { console.error(err); }
  };

  const handleDownloadKas = () => {
    const rows = [["Tanggal", "Keterangan", "Tipe", "Nominal (Rp)"]];
    filtered.forEach((t) => rows.push([
      new Date(t.timestamp).toLocaleDateString('id-ID'),
      t.description,
      t.type,
      t.amount
    ]));
    downloadCSV(`Laporan_Kas_${filterMonth}.csv`, rows);
  }

  const filtered = transactions.filter(t => {
    const d = new Date(t.timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
  });
  const balance = filtered.reduce((acc, curr) => curr.type === 'masuk' ? acc + curr.amount : acc - curr.amount, 0);

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><Wallet size={20} className="text-blue-600"/> Buku Kas</h2>
      <div className="flex gap-2 mb-4">
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-xl bg-white shadow-sm text-sm font-bold"/>
        <button onClick={handleDownloadKas} className="bg-gray-800 text-white px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm font-bold text-sm hover:bg-gray-900"><Download size={18} /></button>
      </div>

      <div className={`rounded-2xl p-6 text-white shadow-lg mb-6 ${balance >= 0 ? 'bg-gradient-to-br from-blue-700 to-blue-900' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
        <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Saldo Kas Bulan Ini</p>
        <h3 className="text-3xl font-black">{formatRp(balance)}</h3>
      </div>

      <Card>
        <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Catat Transaksi</h3>
        <form onSubmit={addTransaction} className="space-y-3">
          <input type="text" placeholder="Keterangan (ex: Beli Bola)" value={desc} onChange={(e)=>setDesc(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl text-sm" required/>
          <div className="flex gap-2">
            <select value={type} onChange={(e)=>setType(e.target.value)} className="w-1/3 p-3 border border-gray-300 rounded-xl text-sm"><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select>
            <input type="number" placeholder="Nominal Rp" value={amount} onChange={(e)=>setAmount(e.target.value)} className="w-2/3 p-3 border border-gray-300 rounded-xl text-sm" required/>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold flex justify-center gap-2 text-sm hover:bg-blue-700"><Plus size={18} /> Simpan Transaksi</button>
        </form>
      </Card>

      <div className="space-y-2 mt-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Riwayat Transaksi</h3>
        {filtered.length===0 && <p className="text-xs text-center text-gray-500 py-4">Belum ada transaksi di bulan ini.</p>}
        {filtered.map(t => (
          <div key={t.id} className="flex justify-between items-center p-3.5 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${t.type === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'masuk' ? <Plus size={16}/> : <Minus size={16}/>}</div>
              <div><p className="font-bold text-gray-800 text-xs">{t.description}</p><p className="text-[10px] text-gray-400 mt-0.5">{new Date(t.timestamp).toLocaleDateString('id-ID')}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-black text-sm ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'masuk' ? '+' : '-'}{formatRp(t.amount)}</span>
              <button onClick={() => setDeleteModal({ isOpen: true, id: t.id })} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
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
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'master'), {
        ...localSettings, jumlahJadwal: Number(localSettings.jumlahJadwal), hargaBola: Number(localSettings.hargaBola), hargaVisit: Number(localSettings.hargaVisit), updatedAt: Date.now()
      });
      setSaveMsg('Pengaturan Tersimpan!'); setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) { setSaveMsg('Gagal Menyimpan!'); }
    setIsSaving(false);
  };

  const handleJadwal = (e) => {
    const c = parseInt(e.target.value);
    const hm = { ...localSettings.hargaMember };
    for (let i = 1; i <= c; i++) if (hm[`Jadwal ${i}`] === undefined) hm[`Jadwal ${i}`] = 0;
    setLocalSettings({...localSettings, jumlahJadwal: c, hargaMember: hm});
  };

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => setLocalSettings(p => ({...p, qrCodeBase64: r.result}));
    r.readAsDataURL(f);
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10">
      <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><Settings size={20} className="text-blue-600"/> Pengaturan</h2>
      
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
                  <input type="number" value={localSettings.hargaMember[jk] || ''} onChange={(e) => setLocalSettings(p => ({...p, hargaMember: {...p.hargaMember, [jk]: Number(e.target.value)}}))} className="flex-1 p-2.5 border rounded-lg text-sm" placeholder="Iuran Rp"/>
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
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2"><QrCode size={16} /> QRIS Pembayaran</h3>
          <div className="flex flex-col items-center gap-3">
            {localSettings.qrCodeBase64 ? (
              <div className="relative"><img src={localSettings.qrCodeBase64} alt="QR" className="w-32 h-32 object-cover rounded-xl border-2" /><button type="button" onClick={() => setLocalSettings({...localSettings, qrCodeBase64: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14} /></button></div>
            ) : (
              <div className="w-full border-2 border-dashed border-gray-300 p-4 rounded-xl flex flex-col items-center text-gray-400 bg-gray-50"><Camera size={24} className="mb-1" /><p className="text-xs font-bold">Upload QR</p></div>
            )}
            <div className="w-full relative overflow-hidden"><button type="button" className="w-full bg-gray-800 hover:bg-gray-900 transition text-white p-3 rounded-xl font-bold text-sm flex justify-center gap-2"><Upload size={16} /> Pilih Gambar</button><input type="file" accept="image/*" onChange={handleImage} className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"/></div>
          </div>
        </Card>

        <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 flex justify-center gap-2 transition-all sticky bottom-4 z-10">
          <Save size={20} /> {isSaving ? 'Menyimpan...' : 'SIMPAN SEMUA'}
        </button>
        {saveMsg && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-bold animate-in slide-in-from-top-4">{saveMsg}</div>}
      </form>
    </div>
  );
};