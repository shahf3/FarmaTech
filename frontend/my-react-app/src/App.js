import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/assets');  // Make GET request to backend
                console.log("Full Axios response:", response);
                console.log("Response Data:", response.data);

                // Ensure the data is an array before calling setAssets
                if (Array.isArray(response.data)) {
                    setAssets(response.data);  // Update state with assets data
                } else {
                    console.error('Expected an array but got:', response.data);
                }
            } catch (error) {
                console.error('Error fetching assets:', error);
            }
        };

        fetchAssets();  // Fetch assets when the component mounts
    }, []);  // Empty dependency array to run only once when the component mounts

    return (
        <div>
            <h1>Assets</h1>
            <ul>
                {assets.length === 0 ? (
                    <li>No assets available</li>  // If no assets, display a message
                ) : (
                    assets.map(asset => (
                        <li key={asset.ID}>
                            ID: {asset.ID}, Color: {asset.Color}, Size: {asset.Size}, Owner: {asset.Owner}, Value: {asset.AppraisedValue}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

export default App;
