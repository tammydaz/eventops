import { Link } from "react-router-dom";

interface WatchtowerSidebarProps {
  event: any;
  onClose: () => void;
}

export default function WatchtowerSidebar({ event, onClose }: WatchtowerSidebarProps) {
  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-black bg-opacity-80 shadow-2xl z-50 transition-transform duration-300 flex flex-col p-6" style={{borderLeft: '2px solid #ff0033'}}>
      <button className="self-end text-gray-400 mb-4" onClick={onClose}>✕</button>
      <div className="mb-6">
        <div className="text-xl font-bold text-white">{event.name}</div>
        <div className="text-gray-300">{event.eventDate}</div>
        <div className="text-gray-400">{event.clientName}</div>
        <div className="text-gray-400">Dispatch: {event.dispatchTime}</div>
      </div>
      <Link to={`/spec-engine/${event.id}`} className="mb-3 py-3 px-4 rounded-full neon-pill block text-center">📋 Spec Food Items</Link>
      <Link to={`/beo-print/${event.id}`} className="mb-3 py-3 px-4 rounded-full neon-pill block text-center">🖨️ Print BEO</Link>
      <button className="mb-3 py-3 px-4 rounded-full neon-pill block text-center" onClick={() => alert('Coming soon: Email Proposal!')}>
        📧 Email Proposal
      </button>
      <Link to={`/profit/${event.id}`} className="mb-3 py-3 px-4 rounded-full neon-pill block text-center">💰 Profit Margin</Link>
      <Link to={`/health/${event.id}`} className="mb-3 py-3 px-4 rounded-full neon-pill block text-center">🚦 Health Light</Link>
      <a className="mb-3 py-3 px-4 rounded-full neon-pill block text-center" href={`https://airtable.com/${event.id}`} target="_blank" rel="noopener noreferrer">
        📁 Open in Airtable
      </a>
      <style>{`
        .neon-pill {
          background: rgba(30,0,0,0.7);
          border: 2px solid #ff0033;
          color: #fff;
          box-shadow: 0 0 8px #ff0033, 0 0 2px #fff;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .neon-pill:hover {
          background: #ff0033;
          color: #fff;
          box-shadow: 0 0 16px #ff0033, 0 0 4px #fff;
        }
      `}</style>
    </div>
  );
}
