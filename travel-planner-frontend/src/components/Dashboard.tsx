import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 mt-12">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Welcome to Your Dashboard</h2>
      <p className="text-gray-700 text-lg text-center">
        This is a protected route. You can only access it if you're logged in.
      </p>
    </div>
  );
};

export default Dashboard;
