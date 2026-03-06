type HomeHeaderProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const tabs = ["Live Events", "Upcoming", "Completed", "Archive"];

export const HomeHeader = ({ activeTab, onTabChange }: HomeHeaderProps) => {
  return (
    <>
      <header className="top-header">
        <input className="search-box" placeholder="Search events..." />
        <div className="header-title-section header-werx-brand">
          <span className="header-werx-logo">Werx</span>
          <span className="header-werx-tagline">The engine behind the excellence!!</span>
        </div>
        <div className="header-right">
          <div className="notification-icon" title="Notifications"></div>
          <button className="add-event-btn" type="button">
            + Add Event
          </button>
          <div className="user-profile">FWX</div>
        </div>
      </header>
      <div className="tabs-section">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={tab === activeTab ? "tab active" : "tab"}
            role="button"
            tabIndex={0}
            onClick={() => onTabChange(tab)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                onTabChange(tab);
              }
            }}
          >
            {tab}
          </div>
        ))}
      </div>
    </>
  );
};
