import { useState } from "react";
import "../../pages/HomeDashboard.css";
import { HomeHeader } from "./HomeHeader";
import { EventGrid } from "./EventGrid";
import type { EventCardData } from "./EventCard";
import { DepartmentCircles } from "./DepartmentCircles";

const sampleEvents: EventCardData[] = [
  {
    id: "evt-1",
    name: "Holloway Wedding",
    time: "Saturday • 5:30 PM",
    client: "Mia Holloway",
    venue: "Magnolia Estate",
    guests: 180,
    category: "Wedding",
    health: "green",
  },
  {
    id: "evt-2",
    name: "Laurel Corporate Gala",
    time: "Friday • 7:00 PM",
    client: "Laurel Tech",
    venue: "Harbor Hall",
    guests: 240,
    category: "Corporate",
    health: "yellow",
  },
  {
    id: "evt-3",
    name: "Ava Bridal Shower",
    time: "Sunday • 11:00 AM",
    client: "Ava Daniels",
    venue: "Rosewood Loft",
    guests: 60,
    category: "Social",
    health: "green",
  },
  {
    id: "evt-4",
    name: "Chef Preview Dinner",
    time: "Thursday • 6:00 PM",
    client: "FoodWerx VIP",
    venue: "FWX Studio",
    guests: 40,
    category: "Tasting",
    health: "red",
  },
  {
    id: "evt-5",
    name: "Donovan Anniversary",
    time: "Saturday • 8:00 PM",
    client: "Donovan Family",
    venue: "Skyline Terrace",
    guests: 120,
    category: "Celebration",
    health: "yellow",
  },
  {
    id: "evt-6",
    name: "Civic Fundraiser",
    time: "Wednesday • 7:30 PM",
    client: "Civic Partners",
    venue: "Downtown Atrium",
    guests: 300,
    category: "Fundraiser",
    health: "green",
  },
];

export const HomeDashboard = () => {
  const [activeTab, setActiveTab] = useState("Live Events");

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="foodwerx-logo-small">
            <div className="foodwerx-logo-small-letter">F</div>
          </div>
          <div className="logo-text">
            <div className="logo-title">FOODWERX</div>
            <div className="logo-subtitle">EVENTOPS</div>
          </div>
        </div>
        <ul className="sidebar-menu">
          <li>
            <a className="active" href="/">
              <span className="sidebar-icon"></span>
              Dashboard
            </a>
          </li>
          <li>
            <a href="/beo-intake">
              <span className="sidebar-icon"></span>
              Intake
            </a>
          </li>
          <li>
            <a href="#departments">
              <span className="sidebar-icon"></span>
              Departments
            </a>
          </li>
          <li>
            <a href="/print-test">
              <span className="sidebar-icon"></span>
              Print Engine
            </a>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <HomeHeader activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="events-container">
          <EventGrid events={sampleEvents} />
        </div>

        <DepartmentCircles />
      </main>
    </div>
  );
};
