import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { LandTile, Team } from '../types';

export default function TribeMap() {
  const [tiles, setTiles] = useState<LandTile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTile, setSelectedTile] = useState<any>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const fetchData = async () => {
      const { data: tilesData } = await supabase.from('land_tiles').select('*');
      const { data: teamsData } = await supabase.from('teams').select('*');
      setTiles(tilesData || []);
      setTeams(teamsData || []);
    };
    fetchData();
  }, []);

  const getTileData = (x: number, y: number) => {
    const tile = tiles.find(t => t.x === x && t.y === y);
    const team = tile ? teams.find(t => t.id === tile.team_id) : null;
    return { tile, team };
  };

  const icons: Record<string, string> = {
    empty: '⬜', house: '🏠', garden: '🌿', school: '🏫', church: '⛪', fortress: '🏰'
  };

  return (
    <div className="bg-[#FFFDF5] p-4 rounded-lg overflow-auto max-w-full shadow-inner border border-[#C9A96E]">
      <div className="grid grid-cols-20 gap-px min-w-[600px]">
        {Array.from({ length: 400 }).map((_, i) => {
          const x = i % 20;
          const y = Math.floor(i / 20);
          const { tile, team } = getTileData(x, y);
          
          return (
            <div
              key={i}
              className="w-8 h-8 flex items-center justify-center cursor-pointer border border-[#C9A96E]/20"
              style={{ backgroundColor: team?.color || '#F0F0F0' }}
              onClick={() => tile && setSelectedTile({ ...tile, teamName: team?.name })}
            >
              <span className="text-xs">{tile ? icons[tile.building_type] : ''}</span>
            </div>
          );
        })}
      </div>
      
      {selectedTile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedTile(null)}>
          <div className="bg-[#FFF8E7] p-6 rounded-lg text-[#2C1810] border-2 border-[#C9A96E] relative shadow-2xl">
            <h3 className="font-title text-xl text-[#8B4513]">{selectedTile.teamName}</h3>
            <p>المبنى: {selectedTile.building_type}</p>
            <p>المستوى: {selectedTile.level}</p>
            <p>الإحداثيات: ({selectedTile.x}, {selectedTile.y})</p>
          </div>
        </div>
      )}
    </div>
  );
}
