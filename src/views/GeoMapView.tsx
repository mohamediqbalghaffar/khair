import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { GOVERNORATE_STATS } from '../data/initialData';
import { GovernorateStats, Beneficiary, NeedCategory } from '../types';
import { useApp } from '../context/AppContext';
import { KURDISTAN_REGION_GEOJSON, REGION_CENTERS } from '../data/kurdistanGeoJson';
import {
  MapPin,
  Users,
  FolderKanban,
  Sparkles,
  TrendingUp,
  Award,
  Compass,
  ArrowUpRight,
  ChevronRight,
  Maximize2,
  Minimize2,
  Home,
  Crosshair,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Check,
  Copy,
  Layers,
  Eye,
  EyeOff,
  Navigation
} from 'lucide-react';

type MapTileStyle = 'street' | 'light' | 'satellite';

const NEED_CATEGORY_COLORS: Record<NeedCategory, { bg: string; text: string; border: string; hex: string; label: string }> = {
  poor: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', hex: '#059669', label: 'کەمدەرامەت' },
  orphan: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', hex: '#9333ea', label: 'بێباوک و هەتیو' },
  sick: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', hex: '#e11d48', label: 'نەخۆش و دەستکورت' },
  disabled: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', hex: '#d97706', label: 'خاوەن پێداویستی تایبەت' },
  student: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', hex: '#2563eb', label: 'خوێندکاری هەژار' },
  displaced: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', hex: '#475569', label: 'ئاوارە و لێقەوماو' }
};

export const GeoMapView: React.FC = () => {
  const {
    beneficiaries,
    projects,
    volunteers,
    setActiveTab,
    updateBeneficiary,
    addBeneficiary,
    mapFocusLocation,
    setMapFocusLocation
  } = useApp();

  const [selectedGov, setSelectedGov] = useState<string>('هەولێر');
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('street');
  const [showSatelliteLabels, setShowSatelliteLabels] = useState<boolean>(true);
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(8);
  const [sidebarTab, setSidebarTab] = useState<'gov' | 'houses'>('gov');
  const [houseSearchQuery, setHouseSearchQuery] = useState<string>('');
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Tagging State
  const [isTaggingMode, setIsTaggingMode] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false);
  const [tagModalMode, setTagModalMode] = useState<'existing' | 'new'>('existing');
  const [tagBeneficiarySearch, setTagBeneficiarySearch] = useState<string>('');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [houseLabelInput, setHouseLabelInput] = useState<string>('');
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  // New beneficiary quick registration fields
  const [newBenData, setNewBenData] = useState({
    fullName: '',
    phone: '',
    governorate: 'هەولێر' as Beneficiary['governorate'],
    needCategory: 'poor' as NeedCategory,
    address: ''
  });

  // Map DOM and instance references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const houseMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const houseMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayTileLayerRef = useRef<L.TileLayer | null>(null);
  const isTaggingModeRef = useRef<boolean>(isTaggingMode);

  useEffect(() => {
    isTaggingModeRef.current = isTaggingMode;
    const container = mapContainerRef.current;
    if (container) {
      if (isTaggingMode) {
        container.classList.add('tagging-mode-active');
      } else {
        container.classList.remove('tagging-mode-active');
        setCursorPos(null);
      }
    }
    mapInstanceRef.current?.invalidateSize();
  }, [isTaggingMode]);

  // Beneficiaries with tagged locations
  const taggedBeneficiaries = beneficiaries.filter(b => b.location && b.location.lat && b.location.lng);

  // Dynamically calculate governorate stats from actual system data
  const governorateStats: GovernorateStats[] = GOVERNORATE_STATS.map(gov => {
    const govBeneficiaries = beneficiaries.filter(b => b.governorate === gov.name);
    const totalAid = govBeneficiaries
      .flatMap(b => b.aidHistory)
      .reduce((sum, a) => sum + (a.amountIQD || 0), 0);
    const activeProjects = projects.filter(p => p.governorates.includes(gov.name) && p.status === 'active').length;
    const volCount = volunteers.filter(v => v.governorate === gov.name).length;

    return {
      ...gov,
      beneficiariesCount: govBeneficiaries.length,
      totalAidDistributedIQD: totalAid,
      activeProjectsCount: activeProjects,
      volunteersCount: volCount
    };
  });

  const activeStat = governorateStats.find(g => g.name === selectedGov) || governorateStats[0];
  const totalDistributedIQD = governorateStats.reduce((sum, g) => sum + g.totalAidDistributedIQD, 0);
  const totalBeneficiariesCount = governorateStats.reduce((sum, g) => sum + g.beneficiariesCount, 0);

  // Tile provider configurations (100% Free, High Resolution, NO Watermark, NO API Key)
  const getTileConfig = (style: MapTileStyle) => {
    switch (style) {
      case 'light':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; Topographic',
          maxNativeZoom: 19,
          maxZoom: 20
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri World Imagery',
          maxNativeZoom: 19,
          maxZoom: 20
        };
      case 'street':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: ['a', 'b', 'c'],
          maxNativeZoom: 19,
          maxZoom: 20
        };
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [36.19, 44.01],
        zoom: 8,
        minZoom: 6,
        maxZoom: 20, // Full deep zoom for houses, streets, alleys!
        zoomControl: false,
        attributionControl: false
      });

      // Clean Zoom Control on top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Base Tile Layer
      const tileConfig = getTileConfig(tileStyle);
      const baseLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains || 'abc',
        maxNativeZoom: tileConfig.maxNativeZoom || 19,
        maxZoom: tileConfig.maxZoom || 20
      }).addTo(map);
      baseTileLayerRef.current = baseLayer;

      // Layer groups for markers
      const regionalMarkersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = regionalMarkersGroup;

      const houseMarkersGroup = L.layerGroup().addTo(map);
      houseMarkersLayerRef.current = houseMarkersGroup;

      mapInstanceRef.current = map;

      // Track zoom level for dynamic styling
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Map Click Handler for Location Tagging
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!isTaggingModeRef.current) return;
        const { lat, lng } = e.latlng;
        setSelectedLatLng({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6))
        });
        setIsTagModalOpen(true);
        setIsTaggingMode(false);
        setCursorPos(null);
      });

      // Mouse Move Tracking for Precision Reticle HUD
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (!isTaggingModeRef.current) return;
        const containerPoint = map.latLngToContainerPoint(e.latlng);
        setCursorPos({
          x: containerPoint.x,
          y: containerPoint.y,
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6))
        });
      });

      map.on('mouseout', () => {
        setCursorPos(null);
      });

      setMapReady(true);

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // 2. Update Map Tiles when tileStyle or showSatelliteLabels changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old base layer
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    // Add new base layer
    const tileConfig = getTileConfig(tileStyle);
    const newBase = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abc',
      maxNativeZoom: tileConfig.maxNativeZoom || 19,
      maxZoom: tileConfig.maxZoom || 20
    }).addTo(map);
    baseTileLayerRef.current = newBase;

    // Manage Satellite Hybrid Labels Overlay
    if (overlayTileLayerRef.current) {
      map.removeLayer(overlayTileLayerRef.current);
      overlayTileLayerRef.current = null;
    }

    if (tileStyle === 'satellite' && showSatelliteLabels) {
      const overlayLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        {
          maxNativeZoom: 19,
          maxZoom: 20,
          opacity: 0.85
        }
      ).addTo(map);
      overlayTileLayerRef.current = overlayLayer;
    }
  }, [tileStyle, showSatelliteLabels]);

  // 3. Invalidate map size when full screen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  // 4. Listen to Escape key to exit full screen or tagging mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTaggingMode) setIsTaggingMode(false);
        else if (isFullScreen) setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, isTaggingMode]);

  // 5. Update GeoJSON Polygons and Regional Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    if (showBorders) {
      const isZoomedIn = currentZoom >= 13;

      const geoJsonLayer = L.geoJSON(KURDISTAN_REGION_GEOJSON as any, {
        interactive: !isTaggingMode,
        style: (feature) => {
          const name = feature?.properties?.name;
          const isSelected = name === selectedGov;
          const color = feature?.properties?.color || '#0284c7';

          return {
            fillColor: color,
            fillOpacity: isZoomedIn ? 0.02 : isSelected ? 0.28 : 0.08,
            color: isSelected ? '#0284c7' : '#64748b',
            weight: isSelected ? (isZoomedIn ? 2 : 3) : 1.2,
            opacity: isZoomedIn ? 0.4 : isSelected ? 0.9 : 0.6,
            dashArray: isSelected ? '' : '4, 4'
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature?.properties?.name;
          layer.on({
            mouseover: (e) => {
              if (isTaggingMode) return;
              if (currentZoom < 13 && name !== selectedGov) {
                e.target.setStyle({ fillOpacity: 0.2, weight: 2 });
              }
            },
            mouseout: (e) => {
              if (isTaggingMode) return;
              if (currentZoom < 13 && name !== selectedGov) {
                geoJsonLayer.resetStyle(e.target);
              }
            },
            click: () => {
              if (name && !isTaggingMode) {
                setSelectedGov(name);
                const center = REGION_CENTERS[name];
                if (center) {
                  map.flyTo(center, 9, { duration: 0.8 });
                }
              }
            }
          });
        }
      }).addTo(map);

      geoJsonLayerRef.current = geoJsonLayer;
    }

    // Regional Center Markers (visible at broader zoom levels)
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      if (currentZoom < 14) {
        governorateStats.forEach(stat => {
          const center = REGION_CENTERS[stat.name];
          if (!center) return;

          const isSelected = stat.name === selectedGov;

          const icon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 text-white ring-4 ring-cyan-500/30 scale-105 shadow-xl'
                  : 'bg-white/95 text-slate-800 border border-slate-200 hover:scale-105'
              }">
                <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-rose-500'}"></span>
                <span class="whitespace-nowrap">${stat.name}</span>
                <span class="text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}">(${stat.beneficiariesCount})</span>
              </div>
            `,
            iconSize: [110, 32],
            iconAnchor: [55, 16]
          });

          const marker = L.marker(center, { icon });
          marker.on('click', () => {
            if (!isTaggingMode) {
              setSelectedGov(stat.name);
              map.flyTo(center, 10, { duration: 0.8 });
            }
          });

          markersLayerRef.current?.addLayer(marker);
        });
      }
    }
  }, [selectedGov, governorateStats, showBorders, currentZoom, isTaggingMode]);

  // 6. Render Beneficiary House Pin Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !houseMarkersLayerRef.current) return;

    houseMarkersLayerRef.current.clearLayers();
    houseMarkersMapRef.current.clear();

    taggedBeneficiaries.forEach(ben => {
      if (!ben.location) return;

      const catStyle = NEED_CATEGORY_COLORS[ben.needCategory] || NEED_CATEGORY_COLORS.poor;

      const houseIcon = L.divIcon({
        className: 'house-map-marker',
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer" title="${ben.fullName}">
            <span class="absolute -inset-1 rounded-full animate-ping opacity-75" style="background-color: ${catStyle.hex}33;"></span>
            <div class="w-8 h-8 rounded-2xl bg-white border-2 flex items-center justify-center shadow-lg hover:scale-115 transition-transform" style="border-color: ${catStyle.hex}; color: ${catStyle.hex};">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <div class="absolute -bottom-1 w-2 h-2 rotate-45" style="background-color: ${catStyle.hex};"></div>
          </div>
        `,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([ben.location.lat, ben.location.lng], { icon: houseIcon });

      const popupContent = `
        <div class="p-3.5 space-y-2.5 font-sans" dir="rtl" style="min-width: 240px;">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h4 class="font-black text-sm text-slate-900 leading-tight">${ben.fullName}</h4>
              <span class="text-[10px] font-mono text-slate-500 mt-0.5 block">${ben.phone || 'بێ ژمارە'}</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style="background-color: ${catStyle.hex}18; color: ${catStyle.hex}; border: 1px solid ${catStyle.hex}44;">
              ${catStyle.label}
            </span>
          </div>

          <div class="text-xs text-slate-600 space-y-1">
            <p><strong class="text-slate-800">پارێزگا:</strong> ${ben.governorate}</p>
            ${ben.address ? `<p><strong class="text-slate-800">ناونیشان:</strong> ${ben.address}</p>` : ''}
            ${ben.location.label ? `<p class="text-cyan-800 font-bold"><strong class="text-slate-800">تێبینی ماڵ:</strong> ${ben.location.label}</p>` : ''}
            <div class="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 mt-1">
              GPS: ${ben.location.lat}, ${ben.location.lng}
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <a
              href="https://www.google.com/maps?q=${ben.location.lat},${ben.location.lng}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 text-center py-1.5 px-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[11px] transition-colors border border-cyan-200"
            >
              Google Maps ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      houseMarkersLayerRef.current?.addLayer(marker);
      houseMarkersMapRef.current.set(ben.id, marker);
    });
  }, [taggedBeneficiaries]);

  // 7. Direct Location Referral Effect (handles navigating directly to specific beneficiary's house)
  useEffect(() => {
    if (!mapFocusLocation || !mapReady || !mapInstanceRef.current) return;

    const { lat, lng, beneficiaryId } = mapFocusLocation;
    const map = mapInstanceRef.current;

    // 1. Switch to satellite mode so the user sees the real satellite imagery of the house rooftop!
    setTileStyle('satellite');
    // 2. Switch sidebar to 'houses' tab
    setSidebarTab('houses');

    // 3. Smooth fly to the exact coordinates at maximum rooftop zoom level 19!
    map.flyTo([lat, lng], 19, {
      animate: true,
      duration: 1.2
    });

    // 4. Open popup after flying finishes
    const openPopupTimer = setTimeout(() => {
      if (beneficiaryId && houseMarkersMapRef.current.has(beneficiaryId)) {
        houseMarkersMapRef.current.get(beneficiaryId)?.openPopup();
      } else {
        let closestMarker: L.Marker | null = null;
        let minDist = Infinity;
        for (const marker of houseMarkersMapRef.current.values()) {
          const mLatLng = marker.getLatLng();
          const dist = Math.hypot(mLatLng.lat - lat, mLatLng.lng - lng);
          if (dist < minDist) {
            minDist = dist;
            closestMarker = marker;
          }
        }
        if (closestMarker && minDist < 0.001) {
          (closestMarker as L.Marker).openPopup();
        }
      }
    }, 1300);

    setMapFocusLocation(null);

    return () => clearTimeout(openPopupTimer);
  }, [mapFocusLocation, mapReady]);

  // Handle zooming when user selects governorate
  const handleSelectGov = (govName: string) => {
    setSelectedGov(govName);
    const center = REGION_CENTERS[govName];
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.flyTo(center, 10, { duration: 0.8 });
    }
  };

  // Fly to exact house coordinates
  const handleFlyToHouse = (ben: Beneficiary) => {
    if (!ben.location) return;
    if (mapInstanceRef.current) {
      setTileStyle('satellite');
      mapInstanceRef.current.flyTo([ben.location.lat, ben.location.lng], 19, { duration: 1.0 });
      setTimeout(() => {
        houseMarkersMapRef.current.get(ben.id)?.openPopup();
      }, 1100);
    }
  };

  // Reset View to full Kurdistan Region
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([36.19, 44.01], 8, { duration: 0.8 });
    }
  };

  // Toggle Full Screen Mode
  const handleToggleFullScreen = () => {
    setIsFullScreen(prev => {
      const next = !prev;
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return next;
    });
  };

  // Start Tagging Mode
  const handleStartTagging = () => {
    setIsTaggingMode(true);
    if (tileStyle !== 'satellite') {
      setTileStyle('satellite');
    }
  };

  // Cancel Tagging Mode
  const handleCancelTagging = () => {
    setIsTaggingMode(false);
    setCursorPos(null);
  };

  // Save Tagged House
  const handleSaveTag = () => {
    if (!selectedLatLng) return;

    if (tagModalMode === 'existing') {
      if (!selectedBeneficiaryId) return;
      const target = beneficiaries.find(b => b.id === selectedBeneficiaryId);
      if (target) {
        updateBeneficiary({
          ...target,
          location: {
            lat: selectedLatLng.lat,
            lng: selectedLatLng.lng,
            label: houseLabelInput.trim() || undefined,
            tagDate: new Date().toISOString()
          }
        });
      }
    } else {
      if (!newBenData.fullName.trim()) return;
      addBeneficiary({
        nationalId: `IQ-${Math.floor(10000000 + Math.random() * 90000000)}`,
        fullName: newBenData.fullName.trim(),
        phone: newBenData.phone.trim() || '07500000000',
        gender: 'male',
        age: 35,
        isFamilyHead: true,
        isProvider: true,
        isOnlyProvider: true,
        governorate: newBenData.governorate,
        address: newBenData.address.trim() || 'تۆمارکراو لە ڕێگەی نەخشە',
        familyMembers: 1,
        monthlyIncomeIQD: 0,
        needCategory: newBenData.needCategory,
        status: 'pending',
        notes: houseLabelInput.trim() ? `تێبینی ماڵ: ${houseLabelInput.trim()}` : '',
        documents: [],
        location: {
          lat: selectedLatLng.lat,
          lng: selectedLatLng.lng,
          label: houseLabelInput.trim() || undefined,
          tagDate: new Date().toISOString()
        }
      });
    }

    setIsTagModalOpen(false);
    setSelectedLatLng(null);
    setHouseLabelInput('');
    setSelectedBeneficiaryId('');
    setNewBenData({
      fullName: '',
      phone: '',
      governorate: 'هەولێر',
      needCategory: 'poor',
      address: ''
    });
  };

  // Remove Tagged House Location
  const handleRemoveLocation = (benId: string) => {
    if (window.confirm('ئایا دڵنیایت دەتەوێت نیشانەی ئەم ماڵە لەسەر نەخشە بسڕیتەوە؟')) {
      const target = beneficiaries.find(b => b.id === benId);
      if (target) {
        updateBeneficiary({
          ...target,
          location: undefined
        });
      }
    }
  };

  // Copy GPS Coordinates
  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Filtered Candidates for tagging
  const filteredCandidatesForTag = beneficiaries.filter(b => {
    if (!tagBeneficiarySearch.trim()) return true;
    const q = tagBeneficiarySearch.toLowerCase();
    return (
      b.fullName.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.nationalId.includes(q) ||
      b.governorate.includes(q)
    );
  });

  // Filtered Tagged Houses for sidebar
  const filteredTaggedHouses = taggedBeneficiaries.filter(b => {
    if (!houseSearchQuery.trim()) return true;
    const q = houseSearchQuery.toLowerCase();
    return (
      b.fullName.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.governorate.includes(q) ||
      (b.location?.label && b.location.label.toLowerCase().includes(q))
    );
  });

  // Toolbar Component for Map controls
  const MapToolbar = ({ inFullScreen = false }: { inFullScreen?: boolean }) => (
    <div className={`flex items-center justify-between gap-2 flex-wrap ${inFullScreen ? 'p-3 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800' : 'mb-3'}`}>
      
      {/* Map Tile Styles */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold shadow-inner">
        <button
          type="button"
          onClick={() => setTileStyle('street')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            tileStyle === 'street'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="شەقام، کۆڵان، و بیناکان بە ڕوونی تەواو"
        >
          شەقام و کۆڵانەکان
        </button>
        <button
          type="button"
          onClick={() => setTileStyle('light')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            tileStyle === 'light'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="نەخشەی تۆپۆگرافی سادە"
        >
          نەخشەی سادە
        </button>
        <button
          type="button"
          onClick={() => setTileStyle('satellite')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            tileStyle === 'satellite'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="وێنەی ڕاستەقینەی سەتەلایت لەسەر سەربانی ماڵەکان"
        >
          سەتەلایت
        </button>
      </div>

      {/* Toggles and Tagging */}
      <div className="flex items-center gap-2 flex-wrap">
        
        {/* Satellite Street Labels Toggle */}
        {tileStyle === 'satellite' && (
          <button
            type="button"
            onClick={() => setShowSatelliteLabels(!showSatelliteLabels)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showSatelliteLabels
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="نیشاندان یان شاردنەوەی ناوی شەقامەکان لەسەر سەتەلایت"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ناوی شەقامەکان</span>
          </button>
        )}

        {/* Governorate Borders Toggle */}
        <button
          type="button"
          onClick={() => setShowBorders(!showBorders)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            showBorders
              ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="نیشاندان یان شاردنەوەی سنووری پارێزگاکان"
        >
          {showBorders ? <Eye className="w-3.5 h-3.5 text-cyan-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          <span>سنوورەکان</span>
        </button>

        {/* Tag House on Map Action Button */}
        <button
          type="button"
          onClick={isTaggingMode ? handleCancelTagging : handleStartTagging}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm ${
            isTaggingMode
              ? 'bg-amber-500 text-white ring-4 ring-amber-400/40 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
          }`}
          title="دیاریکردنی سەربان یان پێگەی ماڵی سوودمەند لەسەر نەخشە"
        >
          <Crosshair className="w-4 h-4" />
          <span>{isTaggingMode ? 'پەشیمانبوونەوە لە نیشانەکردن' : '+ نیشانەکردنی ماڵ'}</span>
        </button>

        {/* Zoom Level Indicator */}
        <div className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border ${
          currentZoom >= 18
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : currentZoom >= 13
            ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`} title={`ئاستی زووم: ${currentZoom}`}>
          <span>زووم: {currentZoom}</span>
          {currentZoom >= 18 && <span className="mr-1 text-[10px] text-emerald-700 font-sans font-bold">🏠 سەربانی ماڵ</span>}
        </div>

        {/* Full Screen Button */}
        <button
          type="button"
          onClick={handleToggleFullScreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm"
          title={isFullScreen ? 'دەرچوون لە تەواوی شاشە (Esc)' : 'کردنەوە بە تەواوی شاشە'}
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-rose-600" />
              <span>دەرچوون</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-cyan-600" />
              <span>تەواوی شاشە</span>
            </>
          )}
        </button>

      </div>
    </div>
  );

  // Render Sidebar Contents (Governorate Info & Tagged Houses)
  const SidebarContent = ({ isDark = false }: { isDark?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className={`grid grid-cols-2 p-1 rounded-2xl mb-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        <button
          type="button"
          onClick={() => setSidebarTab('gov')}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${
            sidebarTab === 'gov'
              ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          }`}
        >
          پارێزگای {activeStat.name}
        </button>
        <button
          type="button"
          onClick={() => setSidebarTab('houses')}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
            sidebarTab === 'houses'
              ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          }`}
        >
          <Home className="w-3.5 h-3.5 text-cyan-500" />
          <span>ماڵەکان ({taggedBeneficiaries.length})</span>
        </button>
      </div>

      {sidebarTab === 'gov' ? (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
              <div>
                <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>پارێزگای {activeStat.name}</h3>
                <span className="text-xs text-slate-400">ڕاپۆرتی گشتگیری ناوچەیی و مەیدانی</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'} font-bold flex items-center gap-1.5`}>
                    <Users className="w-4 h-4 text-cyan-500" />
                    خێزانە سوودمەندەکان:
                  </span>
                  <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeStat.beneficiariesCount} خێزان</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/50 overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                    style={{
                      width: `${totalBeneficiariesCount > 0 ? Math.min(100, (activeStat.beneficiariesCount / totalBeneficiariesCount) * 100) : 0}%`
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {totalBeneficiariesCount > 0
                    ? `${Math.round((activeStat.beneficiariesCount / totalBeneficiariesCount) * 100)}٪ ی تەواوی سوودمەندان`
                    : 'سفر خێزان تۆمارکراوە'}
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50/70 border-emerald-200'}`}>
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  کۆی هاوکاری دابەشکراو:
                </span>
                <span className={`text-lg font-black ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                  {activeStat.totalAidDistributedIQD.toLocaleString()} د.ع
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <FolderKanban className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">پڕۆژەکان:</span>
                  <span className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeStat.activeProjectsCount} پڕۆژە</span>
                </div>
                <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">خۆبەخشان:</span>
                  <span className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeStat.volunteersCount} کەس</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/50">
            <button
              onClick={() => setActiveTab('beneficiaries')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 font-bold text-xs transition-all border border-cyan-500/20"
            >
              <span>بینینی خێزانەکانی {activeStat.name}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Tagged Houses List Tab */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={houseSearchQuery}
              onChange={(e) => setHouseSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی ناو، مۆبایل، شار..."
              className={`w-full pr-8 pl-3 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-cyan-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* List of Houses */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5" style={{ maxHeight: isFullScreen ? 'calc(100vh - 180px)' : '420px' }}>
            {filteredTaggedHouses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 px-4">
                <Home className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-500" />
                <p className="text-xs font-bold">هیچ ماڵێک نەدۆزرایەوە</p>
                <p className="text-[11px] mt-1 text-slate-500">
                  کلیک لەسەر دوگمەی "+ نیشانەکردنی ماڵ" بکە و سەربانی ماڵەکە لەسەر نەخشە دیاری بکە.
                </p>
              </div>
            ) : (
              filteredTaggedHouses.map(ben => {
                const catStyle = NEED_CATEGORY_COLORS[ben.needCategory] || NEED_CATEGORY_COLORS.poor;
                return (
                  <div
                    key={ben.id}
                    className={`p-3 rounded-2xl border transition-all hover:border-cyan-500/50 ${
                      isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`font-black text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {ben.fullName}
                          </h4>
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                            style={{ backgroundColor: `${catStyle.hex}18`, color: catStyle.hex }}
                          >
                            {catStyle.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{ben.governorate}</span>
                          <span>•</span>
                          <span className="font-mono">{ben.phone}</span>
                        </div>
                        {ben.location?.label && (
                          <p className="text-[10px] text-cyan-600 font-bold mt-1 line-clamp-1">
                            تێبینی: {ben.location.label}
                          </p>
                        )}
                        <div className="text-[9px] font-mono text-slate-400 mt-1">
                          GPS: {ben.location?.lat}, {ben.location?.lng}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/40 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleFlyToHouse(ben)}
                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] transition-colors shadow-sm"
                        title="فڕینی ڕاستەوخۆ بۆ سەربانی ماڵەکە لە ئاستی زوومی ١٩"
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>فڕین بۆ سەربان (Zoom 19)</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps?q=${ben.location?.lat},${ben.location?.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 px-1.5 rounded-lg border text-[10px] font-bold ${
                          isDark ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title="کردنەوە لە Google Maps بۆ ئاراستەکردن"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(ben.id)}
                        className="p-1 px-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold transition-colors"
                        title="سڕینەوەی نیشانەی ماڵ لەسەر نەخشە"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={isFullScreen ? 'fixed inset-0 z-[100] bg-slate-950 flex flex-col w-screen h-screen overflow-hidden' : 'space-y-6 pb-8'}>
      
      {/* Normal View Header */}
      {!isFullScreen && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-rose-600" />
              نەخشەی جوگرافی کارلێککاری پارێزگاکان و شوێنی ماڵەکان
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              سنووری فەرمیی پارێزگاکان، وێنەی سەتەلایت لەسەر سەربانی ماڵەکان، و نیشانەکردنی ماڵی سوودمەندان بەبێ کلیل و بێ سنووردارکردنی زووم
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm"
              title="بینینی گشتی سەرجەم ناوچەکانی کوردستان"
            >
              <Compass className="w-4 h-4 text-cyan-600" />
              <span>کوردستان بە گشتی</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>{governorateStats.length} ناوچەی کارگێڕی</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>{taggedBeneficiaries.length} ماڵی نیشانەکراو</span>
            </div>
          </div>
        </div>
      )}

      {/* Tagging Mode Active Banner */}
      {isTaggingMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] px-5 py-3 rounded-2xl bg-amber-500 text-white shadow-2xl flex items-center gap-3 border-2 border-white animate-bounce">
          <Crosshair className="w-5 h-5 animate-spin" />
          <span className="text-xs sm:text-sm font-black">
            پێگەی ماڵ دیاری بکە: نەخشەکە زووم بکە بۆ سەر سەربانی ماڵی سوودمەند و کلیک بکە
          </span>
          <button
            onClick={handleCancelTagging}
            className="px-3 py-1 rounded-xl bg-white text-amber-900 font-black text-xs hover:bg-amber-100 transition-colors shadow-sm"
          >
            پەشیمانبوونەوە
          </button>
        </div>
      )}

      {/* Unified Main Container (Seamless for Normal & Fullscreen views without unmounting Leaflet DOM) */}
      <div className={isFullScreen ? "flex-1 flex flex-col h-full overflow-hidden" : "grid grid-cols-1 lg:grid-cols-12 gap-6"}>
        {/* Fullscreen Map Controls Header */}
        {isFullScreen && <MapToolbar inFullScreen={true} />}

        <div className={isFullScreen ? "flex-1 relative flex overflow-hidden" : "contents"}>
          {/* Sidebar */}
          <div className={isFullScreen 
            ? "w-80 sm:w-96 bg-slate-900/95 border-r border-slate-800 p-4 flex flex-col z-10 text-white backdrop-blur-2xl shrink-0" 
            : "lg:col-span-4 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between min-h-[580px]"
          }>
            <SidebarContent isDark={isFullScreen} />
          </div>

          {/* Map Area Card */}
          <div className={isFullScreen 
            ? "flex-1 h-full relative flex flex-col" 
            : "lg:col-span-8 rounded-3xl bg-white/90 backdrop-blur-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[580px]"
          }>
            {!isFullScreen && <MapToolbar inFullScreen={false} />}

            {/* Leaflet Map Frame */}
            <div className={isFullScreen ? "flex-1 w-full h-full relative overflow-hidden" : "relative w-full h-[470px] rounded-2xl border border-slate-200 overflow-hidden shadow-inner"}>
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%', minHeight: isFullScreen ? '100%' : '470px' }}
              />

              {/* High-Precision Aiming Reticle HUD for Rooftop Tagging */}
              {isTaggingMode && cursorPos && (
                <div
                  className="absolute pointer-events-none z-[2000] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
                  style={{ left: cursorPos.x, top: cursorPos.y }}
                >
                  {/* Concentric rings and crosshairs */}
                  <div className="relative flex items-center justify-center w-16 h-16">
                    {/* Outer rotating dashed ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/80 animate-spin" style={{ animationDuration: '6s' }} />
                    {/* Inner pulsing red ring */}
                    <div className="absolute inset-2.5 rounded-full border-2 border-rose-500/90 shadow-sm animate-pulse" />
                    {/* Precision Crosshair Lines */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-rose-500 via-transparent to-rose-500" />
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-rose-500 via-transparent to-rose-500" />
                    {/* Center pinpoint red dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white shadow-lg z-10" />
                  </div>

                  {/* Floating HUD Tag with Live GPS */}
                  <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-950/90 text-white backdrop-blur-md border border-cyan-400/40 shadow-2xl text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-amber-300">
                      <Crosshair className="w-3 h-3 text-rose-400 animate-spin" />
                      <span>دیاریکردنی سەربانی ماڵ</span>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300">
                      GPS: {cursorPos.lat}, {cursorPos.lng}
                    </div>
                    <div className="text-[9px] text-slate-300 font-bold">
                      کلیک بکە بۆ دیاریکردن
                    </div>
                  </div>
                </div>
              )}

              {/* Map Legend Overlay */}
              <div className={`absolute ${isFullScreen ? 'bottom-4 left-4 z-[1000] p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white text-[10px] space-y-1.5 shadow-xl' : 'bottom-3 left-3 z-[1000] p-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md text-[10px] space-y-1'} pointer-events-none`}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white shadow-sm inline-block" />
                  <span className={isFullScreen ? "font-bold" : "font-bold text-slate-800"}>ناوچەی هەڵبژێردراو</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm inline-block" />
                  <span className={isFullScreen ? "" : "text-slate-700"}>ماڵی سوودمەند</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 inline-block" />
                  <span className={isFullScreen ? "text-slate-300" : "text-slate-600"}>سنووری فەرمی</span>
                </div>
              </div>
            </div>

            {!isFullScreen && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2">
                <span>کۆی هاوکاری دابەشکراو لە ناوچەکان: <strong className="text-emerald-700 font-mono">{totalDistributedIQD.toLocaleString()} د.ع</strong></span>
                <span className="font-bold text-cyan-800">{taggedBeneficiaries.length} ماڵی بەستراو بە پێگەی GPS</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regional Aid Equity Table (Shown in Normal View) */}
      {!isFullScreen && (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900">بەراوردی دادپەروەری دابەشکردنی هاوکاری بەپێی شارەکان (کلیک بکە بۆ جوڵانی نەخشە)</h4>
            <span className="text-[11px] text-slate-500">بەستراوە بە پێگەی جوگرافی</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3 px-4">ناوی پارێزگا / ئیدارە</th>
                  <th className="py-3 px-4">خێزانی سوودمەند</th>
                  <th className="py-3 px-4">کۆی بڕی هاوکاری (د.ع)</th>
                  <th className="py-3 px-4">پڕۆژەی کارا</th>
                  <th className="py-3 px-4">خۆبەخشانی ناوچەکە</th>
                  <th className="py-3 px-4">ڕێژەی گشتی</th>
                  <th className="py-3 px-4 text-center">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {governorateStats.map(stat => {
                  const totalBens = governorateStats.reduce((s, g) => s + g.beneficiariesCount, 0);
                  const percent = Math.round((stat.beneficiariesCount / (totalBens || 1)) * 100);
                  const isCurrent = stat.name === selectedGov;

                  return (
                    <tr
                      key={stat.name}
                      onClick={() => handleSelectGov(stat.name)}
                      className={`cursor-pointer transition-colors ${isCurrent ? 'bg-cyan-50/80 font-bold' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="py-3 px-4 flex items-center gap-1.5 text-slate-900">
                        <MapPin className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-600' : 'text-slate-400'}`} />
                        <span>{stat.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-900">{stat.beneficiariesCount} خێزان</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {stat.totalAidDistributedIQD.toLocaleString()} د.ع
                      </td>
                      <td className="py-3 px-4 text-purple-700">{stat.activeProjectsCount} پڕۆژە</td>
                      <td className="py-3 px-4 text-amber-700 font-bold">{stat.volunteersCount} کەس</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-600"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{percent}٪</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectGov(stat.name);
                          }}
                          className="p-1 px-2.5 rounded-lg bg-white border border-slate-200 text-cyan-700 hover:bg-cyan-50 font-bold text-[11px] shadow-sm inline-flex items-center gap-1"
                        >
                          <span>نیشاندان لەسەر نەخشە</span>
                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tag House Modal */}
      {isTagModalOpen && selectedLatLng && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp text-slate-900 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">نیشانەکردنی ماڵی سوودمەند</h3>
                  <p className="text-[11px] text-slate-500">بەستنەوەی ئەم پێگەیە بە دۆسیەی خێزانی سوودمەند</p>
                </div>
              </div>
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Coordinates Display */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">هێڵی پانی و درێژی هەڵبژێردراو (GPS):</span>
                <span className="text-xs font-mono font-bold text-cyan-800">
                  {selectedLatLng.lat}, {selectedLatLng.lng}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyCoords(selectedLatLng.lat, selectedLatLng.lng)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-sm"
                  title="کۆپیکردنی خاڵەکان"
                >
                  {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedCoords ? 'کۆپیکرا!' : 'کۆپیکردن'}</span>
                </button>
                <a
                  href={`https://www.google.com/maps?q=${selectedLatLng.lat},${selectedLatLng.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-white border border-slate-200 text-cyan-700 hover:bg-cyan-50 transition-colors shadow-sm"
                  title="پێشبینین لە Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Mode Switcher: Existing vs New Beneficiary */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTagModalMode('existing')}
                className={`py-2 px-3 rounded-xl transition-all ${
                  tagModalMode === 'existing'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                بەستنەوە بە سوودمەندی تۆمارکراو
              </button>
              <button
                type="button"
                onClick={() => setTagModalMode('new')}
                className={`py-2 px-3 rounded-xl transition-all ${
                  tagModalMode === 'new'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + تۆمارکردنی خێزانی نوێ
              </button>
            </div>

            {tagModalMode === 'existing' ? (
              /* Existing Beneficiary Selection */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    گەڕان لەنێو کەسە تۆمارکراوەکان:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={tagBeneficiarySearch}
                      onChange={(e) => setTagBeneficiarySearch(e.target.value)}
                      placeholder="ناوی کەس یان ژمارە مۆبایل بنووسە..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-2xl p-1.5 space-y-1 bg-slate-50/50">
                  {filteredCandidatesForTag.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      هیچ کەسێک بەم ناوە نەدۆزرایەوە
                    </div>
                  ) : (
                    filteredCandidatesForTag.slice(0, 15).map(ben => {
                      const isSelected = selectedBeneficiaryId === ben.id;
                      const hasLoc = Boolean(ben.location);
                      return (
                        <div
                          key={ben.id}
                          onClick={() => setSelectedBeneficiaryId(ben.id)}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-cyan-500 text-white shadow-md'
                              : 'hover:bg-slate-100 bg-white border border-slate-200/60'
                          }`}
                        >
                          <div>
                            <span className="font-bold block">{ben.fullName}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-cyan-100' : 'text-slate-400'}`}>
                              {ben.governorate} • {ben.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasLoc && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                پێشتر ماڵی هەبووە
                              </span>
                            )}
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تێبینی ماڵ یان ئاماژەی شوێن (ئارەزوومەندانە):
                  </label>
                  <input
                    type="text"
                    value={houseLabelInput}
                    onChange={(e) => setHouseLabelInput(e.target.value)}
                    placeholder="وەک: خانوی دوو نهۆم، سەربانی شین، بەرامبەر مزگەوتی گەورە"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              /* New Beneficiary Quick Entry */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ناوی تەواوی سوودمەند *</label>
                  <input
                    type="text"
                    required
                    value={newBenData.fullName}
                    onChange={(e) => setNewBenData({ ...newBenData, fullName: e.target.value })}
                    placeholder="ناوی چوارقۆڵی بنووسە"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ژمارەی مۆبایل</label>
                    <input
                      type="text"
                      value={newBenData.phone}
                      onChange={(e) => setNewBenData({ ...newBenData, phone: e.target.value })}
                      placeholder="0750xxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">پارێزگا</label>
                    <select
                      value={newBenData.governorate}
                      onChange={(e) => setNewBenData({ ...newBenData, governorate: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none bg-white"
                    >
                      <option value="هەولێر">هەولێر</option>
                      <option value="سلێمانی">سلێمانی</option>
                      <option value="دهۆک">دهۆک</option>
                      <option value="هەڵەبجە">هەڵەبجە</option>
                      <option value="کەرکووک">کەرکووک</option>
                      <option value="گەرمیان">گەرمیان</option>
                      <option value="زاخۆ">زاخۆ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">حاڵەتی پێویستی</label>
                    <select
                      value={newBenData.needCategory}
                      onChange={(e) => setNewBenData({ ...newBenData, needCategory: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none bg-white"
                    >
                      <option value="poor">هەژار و کەمدەرامەت</option>
                      <option value="orphan">بێباوک و هەتیو</option>
                      <option value="sick">نەخۆش و دەستکورت</option>
                      <option value="disabled">خاوەن پێداویستی تایبەت</option>
                      <option value="student">خوێندکاری هەژار</option>
                      <option value="displaced">ئاوارە و لێقەوماو</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ناونیشانی گەڕەک</label>
                    <input
                      type="text"
                      value={newBenData.address}
                      onChange={(e) => setNewBenData({ ...newBenData, address: e.target.value })}
                      placeholder="شار / گەڕەک / کۆڵان"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تێبینی ماڵ / سەربان (ئارەزوومەندانە)</label>
                  <input
                    type="text"
                    value={houseLabelInput}
                    onChange={(e) => setHouseLabelInput(e.target.value)}
                    placeholder="وەک: خانوی دوو نهۆم، سەربانی شین"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
              >
                هەڵوەشاندنەوە
              </button>
              <button
                type="button"
                onClick={handleSaveTag}
                disabled={tagModalMode === 'existing' ? !selectedBeneficiaryId : !newBenData.fullName.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>پاشەکەوتکردن و نیشانەکردنی ماڵ</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
