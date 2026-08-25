import React, { useState, useMemo } from 'react';
import {
  Bus,
  Search,
  X,
  Phone,
  MapPin,
  User,
  Navigation,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Filter,
  ArrowRight
} from 'lucide-react';
import { BUS_ROUTES_DATA, BusRoute } from '../data/busRoutesData';
import { soundFx } from './AudioEffects';

interface BusRoutesModalProps {
  onClose: () => void;
}

type FilterCategory = 'ALL' | 'CHENNAI' | 'SOUTH_GST' | 'WEST_THIRUVALLUR' | 'KANCHI_VELLORE';

export const BusRoutesModal: React.FC<BusRoutesModalProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [copiedRouteId, setCopiedRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);

  const filterRoutes = (route: BusRoute, category: FilterCategory): boolean => {
    if (category === 'ALL') return true;
    const name = route.routeName.toUpperCase();
    const no = route.routeNo.toUpperCase();

    if (category === 'CHENNAI') {
      return ['route-6', 'route-7', 'route-7a', 'route-7b'].includes(route.id);
    }
    if (category === 'SOUTH_GST') {
      return ['route-5', 'route-5a', 'route-8', 'route-9'].includes(route.id);
    }
    if (category === 'WEST_THIRUVALLUR') {
      return ['route-3', 'route-4', 'route-4a', 'route-10', 'route-10a'].includes(route.id);
    }
    if (category === 'KANCHI_VELLORE') {
      return ['route-1', 'route-1a', 'route-1b', 'route-1c', 'route-1d', 'route-2', 'route-2a'].includes(route.id);
    }
    return true;
  };

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return BUS_ROUTES_DATA.filter((r) => {
      const matchesCat = filterRoutes(r, activeCategory);
      if (!matchesCat) return false;

      if (!q) return true;

      const inNo = r.routeNo.toLowerCase().includes(q);
      const inName = r.routeName.toLowerCase().includes(q);
      const inPath = r.routePath.toLowerCase().includes(q);
      const inDriver = r.driverName.toLowerCase().includes(q);
      const inPhone = r.driverPhone.includes(q);
      const inVehicle = r.vehicleNumber.toLowerCase().includes(q);
      const inStops = r.stops.some(s => s.toLowerCase().includes(q));

      return inNo || inName || inPath || inDriver || inPhone || inVehicle || inStops;
    });
  }, [searchQuery, activeCategory]);

  const handleCopy = (route: BusRoute) => {
    soundFx.playClick();
    const text = `${route.routeNo} (${route.routeName})\nVehicle: ${route.vehicleNumber}\nPath: ${route.routePath}\nDriver: ${route.driverName} - ${route.driverPhone}`;
    navigator.clipboard.writeText(text);
    setCopiedRouteId(route.id);
    setTimeout(() => setCopiedRouteId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#020d06] border-2 border-emerald-500/80 shadow-[0_0_50px_rgba(0,255,102,0.3)] text-left overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-emerald-900/80 bg-gradient-to-r from-[#03180c] via-[#052613] to-[#03180c] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                <Bus className="w-4 h-4 text-emerald-400" />
                <span>SATHYABAMA TRANSPORT NETWORK • 20 ACTIVE ROUTES</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-mono font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>OFFICIAL COLLEGE BUS SCHEDULE</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-normal">
                  FREE FOR PARTICIPANTS
                </span>
              </h2>
              <p className="text-xs text-emerald-300/90 font-sans">
                Registered students can board any college bus on standard operational routes with driver contacts listed below.
              </p>
            </div>
            
            <button
              id="btn-close-bus-routes"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-700 text-neutral-400 hover:text-white hover:border-emerald-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by area, boarding point, route number, vehicle number, or driver..."
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/80 border border-emerald-800/80 focus:border-emerald-400 text-white placeholder-neutral-500 text-xs font-mono outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-white text-xs font-mono"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveCategory('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === 'ALL'
                    ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                    : 'bg-[#061e0f] text-neutral-300 hover:text-white border border-emerald-950'
                }`}
              >
                <span>ALL ROUTES ({BUS_ROUTES_DATA.length})</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveCategory('CHENNAI');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === 'CHENNAI'
                    ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                    : 'bg-[#061e0f] text-neutral-300 hover:text-white border border-emerald-950'
                }`}
              >
                <span>CHENNAI CITY & NORTH</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveCategory('SOUTH_GST');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === 'SOUTH_GST'
                    ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                    : 'bg-[#061e0f] text-neutral-300 hover:text-white border border-emerald-950'
                }`}
              >
                <span>SOUTH &amp; GST CORRIDOR</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveCategory('WEST_THIRUVALLUR');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === 'WEST_THIRUVALLUR'
                    ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                    : 'bg-[#061e0f] text-neutral-300 hover:text-white border border-emerald-950'
                }`}
              >
                <span>WEST &amp; THIRUVALLUR</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveCategory('KANCHI_VELLORE');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === 'KANCHI_VELLORE'
                    ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                    : 'bg-[#061e0f] text-neutral-300 hover:text-white border border-emerald-950'
                }`}
              >
                <span>KANCHIPURAM &amp; VELLORE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Routes Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Quick Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-[#02180c] border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-300 font-sans">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
              <span>
                <strong>Commute Tip:</strong> Arrive 5–10 minutes early at your boarding stop. Show your digital or printed pass to board.
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold shrink-0">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct Driver Call Enabled</span>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-emerald-950 pb-2">
            <span>SHOWING {filteredRoutes.length} OF {BUS_ROUTES_DATA.length} ROUTES</span>
            {searchQuery && (
              <span className="text-emerald-400">Filter: "{searchQuery}"</span>
            )}
          </div>

          {/* Route Cards Grid */}
          {filteredRoutes.length === 0 ? (
            <div className="py-12 text-center space-y-3 font-mono">
              <Bus className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="text-neutral-300 font-bold">NO BUS ROUTES MATCHED YOUR SEARCH</p>
              <p className="text-xs text-neutral-500">Try searching for common areas like 'Kanchipuram', 'Porur', 'Avadi', 'Tambaram', or clear search filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase hover:bg-emerald-400 transition-colors"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRoutes.map((route) => {
                const isCopied = copiedRouteId === route.id;

                return (
                  <div
                    key={route.id}
                    className="p-4 rounded-2xl bg-[#020b05] border border-emerald-900/80 hover:border-emerald-400/80 hover:shadow-[0_0_20px_rgba(0,255,102,0.2)] transition-all flex flex-col justify-between space-y-3 group"
                  >
                    {/* Card Top: Route No & Name */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono text-xs font-black tracking-wide">
                            {route.routeNo}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            #{route.sNo}
                          </span>
                        </div>

                        {/* Copy details */}
                        <button
                          onClick={() => handleCopy(route)}
                          title="Copy route details"
                          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-neutral-400 hover:text-emerald-300 transition-colors border border-emerald-900"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-neutral-900 border border-neutral-700 text-[10px] font-mono uppercase text-neutral-300">
                        Vehicle: {route.vehicleNumber}
                      </div>

                      <h3 className="text-base font-mono font-black text-amber-300 uppercase tracking-tight mt-2 flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{route.routeName}</span>
                      </h3>

                      {/* Stops list badges */}
                      <div className="mt-3">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1.5">
                          Boarding Points &amp; Path:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {route.stops.map((stop, idx) => {
                            const isCampus = stop.toLowerCase().includes('campus');
                            const isFirst = idx === 0;

                            return (
                              <span
                                key={idx}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                  isCampus
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 font-bold'
                                    : isFirst
                                    ? 'bg-emerald-950 text-emerald-200 border-emerald-700 font-bold'
                                    : 'bg-[#03150a] text-neutral-300 border-emerald-950 hover:border-emerald-800'
                                }`}
                              >
                                {stop}
                                {idx < route.stops.length - 1 && (
                                  <ArrowRight className="w-2.5 h-2.5 text-emerald-600 inline ml-0.5" />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Driver Contact */}
                    <div className="pt-3 border-t border-emerald-950/80 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="font-mono text-xs">
                          <div className="text-neutral-200 font-bold">{route.driverName}</div>
                          <div className="text-[10px] text-emerald-400">{route.driverPhone}</div>
                        </div>
                      </div>

                      <a
                        href={`tel:${route.driverPhone}`}
                        onClick={() => soundFx.playClick()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/60 text-emerald-300 hover:text-black font-mono text-xs font-bold transition-all shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Driver</span>
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer Area */}
        <div className="p-4 sm:p-5 border-t border-emerald-900/80 bg-[#020703] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-neutral-400 text-center sm:text-left">
            <span>Transport Inquiries &amp; Assistance: </span>
            <strong className="text-amber-300">Sathyabama Central Transport Desk</strong>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-emerald-500 text-black font-mono text-xs font-black uppercase hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(0,255,102,0.4)]"
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
};
