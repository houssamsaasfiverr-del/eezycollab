import Dashboard from "./Dashboard";

export default function CampaignRecent() {
  return (
    <Dashboard
      showCampaignMetrics={false}
      titleOverride="Recent Campaigns"
      subtitleOverride="Review your latest campaign drafts and activity."
    />
  );
}
