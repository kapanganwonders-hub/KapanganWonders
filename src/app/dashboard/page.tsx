export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard Overview</h1>
      <p className="text-gray-500 mb-6">Welcome back, Traveler!</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-100 text-green-800 p-4 rounded-lg">0 Scheduled Travels</div>
        <div className="bg-green-100 text-green-800 p-4 rounded-lg">0 Places Visited</div>
        <div className="bg-green-100 text-green-800 p-4 rounded-lg">0 Companions</div>
      </div>
    </div>
  );
}
