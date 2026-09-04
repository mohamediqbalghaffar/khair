import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { GOVERNORATE_STATS } from '../data/initialData';
import { GovernorateStats } from '../types';
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
  ChevronRight
} from 'lucide-react';

type MapTileStyle = 'street' | 'light' | 'satellite';

export const GeoMapView: React.FC = () => {
  const { beneficiaries, projects, volunteers, setActiveTab } = useApp();
  const [selectedGov, setSelectedGov] = useState<string>('هەولێر');
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('street');

  // Map DOM and instance references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

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

  // Tile provider URLs
  const getTileConfig = (style: MapTileStyle) => {
    switch (style) {
      case 'light':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
        };
      case 'street':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
        };
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [36.0, 44.2],
        zoom: 7.7,
        minZoom: 6.5,
        maxZoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // Add clean zoom control top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Initial Tile Layer
      const tileConfig = getTileConfig(tileStyle);
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 18
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Layer groups for markers
      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      mapInstanceRef.current = map;

      // Invalidate size after layout settles
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when tileStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileConfig = getTileConfig(tileStyle);
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 18
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [tileStyle]);

  // Update GeoJSON Polygons and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing GeoJSON layer if present
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    // Render official Kurdistan boundaries from HDX / geoBoundaries
    const geoJsonLayer = L.geoJSON(KURDISTAN_REGION_GEOJSON as any, {
      style: (feature) => {
        const name = feature?.properties?.name;
        const isSelected = name === selectedGov;
        const color = feature?.properties?.color || '#0284c7';

        return {
          fillColor: color,
          fillOpacity: isSelected ? 0.42 : 0.16,
          color: isSelected ? '#0284c7' : '#64748b',
          weight: isSelected ? 3.5 : 1.5,
          opacity: isSelected ? 1 : 0.7,
          dashArray: isSelected ? '' : '4, 4'
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature?.properties?.name;

        layer.on({
          mouseover: (e) => {
            const target = e.target;
            if (name !== selectedGov) {
              target.setStyle({
                fillOpacity: 0.32,
                weight: 2.5,
                color: '#0284c7'
              });
            }
          },
          mouseout: (e) => {
            const target = e.target;
            if (name !== selectedGov) {
              geoJsonLayer.resetStyle(target);
            }
          },
          click: () => {
            if (name) {
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

    // Render interactive marker pins on regional centers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      governorateStats.forEach(stat => {
        const center = REGION_CENTERS[stat.name];
        if (!center) return;

        const isSelected = stat.name === selectedGov;

        const icon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md cursor-pointer transition-all duration-300 ${
              isSelected
                ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 text-white ring-4 ring-cyan-500/30 scale-110 shadow-xl'
                : 'bg-white/95 text-slate-800 border border-slate-200 hover:scale-105'
            }">
              <span class="w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-rose-500'}"></span>
              <span class="whitespace-nowrap">${stat.name}</span>
              <span class="text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}">(${stat.beneficiariesCount})</span>
            </div>
          `,
          iconSize: [110, 34],
          iconAnchor: [55, 17]
        });

        const marker = L.marker(center, { icon });
        marker.on('click', () => {
          setSelectedGov(stat.name);
          map.flyTo(center, 9, { duration: 0.8 });
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [selectedGov, governorateStats]);

  // Handle zooming when user selects governorate from table or external buttons
  const handleSelectGov = (govName: string) => {
    setSelectedGov(govName);
    const center = REGION_CENTERS[govName];
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.flyTo(center, 9, { duration: 0.8 });
    }
  };

  // Reset View to full Kurdistan Region
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([36.0, 44.2], 7.7, { duration: 0.8 });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-rose-600" />
            نەخشەی جوگرافی کارلێککاری پارێزگاکانی کوردستان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سنووری فەرمیی پارێزگا و ئیدارەکانی کوردستان (HDX & geoBoundaries) لەگەڵ تۆڕی شەقام و چڕیی هاوکارییەکان
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
        </div>
      </div>

      {/* Main Map & Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Selected Area Details Card (Left side in RTL) */}
        <div className="lg:col-span-4 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">پارێزگای {activeStat.name}</h3>
                <span className="text-xs text-slate-500">ڕاپۆرتی گشتگیری ناوچەیی و مەیدانی</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    خێزانە سوودمەندەکان:
                  </span>
                  <span className="font-black text-slate-900 text-sm">{activeStat.beneficiariesCount} خێزان</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                    style={{
                      width: `${totalBeneficiariesCount > 0 ? Math.min(100, (activeStat.beneficiariesCount / totalBeneficiariesCount) * 100) : 0}%`
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {totalBeneficiariesCount > 0
                    ? `${Math.round((activeStat.beneficiariesCount / totalBeneficiariesCount) * 100)}٪ ی تەواوی سوودمەندان`
                    : 'سفر خێزان تۆمارکراوە'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  کۆی هاوکاری دابەشکراو:
                </span>
                <span className="text-xl font-black text-emerald-900">
                  {activeStat.totalAidDistributedIQD.toLocaleString()} د.ع
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <FolderKanban className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">پڕۆژەکان:</span>
                  <span className="font-black text-slate-900 text-sm">{activeStat.activeProjectsCount} پڕۆژە</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <Award className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">تیمی خۆبەخش:</span>
                  <span className="font-black text-slate-900 text-sm">{activeStat.volunteersCount} کەس</span>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
            <p className="text-slate-600 text-xs leading-relaxed">
              تیمەکانی ڕێکخراو لە هەماهەنگیدان لەگەڵ فەرمانگەی چاودێری کۆمەڵایەتی و ئیدارەی {activeStat.name} بۆ دڵنیابوون لە شەفافییەتی تەواوی دابەشکردن.
            </p>
            <button
              onClick={() => setActiveTab('beneficiaries')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold transition-all border border-cyan-200/80"
            >
              <span>بینینی خێزانەکانی {activeStat.name}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Kurdistan Leaflet Map (Center/Right) */}
        <div className="lg:col-span-8 rounded-3xl bg-white/90 backdrop-blur-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[520px]">
          
          {/* Map Controls Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                نەخشەی ڕاستەقینەی جوگرافی و سنووری پارێزگاکان
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">کلیک لەسەر هەر پارێزگایەک یان نیشاندەرەکانی بکە بۆ بینینی داتا مەیدانییەکان</p>
            </div>

            {/* Map Style Selector */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setTileStyle('street')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  tileStyle === 'street'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                شەقام و ڕێگاکان
              </button>
              <button
                type="button"
                onClick={() => setTileStyle('light')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  tileStyle === 'light'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
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
              >
                سەتەلایت
              </button>
            </div>
          </div>

          {/* Real Leaflet Map Canvas */}
          <div className="relative w-full h-[430px] rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
            <div
              ref={mapContainerRef}
              className="w-full h-full"
              style={{ minHeight: '430px' }}
            />

            {/* Map Legend Overlay in bottom-left */}
            <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md text-[10px] space-y-1 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white shadow-sm inline-block" />
                <span className="font-bold text-slate-800">ناوچەی هەڵبژێردراو</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 inline-block" />
                <span className="text-slate-600">سنووری فەرمی پارێزگاکان</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2">
            <span>کۆی هاوکاری دابەشکراو لە سەرجەم ناوچەکان: <strong className="text-emerald-700 font-mono">{totalDistributedIQD.toLocaleString()} د.ع</strong></span>
            <span className="font-bold text-cyan-800">٧ ناوچەی کارا و بەستراوە</span>
          </div>

        </div>

      </div>

      {/* Regional Aid Equity Table */}
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

    </div>
  );
};
