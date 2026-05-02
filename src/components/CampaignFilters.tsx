import { Filter, X } from "lucide-react";
import { useState } from "react";

interface CampaignFiltersProps {
  onFilterChange: (filters: CampaignFilterState) => void;
}

export interface CampaignFilterState {
  platform?: "YouTube" | "TikTok" | "Instagram" | "Facebook" | "All";
  minFollowers?: number;
  maxFollowers?: number;
  keywords?: string;
  dateRange?: "all" | "week" | "month" | "year";
}

export default function CampaignFilters({
  onFilterChange,
}: CampaignFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<CampaignFilterState>({
    platform: "All",
    minFollowers: 0,
    maxFollowers: 1000000,
    keywords: "",
    dateRange: "all",
  });

  const handleApply = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: CampaignFilterState = {
      platform: "All",
      minFollowers: 0,
      maxFollowers: 1000000,
      keywords: "",
      dateRange: "all",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="ec-filter-wrapper">
      <button className="ec-filter-toggle" onClick={() => setIsOpen(!isOpen)}>
        <Filter size={14} />
        Filters
      </button>

      {isOpen && (
        <div className="ec-filter-panel">
          <div className="ec-filter-header">
            <h3>Filter Options</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="ec-filter-content">
            <label>
              Platform
              <select
                value={filters.platform}
                onChange={(e) =>
                  setFilters({ ...filters, platform: e.target.value as any })
                }
              >
                <option value="All">All Platforms</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
              </select>
            </label>

            <label>
              Min Followers
              <input
                type="number"
                value={filters.minFollowers}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minFollowers: Number(e.target.value),
                  })
                }
                min={0}
              />
            </label>

            <label>
              Max Followers
              <input
                type="number"
                value={filters.maxFollowers}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxFollowers: Number(e.target.value),
                  })
                }
                min={0}
              />
            </label>

            <label>
              Keywords (name / product / URL)
              <input
                type="text"
                value={filters.keywords}
                onChange={(e) =>
                  setFilters({ ...filters, keywords: e.target.value })
                }
                placeholder="e.g. fintech, yourbrand.com, #saas"
              />
            </label>

            <label>
              Date Range
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value as any })
                }
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </label>
          </div>

          <div className="ec-filter-actions">
            <button onClick={handleReset} className="ec-filter-reset">
              Reset
            </button>
            <button onClick={handleApply} className="ec-filter-apply">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <style>{`
        .ec-filter-wrapper {
          position: relative;
        }

        .ec-filter-toggle {
          border: 1px solid #e8d7c6;
          border-radius: 10px;
          padding: 8px 12px;
          background: #fff;
          color: #634f41;
          font-weight: 700;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .ec-filter-toggle:hover {
          background: #fff7ef;
        }

        .ec-filter-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 320px;
          background: #fff;
          border: 1px solid #e8d7c6;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 100;
          animation: slideDown 0.2s ease;
        }

        .ec-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid #f0e0d0;
        }

        .ec-filter-header h3 {
          font-size: 15px;
          margin: 0;
          color: #2b221d;
        }

        .ec-filter-header button {
          border: 0;
          background: transparent;
          color: #6a5647;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }

        .ec-filter-header button:hover {
          background: #f7eee5;
        }

        .ec-filter-content {
          padding: 14px;
          display: grid;
          gap: 12px;
        }

        .ec-filter-content label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #4f3f32;
        }

        .ec-filter-content input,
        .ec-filter-content select {
          width: 100%;
          border: 1px solid #e6d7c8;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          font-family: inherit;
          background: #fffefb;
        }

        .ec-filter-actions {
          display: flex;
          gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid #f0e0d0;
        }

        .ec-filter-reset,
        .ec-filter-apply {
          flex: 1;
          border: 0;
          border-radius: 8px;
          padding: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .ec-filter-reset {
          background: #fff;
          border: 1px solid #e8d7c6;
          color: #634f41;
        }

        .ec-filter-apply {
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
