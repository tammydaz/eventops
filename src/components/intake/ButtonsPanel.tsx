export const ButtonsPanel = () => {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-red-500">Buttons & Actions</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-red-500 text-red-400 bg-black hover:bg-gray-900"
        >
          Open URL
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-red-500 text-red-400 bg-black hover:bg-gray-900"
        >
          Open BEO
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-red-500 text-red-400 bg-black hover:bg-gray-900"
        >
          Open BEO Intake
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Airtable buttons are visual only in this UI.
      </p>
    </section>
  );
};
