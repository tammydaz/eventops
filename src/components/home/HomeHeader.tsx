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
        <div className="header-title-section">
          <div className="header-title">FoodWerx EventOps</div>
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
