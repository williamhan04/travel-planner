import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div>
            <h2> Welcome to Your Dashboard</h2>
            <p>This is a protected route. You can only access it if you're logged in.</p>
        </div>
    );
};

export default Dashboard;