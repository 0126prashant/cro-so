import React, { useState } from 'react';
import axios from 'axios';

const Amazon = () => {
  const [sellerId, setSellerId] = useState('');
  const [marketplaceIds, setMarketplaceIds] = useState('');

  const handleAuthorize = () => {
    const clientId = process.env.AmzClientID;
    const redirectUri = `${process.env.backendURL}/auth/google/callback`;
    const url = `https://sellercentral.amazon.com/apps/authorize/consent?application_id=${clientId}&state=yourUniqueState&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    axios.post(`${process.env.backendURL}/saveConfig`, { sellerId, marketplaceIds })
      .then(response => {
        console.log('Configuration saved successfully');
        // Redirect to the inventory page or display a success message
      })
      .catch(error => {
        console.error('Error saving configuration:', error);
        // Display an error message to the user
      });
  };

  return (
    <div>
      <h1>Amazon SP-API Example App</h1>
      <button onClick={handleAuthorize}>Authorize</button>
      <form onSubmit={handleConfigSubmit}>
        <label htmlFor="sellerId">Seller ID:</label>
        <input
          type="text"
          id="sellerId"
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
          required
        />
        <br />
        <label htmlFor="marketplaceIds">Marketplace IDs (comma-separated):</label>
        <input
          type="text"
          id="marketplaceIds"
          value={marketplaceIds}
          onChange={(e) => setMarketplaceIds(e.target.value)}
          required
        />
        <br />
        <button type="submit">Save Configuration</button>
      </form>
    </div>
  );
};

export default Amazon;