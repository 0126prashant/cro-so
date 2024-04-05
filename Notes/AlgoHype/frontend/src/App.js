import React, { useState } from "react";
import {
  ChakraProvider,
  Box,
  Heading,
  Input,
  Button,
  Alert,
  AlertIcon,
  Image,
} from "@chakra-ui/react";

const App = () => {
  const [url, setUrl] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [error, setError] = useState("");

  const captureScreenshot = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setError(""); 

    try {
      const response = await fetch("http://localhost:8080/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (data.success) {
        setScreenshotUrl(data.folderPath);
        console.log(data) 
        setUrl("");
        alert("Screenshots captured successfully");
      } else {
        setError("Failed to capture screenshot.");
      }
    } catch (error) {
      setError("Error capturing screenshot. Please try again.");
    }
  };

  return (
    <ChakraProvider>
      <Box p={4} maxW="500px" mx="auto" mt="50px">
        <Heading mb={4}>Website Screenshot Capture</Heading>
        <Input
          type="text"
          placeholder="Please enter a URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          mb={2}
        />
        <Button colorScheme="blue" onClick={captureScreenshot}>
          Capture Screenshot
        </Button>
        {error && (
          <Alert status="error" mt={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        {screenshotUrl && !error && ( // Check if screenshotUrl is truthy and there is no error
          <Box mt={4}>
            <Heading size="md" mb={2}>
              Screenshot
            </Heading>
            <Image src={`http://localhost:8080${screenshotUrl}`} alt="Screenshot" />
          </Box>
        )}
      </Box>
    </ChakraProvider>
  );
};

export default App;



// import React, { useState } from 'react';

// const App = () => {
//   const [url, setUrl] = useState("");
//   const [screenshotUrl, setScreenshotUrl] = useState("");

//   const captureScreenshot = async () => {
//     if (!url) {
//       alert("Please enter a URL");
//       return;
//     }

//     const response = await fetch("http://localhost:8080/capture", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({url}),
//     });

//     const data = await response.json();
//     if (data.success) {
//       setScreenshotUrl(data.screenshotPath);
//       setUrl("")
//       alert("Screenshot captured successfully!");
//     } else {
//       alert("Failed to capture screenshot.");
//     }
//   };

//   return (
//     <div>
//       <h1>Website Screenshot Capture</h1>
//       <label htmlFor="urlInput">Enter website URL:</label>
//       <input
//         type="text"
//         id="urlInput"
//         placeholder="Please enter a URL"
//         value={url}
//         onChange={(e) => setUrl(e.target.value)}
//       />
//       <button onClick={captureScreenshot}>Capture Screenshot</button>
//       {screenshotUrl && (
//         <div>
//           <h2>Screenshot</h2>
//           <img src={`http://localhost:8080${screenshotUrl}`} alt="Screenshot" />
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;
