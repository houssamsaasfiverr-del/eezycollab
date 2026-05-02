import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface InfluencerFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  minFollowers: number;
  maxFollowers: number;
  keywords: string;
}

export default function InfluencerFilters({ onFilterChange }: InfluencerFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minFollowers: 0,
    maxFollowers: 1000000,
    keywords: '',
  });

  const handleApply = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      minFollowers: 0,
      maxFollowers: 1000000,
      keywords: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid #e8d7c6',
          borderRadius: '8px',
          padding: '8px 12px',
          background: '#fff',
          color: '#634f41',
          fontWeight: 700,
          fontSize: '13px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
        }}
      >
        <Filter size={14} />
        Filters
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '300px',
            background: '#fff',
            border: '1px solid #e8d7c6',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 100,
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Filter Options</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              Min Followers
              <input
                type="number"
                value={filters.minFollowers}
                onChange={(e) => setFilters({ ...filters, minFollowers: Number(e.target.value) })}
                min={0}
                style={{
                  border: '1px solid #e6d7c8',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '13px',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              Max Followers
              <input
                type="number"
                value={filters.maxFollowers}
                onChange={(e) => setFilters({ ...filters, maxFollowers: Number(e.target.value) })}
                min={0}
                style={{
                  border: '1px solid #e6d7c8',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '13px',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              Keywords
              <input
                type="text"
                value={filters.keywords}
                onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                placeholder="Search by name, handle, bio..."
                style={{
                  border: '1px solid #e6d7c8',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '13px',
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                flex: 1,
                border: '1px solid #e8d7c6',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              style={{
                flex: 1,
                border: 0,
                borderRadius: '8px',
                padding: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #f47d21, #dc4f24)',
                color: '#fff',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
