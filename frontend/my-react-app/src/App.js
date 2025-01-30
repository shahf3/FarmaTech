   // frontend/my-react-app/src/App.js
   import React, { useEffect, useState } from 'react';
   import axios from 'axios';

   function App() {
       const [assets, setAssets] = useState([]);

       useEffect(() => {
           const fetchAssets = async () => {
               try {
                   const response = await axios.get('/api/assets'); // Adjust the endpoint as necessary
                   setAssets(response.data);
               } catch (error) {
                   console.error('Error fetching assets:', error);
               }
           };

           fetchAssets();
       }, []);

       return (
           <div>
               <h1>Assets</h1>
               <ul>
                   {assets.map(asset => (
                       <li key={asset.ID}>
                           ID: {asset.ID}, Color: {asset.Color}, Size: {asset.Size}, Owner: {asset.Owner}, Value: {asset.AppraisedValue}
                       </li>
                   ))}
               </ul>
           </div>
       );
   }

   export default App;