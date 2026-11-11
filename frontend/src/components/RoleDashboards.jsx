import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from "recharts";
import { jsPDF } from "jspdf";
import {
  Truck,
  Users,
  Compass,
  DollarSign,
  Wrench,
  BarChart3,
  ShieldAlert,
  Sliders,
  Search,
  CheckCircle,
  FileText,
  AlertTriangle,
  Plus,
  Calendar,
  FileCheck,
  Download,
  Play,
  ArrowUpDown,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const Card = ({ title, value, desc, icon: Icon, color = "text-brand" }) => (
  <div className="bg-dark-surface border border-dark-border p-5 rounded shadow hover:border-brand/40 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider">
          {title}
        </p>
        <h4 className="text-2xl font-bold mt-1.5 font-mono tracking-tight text-white">
          {value}
        </h4>
      </div>
      <div className={`p-2.5 bg-dark-surface rounded ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {desc && <p className="text-xs text-gray-400 mt-3">{desc}</p>}
  </div>
);

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const SortableHeader = ({ label, sortKey, sortConfig, onSort, className = "" }) => (
  <th
    className={`py-2.5 cursor-pointer select-none hover:text-white transition-colors group ${className}`}
    onClick={() => onSort(sortKey)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      <span className="text-[8px] text-theme-muted group-hover:text-brand transition-colors">
        {sortConfig.key === sortKey ? (sortConfig.dir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </span>
  </th>
);
export const DispatcherDashboard = () => {
  const [search, setSearch] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
    }));
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const token = useAuthStore.getState().token;
      const response = await axios.get("http://localhost:5000/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
    refetchInterval: 10000 // Keep operational stats live
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-theme-muted font-mono">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>CONNECTING DEPOT FEED...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-500/30 p-4 sm:p-6 rounded text-center text-red-400 font-mono">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <h4 className="font-bold">FEED ERROR</h4>
        <p className="text-xs mt-1">Failed to establish active websocket/data connection to database.</p>
      </div>
    );
  }

  const { metrics, vehicleStatus, recentTrips } = data;

  // Filter logic
  const filteredTrips = recentTrips.filter(trip => {
    const matchesSearch = 
      trip.tripId.toLowerCase().includes(search.toLowerCase()) ||
      trip.source.toLowerCase().includes(search.toLowerCase()) ||
      trip.destination.toLowerCase().includes(search.toLowerCase()) ||
      trip.driver.toLowerCase().includes(search.toLowerCase()) ||
      trip.vehicle.toLowerCase().includes(search.toLowerCase());

    const matchesType = vehicleTypeFilter === "All" || trip.vehicleType === vehicleTypeFilter;
    const matchesStatus = statusFilter === "All" || trip.status === statusFilter;
    const matchesSource = sourceFilter === "All" || trip.source === sourceFilter;

    return matchesSearch && matchesType && matchesStatus && matchesSource;
  });

  // Calculate percentages for vehicle status progress bars
  const totalVehicles = (vehicleStatus.available || 0) + (vehicleStatus.onTrip || 0) + (vehicleStatus.inShop || 0) + (vehicleStatus.retired || 0);
  const getPct = (val) => totalVehicles > 0 ? Math.round((val / totalVehicles) * 100) : 0;

  // Unique sources for the dropdown filter
  const uniqueSources = [...new Set(recentTrips.map(t => t.source))];

  return (
    <div className="space-y-6 text-theme-text transition-colors duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text tracking-tight uppercase">
            Dispatch Operations Centre
          </h2>
          <p className="text-sm text-theme-muted mt-1">
            Real-time database feed of active dispatches, driver rosters, and fleet metrics.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-theme-muted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search dispatches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
          />
        </div>
      </div>

      {/* METRIC GRID (7 Cards Side by Side, responsive wrapping) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow flex flex-col justify-between border-l-2 border-l-blue-500 hover:border-brand/40 transition-colors">
          <div>
            <span className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider block">Active Vehicles</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{String(metrics.activeVehicles).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-theme-muted mt-2 block leading-none">In transit en route</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow flex flex-col justify-between border-l-2 border-l-green-500 hover:border-brand/40 transition-colors">
          <div>
            <span className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider block">Available</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{String(metrics.availableVehicles).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-theme-muted mt-2 block leading-none">In depot ready</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow flex flex-col justify-between border-l-2 border-l-amber-500 hover:border-brand/40 transition-colors">
          <div>
            <span className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider block">In Shop</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{String(metrics.vehiclesInMaintenance).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-theme-muted mt-2 block leading-none">Maintenance status</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow flex flex-col justify-between border-l-2 border-l-indigo-500 hover:border-brand/40 transition-colors">
          <div>
            <span className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider block">Active Trips</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{String(metrics.activeTrips).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-theme-muted mt-2 block leading-none">Dispatched trips</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow flex flex-col justify-between border-l-2 border-l-sky-400 hover:border-brand/40 transition-colors">
          <div>
            <span className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider block">Pending Trips</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{String(metrics.pendingTrips).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-theme-muted mt-2 block leading-none">Draft queues</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow flex flex-col justify-between border-l-2 border-l-gray-500 hover:border-brand/40 transition-colors">
          <div>
            <span className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider block">Drivers Duty</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{String(metrics.driversOnDuty).padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-theme-muted mt-2 block leading-none">On-road drivers</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow flex flex-col justify-between border-l-2 border-l-brand hover:border-brand/40 transition-colors">
          <div>
            <span className="text-xs text-theme-muted font-sans font-semibold uppercase tracking-wider block">Utilization</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{metrics.fleetUtilization}%</span>
          </div>
          <span className="text-xs text-theme-muted mt-2 block leading-none">Operational ratio</span>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-theme-panel border border-dark-border p-4 rounded shadow space-y-3">
        <span className="text-[10px] text-theme-muted font-mono font-bold uppercase tracking-widest block">Operations Filters</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] text-theme-muted font-mono uppercase mb-1 font-bold">Vehicle Type</label>
            <select 
              value={vehicleTypeFilter} 
              onChange={(e) => setVehicleTypeFilter(e.target.value)} 
              className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Mini">Mini</option>
              <option value="Container">Container</option>
              <option value="Flatbed">Flatbed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] text-theme-muted font-mono uppercase mb-1 font-bold">Trip Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-theme-muted font-mono uppercase mb-1 font-bold">Source Region</label>
            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value)} 
              className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
            >
              <option value="All">All Regions</option>
              {uniqueSources.map((source, idx) => (
                <option key={idx} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MAIN DATA SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT TRIPS TABLE (2/3 width) */}
        <div className="lg:col-span-2 bg-theme-panel border border-dark-border rounded p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-theme-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" /> Recent Trips Log
            </h3>
            <span className="text-[10px] text-theme-muted font-mono">Showing {filteredTrips.length} dispatches</span>
          </div>

          <div className="overflow-x-auto">
            {filteredTrips.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-dark-border pb-3 text-theme-muted text-[10px] uppercase">
                    <SortableHeader label="Trip ID" sortKey="tripId" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Vehicle" sortKey="vehicle" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Driver" sortKey="driver" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Route Map" sortKey="source" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                    <th className="text-right">ETA / Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-theme-text">
                  {[...filteredTrips].sort((a, b) => {
                    if (!sortConfig.key) return 0;
                    let aVal = a[sortConfig.key];
                    let bVal = b[sortConfig.key];
                    if (typeof aVal === "string") aVal = aVal.toLowerCase();
                    if (typeof bVal === "string") bVal = bVal.toLowerCase();
                    if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
                    if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
                    return 0;
                  }).map((trip) => (
                    <tr key={trip.id} className="hover:bg-dark-hoverBg/25 transition-colors">
                      <td className="py-3 text-brand font-bold">{trip.tripId}</td>
                      <td>
                        <span className="font-semibold block">{trip.vehicle}</span>
                        <span className="text-[10px] text-theme-muted font-sans block">{trip.vehicleName}</span>
                      </td>
                      <td className="font-semibold">{trip.driver}</td>
                      <td>
                        <span className="block text-[11px] font-sans truncate max-w-50" title={`${trip.source} ➔ ${trip.destination}`}>
                          {trip.source} ➔ {trip.destination}
                        </span>
                      </td>
                      <td>
                        {trip.status === "Completed" && <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400">Completed</span>}
                        {trip.status === "Dispatched" && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400">Dispatched</span>}
                        {trip.status === "Draft" && <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">Draft</span>}
                        {trip.status === "Cancelled" && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand">Cancelled</span>}
                      </td>
                      <td className="text-right font-mono tracking-tight text-theme-muted font-bold">
                        {trip.status === "Dispatched" ? (
                          <span className="text-blue-400 font-mono">{trip.eta}</span>
                        ) : trip.status === "Draft" ? (
                          <span className="text-gray-500 font-mono">Awaiting vehicle</span>
                        ) : (
                          <span className="text-theme-muted font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-theme-muted font-mono text-xs">
                NO DISPATCHES MATCHING SELECTED FILTERS.
              </div>
            )}
          </div>
        </div>

        {/* VEHICLE STATUS DISTRIBUTION (1/3 width with Recharts PieChart) */}
        <div className="bg-theme-panel border border-dark-border rounded p-6 shadow space-y-4">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-theme-text flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand" /> Vehicle Status Distribution
          </h3>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Available", value: vehicleStatus.available || 0 },
                    { name: "On Trip", value: vehicleStatus.onTrip || 0 },
                    { name: "In Shop", value: vehicleStatus.inShop || 0 },
                    { name: "Retired", value: vehicleStatus.retired || 0 }
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {[
                    { name: "Available", color: "#22c55e" },
                    { name: "On Trip", color: "#3b82f6" },
                    { name: "In Shop", color: "#f59e0b" },
                    { name: "Retired", color: "#ef4444" }
                  ].filter(col => (vehicleStatus[col.name === "On Trip" ? "onTrip" : col.name === "In Shop" ? "inShop" : col.name.toLowerCase()] || 0) > 0).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-theme-text">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Available</span>
              <span className="font-bold">{vehicleStatus.available} ({getPct(vehicleStatus.available)}%)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-theme-text">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> On Trip</span>
              <span className="font-bold">{vehicleStatus.onTrip} ({getPct(vehicleStatus.onTrip)}%)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-theme-text">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> In Shop</span>
              <span className="font-bold">{vehicleStatus.inShop} ({getPct(vehicleStatus.inShop)}%)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-theme-text">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Retired</span>
              <span className="font-bold">{vehicleStatus.retired} ({getPct(vehicleStatus.retired)}%)</span>
            </div>
          </div>

          <div className="border-t border-dark-border/40 pt-3 text-center">
            <span className="text-[10px] text-theme-muted font-mono">
              TOTAL OPERATIONAL FLEET: {totalVehicles - (vehicleStatus.retired || 0)} UNITS
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

// 2. Dispatcher component: Trips
export const TripsManager = () => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [distance, setDistance] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  // Advanced features states
  const [selectedStops, setSelectedStops] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [telemetry, setTelemetry] = useState(null);

  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const pathLayerRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const vehicleMarkerRef = React.useRef(null);
  const tileLayerRef = React.useRef(null);
  const tripsLayerGroupRef = React.useRef(null);

  const token = useAuthStore((state) => state.token);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  // Depot mapping coords
  const coordsMap = {
    "Depot Alpha": [23.2156, 72.6369],
    "Sector 4 Distribution": [23.2200, 72.6500],
    "West Warehouse": [23.0300, 72.5000],
    "North Terminal": [23.3000, 72.6000],
    "South Depot": [22.9000, 72.6000],
    "Gandhinagar Depot": [23.2156, 72.6369],
    "Ahmedabad Hub": [23.0225, 72.5714],
  };

  const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return 0;
    const latDiff = coord1[0] - coord2[0];
    const lngDiff = coord1[1] - coord2[1];
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.32;
  };

  const generateRoadPath = (src, dest) => {
    if (!src || !dest) return [];
    const lat1 = src[0];
    const lng1 = src[1];
    const lat2 = dest[0];
    const lng2 = dest[1];
    
    // Render a grid-like urban road structure with intermediate avenue turns
    const t1 = [lat1 + (lat2 - lat1) * 0.15, lng1 + (lng2 - lng1) * 0.65];
    const t2 = [lat1 + (lat2 - lat1) * 0.85, lng1 + (lng2 - lng1) * 0.70];
    const t3 = [lat1 + (lat2 - lat1) * 0.90, lng1 + (lng2 - lng1) * 0.95];

    return [src, t1, t2, t3, dest];
  };

  const getPointAlongPath = (pathPoints, ratio) => {
    if (!pathPoints || pathPoints.length === 0) return [23.1000, 72.6000];
    if (pathPoints.length === 1) return pathPoints[0];
    if (ratio <= 0) return pathPoints[0];
    if (ratio >= 1) return pathPoints[pathPoints.length - 1];
    
    const totalSegments = pathPoints.length - 1;
    const segmentIndex = Math.min(
      Math.floor(ratio * totalSegments),
      totalSegments - 1
    );
    const segmentRatio = (ratio * totalSegments) - segmentIndex;
    
    const startNode = pathPoints[segmentIndex];
    const endNode = pathPoints[segmentIndex + 1];
    
    const lat = startNode[0] + (endNode[0] - startNode[0]) * segmentRatio;
    const lng = startNode[1] + (endNode[1] - startNode[1]) * segmentRatio;
    
    return [lat, lng];
  };

  const handleToggleStop = (stopName) => {
    if (selectedStops.includes(stopName)) {
      setSelectedStops(selectedStops.filter(s => s !== stopName));
    } else {
      setSelectedStops([...selectedStops, stopName]);
    }
  };

  const handleOptimizeStops = () => {
    if (selectedStops.length < 2) return;
    const unvisited = [...selectedStops];
    const path = [];
    let current = unvisited.shift();
    path.push(current);
    
    let totalDist = 0;
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistance(coordsMap[current], coordsMap[unvisited[i]]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }
      
      totalDist += minDistance;
      current = unvisited[nearestIndex];
      path.push(current);
      unvisited.splice(nearestIndex, 1);
    }

    setOptimizedRoute({
      sequence: path,
      totalDistance: Math.round(totalDist)
    });
  };

  const handleApplyOptimization = () => {
    if (!optimizedRoute) return;
    setSource(optimizedRoute.sequence[0]);
    setDestination(optimizedRoute.sequence[optimizedRoute.sequence.length - 1]);
    setDistance(optimizedRoute.totalDistance.toString());
  };

  // Queries
  const { data: trips, refetch: refetchTrips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/trips", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: vehicles, refetch: refetchVehicles } = useQuery({
    queryKey: ["dispatcherVehicles"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: drivers, refetch: refetchDrivers } = useQuery({
    queryKey: ["dispatcherDrivers"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/drivers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  // Map effect
  useEffect(() => {
    if (!mapRef.current) return;

    // Prevent double-initialization crash
    if (mapRef.current._leaflet_id) {
      return;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([23.1000, 72.6000], 10);
      const initialUrl = isDark 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      const attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
      
      const tiles = L.tileLayer(initialUrl, { attribution }).addTo(map);
      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;
      
      // Fix tile misalignment on render
      map.invalidateSize();
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      tripsLayerGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update map tiles dynamically when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const url = isDark 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      tileLayerRef.current.setUrl(url);
    }
  }, [isDark]);

  // Update map markers and paths when trips, selectedTrip, or isSimulating changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. Initialize trips layer group if it doesn't exist
    if (!tripsLayerGroupRef.current) {
      tripsLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    } else {
      if (!mapInstanceRef.current.hasLayer(tripsLayerGroupRef.current)) {
        tripsLayerGroupRef.current.addTo(mapInstanceRef.current);
      }
    }

    // 2. Clear all previous layers
    tripsLayerGroupRef.current.clearLayers();

    // 3. Reset vehicle marker if selected trip changes
    if (vehicleMarkerRef.current) {
      mapInstanceRef.current.removeLayer(vehicleMarkerRef.current);
      vehicleMarkerRef.current = null;
    }

    // Helper to get coordinates
    const getCoords = (locationName) => {
      if (!locationName) return [23.1000, 72.6000];
      if (coordsMap[locationName]) return coordsMap[locationName];
      let hash = 0;
      for (let i = 0; i < locationName.length; i++) {
        hash = locationName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const lat = 23.02 + (Math.abs(hash % 100) / 600);
      const lng = 72.50 + (Math.abs((hash >> 8) % 100) / 600);
      return [lat, lng];
    };

    // 4. Render all trips and their paths
    (trips || []).forEach(t => {
      const srcCoords = getCoords(t.source);
      const destCoords = getCoords(t.destination);
      const isSelected = selectedTrip && selectedTrip._id === t._id;

      // Skip cancelled trips to keep view clean
      if (t.status === "Cancelled") return;

      // Draw Path Line
      let polylineColor = "#3b82f6"; // standard en-route blue
      let polylineWeight = 2.5;
      let opacity = 0.55;

      if (isSelected) {
        polylineColor = "#ef4444"; // selected route is bright crimson red
        polylineWeight = 4.5;
        opacity = 1.0;
      } else if (t.status === "Completed") {
        polylineColor = "#10b981"; // completed is light green
        polylineWeight = 1.5;
        opacity = 0.25;
      } else if (t.status === "Draft") {
        polylineColor = "#f59e0b"; // draft is amber
        polylineWeight = 2;
        opacity = 0.45;
      }

      const roadPath = generateRoadPath(srcCoords, destCoords);

      L.polyline(roadPath, {
        color: polylineColor,
        weight: polylineWeight,
        opacity: opacity
      }).addTo(tripsLayerGroupRef.current)
        .bindPopup(`<strong>Trip: ${t.tripId}</strong><br/>Route: ${t.source} ➔ ${t.destination}<br/>Status: <span class="uppercase font-bold">${t.status}</span>`);

      // Start Pin
      const startIcon = L.divIcon({
        html: `<div style="background-color: ${isSelected ? '#ef4444' : '#10b981'}; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
        className: "",
        iconSize: [10, 10]
      });
      L.marker(srcCoords, { icon: startIcon })
        .addTo(tripsLayerGroupRef.current)
        .bindPopup(`Origin: ${t.source}`)
        .bindTooltip("Start", { permanent: true, direction: "top", className: "font-mono text-[9px] bg-zinc-900/90 text-green-400 border border-green-500/20 px-1 py-0.5 rounded shadow" });

      // End Pin
      const endIcon = L.divIcon({
        html: `<div style="background-color: #ef4444; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
        className: "",
        iconSize: [10, 10]
      });
      L.marker(destCoords, { icon: endIcon })
        .addTo(tripsLayerGroupRef.current)
        .bindPopup(`Destination: ${t.destination}`)
        .bindTooltip("End", { permanent: true, direction: "top", className: "font-mono text-[9px] bg-zinc-900/90 text-red-400 border border-red-500/20 px-1 py-0.5 rounded shadow" });

      // Render truck markers for active dispatches
      if (t.status === "Dispatched") {
        if (!isSelected) {
          // Render a static background truck marker placed en-route (35% of the way along the road segments)
          const midCoords = getPointAlongPath(roadPath, 0.35);

          const staticTruckIcon = L.divIcon({
            html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); transform: translateY(-5px); z-index: 500;">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display: block;">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7.5l2.25 3H17v-3h1.5z"/>
              </svg>
            </div>`,
            className: "",
            iconSize: [24, 24]
          });

          L.marker(midCoords, { icon: staticTruckIcon })
            .addTo(tripsLayerGroupRef.current)
            .bindPopup(`<strong>Truck En Route</strong><br/>Asset: ${t.vehicleId?.registrationNo || "Truck"}<br/>Driver: ${t.driverId?.name || "Driver"}<br/>Location: In Transit`);
        }
      }
    });

    // 5. Draw active tracking marker if selected trip is active and simulating
    if (selectedTrip) {
      const srcCoords = getCoords(selectedTrip.source);
      const destCoords = getCoords(selectedTrip.destination);

      if (selectedTrip.status === "Dispatched") {
        const liveTruckIcon = L.divIcon({
          html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.6); transform: translateY(-5px); z-index: 1000;" class="animate-bounce">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display: block;">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7.5l2.25 3H17v-3h1.5z"/>
            </svg>
          </div>`,
          className: "",
          iconSize: [24, 24]
        });
        
        const startPos = isSimulating && telemetry ? [Number(telemetry.lat), Number(telemetry.lng)] : srcCoords;
        
        vehicleMarkerRef.current = L.marker(startPos, { icon: liveTruckIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Tracking Active Simulating...");
      }

      // Zoom to fit the selected trip
      mapInstanceRef.current.fitBounds([srcCoords, destCoords], { padding: [45, 45] });
    } else {
      // Zoom to fit all active paths
      const boundsCoords = [];
      (trips || []).forEach(t => {
        if (t.status === "Dispatched" || t.status === "Draft") {
          boundsCoords.push(getCoords(t.source));
          boundsCoords.push(getCoords(t.destination));
        }
      });

      if (boundsCoords.length > 0) {
        mapInstanceRef.current.fitBounds(boundsCoords, { padding: [35, 35] });
      } else {
        mapInstanceRef.current.setView([23.1000, 72.6000], 10);
      }
    }
  }, [trips, selectedTrip, isSimulating]);

  // GPS Runner animation
  const handleSimulateGPS = (targetTrip = null) => {
    const tripToSimulate = targetTrip || selectedTrip;
    if (!tripToSimulate || tripToSimulate.status !== "Dispatched" || isSimulating) return;

    // Select the trip so the map centers and focuses on it
    if (!selectedTrip || selectedTrip._id !== tripToSimulate._id) {
      setSelectedTrip(tripToSimulate);
    }

    const srcName = tripToSimulate.source;
    const destName = tripToSimulate.destination;

    const getCoordsLocal = (locationName) => {
      if (!locationName) return [23.1000, 72.6000];
      if (coordsMap[locationName]) return coordsMap[locationName];
      let hash = 0;
      for (let i = 0; i < locationName.length; i++) {
        hash = locationName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const lat = 23.02 + (Math.abs(hash % 100) / 600);
      const lng = 72.50 + (Math.abs((hash >> 8) % 100) / 600);
      return [lat, lng];
    };

    const srcCoords = getCoordsLocal(srcName);
    const destCoords = getCoordsLocal(destName);
    const roadPath = generateRoadPath(srcCoords, destCoords);

    setIsSimulating(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    // Initialize Telemetry
    setTelemetry({
      lat: srcCoords[0].toFixed(5),
      lng: srcCoords[1].toFixed(5),
      speed: 0,
      distanceRemaining: Math.round(tripToSimulate.plannedDistanceKm),
      etaMins: Math.round(tripToSimulate.plannedDistanceKm * 1.5)
    });

    let step = 0;
    const totalSteps = 40; // 4 seconds

    const interval = setInterval(async () => {
      step++;
      const ratio = step / totalSteps;
      const currentPos = getPointAlongPath(roadPath, ratio);
      const lat = currentPos[0];
      const lng = currentPos[1];

      if (vehicleMarkerRef.current && mapInstanceRef.current) {
        vehicleMarkerRef.current.setLatLng(currentPos);
        mapInstanceRef.current.panTo(currentPos);
      }

      // Update Telemetry values
      const currentSpeed = ratio >= 0.95 ? 0 : Math.round(50 + Math.random() * 20);
      const distRemaining = Math.max(0, Math.round(tripToSimulate.plannedDistanceKm * (1 - ratio)));
      const eta = Math.max(0, Math.round(distRemaining * 1.2));
      
      setTelemetry({
        lat: lat.toFixed(5),
        lng: lng.toFixed(5),
        speed: currentSpeed,
        distanceRemaining: distRemaining,
        etaMins: eta
      });

      if (step >= totalSteps) {
        clearInterval(interval);
        setIsSimulating(false);
        setTelemetry(null);
        setSuccessMsg(`Simulated geofence breached! Vehicle entered destination boundary. Trip completed.`);
        await handleUpdateStatus(tripToSimulate._id, "Completed");
      }
    }, 100);
  };

  // jsPDF Invoice
  const handleDownloadInvoice = (trip) => {
    const doc = new jsPDF();
    const cost = (trip.plannedDistanceKm * 10) + (trip.cargoWeightKg * 0.5);

    // Styling
    doc.setFillColor(24, 24, 27); // Dark zinc header
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("TRANSITOPS BILLING INVOICE", 15, 25);

    doc.setTextColor(82, 82, 91);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Invoice Ref: INV-${trip.tripId}-${Math.floor(Math.random() * 10000)}`, 15, 55);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 15, 62);
    
    // Details
    doc.setFont("helvetica", "bold");
    doc.text("SHIPMENT DETAIL MATRIX", 15, 80);
    doc.line(15, 82, 195, 82);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Source Depot: ${trip.source}`, 15, 92);
    doc.text(`Destination Depot: ${trip.destination}`, 15, 99);
    doc.text(`Vehicle Asset: ${trip.vehicleId ? trip.vehicleId.registrationNo : "N/A"}`, 15, 106);
    doc.text(`Assigned Driver: ${trip.driverId ? trip.driverId.name : "N/A"}`, 15, 113);
    doc.text(`Cargo Volume: ${trip.cargoWeightKg} kg`, 15, 120);
    doc.text(`Odometer Run: ${trip.plannedDistanceKm} km`, 15, 127);
    
    // Charges Table
    doc.setFont("helvetica", "bold");
    doc.text("BILLING MATRIX BREAKDOWN", 15, 145);
    doc.line(15, 147, 195, 147);
    
    doc.setFont("helvetica", "normal");
    doc.text("Distance Freight charge (INR 10/km):", 15, 157);
    doc.text(`INR ${(trip.plannedDistanceKm * 10).toLocaleString()}`, 150, 157);
    
    doc.text("Cargo Weight freight surcharge (INR 0.50/kg):", 15, 164);
    doc.text(`INR ${(trip.cargoWeightKg * 0.5).toLocaleString()}`, 150, 164);
    
    doc.setFont("helvetica", "bold");
    doc.text("NET PAYABLE DUE:", 15, 178);
    doc.text(`INR ${cost.toLocaleString()}`, 150, 178);
    
    doc.line(15, 182, 195, 182);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("TransitOps automated billing registry matrix. Paid invoice copy.", 15, 200);

    // Save PDF
    doc.save(`Invoice_${trip.tripId}.pdf`);
  };

  // Export CSV
  const handleExportTripsCSV = () => {
    const headers = ["Trip ID", "Source", "Destination", "Vehicle Reg", "Driver Name", "Cargo Weight (kg)", "Planned Distance (km)", "Status"];
    const rows = (trips || []).map(t => [
      t.tripId,
      t.source,
      t.destination,
      t.vehicleId ? t.vehicleId.registrationNo : "—",
      t.driverId ? t.driverId.name : "—",
      t.cargoWeightKg,
      t.plannedDistanceKm,
      t.status
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trips_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter available items
  const availableVehicles = (vehicles || []).filter(v => v.status === "Available");
  const availableDrivers = (drivers || []).filter(d => {
    const isAvail = d.status === "Available";
    const isLicenseValid = new Date(d.licenseExpiry) > new Date();
    return isAvail && isLicenseValid;
  });

  const selectedVehicle = (vehicles || []).find(v => v._id === vehicleId);
  const selectedDriver = (drivers || []).find(d => d._id === driverId);

  // Warnings / Validation
  const capacityExceeded = selectedVehicle && Number(cargoWeight) > selectedVehicle.capacityKg;
  const isDispatchBlocked = capacityExceeded || !source || !destination || !vehicleId || !driverId || !cargoWeight || !distance;

  const handleCreateTrip = async (status = "Draft") => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.post("http://localhost:5000/api/trips", {
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeightKg: Number(cargoWeight),
        plannedDistanceKm: Number(distance),
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg(status === "Dispatched" ? "Trip dispatched successfully!" : "Draft trip saved!");
      setSource("");
      setDestination("");
      setVehicleId("");
      setDriverId("");
      setCargoWeight("");
      setDistance("");
      refetchTrips();
      refetchVehicles();
      refetchDrivers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create trip");
    }
  };

  const handleUpdateStatus = async (tripId, targetStatus) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.put(`http://localhost:5000/api/trips/${tripId}/status`, {
        status: targetStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(`Trip updated to ${targetStatus}!`);
      refetchTrips();
      refetchVehicles();
      refetchDrivers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update trip status");
    }
  };

  const filteredTrips = (trips || []).filter(t => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      t.tripId.toLowerCase().includes(term) ||
      t.source.toLowerCase().includes(term) ||
      t.destination.toLowerCase().includes(term) ||
      (t.driverId && t.driverId.name.toLowerCase().includes(term)) ||
      (t.vehicleId && t.vehicleId.registrationNo.toLowerCase().includes(term));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-theme-text">
      <div>
        <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Trip Dispatcher</h2>
        <p className="text-sm text-theme-muted mt-1">Create, dispatch, and manage active operational dispatches.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/30 p-3.5 rounded text-xs text-red-400 font-mono">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-950/40 border border-green-500/30 p-3.5 rounded text-xs text-green-400 font-mono">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CREATE TRIP & ROUTE OPTIMIZER COLUMN (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CREATE TRIP FORM */}
          <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded-xl shadow space-y-6">
            
            {/* Lifecycle display */}
            <div className="space-y-2">
              <span className="text-[10px] text-theme-muted font-mono font-bold uppercase tracking-wider block">Trip Lifecycle</span>
              <div className="flex items-center justify-between font-mono text-[9px] font-bold text-center bg-dark-bg p-3 border border-dark-border rounded-lg">
                <span className={`px-2 py-0.5 rounded ${(!selectedTrip || selectedTrip.status === "Draft") ? "bg-brand text-black" : "text-theme-muted"}`}>Draft</span>
                <span className="text-theme-muted">➔</span>
                <span className={`px-2 py-0.5 rounded ${(selectedTrip && selectedTrip.status === "Dispatched") ? "bg-blue-500 text-white" : "text-theme-muted"}`}>Dispatched</span>
                <span className="text-theme-muted">➔</span>
                <span className={`px-2 py-0.5 rounded ${(selectedTrip && selectedTrip.status === "Completed") ? "bg-green-500 text-white" : "text-theme-muted"}`}>Completed</span>
                <span className="text-theme-muted">/</span>
                <span className={`px-2 py-0.5 rounded ${(selectedTrip && selectedTrip.status === "Cancelled") ? "bg-red-500 text-white" : "text-theme-muted"}`}>Cancelled</span>
              </div>
              {selectedTrip && (
                <div className="flex items-center justify-between text-[10px] font-mono text-brand bg-brand/5 border border-brand/20 p-2 rounded-lg">
                  <span>Selected: {selectedTrip.tripId} ({selectedTrip.status})</span>
                  <button 
                    onClick={() => setSelectedTrip(null)}
                    className="text-theme-muted hover:text-white"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold uppercase text-white font-mono tracking-wide">Create Trip</h3>
              
              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Source Location</label>
                <input
                  type="text"
                  placeholder="e.g. Gandhinagar Depot"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad Hub"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Vehicle (Available Only)</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="">Select Available Vehicle</option>
                  {availableVehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNo} — {v.name} ({v.type}, Cap: {v.capacityKg}kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Driver (Available & Licensed)</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="">Select Available Driver</option>
                  {availableDrivers.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.licenseCategory}, Score: {d.safetyScore}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 700"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Planned Distance (km)</label>
                  <input
                    type="number"
                    placeholder="e.g. 38"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Warnings Alert Box */}
              {selectedVehicle && (
                <div className={`p-3 border rounded text-[10px] font-semibold leading-relaxed ${capacityExceeded ? "bg-red-950/20 border-red-500/30 text-red-400" : "bg-dark-bg border-dark-border text-theme-muted"}`}>
                  <div className="flex items-center justify-between">
                    <span>Vehicle Capacity:</span>
                    <span className="font-bold">{selectedVehicle.capacityKg} kg</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span>Cargo Weight:</span>
                    <span className="font-bold">{cargoWeight || 0} kg</span>
                  </div>
                  {capacityExceeded && (
                    <div className="mt-2 border-t border-red-500/20 pt-1.5 font-bold flex items-center gap-1.5 text-[9px] uppercase">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline-block shrink-0" />
                      <span>Capacity exceeded by {Number(cargoWeight) - selectedVehicle.capacityKg} kg — Dispatch Blocked</span>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  disabled={isDispatchBlocked}
                  onClick={() => handleCreateTrip("Dispatched")}
                  className={`py-2 px-4 rounded font-bold uppercase text-[11px] tracking-wide text-center transition-all ${isDispatchBlocked ? "bg-gray-700/30 text-gray-500 border border-gray-600/30 cursor-not-allowed" : "bg-brand text-black hover:bg-brand-light shadow"}`}
                >
                  Dispatch
                </button>
                <button
                  type="button"
                  disabled={!source || !destination || capacityExceeded}
                  onClick={() => handleCreateTrip("Draft")}
                  className={`py-2 px-4 rounded font-bold uppercase text-[11px] border tracking-wide text-center transition-all ${(!source || !destination || capacityExceeded) ? "border-gray-700/30 text-gray-500 cursor-not-allowed" : "border-dark-border hover:bg-dark-hoverBg/10 text-white"}`}
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>

          {/* ROUTE OPTIMIZER WIDGET */}
          <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded-xl shadow space-y-4 font-mono text-xs">
            <div>
              <h3 className="text-sm font-bold uppercase text-white font-mono tracking-wide flex items-center gap-2">
                🧭 Multi-Stop Route Optimizer
              </h3>
              <p className="text-[10px] text-theme-muted mt-1 font-mono">
                Select stops to compute the shortest sequence path.
              </p>
            </div>

            <div className="space-y-2 border-t border-dark-border/40 pt-3">
              <span className="text-[10px] text-theme-muted uppercase font-bold block mb-1">Available Waypoints</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-gray-300">
                {Object.keys(coordsMap).map(stop => (
                  <label key={stop} className="flex items-center gap-2 cursor-pointer bg-dark-bg border border-dark-border/60 hover:border-brand/40 px-2 py-1.5 rounded transition-all">
                    <input 
                      type="checkbox"
                      checked={selectedStops.includes(stop)}
                      onChange={() => handleToggleStop(stop)}
                      className="rounded bg-theme-panel border-dark-border text-brand focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="truncate">{stop}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleOptimizeStops}
                disabled={selectedStops.length < 2}
                className={`flex-1 py-2 px-3 rounded font-bold uppercase text-[10px] tracking-wide text-center transition-all ${selectedStops.length < 2 ? "bg-gray-700/30 text-gray-500 border border-gray-600/30 cursor-not-allowed" : "bg-brand text-black hover:bg-brand-light shadow"}`}
              >
                Compute Optimal TSP Path
              </button>
              {selectedStops.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedStops([]); setOptimizedRoute(null); }}
                  className="border border-dark-border px-3 py-2 text-white hover:bg-dark-hoverBg/10 rounded uppercase text-[10px] font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            {optimizedRoute && (
              <div className="bg-brand/5 border border-brand/20 p-3 rounded space-y-2 transition-opacity duration-300 text-[10px] leading-relaxed">
                <div>
                  <span className="text-brand font-bold uppercase tracking-wider block text-[9px]">Optimal Itinerary Calculated</span>
                  <div className="mt-1 space-y-1">
                    {optimizedRoute.sequence.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-white">
                        <span className="w-4 h-4 bg-brand/20 border border-brand/40 text-brand text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{stop}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-brand/25 pt-2">
                  <span className="text-gray-300">Total Run Distance: <strong className="text-white">{optimizedRoute.totalDistance} km</strong></span>
                  <button
                    type="button"
                    onClick={handleApplyOptimization}
                    className="bg-brand text-black font-bold uppercase px-2.5 py-1 rounded text-[9px] hover:bg-brand-light transition-all"
                  >
                    Apply Path Parameters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAP & LIVE BOARD (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* LEAFLET MAP PANEL */}
          <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Live Route Tracker</h3>
                {selectedTrip && (
                  <p className="text-[10px] text-theme-muted font-mono mt-0.5">
                    Selected Route: {selectedTrip.source} ➔ {selectedTrip.destination} ({selectedTrip.status})
                  </p>
                )}
              </div>
              {selectedTrip && selectedTrip.status === "Dispatched" && (
                <button
                  onClick={handleSimulateGPS}
                  disabled={isSimulating}
                  className={`bg-brand text-black text-[10px] font-bold uppercase px-3 py-1.5 rounded hover:bg-brand-light transition-all flex items-center gap-1 ${isSimulating ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Play className="w-3.5 h-3.5" /> {isSimulating ? "Simulating GPS..." : "Simulate GPS"}
                </button>
              )}
            </div>
            
            {/* Map Canvas with Telemetry Overlay */}
            <div className="relative">
              <div 
                ref={mapRef} 
                className="h-100 w-full bg-dark-bg border border-dark-border rounded-lg overflow-hidden z-10"
                style={{ minHeight: "400px" }}
              ></div>

              {/* TELEMETRY OVERLAY */}
              {isSimulating && telemetry && (
                <div className="absolute bottom-4 left-4 right-4 border border-black/5 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#141519]/70 p-4 rounded-xl z-20 text-[10px] text-gray-300 font-mono shadow-2xl transition-opacity duration-300 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="text-brand font-bold uppercase tracking-wider block text-[9px] mb-1 animate-pulse">🛰️ Active GPS Telemetry</span>
                    <span className="block text-white font-semibold">Position: {telemetry.lat}, {telemetry.lng}</span>
                    <span className="text-[9px] text-theme-muted block mt-0.5">Asset: {selectedTrip.vehicleId?.registrationNo || "Truck"} ({selectedTrip.driverId?.name || "Driver"})</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <span className="text-theme-muted block text-[8px] uppercase">Speed</span>
                      <span className="text-white font-bold text-sm block mt-0.5">{telemetry.speed} <span className="text-[9px] font-normal">km/h</span></span>
                    </div>
                    <div className="text-center">
                      <span className="text-theme-muted block text-[8px] uppercase">Remaining</span>
                      <span className="text-white font-bold text-sm block mt-0.5">{telemetry.distanceRemaining} <span className="text-[9px] font-normal">km</span></span>
                    </div>
                    <div className="text-center">
                      <span className="text-theme-muted block text-[8px] uppercase">ETA</span>
                      <span className="text-white font-bold text-sm block mt-0.5">{telemetry.etaMins} <span className="text-[9px] font-normal">mins</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LIVE BOARD */}
          <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded shadow space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-theme-text">Live Board</h3>
                <button
                  onClick={handleExportTripsCSV}
                  className="bg-dark-surface border border-dark-border text-white text-[10px] uppercase px-2.5 py-1 rounded hover:bg-dark-hoverBg transition-colors flex items-center gap-1 font-bold"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="relative w-full sm:w-56">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-theme-muted">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search board..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9"
                />
              </div>
            </div>

            <div className="space-y-4 max-h-125 overflow-y-auto pr-1">
              {filteredTrips.length > 0 ? (
                filteredTrips.map(trip => (
                  <div 
                    key={trip._id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-4 rounded border font-mono text-xs transition-all cursor-pointer ${selectedTrip?._id === trip._id ? "border-brand bg-brand/5 shadow" : "border-dark-border bg-dark-bg hover:border-dark-border/80"}`}
                  >
                    <div className="flex items-center justify-between border-b border-dark-border/40 pb-2 mb-2">
                      <div>
                        <span className="text-brand font-bold text-sm block">{trip.tripId}</span>
                        <span className="text-[10px] text-theme-muted font-sans mt-0.5 block">
                          {trip.vehicleId ? `${trip.vehicleId.registrationNo} / ${trip.vehicleId.name}` : "Unassigned Vehicle"}
                        </span>
                      </div>
                      <div className="text-right">
                        {trip.status === "Completed" && <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400">Completed</span>}
                        {trip.status === "Dispatched" && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400">Dispatched</span>}
                        {trip.status === "Draft" && <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400 text-gray-400">Draft</span>}
                        {trip.status === "Cancelled" && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand">Cancelled</span>}
                        <span className="text-[10px] text-theme-muted block mt-1">
                          {trip.driverId ? trip.driverId.name : "Unassigned Driver"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-theme-muted pt-1">
                      <div>
                        <span className="block text-theme-text font-semibold">{trip.source} ➔ {trip.destination}</span>
                        <span className="block mt-0.5">Cargo: {trip.cargoWeightKg} kg • Distance: {trip.plannedDistanceKm} km</span>
                      </div>
                      
                      {/* Action controllers */}
                      <div className="flex items-center gap-2">
                        {trip.status === "Completed" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(trip); }}
                            className="bg-brand hover:bg-brand-light text-black font-bold px-2.5 py-1 rounded text-[9px] uppercase font-mono tracking-wide transition-colors flex items-center gap-0.5"
                          >
                            <FileText className="w-3 h-3" /> Invoice
                          </button>
                        )}
                        {trip.status === "Dispatched" && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSimulateGPS(trip); }}
                              disabled={isSimulating}
                              className={`bg-brand text-black font-bold px-2 py-1.5 rounded text-[9px] uppercase font-mono tracking-wide transition-colors flex items-center gap-0.5 ${isSimulating ? 'opacity-55 cursor-not-allowed' : 'hover:bg-brand-light'}`}
                            >
                              <Play className="w-3 h-3" /> Simulate
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(trip._id, "Completed"); }}
                              className="bg-green-600 hover:bg-green-500 text-white font-bold px-2 py-1.5 rounded text-[9px] uppercase font-mono tracking-wide transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(trip._id, "Cancelled"); }}
                              className="bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-400 font-bold px-2 py-1.5 rounded text-[9px] uppercase font-mono tracking-wide transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {trip.status === "Draft" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(trip._id, "Dispatched"); }}
                            className="bg-brand hover:bg-brand-light text-black font-bold px-2 py-1 rounded text-[9px] uppercase font-mono tracking-wide transition-colors"
                          >
                            Dispatch Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-theme-muted font-mono text-xs">
                  NO TRIPS CURRENTLY LOGGED ON THE LIVE BOARD.
                </div>
              )}
            </div>

            <div className="border-t border-dark-border/40 pt-4 text-center font-mono text-[9px] text-theme-muted uppercase tracking-wider">
              On Complete: odometer ➔ fuel log ➔ expenses ➔ Vehicle & Driver Available
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

// 3. Fleet Manager component: Fleet Registry
export const FleetRegistry = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchRegNo, setSearchRegNo] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  // Document management states
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docVehicleId, setDocVehicleId] = useState(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Insurance");
  const [docNo, setDocNo] = useState("");
  const [docIssueDate, setDocIssueDate] = useState("");
  const [docExpiryDate, setDocExpiryDate] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);

  // Form states
  const [regNo, setRegNo] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Truck");
  const [capacity, setCapacity] = useState("");
  const [odometer, setOdometer] = useState("");
  const [acqCost, setAcqCost] = useState("");
  const [status, setStatus] = useState("Available");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const token = useAuthStore((state) => state.token);

  const { data: vehicles, isLoading: vehiclesLoading, refetch } = useQuery({
    queryKey: ["fleetVehicles"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: maintenance, isLoading: maintLoading } = useQuery({
    queryKey: ["fleetMaintenance"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/maintenance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const isLoading = vehiclesLoading || maintLoading;

  // Aggregate repair logs
  const maintenanceCosts = {};
  (maintenance || []).forEach(log => {
    const vId = log.vehicleId?._id || log.vehicleId;
    if (vId) {
      maintenanceCosts[vId] = (maintenanceCosts[vId] || 0) + (log.cost || 0);
    }
  });

  const handleExportCSV = () => {
    const headers = ["Registration No", "Name/Model", "Type", "Capacity (kg)", "Odometer (km)", "Acquisition Cost (₹)", "Status", "Cumulative Repairs (₹)"];
    const rows = (vehicles || []).map(v => [
      v.registrationNo,
      v.name,
      v.type,
      v.capacityKg,
      v.odometerKm,
      v.acquisitionCost,
      v.status,
      maintenanceCosts[v._id] || 0
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fleet_Assets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
    }));
  };

  const handleExportFleetPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TRANSITOPS FLEET REGISTRY REPORT", 15, 25);
    doc.setTextColor(82, 82, 91);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
    doc.text(`Total Vehicles: ${(vehicles || []).length}`, 15, 62);

    doc.setFont("helvetica", "bold");
    doc.text("VEHICLE ASSET MANIFEST", 15, 80);
    doc.line(15, 82, 195, 82);

    let yPos = 92;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    (vehicles || []).forEach((v, i) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(`${i + 1}. ${v.registrationNo} — ${v.name} | Type: ${v.type} | Cap: ${v.capacityKg}kg | ODO: ${v.odometerKm}km | Status: ${v.status}`, 15, yPos);
      yPos += 7;
    });

    doc.save(`Fleet_Registry_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.post(`http://localhost:5000/api/vehicles/${docVehicleId}/documents`, {
        name: docName,
        type: docType,
        documentNo: docNo,
        issueDate: docIssueDate || null,
        expiryDate: docExpiryDate || null,
        notes: docNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg("Document added successfully!");
      setIsDocModalOpen(false);
      setDocName(""); setDocType("Insurance"); setDocNo("");
      setDocIssueDate(""); setDocExpiryDate(""); setDocNotes("");
      refetch();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to add document");
    }
  };

  const handleDeleteDocument = async (vehicleId, docId) => {
    setErrorMsg("");
    try {
      await axios.delete(`http://localhost:5000/api/vehicles/${vehicleId}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg("Document removed.");
      refetch();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete document");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.post("http://localhost:5000/api/vehicles", {
        registrationNo: regNo,
        name,
        type,
        capacityKg: Number(capacity),
        odometerKm: Number(odometer),
        acquisitionCost: Number(acqCost),
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg("Vehicle registered successfully!");
      setIsModalOpen(false);
      setRegNo("");
      setName("");
      setType("Truck");
      setCapacity("");
      setOdometer("");
      setAcqCost("");
      setStatus("Available");
      refetch();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to register vehicle");
    }
  };

  const filtered = (vehicles || []).filter(v => {
    const matchesSearch = v.registrationNo.toLowerCase().includes(searchRegNo.toLowerCase()) || v.name.toLowerCase().includes(searchRegNo.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
    return 0;
  });

  // Analytics helper metrics
  const totalVehiclesCount = (vehicles || []).length;
  const operationalCount = (vehicles || []).filter(v => v.status !== "Retired").length;
  const activeCount = (vehicles || []).filter(v => v.status === "OnTrip").length;
  const inShopCount = (vehicles || []).filter(v => v.status === "InShop").length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-theme-muted font-mono">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>LOADING FLEET DATABASES...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-theme-text">
      
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Vehicle Registry</h2>
          <p className="text-sm text-theme-muted mt-1">Manage and track company transportation assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFleetPDF}
            className="bg-dark-surface border border-dark-border text-white font-bold font-mono text-xs uppercase px-4 py-2 rounded shadow hover:bg-dark-hoverBg flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-dark-surface border border-dark-border text-white font-bold font-mono text-xs uppercase px-4 py-2 rounded shadow hover:bg-dark-hoverBg flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand text-black font-bold font-mono text-xs uppercase px-4 py-2 rounded shadow hover:bg-brand-light flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-950/40 border border-green-500/30 p-3.5 rounded text-xs text-green-400 font-mono">
          {successMsg}
        </div>
      )}

      {/* MODAL WINDOW FOR ADDING VEHICLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-theme-panel border border-dark-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border/40 pb-3">
              <h3 className="font-bold text-white font-mono text-sm uppercase">Register Asset</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-theme-muted hover:text-white font-mono text-sm">✕</button>
            </div>
            
            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 p-3 rounded text-[10px] text-red-400 font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Registration No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ01AB452"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Name / Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VAN-05"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                    <option value="Container">Container</option>
                    <option value="Flatbed">Flatbed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 74000"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Acq. Cost (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 620000"
                    value={acqCost}
                    onChange={(e) => setAcqCost(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="OnTrip">On Trip</option>
                  <option value="InShop">In Shop</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-black font-bold uppercase py-2.5 rounded hover:bg-brand-light tracking-wide text-xs mt-4 transition-colors"
              >
                Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card
          title="Total Registered"
          value={`${totalVehiclesCount} Vehicles`}
          desc="Across all statuses"
          icon={Truck}
        />
        <Card
          title="Operational Status"
          value={`${operationalCount} Active`}
          desc={`${inShopCount} in shop for maintenance`}
          icon={Wrench}
          color="text-green-400"
        />
        <Card
          title="Active On Road"
          value={`${activeCount} On Trip`}
          desc="In transit right now"
          icon={Compass}
          color="text-blue-400"
        />
        <Card
          title="Avg Odometer"
          value="142,390 km"
          desc="Across operational assets"
          icon={BarChart3}
          color="text-indigo-400"
        />
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-theme-panel border border-dark-border p-4 rounded shadow grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] text-theme-muted font-mono uppercase mb-1 font-bold">Vehicle Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer text-xs"
          >
            <option value="All">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Mini">Mini</option>
            <option value="Container">Container</option>
            <option value="Flatbed">Flatbed</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-theme-muted font-mono uppercase mb-1 font-bold">Vehicle Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="OnTrip">On Trip</option>
            <option value="InShop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-theme-muted font-mono uppercase mb-1 font-bold">Search Reg No.</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-theme-muted">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search registration..."
              value={searchRegNo}
              onChange={(e) => setSearchRegNo(e.target.value)}
              className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* VEHICLES LEDGER TABLE */}
      <div className="bg-theme-panel border border-dark-border rounded p-6 shadow">
        <div className="overflow-x-auto">
          {sorted.length > 0 ? (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-dark-border pb-3 text-theme-muted text-[10px] uppercase">
                  <SortableHeader label="Reg. No." sortKey="registrationNo" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Name/Model" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Type" sortKey="type" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Capacity" sortKey="capacityKg" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Odometer" sortKey="odometerKm" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Acq. Cost" sortKey="acquisitionCost" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="text-center">Docs</th>
                  <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-theme-text">
                {sorted.map(v => {
                  const repairsCost = maintenanceCosts[v._id] || 0;
                  const isHighDepreciation = repairsCost >= (v.acquisitionCost || 0) * 0.5;
                  const docs = v.documents || [];

                  return (
                    <React.Fragment key={v._id}>
                      <tr className="hover:bg-dark-hoverBg/25 transition-colors">
                      <td className="py-3 text-white font-bold">
                        <div>{v.registrationNo}</div>
                        {isHighDepreciation && (
                          <div className="text-[9px] text-red-400 font-bold mt-1 flex items-center gap-0.5 uppercase tracking-wide">
                            ⚠️ Depr. Alert (Repairs: ₹{repairsCost.toLocaleString()} &gt; 50% cost)
                          </div>
                        )}
                      </td>
                      <td className="font-semibold">{v.name}</td>
                      <td>{v.type}</td>
                      <td>{v.capacityKg} kg</td>
                      <td className="font-mono tracking-tight">{Number(v.odometerKm).toLocaleString()} km</td>
                      <td className="font-mono tracking-tight">₹{Number(v.acquisitionCost).toLocaleString()}</td>
                      <td className="text-center">
                        <button
                          onClick={() => setExpandedVehicleId(expandedVehicleId === v._id ? null : v._id)}
                          className="text-theme-muted hover:text-brand transition-colors inline-flex items-center gap-0.5 text-[9px] font-bold uppercase"
                        >
                          <FolderOpen className="w-3.5 h-3.5" /> {docs.length}
                          {expandedVehicleId === v._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="text-right">
                        {v.status === "Available" && <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400">Available</span>}
                        {v.status === "OnTrip" && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400 bg-blue-500/10 text-blue-400 border-blue-500/20">On Trip</span>}
                        {v.status === "InShop" && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400">In Shop</span>}
                        {v.status === "Retired" && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand">Retired</span>}
                      </td>
                    </tr>
                    {/* Document expansion row */}
                    {expandedVehicleId === v._id && (
                      <tr>
                        <td colSpan="8" className="p-0">
                          <div className="bg-dark-bg/50 border-t border-dark-border/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Documents — {v.registrationNo}</span>
                              <button
                                onClick={() => { setDocVehicleId(v._id); setIsDocModalOpen(true); }}
                                className="bg-brand text-black font-bold text-[9px] uppercase px-2 py-1 rounded hover:bg-brand-light transition-colors flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" /> Add Document
                              </button>
                            </div>
                            {docs.length > 0 ? (
                              <div className="space-y-2">
                                {docs.map(doc => {
                                  const isDocExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                  return (
                                    <div key={doc._id} className={`flex items-center justify-between p-2.5 rounded border text-[10px] ${isDocExpired ? 'bg-red-950/20 border-red-500/30' : 'bg-dark-surface border-dark-border'}`}>
                                      <div className="flex items-center gap-3">
                                        <FileCheck className={`w-4 h-4 ${isDocExpired ? 'text-red-400' : 'text-green-400'}`} />
                                        <div>
                                          <span className="font-bold text-white block">{doc.name}</span>
                                          <span className="text-theme-muted">{doc.type} {doc.documentNo ? `• ${doc.documentNo}` : ''}
                                            {doc.expiryDate ? ` • Exp: ${new Date(doc.expiryDate).toLocaleDateString()}` : ''}
                                            {isDocExpired ? ' — EXPIRED' : ''}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteDocument(v._id, doc._id)}
                                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                                        title="Delete document"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[10px] text-theme-muted text-center py-3">No documents uploaded for this vehicle.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-theme-muted font-mono text-xs">
              NO REGISTERED VEHICLES MATCHING CURRENT FILTERS.
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT MODAL */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-theme-panel border border-dark-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border/40 pb-3">
              <h3 className="font-bold text-white font-mono text-sm uppercase">Add Vehicle Document</h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-theme-muted hover:text-white font-mono text-sm">✕</button>
            </div>
            <form onSubmit={handleAddDocument} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Document Name</label>
                  <input type="text" required placeholder="e.g. Motor Insurance" value={docName} onChange={(e) => setDocName(e.target.value)} className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Document Type</label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer">
                    <option value="Insurance">Insurance</option>
                    <option value="Registration">Registration</option>
                    <option value="Permit">Permit</option>
                    <option value="Fitness">Fitness</option>
                    <option value="PUC">PUC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Document Number</label>
                <input type="text" placeholder="e.g. POL-2026-1234" value={docNo} onChange={(e) => setDocNo(e.target.value)} className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Issue Date</label>
                  <input type="date" value={docIssueDate} onChange={(e) => setDocIssueDate(e.target.value)} className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Expiry Date</label>
                  <input type="date" value={docExpiryDate} onChange={(e) => setDocExpiryDate(e.target.value)} className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Notes</label>
                <input type="text" placeholder="Optional notes..." value={docNotes} onChange={(e) => setDocNotes(e.target.value)} className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-brand text-black font-bold uppercase py-2.5 rounded hover:bg-brand-light tracking-wide text-xs mt-4 transition-colors">
                Save Document
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Policy warning rules */}
      <div className="text-[10px] text-amber-500/80 font-mono uppercase text-center font-semibold tracking-wider">
        Rule: Registration No. must be unique • Retired/In Shop vehicles are hidden from Trip Dispatcher
      </div>

    </div>
  );
};

// 4. Fleet Manager component: Maintenance
export const MaintenanceLogs = () => {
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const token = useAuthStore((state) => state.token);

  // Queries
  const { data: logs, refetch: refetchLogs } = useQuery({
    queryKey: ["maintenanceLogs"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/maintenance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: vehicles } = useQuery({
    queryKey: ["maintenanceVehicles"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.post("http://localhost:5000/api/maintenance", {
        vehicleId: selectedVehicle,
        serviceType,
        cost: Number(cost),
        date: date || new Date(),
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg("Service record saved successfully!");
      // Reset form
      setSelectedVehicle("");
      setServiceType("");
      setCost("");
      setDate("");
      setStatus("Active");
      refetchLogs();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to log service record");
    }
  };

  const handleComplete = async (logId) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.put(`http://localhost:5000/api/maintenance/${logId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg("Maintenance completed and vehicle restored to Available!");
      refetchLogs();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to close service record");
    }
  };

  const predictiveAlerts = (vehicles || []).filter(v => {
    if (v.status === "Retired" || v.status === "InShop") return false;
    const remainder = v.odometerKm % 10000;
    return remainder >= 9000 || remainder <= 1000;
  });

  return (
    <div className="space-y-6 text-theme-text">
      <div>
        <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Maintenance Scheduler</h2>
        <p className="text-sm text-theme-muted mt-1">Open service tickets and track vehicle repair workshops.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/30 p-3.5 rounded text-xs text-red-400 font-mono">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-950/40 border border-green-500/30 p-3.5 rounded text-xs text-green-400 font-mono">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LOG SERVICE RECORD & PREDICTIVE ALERTS COLUMN (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* LOG SERVICE RECORD FORM */}
          <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded-xl shadow space-y-4">
            <h3 className="text-sm font-bold uppercase text-white font-mono tracking-wide">Log Service Record</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Vehicle</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {(vehicles || []).map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNo} — {v.name} ({v.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Service Type</label>
                <input
                  type="text"
                  placeholder="e.g. Oil Change / Engine Repair"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active (In Shop)</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-black font-bold uppercase py-2 rounded hover:bg-brand-light tracking-wide text-[11px] mt-2 transition-colors"
              >
                Save Record
              </button>
            </form>

            {/* Service transition rules */}
            <div className="border-t border-dark-border/40 pt-4 space-y-1 font-mono text-[9px] text-theme-muted leading-relaxed uppercase">
              <div className="flex justify-between items-center text-green-500/80 font-bold">
                <span>Available</span>
                <span>➔ (Open log) ➔</span>
                <span>In Shop</span>
              </div>
              <div className="flex justify-between items-center text-blue-400 font-bold">
                <span>In Shop</span>
                <span>➔ (Mark Completed) ➔</span>
                <span>Available</span>
              </div>
              <p className="text-[8px] text-center text-red-400 font-semibold mt-2">
                Note: In Shop vehicles are removed from the dispatch pool.
              </p>
            </div>
          </div>

          {/* PREDICTIVE ALERTS */}
          {predictiveAlerts.length > 0 && (
            <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded-xl shadow space-y-4 font-mono text-xs transition-opacity duration-300">
              <h3 className="text-sm font-bold uppercase text-white tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" /> Predictive Alerts
              </h3>
              <p className="text-[10px] text-theme-muted font-mono leading-relaxed">
                Vehicles approaching scheduled 10,000 km maintenance milestones:
              </p>
              
              <div className="space-y-3">
                {predictiveAlerts.map(v => {
                  const nextMilestone = Math.ceil(v.odometerKm / 10000) * 10000;
                  const kmRemaining = Math.max(0, nextMilestone - v.odometerKm);
                  return (
                    <div key={v._id} className="flex justify-between items-center bg-amber-950/10 border border-amber-500/20 p-3 rounded-lg">
                      <div>
                        <span className="font-bold text-white block">{v.registrationNo} — {v.name}</span>
                        <span className="text-[9px] text-amber-400 block mt-0.5 font-bold">
                          Odometer: {v.odometerKm.toLocaleString()} km ({kmRemaining.toLocaleString()} km to target {nextMilestone.toLocaleString()} km)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVehicle(v._id);
                          setServiceType("Scheduled Odometer Maintenance");
                          setCost("4500");
                        }}
                        className="bg-brand text-black font-bold uppercase text-[9px] px-2.5 py-1 rounded hover:bg-brand-light transition-all"
                      >
                        Log Ticket
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SERVICE LOGS TABLE (col-span-7) */}
        <div className="lg:col-span-7 bg-theme-panel border border-dark-border p-4 sm:p-6 rounded shadow space-y-4">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-theme-text">Service Log</h3>
          
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto pr-1">
            {(logs || []).length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-dark-border pb-3 text-theme-muted text-[10px] uppercase">
                    <th className="py-2.5">Vehicle</th>
                    <th>Service Type</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-theme-text">
                  {(logs || []).map(log => (
                    <tr key={log._id} className="hover:bg-dark-hoverBg/25 transition-colors">
                      <td className="py-3 font-bold text-white">
                        {log.vehicleId ? log.vehicleId.registrationNo : "—"}
                      </td>
                      <td className="font-semibold">{log.serviceType}</td>
                      <td className="font-mono tracking-tight">₹{Number(log.cost).toLocaleString()}</td>
                      <td>
                        {log.status === "Completed" ? (
                          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400">Completed</span>
                        ) : (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400">In Shop</span>
                        )}
                      </td>
                      <td className="text-right">
                        {log.status === "Active" && (
                          <button
                            onClick={() => handleComplete(log._id)}
                            className="bg-brand text-black font-bold uppercase text-[9px] px-2 py-1 rounded hover:bg-brand-light transition-all font-mono"
                          >
                            Complete
                          </button>
                        )}
                        {log.status === "Completed" && (
                          <span className="text-[10px] text-theme-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-theme-muted font-mono text-xs">
                NO MAINTENANCE LOGS FOUND IN THE DATABASE.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// 5. Safety Officer component: Driver Registry
export const DriverRegistry = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("LMV");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [contact, setContact] = useState("");
  const [tripCompletionPct, setTripCompletionPct] = useState("");
  const [safetyScore, setSafetyScore] = useState("");
  const [status, setStatus] = useState("Available");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const token = useAuthStore((state) => state.token);

  // Queries
  const { data: drivers, isLoading, refetch } = useQuery({
    queryKey: ["fleetDrivers"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/drivers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
    }));
  };

  const handleExportDriversPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TRANSITOPS DRIVER SAFETY REPORT", 15, 25);
    doc.setTextColor(82, 82, 91);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
    doc.text(`Total Drivers: ${(drivers || []).length}`, 15, 62);

    doc.setFont("helvetica", "bold");
    doc.text("DRIVER ROSTER", 15, 80);
    doc.line(15, 82, 195, 82);

    let yPos = 92;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    (drivers || []).forEach((d, i) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const expDate = new Date(d.licenseExpiry).toLocaleDateString();
      const expired = new Date(d.licenseExpiry) < new Date() ? " [EXPIRED]" : "";
      doc.text(`${i + 1}. ${d.name} | License: ${d.licenseNo} (${d.licenseCategory}) | Expiry: ${expDate}${expired} | Safety: ${d.safetyScore}% | Status: ${d.status}`, 15, yPos);
      yPos += 7;
    });

    doc.save(`Driver_Safety_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.post("http://localhost:5000/api/drivers", {
        name,
        licenseNo,
        licenseCategory,
        licenseExpiry,
        contact,
        tripCompletionPct: Number(tripCompletionPct) || 0,
        safetyScore: Number(safetyScore) || 100,
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg("Driver profile created successfully!");
      setIsModalOpen(false);
      // Reset Form
      setName("");
      setLicenseNo("");
      setLicenseCategory("LMV");
      setLicenseExpiry("");
      setContact("");
      setTripCompletionPct("");
      setSafetyScore("");
      setStatus("Available");
      refetch();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create driver");
    }
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const getFormattedDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Metrics
  const totalCount = (drivers || []).length;
  const expiredCount = (drivers || []).filter(d => isExpired(d.licenseExpiry)).length;
  const safetyRatingAvg = (drivers || []).reduce((acc, curr) => acc + (curr.safetyScore || 100), 0) / (totalCount || 1);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-theme-muted font-mono">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>LOADING SAFETY RECORDS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-theme-text">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Drivers & Safety Profiles</h2>
          <p className="text-sm text-theme-muted mt-1">Driver licensing, safety scores, and rosters tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportDriversPDF}
            className="bg-dark-surface border border-dark-border text-white font-bold font-mono text-xs uppercase px-4 py-2 rounded shadow hover:bg-dark-hoverBg flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand text-black font-bold font-mono text-xs uppercase px-4 py-2 rounded shadow hover:bg-brand-light flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-950/40 border border-green-500/30 p-3.5 rounded text-xs text-green-400 font-mono">
          {successMsg}
        </div>
      )}

      {/* ADD DRIVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-theme-panel border border-dark-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border/40 pb-3">
              <h3 className="font-bold text-white font-mono text-sm uppercase">Add Driver Record</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-theme-muted hover:text-white font-mono text-sm">✕</button>
            </div>
            
            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 p-3 rounded text-[10px] text-red-400 font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Driver Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">License No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-88213"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Category</label>
                  <select
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="LMV">LMV</option>
                    <option value="HMV">HMV</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Contact Info</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 98765xxxxx"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Trip Completion %</label>
                  <input
                    type="number"
                    placeholder="e.g. 96"
                    value={tripCompletionPct}
                    onChange={(e) => setTripCompletionPct(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Safety Score (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Roster Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="OnTrip">On Trip</option>
                    <option value="OffDuty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-black font-bold uppercase py-2.5 rounded hover:bg-brand-light tracking-wide text-xs mt-4 transition-colors"
              >
                Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card
          title="Total Registered Officers"
          value={`${totalCount} Officers`}
          desc="On file driver roster"
          icon={Users}
        />
        <Card
          title="License Alerts"
          value={`${expiredCount} Expired`}
          desc="License validation failure"
          icon={ShieldAlert}
          color={expiredCount > 0 ? "text-red-400" : "text-green-400"}
        />
        <Card
          title="Depot Safety Index"
          value={`${Math.round(safetyRatingAvg)}% Avg`}
          desc="Calculated on safety points"
          icon={BarChart3}
          color="text-blue-400"
        />
      </div>

      {/* TABLE */}
      <div className="bg-theme-panel border border-dark-border rounded p-6 shadow">
        <div className="overflow-x-auto">
          {(drivers || []).length > 0 ? (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-dark-border pb-3 text-theme-muted text-[10px] uppercase">
                  <SortableHeader label="Driver" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <th>License No.</th>
                  <th>Category</th>
                  <SortableHeader label="Expiry" sortKey="licenseExpiry" sortConfig={sortConfig} onSort={handleSort} />
                  <th>Contact</th>
                  <th>Trip Compl.</th>
                  <SortableHeader label="Safety" sortKey="safetyScore" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-theme-text">
                {[...(drivers || [])].sort((a, b) => {
                  if (!sortConfig.key) return 0;
                  let aVal = a[sortConfig.key];
                  let bVal = b[sortConfig.key];
                  if (typeof aVal === "string") aVal = aVal.toLowerCase();
                  if (typeof bVal === "string") bVal = bVal.toLowerCase();
                  if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
                  if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
                  return 0;
                }).map(d => {
                  const expired = isExpired(d.licenseExpiry);
                  return (
                    <tr key={d._id} className="hover:bg-dark-hoverBg/25 transition-colors">
                      <td className="py-3 text-white font-bold">{d.name}</td>
                      <td className="font-semibold">{d.licenseNo}</td>
                      <td>{d.licenseCategory}</td>
                      <td>
                        <span className={expired ? "text-amber-500 font-bold" : ""}>
                          {getFormattedDate(d.licenseExpiry)} {expired && "EXPIRED"}
                        </span>
                      </td>
                      <td className="text-theme-muted">{d.contact}</td>
                      <td className="font-mono tracking-tight">{d.tripCompletionPct || 0}%</td>
                      <td>
                        {d.status === "Suspended" ? (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400">Suspended</span>
                        ) : d.status === "OnTrip" ? (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400 bg-blue-500/10 text-blue-400 border-blue-500/20">On Trip</span>
                        ) : (
                          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400">Available</span>
                        )}
                      </td>
                      <td className="text-right">
                        {d.status === "Available" && <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400">Available</span>}
                        {d.status === "OnTrip" && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400 bg-blue-500/10 text-blue-400 border-blue-500/20">On Trip</span>}
                        {d.status === "OffDuty" && <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400 bg-gray-500/10 text-gray-400 border-gray-500/20">Off Duty</span>}
                        {d.status === "Suspended" && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand">Suspended</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-theme-muted font-mono text-xs">
              NO REGISTERED DRIVER RECORDS FOUND.
            </div>
          )}
        </div>
      </div>

      {/* Toggle visual status legend at bottom */}
      <div className="bg-theme-panel border border-dark-border p-4 rounded shadow space-y-2">
        <span className="text-[10px] text-theme-muted font-mono uppercase font-bold tracking-widest block text-center">Toggle Status Legend</span>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400 uppercase font-mono text-[9px]">Available</span>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400 bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase font-mono text-[9px]">On Trip</span>
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400 bg-gray-500/10 text-gray-400 border-gray-500/20 uppercase font-mono text-[9px]">Off Duty</span>
          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand uppercase font-mono text-[9px]">Suspended</span>
        </div>
      </div>

      <div className="text-[10px] text-amber-500/80 font-mono uppercase text-center font-semibold tracking-wider">
        Rule: Expired license or Suspended status ➔ blocked from trip assignment
      </div>

    </div>
  );
};

// 6. Safety Officer component: Compliance
export const ComplianceLogs = () => {
  const token = useAuthStore((state) => state.token);
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [approvedVehicles, setApprovedVehicles] = useState([]);

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ["complianceDrivers"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/drivers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["complianceVehicles"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: maintenance } = useQuery({
    queryKey: ["complianceMaintenance"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/maintenance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  if (driversLoading || vehiclesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-theme-muted font-mono">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>COMPILING COMPLIANCE DATA...</span>
      </div>
    );
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Filter Drivers with issues
  const expiredDrivers = (drivers || []).filter(d => new Date(d.licenseExpiry) < now);
  const expiringSoonDrivers = (drivers || []).filter(d => {
    const exp = new Date(d.licenseExpiry);
    return exp >= now && exp <= thirtyDaysFromNow;
  });
  const lowSafetyDrivers = (drivers || []).filter(d => (d.safetyScore || 100) < 85);

  // Aggregate repair logs for vehicles
  const maintenanceCosts = {};
  (maintenance || []).forEach(log => {
    const vId = log.vehicleId?._id || log.vehicleId;
    if (vId) {
      maintenanceCosts[vId] = (maintenanceCosts[vId] || 0) + (log.cost || 0);
    }
  });

  // Filter Vehicles with issues (Retired or Depreciation Alert)
  const depreciationAlertVehicles = (vehicles || []).filter(v => {
    const repairsCost = maintenanceCosts[v._id] || 0;
    return repairsCost >= (v.acquisitionCost || 0) * 0.5;
  });

  const unapprovedDriversCount = expiredDrivers.filter(d => !approvedDrivers.includes(d._id)).length +
                                 expiringSoonDrivers.filter(d => !approvedDrivers.includes(d._id)).length +
                                 lowSafetyDrivers.filter(d => !approvedDrivers.includes(d._id)).length;
  
  const unapprovedVehiclesCount = depreciationAlertVehicles.filter(v => !approvedVehicles.includes(v._id)).length;

  const totalComplianceScore = Math.max(0, 100 - 
    (expiredDrivers.filter(d => !approvedDrivers.includes(d._id)).length * 15) - 
    (expiringSoonDrivers.filter(d => !approvedDrivers.includes(d._id)).length * 5) - 
    (lowSafetyDrivers.filter(d => !approvedDrivers.includes(d._id)).length * 10) -
    (depreciationAlertVehicles.filter(v => !approvedVehicles.includes(v._id)).length * 10)
  );

  return (
    <div className="space-y-6 text-theme-text text-sm">
      <div>
        <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Compliance & Safety Engine</h2>
        <p className="text-sm text-theme-muted mt-1">Auto-generated audit reports, driver credentials monitoring, and asset waiver flags.</p>
      </div>

      {/* Overview Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-theme-panel border border-dark-border p-4 rounded-xl shadow hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Compliance Index</span>
          <span className={`text-2xl font-bold block mt-1 font-mono ${totalComplianceScore > 80 ? 'text-green-400' : totalComplianceScore > 50 ? 'text-amber-400' : 'text-red-400'}`}>{totalComplianceScore}%</span>
          <span className="text-xs text-theme-muted block mt-2">Overall fleet status score</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded-xl shadow border-l-2 border-l-red-500 hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Expired Licenses</span>
          <span className="text-2xl font-bold block mt-1 text-red-400 font-mono">
            {expiredDrivers.filter(d => !approvedDrivers.includes(d._id)).length}
          </span>
          <span className="text-xs text-theme-muted block mt-2">Active blocked dispatches</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded-xl shadow border-l-2 border-l-amber-500 hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Expiring Licenses</span>
          <span className="text-2xl font-bold block mt-1 text-amber-400 font-mono">
            {expiringSoonDrivers.filter(d => !approvedDrivers.includes(d._id)).length}
          </span>
          <span className="text-xs text-theme-muted block mt-2">Expires within 30 days</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded-xl shadow border-l-2 border-l-brand hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Critical Safety</span>
          <span className="text-2xl font-bold block mt-1 text-brand font-mono">
            {lowSafetyDrivers.filter(d => !approvedDrivers.includes(d._id)).length}
          </span>
          <span className="text-xs text-theme-muted block mt-2">Safety Score &lt; 85%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DRIVERS CRITICAL COMPLIANCE */}
        <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded-xl shadow space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" /> Driver Credentials Verification
          </h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {expiredDrivers.map(d => {
              const isApproved = approvedDrivers.includes(d._id);
              return (
                <div key={d._id} className={`flex justify-between items-center p-2.5 rounded-lg border transition-all ${isApproved ? 'bg-green-950/10 border-green-500/20' : 'bg-red-950/20 border-red-500/30'}`}>
                  <div>
                    <span className="font-bold text-white block">{d.name}</span>
                    <span className={`text-[10px] font-bold block mt-0.5 ${isApproved ? 'text-green-400' : 'text-red-400'}`}>
                      {isApproved ? "VERIFIED WAIVER APPROVED" : `LICENSE EXPIRED (${new Date(d.licenseExpiry).toLocaleDateString()})`}
                    </span>
                  </div>
                  {isApproved ? (
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400 uppercase text-[8px]">Waived</span>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setApprovedDrivers([...approvedDrivers, d._id])}
                        className="bg-brand text-black font-bold uppercase text-[9px] px-2 py-1 rounded hover:bg-brand-light transition-all"
                      >
                        Verify Waiver
                      </button>
                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand uppercase text-[8px]">Blocked</span>
                    </div>
                  )}
                </div>
              );
            })}
            
            {expiringSoonDrivers.map(d => {
              const isApproved = approvedDrivers.includes(d._id);
              return (
                <div key={d._id} className={`flex justify-between items-center p-2.5 rounded-lg border transition-all ${isApproved ? 'bg-green-950/10 border-green-500/20' : 'bg-amber-950/20 border-amber-500/30'}`}>
                  <div>
                    <span className="font-bold text-white block">{d.name}</span>
                    <span className={`text-[10px] block mt-0.5 ${isApproved ? 'text-green-400' : 'text-amber-400'}`}>
                      {isApproved ? "RENEWAL SCHEDULE VERIFIED" : `Expires soon on ${new Date(d.licenseExpiry).toLocaleDateString()}`}
                    </span>
                  </div>
                  {isApproved ? (
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400 uppercase text-[8px]">Waived</span>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setApprovedDrivers([...approvedDrivers, d._id])}
                        className="bg-brand text-black font-bold uppercase text-[9px] px-2 py-1 rounded hover:bg-brand-light transition-all"
                      >
                        Approve
                      </button>
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-400 uppercase text-[8px]">Renew</span>
                    </div>
                  )}
                </div>
              );
            })}

            {lowSafetyDrivers.map(d => {
              const isApproved = approvedDrivers.includes(d._id);
              return (
                <div key={d._id} className={`flex justify-between items-center p-2.5 rounded-lg border transition-all ${isApproved ? 'bg-green-950/10 border-green-500/20' : 'bg-dark-surface border-dark-border'}`}>
                  <div>
                    <span className="font-bold text-white block">{d.name}</span>
                    <span className={`text-[10px] font-bold block mt-0.5 ${isApproved ? 'text-green-400' : 'text-brand'}`}>
                      {isApproved ? "MONITORING LOGS UPDATED" : `SAFETY RATING: ${d.safetyScore}%`}
                    </span>
                  </div>
                  {isApproved ? (
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400 uppercase text-[8px]">Waived</span>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setApprovedDrivers([...approvedDrivers, d._id])}
                        className="bg-brand text-black font-bold uppercase text-[9px] px-2 py-1 rounded hover:bg-brand-light transition-all"
                      >
                        Verify Roster
                      </button>
                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand uppercase text-[8px]">Monitor</span>
                    </div>
                  )}
                </div>
              );
            })}

            {expiredDrivers.length === 0 && expiringSoonDrivers.length === 0 && lowSafetyDrivers.length === 0 && (
              <div className="py-12 text-center text-theme-muted">All active drivers are fully compliant.</div>
            )}
          </div>
        </div>

        {/* VEHICLE DEPRECIATION & FLEET INTEGRITY */}
        <div className="bg-theme-panel border border-dark-border p-4 sm:p-6 rounded-xl shadow space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand" /> Vehicle Depreciation & Cost Warnings
          </h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {depreciationAlertVehicles.map(v => {
              const repairs = maintenanceCosts[v._id] || 0;
              const isApproved = approvedVehicles.includes(v._id);
              return (
                <div key={v._id} className={`flex justify-between items-center p-2.5 rounded-lg border transition-all ${isApproved ? 'bg-green-950/10 border-green-500/20' : 'bg-red-950/20 border-red-500/30'}`}>
                  <div>
                    <span className="font-bold text-white block">{v.registrationNo} — {v.name}</span>
                    <span className={`text-[10px] block mt-0.5 ${isApproved ? 'text-green-400' : 'text-red-400'}`}>
                      {isApproved ? "DEPRECIATION AMORTIZATION APPROVED" : `Repairs (₹${repairs.toLocaleString()}) >= 50% cost (₹${v.acquisitionCost.toLocaleString()})`}
                    </span>
                  </div>
                  {isApproved ? (
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-green-600 dark:text-green-400 uppercase text-[8px]">Waived</span>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setApprovedVehicles([...approvedVehicles, v._id])}
                        className="bg-brand text-black font-bold uppercase text-[9px] px-2 py-1 rounded hover:bg-brand-light transition-all"
                      >
                        Verify Costs
                      </button>
                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-brand uppercase text-[8px]">Depreciated</span>
                    </div>
                  )}
                </div>
              );
            })}
            {depreciationAlertVehicles.length === 0 && (
              <div className="py-12 text-center text-theme-muted">All vehicle assets are performing within normal cost profiles.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 7. Financial Analyst component: Fuel & Expenses
export const FuelExpenses = () => {
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [sortConfigFuel, setSortConfigFuel] = useState({ key: null, dir: "asc" });
  const [sortConfigExpense, setSortConfigExpense] = useState({ key: null, dir: "asc" });

  // Fuel Form State
  const [fuelVehicle, setFuelVehicle] = useState("");
  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [fuelDate, setFuelDate] = useState("");

  // Expense Form State
  const [expTrip, setExpTrip] = useState("");
  const [expVehicle, setExpVehicle] = useState("");
  const [expToll, setExpToll] = useState("");
  const [expOther, setExpOther] = useState("");
  const [expMaint, setExpMaint] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const token = useAuthStore((state) => state.token);

  // Queries
  const { data: expenseData, refetch } = useQuery({
    queryKey: ["expensesData"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: vehicles } = useQuery({
    queryKey: ["expenseVehicles"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: trips } = useQuery({
    queryKey: ["expenseTrips"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/trips", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const handleLogFuel = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.post("http://localhost:5000/api/expenses/fuel", {
        vehicleId: fuelVehicle,
        liters: Number(fuelLiters),
        cost: Number(fuelCost),
        date: fuelDate || new Date()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg("Fuel log added successfully!");
      setIsFuelModalOpen(false);
      setFuelVehicle("");
      setFuelLiters("");
      setFuelCost("");
      setFuelDate("");
      refetch();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to log fuel");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axios.post("http://localhost:5000/api/expenses/other", {
        tripId: expTrip || null,
        vehicleId: expVehicle,
        toll: Number(expToll) || 0,
        other: Number(expOther) || 0,
        maintenanceCost: Number(expMaint) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg("Expense record added successfully!");
      setIsExpenseModalOpen(false);
      setExpTrip("");
      setExpVehicle("");
      setExpToll("");
      setExpOther("");
      setExpMaint("");
      refetch();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to add expense");
    }
  };

  const getFormattedDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const { fuelLogs = [], otherExpenses = [], metrics = {} } = expenseData || {};

  const handleExportFuelCSV = () => {
    const headers = ["Vehicle", "Date", "Liters", "Cost (INR)"];
    const rows = (fuelLogs || []).map(log => [
      log.vehicleId ? log.vehicleId.registrationNo : "—",
      getFormattedDate(log.date),
      `${log.liters} L`,
      log.cost
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fuel_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExpensesCSV = () => {
    const headers = ["Trip", "Vehicle", "Toll (INR)", "Other (INR)", "Maintenance Linked (INR)", "Total (INR)"];
    const rows = (otherExpenses || []).map(exp => [
      exp.tripId ? exp.tripId.tripId : "—",
      exp.vehicleId ? exp.vehicleId.registrationNo : "—",
      exp.toll,
      exp.other,
      exp.maintenanceCost,
      exp.total
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Other_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSortFuel = (key) => {
    setSortConfigFuel(prev => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
    }));
  };

  const handleSortExpense = (key) => {
    setSortConfigExpense(prev => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
    }));
  };

  const handleExportFinancialReportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TRANSITOPS FINANCIAL REPORT", 15, 25);
    doc.setTextColor(82, 82, 91);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
    doc.text(`Total Operational Cost: INR ${Number(metrics.totalOperationalCost || 0).toLocaleString()}`, 15, 62);

    doc.setFont("helvetica", "bold");
    doc.text("FUEL LOG ENTRIES", 15, 80);
    doc.line(15, 82, 195, 82);

    let yPos = 92;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    (fuelLogs || []).forEach((log, i) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const reg = log.vehicleId ? log.vehicleId.registrationNo : "—";
      doc.text(`${i + 1}. Vehicle: ${reg} | Date: ${getFormattedDate(log.date)} | Liters: ${log.liters} L | Cost: INR ${log.cost}`, 15, yPos);
      yPos += 7;
    });

    yPos += 10;
    if (yPos > 260) { doc.addPage(); yPos = 20; }
    doc.setFont("helvetica", "bold");
    doc.text("OTHER OPERATIONS EXPENSES", 15, yPos);
    doc.line(15, yPos + 2, 195, yPos + 2);
    yPos += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    (otherExpenses || []).forEach((exp, i) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const trip = exp.tripId ? exp.tripId.tripId : "—";
      const reg = exp.vehicleId ? exp.vehicleId.registrationNo : "—";
      doc.text(`${i + 1}. Trip: ${trip} | Vehicle: ${reg} | Toll: INR ${exp.toll} | Other: INR ${exp.other} | Maint: INR ${exp.maintenanceCost} | Total: INR ${exp.total}`, 15, yPos);
      yPos += 7;
    });

    doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 text-theme-text text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Fuel & Expense Management</h2>
          <p className="text-sm text-theme-muted mt-1">Log vehicle fuel inputs, tolls, maintenance costs, and aggregate operations expenses.</p>
        </div>
        <button
          onClick={handleExportFinancialReportPDF}
          className="bg-brand text-black font-bold font-mono text-xs uppercase px-4 py-2 rounded shadow hover:bg-brand-light flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" /> Export Report (PDF)
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/30 p-3 rounded text-red-400 font-mono">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-950/40 border border-green-500/30 p-3 rounded text-green-400 font-mono">
          {successMsg}
        </div>
      )}

      {/* FUEL MODAL */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-theme-panel border border-dark-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border/40 pb-3">
              <h3 className="font-bold text-white font-mono text-sm uppercase">Log Fuel Input</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-theme-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handleLogFuel} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Vehicle</label>
                <select
                  value={fuelVehicle}
                  onChange={(e) => setFuelVehicle(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {(vehicles || []).map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNo} — {v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Liters (L)</label>
                  <input
                    type="number"
                    placeholder="e.g. 42"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Fuel Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 3150"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-theme-muted uppercase font-bold">Log Date</label>
                <input
                  type="date"
                  value={fuelDate}
                  onChange={(e) => setFuelDate(e.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-black font-bold uppercase py-2.5 rounded hover:bg-brand-light transition-colors text-xs"
              >
                Log Fuel Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-theme-panel border border-dark-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border/40 pb-3">
              <h3 className="font-bold text-white font-mono text-sm uppercase">Log Operational Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-theme-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Linked Trip</label>
                  <select
                    value={expTrip}
                    onChange={(e) => setExpTrip(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="">Unlinked / None</option>
                    {(trips || []).map(t => (
                      <option key={t._id} value={t._id}>{t.tripId} ({t.source} ➔ {t.destination})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-theme-muted uppercase font-bold">Vehicle</label>
                  <select
                    value={expVehicle}
                    onChange={(e) => setExpVehicle(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {(vehicles || []).map(v => (
                      <option key={v._id} value={v._id}>{v.registrationNo} — {v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] text-theme-muted uppercase font-bold">Toll cost (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={expToll}
                    onChange={(e) => setExpToll(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-theme-muted uppercase font-bold">Other (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={expOther}
                    onChange={(e) => setExpOther(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-theme-muted uppercase font-bold">Maint. (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 18000"
                    value={expMaint}
                    onChange={(e) => setExpMaint(e.target.value)}
                    className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-black font-bold uppercase py-2.5 rounded hover:bg-brand-light transition-colors text-xs"
              >
                Log Expense Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FUEL LOGS SECTION */}
      <div className="bg-theme-panel border border-dark-border rounded p-6 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-white font-mono tracking-wider">Fuel Logs</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFuelCSV}
              className="bg-dark-surface border border-dark-border text-white text-[10px] uppercase px-3 py-1.5 rounded hover:bg-dark-hoverBg flex items-center gap-1 transition-colors font-bold"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => setIsFuelModalOpen(true)}
              className="bg-brand text-black font-bold text-[10px] uppercase px-3 py-1.5 rounded hover:bg-brand-light flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Log Fuel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {fuelLogs.length > 0 ? (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-dark-border pb-2.5 text-theme-muted text-[10px] uppercase">
                  <SortableHeader label="Vehicle" sortKey="vehicleId" sortConfig={sortConfigFuel} onSort={handleSortFuel} />
                  <SortableHeader label="Date" sortKey="date" sortConfig={sortConfigFuel} onSort={handleSortFuel} />
                  <SortableHeader label="Liters" sortKey="liters" sortConfig={sortConfigFuel} onSort={handleSortFuel} />
                  <SortableHeader label="Fuel Cost (₹)" sortKey="cost" sortConfig={sortConfigFuel} onSort={handleSortFuel} className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-theme-text">
                {[...fuelLogs].sort((a, b) => {
                  if (!sortConfigFuel.key) return 0;
                  let aVal = sortConfigFuel.key === "vehicleId" ? (a.vehicleId?.registrationNo || "") : a[sortConfigFuel.key];
                  let bVal = sortConfigFuel.key === "vehicleId" ? (b.vehicleId?.registrationNo || "") : b[sortConfigFuel.key];
                  if (typeof aVal === "string") aVal = aVal.toLowerCase();
                  if (typeof bVal === "string") bVal = bVal.toLowerCase();
                  if (aVal < bVal) return sortConfigFuel.dir === "asc" ? -1 : 1;
                  if (aVal > bVal) return sortConfigFuel.dir === "asc" ? 1 : -1;
                  return 0;
                }).map(log => (
                  <tr key={log._id} className="hover:bg-dark-hoverBg/20">
                    <td className="py-2.5 font-bold text-white">
                      {log.vehicleId ? log.vehicleId.registrationNo : "—"}
                    </td>
                    <td>{getFormattedDate(log.date)}</td>
                    <td>{log.liters} L</td>
                    <td className="text-right font-bold text-brand">₹{Number(log.cost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-6 text-center text-theme-muted font-mono">NO FUEL LOGS REGISTERED.</div>
          )}
        </div>
      </div>

      {/* OTHER EXPENSES SECTION */}
      <div className="bg-theme-panel border border-dark-border rounded p-6 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-white font-mono tracking-wider">Other Expenses (Toll / Misc)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExpensesCSV}
              className="bg-dark-surface border border-dark-border text-white text-[10px] uppercase px-3 py-1.5 rounded hover:bg-dark-hoverBg flex items-center gap-1 transition-colors font-bold"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-brand text-black font-bold text-[10px] uppercase px-3 py-1.5 rounded hover:bg-brand-light flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {otherExpenses.length > 0 ? (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-dark-border pb-2.5 text-theme-muted text-[10px] uppercase">
                  <SortableHeader label="Trip" sortKey="tripId" sortConfig={sortConfigExpense} onSort={handleSortExpense} />
                  <SortableHeader label="Vehicle" sortKey="vehicleId" sortConfig={sortConfigExpense} onSort={handleSortExpense} />
                  <SortableHeader label="Toll (₹)" sortKey="toll" sortConfig={sortConfigExpense} onSort={handleSortExpense} />
                  <SortableHeader label="Other (₹)" sortKey="other" sortConfig={sortConfigExpense} onSort={handleSortExpense} />
                  <SortableHeader label="Maint. (Linked)" sortKey="maintenanceCost" sortConfig={sortConfigExpense} onSort={handleSortExpense} />
                  <SortableHeader label="Total (₹)" sortKey="total" sortConfig={sortConfigExpense} onSort={handleSortExpense} className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-theme-text">
                {[...otherExpenses].sort((a, b) => {
                  if (!sortConfigExpense.key) return 0;
                  let aVal = sortConfigExpense.key === "tripId" ? (a.tripId?.tripId || "") : sortConfigExpense.key === "vehicleId" ? (a.vehicleId?.registrationNo || "") : a[sortConfigExpense.key];
                  let bVal = sortConfigExpense.key === "tripId" ? (b.tripId?.tripId || "") : sortConfigExpense.key === "vehicleId" ? (b.vehicleId?.registrationNo || "") : b[sortConfigExpense.key];
                  if (typeof aVal === "string") aVal = aVal.toLowerCase();
                  if (typeof bVal === "string") bVal = bVal.toLowerCase();
                  if (aVal < bVal) return sortConfigExpense.dir === "asc" ? -1 : 1;
                  if (aVal > bVal) return sortConfigExpense.dir === "asc" ? 1 : -1;
                  return 0;
                }).map(exp => (
                  <tr key={exp._id} className="hover:bg-dark-hoverBg/20">
                    <td className="py-2.5 text-white font-bold">{exp.tripId ? exp.tripId.tripId : "—"}</td>
                    <td>{exp.vehicleId ? exp.vehicleId.registrationNo : "—"}</td>
                    <td>₹{Number(exp.toll).toLocaleString()}</td>
                    <td>₹{Number(exp.other).toLocaleString()}</td>
                    <td>₹{Number(exp.maintenanceCost).toLocaleString()}</td>
                    <td className="text-right font-bold text-brand">₹{Number(exp.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-6 text-center text-theme-muted font-mono">NO OTHER EXPENSE LOGS REGISTERED.</div>
          )}
        </div>
      </div>

      {/* TOTAL COST COUNTER */}
      <div className="bg-brand/10 border border-brand/20 p-4 rounded shadow flex items-center justify-between text-brand text-sm font-bold uppercase">
        <span>Total Operational Cost (Auto) = Fuel + Maint + Tolls</span>
        <span className="text-xl font-mono tracking-tight font-bold">
          ₹{Number(metrics.totalOperationalCost || 0).toLocaleString()}
        </span>
      </div>

    </div>
  );
};

// 8. Financial Analyst component: Analytics Dashboard
export const AnalyticsDashboard = () => {
  const token = useAuthStore((state) => state.token);

  // Queries
  const { data: expenseData } = useQuery({
    queryKey: ["analyticsExpenses"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["analyticsDashboard"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    }
  });

  const { metrics: expMetrics = {} } = expenseData || {};
  const { metrics: dbMetrics = {} } = dashboardData || {};

  // Operational metrics
  const utilization = dbMetrics.fleetUtilization || 81;
  const opCost = expMetrics.totalOperationalCost || 34070;

  const handleExportOperationalReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(24, 24, 27); // Dark zinc header
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TRANSITOPS OPERATIONS REPORT", 15, 25);
    
    doc.setTextColor(82, 82, 91);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 55);
    doc.text(`Operational Status: Active`, 15, 62);
    
    // Core KPIs
    doc.setFont("helvetica", "bold");
    doc.text("KEY PERFORMANCE INDICATORS (KPIs)", 15, 80);
    doc.line(15, 82, 195, 82);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Fleet Utilization Index:`, 15, 92);
    doc.text(`${utilization}%`, 150, 92);
    
    doc.text(`Total Operational Cost (Fuel + Repairs + Tolls):`, 15, 99);
    doc.text(`INR ${Number(opCost).toLocaleString()}`, 150, 99);
    
    doc.text(`Average Fleet Fuel Efficiency:`, 15, 106);
    doc.text(`8.4 km/l`, 150, 106);
    
    doc.text(`Annualized Yield (ROI):`, 15, 113);
    doc.text(`14.2%`, 150, 113);
    
    // Financials
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL SUMMARY MATRIX", 15, 130);
    doc.line(15, 132, 195, 132);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Simulated Monthly Revenue:`, 15, 142);
    doc.text(`INR 1,240,000`, 150, 142);
    doc.text(`Simulated Cost Base:`, 15, 149);
    doc.text(`INR 385,000`, 150, 149);
    doc.text(`Estimated Net Profit:`, 15, 156);
    doc.text(`INR 855,000`, 150, 156);
    
    doc.line(15, 160, 195, 160);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Report generated by TransitOps portal. Strictly confidential operational audit document.", 15, 180);

    doc.save(`TransitOps_Operations_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 text-theme-text text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-theme-muted mt-1">Operational efficiency, fleet yields, and costs tracking ledger.</p>
        </div>
        <button
          onClick={handleExportOperationalReport}
          className="bg-brand text-black font-bold font-mono text-xs uppercase px-4 py-2 rounded shadow hover:bg-brand-light flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" /> Export Report (PDF)
        </button>
      </div>

      {/* Grid of stats (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Fuel Efficiency</span>
          <span className="text-2xl font-bold block mt-1 font-mono text-white">8.4 km/l</span>
          <span className="text-xs text-theme-muted block mt-2">Avg across active dispatches</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow border-l-2 border-l-green-500 hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Fleet Utilization</span>
          <span className="text-2xl font-bold block mt-1 font-mono text-white">{utilization}%</span>
          <span className="text-xs text-theme-muted block mt-2">Active dispatches ratio</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow border-l-2 border-l-amber-500 hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Operational Cost</span>
          <span className="text-2xl font-bold block mt-1 font-mono text-white">₹{Number(opCost).toLocaleString()}</span>
          <span className="text-xs text-theme-muted block mt-2">Sum of fuel + maintenance + tolls</span>
        </div>

        <div className="bg-theme-panel border border-dark-border p-4 rounded shadow border-l-2 border-l-brand hover:border-brand/40 transition-colors">
          <span className="text-xs text-theme-muted font-sans font-semibold block uppercase tracking-wider">Vehicle ROI</span>
          <span className="text-2xl font-bold block mt-1 font-mono text-white">14.2%</span>
          <span className="text-xs text-theme-muted block mt-2">Annualized yield index</span>
        </div>
      </div>

      <div className="text-xs text-theme-muted uppercase tracking-wider text-center mt-2 border-b border-dark-border/40 pb-4 font-semibold">
        ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MONTHLY REVENUE (col-span-7) */}
        <div className="lg:col-span-7 bg-theme-panel border border-dark-border p-4 sm:p-6 rounded shadow space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Monthly Revenue</h3>
          
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { month: "Jan", Revenue: 55000 },
                  { month: "Feb", Revenue: 70000 },
                  { month: "Mar", Revenue: 60000 },
                  { month: "Apr", Revenue: 85000 },
                  { month: "May", Revenue: 78000 },
                  { month: "Jun", Revenue: 95000 },
                  { month: "Jul", Revenue: 90000 }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.3} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#141519", borderColor: "#23252a", fontSize: "10px", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP COSTLIEST VEHICLES (col-span-5) */}
        <div className="lg:col-span-5 bg-theme-panel border border-dark-border p-4 sm:p-6 rounded shadow space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Top Costliest Vehicles (Repairs)</h3>
          
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[
                  { vehicle: "TRK-12", cost: 18000 },
                  { vehicle: "MINI-08", cost: 6200 },
                  { vehicle: "VAN-05", cost: 2500 }
                ]}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis dataKey="vehicle" type="category" stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: "10px" }} />
                <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

// 9. Common component: Settings
export const SystemSettings = () => {
  const [depotName, setDepotName] = useState("Gandhinagar Depot GJ4");
  const [currency, setCurrency] = useState("INR");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [success, setSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-theme-text text-sm">
      <div>
        <h2 className="text-2xl font-bold text-theme-text uppercase tracking-tight">Settings & RBAC</h2>
        <p className="text-sm text-theme-muted mt-1">Configure global transport operations parameters and role permissions registry.</p>
      </div>

      {success && (
        <div className="bg-green-950/40 border border-green-500/30 p-3 rounded text-green-400 font-mono uppercase tracking-wider">
          Settings changes saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GENERAL SETTINGS FORM (col-span-5) */}
        <div className="lg:col-span-5 bg-theme-panel border border-dark-border p-4 sm:p-6 rounded shadow space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">General Settings</h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] text-theme-muted uppercase font-bold">Depot Name</label>
              <input
                type="text"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-theme-muted uppercase font-bold">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-theme-muted uppercase font-bold">Distance Unit</label>
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-theme-panel px-3 py-2 text-sm text-theme-text shadow-sm transition-colors placeholder:text-theme-muted focus:border-brand focus:outline-none cursor-pointer"
              >
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-brand text-black font-bold uppercase py-2 rounded hover:bg-brand-light transition-all text-xs"
            >
              Save changes
            </button>
          </form>
        </div>

        {/* RBAC MATRIX (col-span-7) */}
        <div className="lg:col-span-7 bg-theme-panel border border-dark-border p-4 sm:p-6 rounded shadow space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Role-Based Access (RBAC)</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-dark-border pb-3 text-theme-muted text-[10px] uppercase">
                  <th className="py-2.5">Role</th>
                  <th>Fleet</th>
                  <th>Driver</th>
                  <th>Trips</th>
                  <th>Fuel/Exp.</th>
                  <th>Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-theme-text">
                <tr>
                  <td className="py-3 font-bold text-white">Fleet Manager</td>
                  <td className="text-green-500 font-bold">✓</td>
                  <td className="text-green-500 font-bold">✓</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-green-500 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-white">Driver</td>
                  <td className="text-blue-400 font-bold">View</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-green-500 font-bold">✓</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-theme-muted">—</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-white">Safety Officer</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-green-500 font-bold">✓</td>
                  <td className="text-blue-400 font-bold">View</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-theme-muted">—</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-white">Financial Analyst</td>
                  <td className="text-blue-400 font-bold">View</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-theme-muted">—</td>
                  <td className="text-green-500 font-bold">✓</td>
                  <td className="text-green-500 font-bold">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

