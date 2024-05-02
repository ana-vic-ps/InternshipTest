const express = require("express");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const path = require("path");

// Create Express app
const app = express();
const port = 3000;

// Serve static files
app.use(express.static("."));

// Set CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// User-Agent list
const userAgentList = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0",
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1",
];
// Override console.error to suppress specific JSDOM CSS parsing error
const originalConsoleError = console.error;
const jsDomCssError = "Error: Could not parse CSS stylesheet";
console.error = (...params) => {
  if (!params.find((p) => p.toString().includes(jsDomCssError))) {
    originalConsoleError(...params);
  }
};

// Fetches the Amazon page for a given keyword
async function fetchAmazonPage(keyword) {
  // Wait for 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Choose a random User-Agent
  const userAgent =
    userAgentList[Math.floor(Math.random() * userAgentList.length)];

  try {
    // Fetch Amazon page using axios with chosen User-Agent
    const response = await axios.get(`https://www.amazon.com/s?k=${keyword}`, {
      headers: {
        "User-Agent": userAgent,
      },
    });
    return response.data; // Return HTML content of the page
  } catch (error) {
    console.error(`Failed to fetch Amazon page: ${error}`);
    return ""; // Return empty string if fetching fails
  }
}

// Parses the product details from the HTML of an Amazon page
function parseProductDetails(html, keyword) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const productDetails = new Map(); // Using a Map to store unique product details

  // Query all elements containing product listings
  const elements = document.querySelectorAll(".s-result-item");
  elements.forEach((element) => {
    // Extract product details from each element
    try {
      const titleElement = element.querySelector(".a-size-base-plus");
      const title = titleElement ? titleElement.textContent.trim() : "";

      const ratingElement = element.querySelector(".a-icon-star-small");
      const rating = ratingElement ? ratingElement.textContent.trim() : "";

      const reviewCountElement = element.querySelector(
        ".a-size-small .a-link-normal"
      );
      const reviewCount = reviewCountElement
        ? reviewCountElement.textContent.trim()
        : "";

      const imageUrlElement = element.querySelector(".s-image");
      const imageUrl = imageUrlElement
        ? imageUrlElement.getAttribute("src")
        : "";

      // Check if the title contains the keyword
      if (
        title.toLowerCase().includes(keyword.toLowerCase()) &&
        title &&
        rating &&
        reviewCount &&
        imageUrl
      ) {
        // Generate a unique key based on the product details
        const key = `${title}${rating}${reviewCount}${imageUrl}`;
        // Check if the product details are not already included
        if (!productDetails.has(key)) {
          productDetails.set(key, {
            title,
            rating,
            reviewCount,
            imageUrl,
          });
        }
      }
    } catch (error) {
      console.error("Error parsing product details:", error);
    }
  });

  // Convert the Map to an array of values and return
  return Array.from(productDetails.values());
}

// Endpoint to scrape Amazon for a given keyword
app.get("/api/scrape", async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ error: "The keyword cannot be empty" });
  }

  const html = await fetchAmazonPage(keyword);
  if (!html) {
    return res.status(500).json({ error: "Failed to scrape Amazon" });
  }

  const productDetails = parseProductDetails(html, keyword);
  res.json(productDetails); // Return product details as JSON response
});

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
