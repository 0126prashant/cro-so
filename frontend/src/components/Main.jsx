import React, { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  Button,
  Input,
  Text,
  VStack,
  Spinner,
  Box,
} from "@chakra-ui/react";

// Neon glow animation
const neonGlow = keyframes`
  from {
    box-shadow: 0 0 8px #00e6e6, 0 0 20px #00e6e6, 0 0 40px #00e6e6, 0 0 80px #00e6e6;
  }
  to {
    box-shadow: 0 0 12px #00e6e6, 0 0 24px #00e6e6, 0 0 48px #00e6e6, 0 0 96px #00e6e6;
  }
`;

// Neon text glow
const neonTextGlow = keyframes`
  from {
    text-shadow: 0 0 10px #00e6e6, 0 0 20px #00e6e6, 0 0 30px #00e6e6, 0 0 40px #00e6e6;
  }
  to {
    text-shadow: 0 0 15px #00e6e6, 0 0 30px #00e6e6, 0 0 45px #00e6e6, 0 0 60px #00e6e6;
  }
`;

// Dynamic loading bar animation
const loadingAnimation = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

const LoadingProgress = styled.div`
  width: 100%;
  background-color: #111;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 0 10px #00e6e6;
  margin-top: 20px; // Add some space between spinner and progress bar
`;

const LoadingProgressBar = styled.div`
  height: 20px;
  background: linear-gradient(90deg, rgba(0,230,118,1) 0%, rgba(0,230,230,1) 50%, rgba(0,212,255,1) 100%);
  width: ${props => props.progress}%;
  transition: width 0.5s ease-in-out;
`;


const LoadingSpinner = styled(Spinner)`
  color: #00e6e6;
  margin-bottom: 20px;
`;

const TextWithNeonEffect = styled(Text)`
  color: #fff;
  animation: ${neonTextGlow} 1.5s ease-in-out infinite alternate;
  margin-top: 20px;
`;

const StyledAppWrapper = styled.div`
  text-align: center;
  background-color: #0a0a0a;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const loadingBoxWidth = '600px'; 

const AnimatedLoadingBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #222;
  border-radius: 8px;
  border: 1px solid #00e6e6;
  animation: ${neonGlow} 1.5s ease-in-out infinite alternate;
  width: ${loadingBoxWidth};
  max-width: 100%;
`;
const StyledBox = styled(Box)`
  background-color: #333; // Dark theme background
  border: 2px solid #00e6e6; // Neon border color
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: #fff; // Text color for dark theme
`;

const StyledInput = styled(Input)`
  background-color: #222; // Darker input background
  border: 1px solid #00e6e6; // Neon glow for border
  color: #fff; // Text color for inputs
  &:focus {
    border-color: #00e6e6;
    box-shadow: 0 0 0 1px #00e6e6;
  }
`;

const StyledButton = styled(Button)`
  margin-top: 10px;
  padding: 10px 15px;
  background-color: #2196f3; // Keeping the original color here
  border: none;
  cursor: pointer;
  color: #fff;
  border-radius: 4px;
  font-size: 16px;
  transition: background-color 0.3s;
  &:hover {
    background-color: #1565c0;
  }
`;



// Assuming AnimatedLoading was supposed to be similar to AnimatedLoadingBox but for the button
const AnimatedLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.2); // Semi-transparent for loading indicator
  border-radius: 8px;
`;

const StyledImg = styled.img`
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd; // For a light border
  border-radius: 4px;
  margin-top: 10px;
`;

// For the modal overlay and content, keeping the original style but adding the theme color
const ModalOverlay = styled.div`
  display: ${(props) => (props.show ? "flex" : "none")};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); // Dark overlay
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background-color: #222; // Dark theme modal
  color: #fff; // Text color
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const ModalInput = styled(Input)`
  margin-bottom: 10px;
  background-color: #333; // Dark input
  color: #fff; // Input text color
`;

const ModalButton = styled(Button)`
  margin-top: 10px;
  background-color: #2196f3; // Keeping the button color consistent
  color: #fff;
`;



const Main = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [screenshotsData, setScreenshotsData] = useState({ mobile: [], desktop: [] });
  const [feedbackData, setFeedbackData] = useState({});
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
// console.log("userEmail in frontend",userEmail)


// console.log("feedbackData-feedbackData",feedbackData)

const simulateLoading = () => {
  const messages = [
    'Initializing...',
    'Downloading images...',
    'Generating images...',
    'Visualizing and generating packages...',
    'Finalizing...',
  ];
  let progress = 0;
  let messageIndex = 0;

  const loadingInterval = setInterval(() => {
    progress += Math.random() * 10; 
    if (progress > 100) progress = 100;

    if (progress >= (messageIndex + 1) * (100 / messages.length)) {
      setStatusMessage(messages[messageIndex]);
      messageIndex++;
    }

    setLoadingProgress(progress);

    if (progress >= 100) {
      clearInterval(loadingInterval);
      setStatusMessage('Completed!');
    }
  }, 5000); 
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
      const response = await fetch(`/screenshots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: websiteUrl,userEmail }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    
      const data = await response.json();
      console.log("data in frontend",data);
      if (data.redirectUrl) {
        window.open(`/home/ubuntu/cro-so/html/page1.html/page1.html?creatorID=${data.creatorID}`, '_blank');
        console.log("Redirecting and passing creator ID.");
      }
      
      // http://127.0.0.1:5500/html/page1.html?creatorID=${data.creatorID}
      console.log("data-in frontend",data)
      console.log("data.creatorID-in frontend",data.creatorID)
      localStorage.setItem("creatorID",data.creatorID)
      setScreenshotsData(data.screenshots)
        
    } catch (error) {
      console.error("Error in frontend:", error.message);
      setError(`Error in frontend: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  
  const handleModalDone = () => { 
    setShowModal(false);
    // Resume other functionality or perform additional actions with userEmail
  };

  const handleDownloadScreenshot = (imageData, key, extension) => {
    const link = document.createElement("a");
    link.href = `data:image/${extension};base64,${imageData}`;
    link.download = `screenshot_${key}.${extension}`;
    link.click();
  };
console.log("screenshotsDatascreenshotsDatascreenshotsData",screenshotsData)


  return (
    // <DIV>
    <>
    
    <StyledAppWrapper>
      <StyledBox>
        <Text fontSize="6xl" >
        <h1>CRO</h1>
        </Text>

        <StyledInput
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          padding="2"
          required
          disabled={loading}
        />
        {urlError && (
          <Text color="red" marginTop="2">
            Please provide a valid URL.
          </Text>
        )}

        {error && (
          <Text color="red" marginTop="2">
            {error}
          </Text>
        )}

        <StyledButton onClick={handleGenerateScreenshots} loading={loading} disabled={loading}>
        {loading ? (
            <AnimatedLoading>
              {/* <LoadingSpinner /> */}
              <Text marginLeft="2">Please wait...</Text>
            </AnimatedLoading>
          ) : (
            "Take Screenshot"
          )}
        </StyledButton>
      </StyledBox>

      <Box>
      {loading ? (
        <AnimatedLoadingBox>
          <LoadingSpinner size="xl" />
          <LoadingProgress>
            <LoadingProgressBar progress={loadingProgress} />
          </LoadingProgress>
          <TextWithNeonEffect>{statusMessage || 'Loading...'}</TextWithNeonEffect>
        </AnimatedLoadingBox>
      ) : ""}
    </Box>

      <Box display="flex" flexDirection="row" justifyContent="center" width="100%">
  <VStack spacing="4" justify="center" align="center">
    {screenshotsData.mobile.map((imageUrl, index) => (
      <StyledBox key={`mobile-${index}`}>
        <StyledImg src={imageUrl} alt={`Mobile Screenshot ${index + 1}`} />
        <StyledButton
          backgroundColor="#2196F3"
          onClick={() => handleDownloadScreenshot(imageUrl, `mobile-${index}`, 'jpg')}
        >
          Download Mobile Screenshot {index + 1}
        </StyledButton>
      </StyledBox>
    ))}
  </VStack>

  <VStack spacing="8" >
    {screenshotsData.desktop.map((imageUrl, index) => (
      <StyledBox key={`desktop-${index}`}>
        <StyledImg src={imageUrl} alt={`Desktop Screenshot ${index + 1}`} />
        <StyledButton
          backgroundColor="#2196F3"
          onClick={() => handleDownloadScreenshot(imageUrl, `desktop-${index}`, 'jpg')}
        >
          Download Desktop Screenshot {index + 1}
        </StyledButton>
      </StyledBox>
    ))}
  </VStack>
</Box>
    
      <ModalOverlay show={showModal}>
        <ModalContent>
          <Text fontSize="xl">Enter your email:</Text>
          <ModalInput
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="your.email@example.com"
          />
          <ModalButton onClick={handleModalDone}>Done</ModalButton>
        </ModalContent>
      </ModalOverlay>

    </StyledAppWrapper>
  
    </>
  );
};

export default Main;
