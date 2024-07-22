import React, { useCallback, useState } from "react";

const Api_Url = process.env.API_URL
const baseUrl = process.env.BASU_URL

const Main = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [screenshotsData, setScreenshotsData] = useState({ mobile: [], desktop: [] });
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  const messages = [
    'Initializing CRO analysis...',
    'Crawling website structure...',
    'Capturing mobile screenshots...',
    'Analyzing mobile layout...',
    'Capturing desktop screenshots...',
    'Analyzing desktop layout...',
    'Comparing mobile and desktop versions...',
    'Identifying potential optimization areas...',
    'Generating heatmaps...',
    'Analyzing user flow...',
    'Compiling conversion rate data...',
    'Preparing optimization suggestions...',
    'Generating comprehensive report...',
    'Finalizing analysis...',
  ];

// console.log("feedbackData-feedbackData",feedbackData)

const sendEmail = useCallback(async (creatorID,userEmail,websiteUrl) => {
  console.log("sendemail is running in frontend")
  try {
    const response = await fetch(`${Api_Url}/screenshots/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ creatorID,userEmail,websiteUrl }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    setEmailSent(true);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}, []);

const simulateLoading = () => {
  let progress = 0;
  let messageIndex = 0;

  const loadingInterval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 100) progress = 100;

    if (progress >= (messageIndex + 1) * (100 / messages.length)) {
      setStatusMessage(messages[messageIndex]);
      messageIndex++;
    }

    setLoadingProgress(progress);

    if (progress >= 100) {
      clearInterval(loadingInterval);
      setStatusMessage('Analysis completed! Preparing your results...');
    }
  }, 3000);
};

const handleGenerateScreenshots = async () => {
  setUrlError(false);
  setError(null);
  if (!websiteUrl) {
    setUrlError(true);
    return;
  }
  if (!userEmail) {
    setShowModal(true);
    setLoading(false);
    return;
  }
  try {
    setLoading(true);
    simulateLoading();
    const response = await fetch(`${Api_Url}/screenshots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: websiteUrl, userEmail }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  
    const data = await response.json();
    console.log("data in frontend", data);
    
    if (data.redirectUrl) {
      console.log("Attempting to open redirect URL in new tab.");
      const redirectUrl = `${baseUrl}?creatorID=${data.creatorID}`
      const openWindow = window.open(redirectUrl, '_blank');
      
      if (openWindow && !openWindow.closed && typeof openWindow.closed !== 'undefined') {
        console.log("Redirect URL opened successfully.");
        if (!emailSent) {
          sendEmail(data.creatorID,data.userEmail,data.websiteName);
        }
      } else {
        console.log("Popup blocked. Please allow popups for this website.");
        setError("Popup blocked. Please click the button below to open the result.");
        setRedirectUrl(data.redirectUrl);
      }
    }
    
    localStorage.setItem("creatorID", data.creatorID);
    setScreenshotsData(data.screenshots);
      
      
      
  } catch (error) {
    console.error("Error in frontend:", error.message);
    setError(`Error in frontend: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
  
  const handleModalDone = () => { 
    setShowModal(false);
    handleGenerateScreenshots();
  };

  const handleDownloadScreenshot = (imageUrl, key, extension) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `screenshot_${key}.${extension}`;
    link.click();
  };
// console.log("screenshotsDatascreenshotsDatascreenshotsData",screenshotsData)
const hasScreenshots = screenshotsData.mobile.length > 0 || screenshotsData.desktop.length > 0;


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-center mb-8 text-blue-500">CRO Analyzer</h1>

        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 text-lg rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
          {urlError && (
            <p className="text-red-500 mt-2">Please provide a valid URL.</p>
          )}
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
          <button
            onClick={handleGenerateScreenshots}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {loading ? "Analyzing..." : "Start CRO Analysis"}
          </button>
        </div>

        {loading && (
          <div className="max-w-xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-lg font-medium">{statusMessage || 'Initializing...'}</p>
          </div>
        )}

        {redirectUrl && (
          <button
            onClick={() => window.open(redirectUrl, '_blank')}
            className="mx-auto block mb-8 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            View Detailed Results
          </button>
        )}

        {hasScreenshots && (
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {screenshotsData.mobile.length > 0 && (
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Mobile Screenshots</h2>
                {screenshotsData.mobile.map((imageUrl, index) => (
                  <div key={`mobile-${index}`} className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
                    <img src={imageUrl} alt={`Mobile Screenshot ${index + 1}`} className="w-full h-auto rounded mb-4" />
                    <button
                      onClick={() => handleDownloadScreenshot(imageUrl, `mobile-${index}`, 'jpg')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Download Mobile Screenshot {index + 1}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {screenshotsData.desktop.length > 0 && (
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Desktop Screenshots</h2>
                {screenshotsData.desktop.map((imageUrl, index) => (
                  <div key={`desktop-${index}`} className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
                    <img src={imageUrl} alt={`Desktop Screenshot ${index + 1}`} className="w-full h-auto rounded mb-4" />
                    <button
                      onClick={() => handleDownloadScreenshot(imageUrl, `desktop-${index}`, 'jpg')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Download Desktop Screenshot {index + 1}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-2xl font-bold mb-4">Enter your email</h2>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <button
                onClick={handleModalDone}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Start Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Main;