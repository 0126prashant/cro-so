import React from 'react'

export const Navbar = () => {
  return (
    <div>Navbar</div>
  )
}



// import React, { useState } from "react";
// import styled, { keyframes } from "styled-components";
// import {
//   Button,
//   Input,
//   Text,
//   VStack,
//   Spinner,
//   Box,
// } from "@chakra-ui/react";


// // loading spinner css
// const LoadingProgress = styled.div`
//   width: 100%;
//   background-color: #ddd;
//   border-radius: 5px;
//   overflow: hidden;
// `;

// const LoadingProgressBar = styled.div`
//   height: 10px;
//   background-color: #2196f3;
//   width: ${props => props.progress}%;
//   transition: width 0.5s ease-in-out;
// `;

// // Model css-------------->>>>>
// const ModalOverlay = styled.div`
//   display: ${(props) => (props.show ? "flex" : "none")};
//   position: fixed;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   background-color: rgba(0, 0, 0, 0.5);
//   align-items: center;
//   justify-content: center;
// `;

// const ModalContent = styled.div`
//   background-color: #fff;
//   padding: 20px;
//   border-radius: 8px;
//   max-width: 400px;
//   width: 100%;
//   text-align: center;
// `;

// const ModalInput = styled(Input)`
//   margin-bottom: 10px;
// `;

// const ModalButton = styled(Button)`
//   margin-top: 10px;
// `;

// const fadeIn = keyframes`
//   from {
//     opacity: 0;
//   }
//   to {
//     opacity: 1;
//   }
// `;
// // Model css-------------->>>>>

// const StyledAppWrapper = styled.div`
// /* border: 2px solid red; */
//   text-align: center;
//   background-color: #f0f0f0;
//   /* background-color: #f0f0f0; */
//   min-height: 100vh;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   animation: ${fadeIn} 0.5s ease-in-out;
// `;

// const StyledBox = styled.div`
//   background-color: #00796B;
//   /* border: 2px solid red; */
//   border: 2px solid #ddd;
//   border-radius: 8px;
//   padding: 20px;
//   margin: 20px;
//   max-width: 600px;
//   width: 100%;
//   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
// `;

// const StyledInput = styled.input`
// background-color: #f0f0f0;
// border-radius: 5px ;
//   padding: 10px;
//   width: 100%;
// `;

// const StyledButton = styled(Button)`
//   margin-top: 10px;
//   padding: 15px;
//   background-color: #2196f3;
//   border: none;
//   cursor: pointer;
//   color: #fff;
//   border-radius: 4px;
//   font-size: 16px;
//   &:hover {
//     background-color: #1565c0;
//   }
// `;

// const LoadingSpinner = styled(Spinner)`
//   color: #2196f3;
// `;

// const AnimatedLoading = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 20px;
//   background-color: rgba(255, 255, 255, 0.8);
//   border-radius: 8px;
// `;

// const AnimatedLoadingBox = styled.div`
// border: 2px solid red;
// width: 500px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 20px;
//   background-color: rgba(255, 255, 255, 0.8);
//   border-radius: 8px;
// `;

// const StyledImg = styled.img`
//   max-width: 100%;
//   height: auto;
//   border: 1px solid #ddd;
//   border-radius: 4px;
//   margin-top: 10px;
// `;

// const Main = () => {
//   const [websiteUrl, setWebsiteUrl] = useState("");
//   const [urlError, setUrlError] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [loadingProgress, setLoadingProgress] = useState(0);
//   const [statusMessage, setStatusMessage] = useState('');
//   const [screenshotsData, setScreenshotsData] = useState({});
//   const [feedbackData, setFeedbackData] = useState({});
//   const [error, setError] = useState(null);
//   const [userEmail, setUserEmail] = useState("");
//   const [showModal, setShowModal] = useState(false);
// // console.log("userEmail in frontend",userEmail)


// const simulateLoading = () => {
//   const messages = [
//     'Initializing...',
//     'Downloading images...',
//     'Generating images...',
//     'Visualizing and generating packages...',
//     'Finalizing...',
//   ];
//   let progress = 0;
//   let messageIndex = 0;

//   const loadingInterval = setInterval(() => {
//     progress += Math.random() * 10; // Increment progress by a random value.
//     if (progress > 100) progress = 100;

//     if (progress >= (messageIndex + 1) * (100 / messages.length)) {
//       // Update the message when progress reaches certain thresholds.
//       setStatusMessage(messages[messageIndex]);
//       messageIndex++;
//     }

//     setLoadingProgress(progress);

//     if (progress >= 100) {
//       clearInterval(loadingInterval);
//       setStatusMessage('Completed!');
//     }
//   }, 5000); // Update progress every 500ms.
// };


//   const handleGenerateScreenshots = async () => {
//     setUrlError(false);
//     setError(null);
//     if (!websiteUrl) {
//       setUrlError(true);
//       return;
//     }
//     if (!userEmail) {
//       setShowModal(true);
//       setLoading(false);
//       return;
//     }
//     try {
//       setLoading(true);
//       simulateLoading();
//       const response = await fetch(`http://localhost:8080/screenshots`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ url: websiteUrl,userEmail }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setScreenshotsData(data.screenshots);

//         const feedbackPromises = Object.keys(data.screenshots).map(async (key) => {
//           const feedbackResponse = await fetch(`http://localhost:8080/screenshots/feedback/${key}`, {
//             method: "GET",
//           });

//           if (feedbackResponse.ok) {
//             const feedbackData = await feedbackResponse.json();
//             return { key, feedback: feedbackData.feedback };
//           } else {
//             return { key, feedback: 'Error fetching feedback' };
//           }
//         });

//         const feedbackResults = await Promise.all(feedbackPromises);

//         const feedbackMap = {};
//         feedbackResults.forEach((result) => {
//           feedbackMap[result.key] = result.feedback;
//         });

//         setFeedbackData(feedbackMap);
//       } else {
//         const errorMessage = await response.text();
//         setError(`Server error: ${response.status} - ${errorMessage}`);
//       }
//     } catch (error) {
//       console.error("Error in frontend:", error.message);
//       setError(`Error in frontend: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleModalDone = () => {
//     setShowModal(false);
//     // Resume other functionality or perform additional actions with userEmail
//   };

//   const handleDownloadScreenshot = (imageData, key, extension) => {
//     const link = document.createElement("a");
//     link.href = `data:image/${extension};base64,${imageData}`;
//     link.download = `screenshot_${key}.${extension}`;
//     link.click();
//   };

//   const dummyImages = [
//     "https://dummyimage.com/300x200/000/fff&text=Image+1",
//     "https://dummyimage.com/300x200/333/fff&text=Image+2",
//     "https://dummyimage.com/300x200/666/fff&text=Image+3",
//   ];
  

//   return (
//     // <DIV>
//     <StyledAppWrapper>
//       <StyledBox>
//         <Text fontSize="4xl" color="#263238">
//           Crow.so
//         </Text>

//         <StyledInput
//           type="text"
//           value={websiteUrl}
//           onChange={(e) => setWebsiteUrl(e.target.value)}
//           placeholder="https://example.com"
//           padding="2"
//           required
//           disabled={loading}
//         />
//         {urlError && (
//           <Text color="red" marginTop="2">
//             Please provide a valid URL.
//           </Text>
//         )}

//         {error && (
//           <Text color="red" marginTop="2">
//             {error}
//           </Text>
//         )}

//         <StyledButton onClick={handleGenerateScreenshots} loading={loading} disabled={loading}>
//         {loading ? (
//             <AnimatedLoading>
//               {/* <LoadingSpinner /> */}
//               <Text marginLeft="2">Please wait...</Text>
//             </AnimatedLoading>
//           ) : (
//             "Take Screenshot"
//           )}
//         </StyledButton>
//       </StyledBox>

//       <Box>
//       {loading ? (
//             <AnimatedLoadingBox>
//               <LoadingSpinner />
//               <LoadingProgress>
//                 <LoadingProgressBar progress={loadingProgress} />
//               </LoadingProgress>
//               <Text marginLeft="2">{statusMessage || 'Loading...'}</Text>
//             </AnimatedLoadingBox>
//           ) : ""}
//       </Box>

//       <VStack spacing="4" justify="center" align="center">
//         {dummyImages.map((imageUrl, index) => (
//           <StyledBox key={index}>
//             <StyledImg src={imageUrl} alt={`Dummy Image ${index + 1}`} />
            
//             <StyledButton
//               backgroundColor="#2196F3"
//               onClick={() => handleDownloadScreenshot(screenshotsData[index], index, 'jpeg')}
//             >
//               Download Screenshot {index+1}
//             </StyledButton>
//           </StyledBox>
//         ))}
//       </VStack> 
    
//       <ModalOverlay show={showModal}>
//         <ModalContent>
//           <Text fontSize="xl">Enter your email:</Text>
//           <ModalInput
//             type="email"
//             value={userEmail}
//             onChange={(e) => setUserEmail(e.target.value)}
//             placeholder="your.email@example.com"
//           />
//           <ModalButton onClick={handleModalDone}>Done</ModalButton>
//         </ModalContent>
//       </ModalOverlay>

//     </StyledAppWrapper>
  
   
//   );
// };

// export default Main;