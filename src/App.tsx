import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { 
  Home, 
  Scan, 
  Map as MapIcon, 
  User as UserIcon, 
  Award, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  LayoutDashboard,
  Settings,
  Plus,
  BarChart3,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MOCK_USER, MOCK_CAMPAIGNS, MOCK_QUIZZES } from './mockData';
import { User, Campaign, Mission, Quiz, Voucher } from './types';
import confetti from 'canvas-confetti';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function MapResizer() {
  const map = useMap();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Initial resize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // Watch for container resize
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

type View = 'home' | 'scan' | 'map' | 'profile' | 'brand-dashboard' | 'admin-dashboard' | 'leaderboard';

const POINTS_PER_LEVEL = 100;

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [user, setUser] = useState<User>(MOCK_USER);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [activePhotoMission, setActivePhotoMission] = useState<{ campaignId: string, missionId: string } | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ lat: number, lng: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  const [lastMission, setLastMission] = useState<Mission | null>(null);
  const [onMissionCompleteClose, setOnMissionCompleteClose] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (pendingLevelUp && currentView === 'home' && !showMissionComplete) {
      const timer = setTimeout(() => {
        setShowLevelUp(true);
        setPendingLevelUp(false);
      }, 1500); // Delay to allow progress bar animation
      return () => clearTimeout(timer);
    }
  }, [pendingLevelUp, currentView, showMissionComplete]);

  const addPoints = (amount: number) => {
    setUser(prev => {
      const newPoints = prev.points + amount;
      const oldLevel = Math.floor(prev.points / POINTS_PER_LEVEL) + 1;
      const currentLevel = Math.floor(newPoints / POINTS_PER_LEVEL) + 1;
      
      if (currentLevel > oldLevel) {
        setNewLevel(currentLevel);
        setPendingLevelUp(true);
      }
      
      return { ...prev, points: newPoints, level: currentLevel };
    });
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const completeMission = (campaignId: string, missionId: string, onDismiss?: () => void) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return {
          ...c,
          missions: c.missions.map(m => {
            if (m.id === missionId && !m.completed) {
              addPoints(m.points);
              setLastMission(m);
              setOnMissionCompleteClose(() => onDismiss || null);
              setTimeout(() => setShowMissionComplete(true), 300);
              return { ...m, completed: true };
            }
            return m;
          })
        };
      }
      return c;
    }));
  };

  const handleScan = (barcode: string) => {
    const campaign = campaigns.find(c => c.productBarcode === barcode);
    if (campaign) {
      // Create a digital voucher
      const newVoucher: Voucher = {
        id: `v-${Math.random().toString(36).substr(2, 9)}`,
        campaignId: campaign.id,
        code: Math.random().toString(36).toUpperCase().substr(2, 8),
        status: 'unused',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      setUser(prev => ({
        ...prev,
        vouchers: [...prev.vouchers, newVoucher]
      }));

      setActiveCampaign(campaign);
      const scanMission = campaign.missions.find(m => m.type === 'scan');
      if (scanMission) {
        completeMission(campaign.id, scanMission.id, () => {
          setCurrentView('home');
        });
      } else {
        setCurrentView('home');
      }
    } else {
      alert('Produto não reconhecido. Tente escanear um produto EcoRefresh ou FitSnack!');
    }
  };

  return (
    <div className="h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden flex flex-col max-w-md mx-auto shadow-2xl border-x border-gray-200 relative">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Award className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Code Hunters Brasil</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-700 font-bold text-sm">{user.points} pts</span>
          </div>
          <button 
            onClick={() => setCurrentView('admin-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 relative",
        currentView === 'map' || currentView === 'scan' ? "overflow-hidden flex flex-col" : "overflow-y-auto pb-24"
      )}>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-8"
            >
              <section>
                <h1 className="text-3xl font-bold leading-tight">Olá, {user.name.split(' ')[0]}! 👋</h1>
                <p className="text-gray-500 mt-1">
                  Você está no nível {user.level}. Faltam {POINTS_PER_LEVEL - (user.points % POINTS_PER_LEVEL)} pontos para subir!
                </p>
                <div className="w-full bg-gray-200 h-3 rounded-full mt-4 overflow-hidden">
                  <motion.div 
                    className="bg-emerald-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.points % POINTS_PER_LEVEL)}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <h2 className="text-xl font-bold">Meus Vouchers</h2>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {user.vouchers.length} Ativos
                  </span>
                </div>
                {user.vouchers.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                    {user.vouchers.map(v => (
                      <div key={v.id} className="min-w-[140px] bg-white p-4 rounded-2xl border border-dashed border-emerald-200 flex flex-col items-center gap-2 shadow-sm">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                          <Award className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-400">{v.code}</span>
                        <span className="text-[10px] font-bold text-emerald-600">Pronto para usar</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                    <p className="text-sm text-gray-400">Escaneie um produto para ganhar seu primeiro voucher!</p>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <h2 className="text-xl font-bold">Campanhas Ativas</h2>
                  <button className="text-sm font-semibold text-gray-400">Ver tudo</button>
                </div>
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id}>
                      <CampaignCard 
                        campaign={campaign} 
                        onClick={() => setActiveCampaign(campaign)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setCurrentView('scan')}
                  className="bg-black text-white p-6 rounded-3xl flex flex-col gap-4 items-start group"
                >
                  <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <Scan className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Escanear Produto</p>
                    <p className="text-xs text-white/60">Desbloquear missões</p>
                  </div>
                </button>
                <button 
                  onClick={() => setCurrentView('map')}
                  className="bg-emerald-500 text-white p-6 rounded-3xl flex flex-col gap-4 items-start group"
                >
                  <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Explorar Mapa</p>
                    <p className="text-xs text-white/60">Encontrar locais</p>
                  </div>
                </button>
              </section>
            </motion.div>
          )}

          {currentView === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex flex-col max-w-md mx-auto"
            >
              <div className="p-6 flex justify-between items-center text-white">
                <button onClick={() => setCurrentView('home')} className="p-2 bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
                <span className="font-bold">Scanner</span>
                <div className="w-10" />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-64 h-64 border-2 border-emerald-500 rounded-3xl relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
                  <Scan className="w-16 h-16 text-emerald-500 opacity-50" />
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                  />
                </div>
                <p className="text-white mt-8 font-medium">Aponte sua câmera para o código de barras do produto</p>
                <div className="mt-12 grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => handleScan('123456789')}
                    className="bg-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/20"
                  >
                    Simular EcoRefresh
                  </button>
                  <button 
                    onClick={() => handleScan('987654321')}
                    className="bg-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/20"
                  >
                    Simular FitSnack
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="p-4 bg-white border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="font-bold text-lg">Missões Próximas</h2>
                </div>
                {activeRoute && (
                  <button 
                    onClick={() => setActiveRoute(null)}
                    className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100"
                  >
                    Limpar Rota
                  </button>
                )}
              </div>
              <div className="flex-1 bg-gray-100 relative overflow-hidden">
                <MapContainer 
                  center={[-21.2089, -50.4328]} 
                  zoom={15} 
                  className="absolute inset-0 z-0"
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  scrollWheelZoom={true}
                  touchZoom={true}
                  doubleClickZoom={true}
                  zoomAnimation={true}
                  fadeAnimation={true}
                  markerZoomAnimation={true}
                  preferCanvas={true}
                >
                  <MapResizer />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                    minZoom={2}
                    keepBuffer={16}
                    updateWhenIdle={false}
                    updateWhenZooming={false}
                    detectRetina={true}
                    crossOrigin={true}
                    errorTileUrl="https://{s}.tile.openstreetmap.org/0/0/0.png"
                  />
                  
                  {/* User Marker */}
                  <Marker position={[-21.2089, -50.4328]}>
                    <Popup>Você está aqui</Popup>
                  </Marker>

                  {activeRoute && (
                    <Polyline 
                      positions={[
                        [-21.2089, -50.4328],
                        [-21.2100, -50.4335],
                        [-21.2105, -50.4345],
                        [activeRoute.lat, activeRoute.lng]
                      ]}
                      pathOptions={{ color: '#3B82F6', weight: 6, opacity: 0.8, lineJoin: 'round' }}
                    />
                  )}

                  {campaigns.map(c => c.missions.filter(m => m.type === 'geo' && m.location).map(m => (
                    <React.Fragment key={m.id}>
                      <Circle 
                        center={[m.location!.lat, m.location!.lng]} 
                        radius={m.location!.radius}
                        pathOptions={{ color: '#10B981', fillOpacity: 0.2 }}
                      />
                      <Marker 
                        position={[m.location!.lat, m.location!.lng]}
                        eventHandlers={{
                          click: () => setActiveCampaign(c)
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <p className="font-bold">{m.title}</p>
                            <p className="text-xs">{m.points} pts</p>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  )))}
                </MapContainer>
                
                {/* User Location Overlay (Visual only) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
                  <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50" />
                  </div>
                </div>

                {/* Map Controls */}
                <div className="absolute top-20 right-4 z-[400] flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      // We can't easily access map instance here without a ref, 
                      // but for this prototype, we'll just re-trigger the view or use a simple alert
                      // In a real app, we'd use a map ref.
                    }}
                    className="p-3 bg-white rounded-2xl shadow-xl border border-gray-100 active:scale-95 transition-transform"
                  >
                    <MapIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="p-6 bg-white rounded-t-3xl shadow-2xl space-y-4">
                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <MapIcon className="text-white w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Fonte Araçatuba</p>
                    <p className="text-xs text-emerald-700">a 150m • 200 pts</p>
                  </div>
                  <button 
                    onClick={() => {
                      const campaign = campaigns.find(c => c.id === 'eco-refresh');
                      const mission = campaign?.missions.find(m => m.type === 'geo');
                      if (campaign && mission) {
                        completeMission(campaign.id, mission.id, () => {
                          setActiveRoute(null);
                          setCurrentView('home');
                        });
                      }
                    }}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
                  >
                    Ir
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-bold">
                  J
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-gray-500">Membro desde Março de 2024</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total de Pontos</p>
                  <p className="text-2xl font-bold mt-1">{user.points}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Nível</p>
                  <p className="text-2xl font-bold mt-1">{user.level}</p>
                </div>
              </div>

              <section className="space-y-4">
                <h3 className="font-bold text-lg">Conquistas</h3>
                <div className="grid grid-cols-3 gap-4">
                  {user.achievements.map(ach => (
                    <div key={ach.id} className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                      ach.unlockedAt ? "bg-white border-emerald-100" : "bg-gray-50 border-transparent opacity-50"
                    )}>
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        ach.unlockedAt ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-400"
                      )}>
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-center leading-tight">{ach.title}</span>
                    </div>
                  ))}
                </div>
              </section>

              <button 
                onClick={() => setCurrentView('brand-dashboard')}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 text-gray-400" />
                  <span className="font-bold">Portal da Marca</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </motion.div>
          )}

          {currentView === 'brand-dashboard' && (
            <motion.div 
              key="brand"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-8 bg-white min-h-full"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentView('profile')} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
                <h2 className="font-bold text-xl">Portal da Marca</h2>
                <div className="w-10" />
              </div>

              <div className="bg-black text-white p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/60 text-sm">Campanhas Ativas</p>
                    <p className="text-4xl font-bold mt-1">12</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between text-sm">
                  <span>Engajamento Total</span>
                  <span className="text-emerald-400 font-bold">+24% esta semana</span>
                </div>
              </div>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Minhas Campanhas</h3>
                  <button className="p-2 bg-emerald-500 text-white rounded-xl">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {campaigns.filter(c => c.brandName === 'EcoRefresh').map(c => (
                    <div key={c.id} className="p-4 border rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold">{c.title}</p>
                        <p className="text-xs text-gray-400">452 participantes • 89% conclusão</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'admin-dashboard' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-8 bg-white min-h-full"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
                <h2 className="font-bold text-xl">Admin do Sistema</h2>
                <div className="w-10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase">Total de Usuários</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">14.205</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <p className="text-xs text-purple-600 font-bold uppercase">Marcas Ativas</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">84</p>
                </div>
              </div>

              <section className="space-y-4">
                <h3 className="font-bold text-lg">Aprovações Pendentes</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-200 rounded-lg" />
                      <div>
                        <p className="font-bold text-sm">Nova Marca: Sparkle</p>
                        <p className="text-xs text-amber-700">Aguardando verificação</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-amber-800 underline">Revisar</button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
          {currentView === 'leaderboard' && (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-8"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
                <h2 className="font-bold text-xl">Ranking Global</h2>
                <div className="w-10" />
              </div>

              <div className="flex justify-center items-end gap-4 h-48 pb-4 border-b">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-sm" />
                  <div className="w-16 h-20 bg-gray-100 rounded-t-xl flex items-center justify-center font-bold text-gray-400">2º</div>
                  <span className="text-[10px] font-bold">Sarah J.</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold">
                    J
                  </div>
                  <div className="w-20 h-28 bg-emerald-50 rounded-t-xl flex flex-col items-center justify-center font-bold text-emerald-600 border-x border-t border-emerald-100">
                    <Award className="w-6 h-6 text-amber-400 mb-1" />
                    <span>1º</span>
                  </div>
                  <span className="text-[10px] font-bold">Jackson</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-sm" />
                  <div className="w-16 h-16 bg-gray-100 rounded-t-xl flex items-center justify-center font-bold text-gray-400">3º</div>
                  <span className="text-[10px] font-bold">Mike R.</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { rank: 4, name: 'Emma W.', points: 1240 },
                  { rank: 5, name: 'David L.', points: 1150 },
                  { rank: 6, name: 'Chris P.', points: 980 },
                  { rank: 7, name: 'Jackson', points: user.points, isMe: true },
                ].map((entry, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-2xl flex items-center justify-between",
                    entry.isMe ? "bg-emerald-50 border border-emerald-100" : "bg-white border border-gray-100"
                  )}>
                    <div className="flex items-center gap-4">
                      <span className="w-6 text-sm font-bold text-gray-400">#{entry.rank}</span>
                      <div className="w-10 h-10 bg-gray-100 rounded-full" />
                      <span className="font-bold">{entry.name}</span>
                    </div>
                    <span className="font-bold text-emerald-600">{entry.points} pts</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mission Complete Modal */}
      <AnimatePresence>
        {showMissionComplete && lastMission && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-xs text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              
              <h3 className="text-2xl font-bold mb-1">Missão Concluída!</h3>
              <p className="text-gray-500 text-sm mb-4">{lastMission.title}</p>
              
              <div className="bg-emerald-500/10 py-2 px-4 rounded-full inline-flex items-center gap-2 mb-6">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">+{lastMission.points} Pontos</span>
              </div>
              
              <button 
                onClick={() => {
                  setShowMissionComplete(false);
                  if (onMissionCompleteClose) onMissionCompleteClose();
                  setOnMissionCompleteClose(null);
                }}
                className="w-full bg-black text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
              >
                Continuar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 100 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              
              <motion.div 
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Award className="w-12 h-12 text-emerald-600" />
              </motion.div>
              
              <h2 className="text-3xl font-black mb-2">LEVEL UP!</h2>
              <p className="text-gray-500 mb-8">
                Parabéns! Você alcançou o <span className="font-bold text-emerald-600">Nível {newLevel}</span>. 
                Continue completando missões para ganhar mais recompensas!
              </p>
              
              <button 
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
              >
                Incrível!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-4 flex justify-between items-center z-50 max-w-md mx-auto">
        <NavButton active={currentView === 'home'} onClick={() => setCurrentView('home')} icon={<Home />} label="Início" />
        <NavButton active={currentView === 'map'} onClick={() => setCurrentView('map')} icon={<MapIcon />} label="Explorar" />
        <div className="relative -top-8">
          <button 
            onClick={() => setCurrentView('scan')}
            className="w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <Scan className="w-8 h-8" />
          </button>
        </div>
        <NavButton active={currentView === 'profile'} onClick={() => setCurrentView('profile')} icon={<UserIcon />} label="Perfil" />
        <NavButton active={currentView === 'leaderboard'} onClick={() => setCurrentView('leaderboard')} icon={<Award />} label="Ranking" />
      </nav>

      {/* Campaign Modal */}
      <AnimatePresence>
        {activeCampaign && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end max-w-md mx-auto"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full rounded-t-[40px] p-8 space-y-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-emerald-500 font-bold text-sm uppercase tracking-wider">{activeCampaign.brandName}</p>
                  <h2 className="text-2xl font-bold leading-tight">{activeCampaign.title}</h2>
                </div>
                <button onClick={() => setActiveCampaign(null)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-500 leading-relaxed">{activeCampaign.description}</p>

              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 font-bold uppercase">Reward</p>
                  <p className="font-bold text-lg">{activeCampaign.reward.value}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg">Missões</h3>
                <div className="space-y-3">
                  {activeCampaign.missions.map(mission => (
                    <div 
                      key={mission.id} 
                      className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between transition-all",
                        mission.completed ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          mission.completed ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                        )}>
                          {mission.completed ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={cn("font-bold", mission.completed && "text-emerald-900")}>{mission.title}</p>
                          <p className="text-xs text-gray-400">{mission.points} pontos</p>
                        </div>
                      </div>
                      {!mission.completed && (
                        <button 
                          onClick={() => {
                            if (mission.type === 'quiz' && mission.quizId) {
                              setCurrentQuizQuestion(0);
                              setQuizFeedback(null);
                              setActiveQuiz(MOCK_QUIZZES[mission.quizId as keyof typeof MOCK_QUIZZES] as Quiz);
                            } else if (mission.type === 'photo') {
                              setActivePhotoMission({ campaignId: activeCampaign.id, missionId: mission.id });
                            } else if (mission.type === 'geo' && mission.location) {
                              setActiveRoute({ lat: mission.location.lat, lng: mission.location.lng });
                              setCurrentView('map');
                              setActiveCampaign(null);
                            } else {
                              completeMission(activeCampaign.id, mission.id);
                            }
                          }}
                          className="text-sm font-bold text-emerald-600 hover:underline"
                        >
                          Começar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {activeQuiz && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-white flex flex-col max-w-md mx-auto"
          >
            <div className="p-6 flex justify-between items-center border-b">
              <button onClick={() => setActiveQuiz(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
              <span className="font-bold">Quiz da Campanha</span>
              <div className="w-10" />
            </div>
            <div className="flex-1 p-8 space-y-12">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-emerald-600 font-bold text-sm uppercase">
                    Pergunta {currentQuizQuestion + 1} de {activeQuiz.questions.length}
                  </span>
                  <span className="text-gray-400 text-xs">Ganhe {campaigns.find(c => c.id === activeQuiz.campaignId)?.missions.find(m => m.quizId === activeQuiz.id)?.points || 100} pontos</span>
                </div>
                <h3 className="text-2xl font-bold leading-tight">{activeQuiz.questions[currentQuizQuestion].text}</h3>
              </div>

              {quizFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-6 rounded-3xl text-center font-bold text-lg",
                    quizFeedback === 'correct' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  )}
                >
                  {quizFeedback === 'correct' ? "✨ Resposta Correta!" : "❌ Ops! Tente novamente."}
                </motion.div>
              )}

              <div className="space-y-3">
                {activeQuiz.questions[currentQuizQuestion].options.map((option, idx) => (
                  <button 
                    key={idx}
                    disabled={quizFeedback === 'correct'}
                    onClick={() => {
                      if (idx === activeQuiz.questions[currentQuizQuestion].correctAnswer) {
                        setQuizFeedback('correct');
                        
                        setTimeout(() => {
                          if (currentQuizQuestion < activeQuiz.questions.length - 1) {
                            setCurrentQuizQuestion(prev => prev + 1);
                            setQuizFeedback(null);
                          } else {
                            const campaignId = activeQuiz.campaignId;
                            const mission = campaigns.find(c => c.id === campaignId)?.missions.find(m => m.quizId === activeQuiz.id);
                            if (mission) {
                              completeMission(campaignId, mission.id, () => setActiveQuiz(null));
                            } else {
                              setActiveQuiz(null);
                            }
                          }
                        }, 1500);
                      } else {
                        setQuizFeedback('wrong');
                        setTimeout(() => setQuizFeedback(null), 1500);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-6 rounded-3xl border transition-all font-medium",
                      quizFeedback === 'correct' && idx === activeQuiz.questions[currentQuizQuestion].correctAnswer 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                        : "border-gray-200 hover:border-emerald-500 hover:bg-emerald-50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Photo Mission Modal */}
      <AnimatePresence>
        {activePhotoMission && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[400] bg-black flex flex-col max-w-md mx-auto"
          >
            <div className="p-6 flex justify-between items-center text-white">
              <button onClick={() => setActivePhotoMission(null)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
              <span className="font-bold">Missão de Foto</span>
              <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
              <div className="w-full aspect-[3/4] bg-gray-900 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden">
                {isCapturing ? (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <Camera className="w-16 h-16 text-white/40 mb-4" />
                    <p className="text-white/60 text-center px-8">
                      {campaigns.find(c => c.id === activePhotoMission.campaignId)?.missions.find(m => m.id === activePhotoMission.missionId)?.description}
                    </p>
                  </>
                )}
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={() => {
                    setIsCapturing(true);
                    setTimeout(() => {
                      completeMission(activePhotoMission.campaignId, activePhotoMission.missionId, () => {
                        setActivePhotoMission(null);
                      });
                      setIsCapturing(false);
                    }, 2000);
                  }}
                  disabled={isCapturing}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  {isCapturing ? 'Enviando...' : 'Tirar Foto'}
                </button>
                <p className="text-white/40 text-xs text-center">A foto será analisada pela nossa IA para validação.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CampaignCard({ campaign, onClick }: { campaign: any; onClick: () => void }) {
  const completedMissions = campaign.missions.filter(m => m.completed).length;
  const progress = (completedMissions / campaign.missions.length) * 100;

  return (
    <button 
      onClick={onClick}
      className="w-full bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-4 text-left group hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest">{campaign.brandName}</p>
          <h3 className="font-bold text-lg leading-tight group-hover:text-emerald-600 transition-colors">{campaign.title}</h3>
        </div>
        <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
          <span>Progresso</span>
          <span>{completedMissions}/{campaign.missions.length} Missões</span>
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-emerald-500 h-full rounded-full"
          />
        </div>
      </div>
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all",
        active ? "text-black scale-110" : "text-gray-300 hover:text-gray-400"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
