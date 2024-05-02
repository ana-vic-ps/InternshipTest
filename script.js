document.addEventListener("DOMContentLoaded", () => {
  // Get references to DOM elements
  const searchBtn = document.getElementById("search-btn");
  const keywordInput = document.getElementById("keyword");
  const resultsContainer = document.getElementById("results");
  const loadingIndicator = document.getElementById("loading"); // Added

  // Add event listener to search button
  searchBtn.addEventListener("click", async () => {
    const keyword = keywordInput.value.trim(); // Get search keyword
    if (keyword === "") {
      alert("Please enter a keyword"); // Show alert if keyword is empty
      return;
    }

    // Show loading indicator
    loadingIndicator.style.display = "block";

    try {
      // Fetch data from backend using AJAX
      const response = await fetch(
        `http://localhost:3000/api/scrape?keyword=${encodeURIComponent(
          keyword
        )}`
      );
      const data = await response.json(); // Parse JSON response
      displayResults(data); // Display fetched data
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("An error occurred while fetching data. Please try again later."); // Show error message to user
    } finally {
      // Hide loading indicator regardless of success or error
      loadingIndicator.style.display = "none";
    }
  });

  // Function to display search results on the webpage
  function displayResults(products) {
    resultsContainer.innerHTML = ""; // Clear previous results

    if (products.length === 0) {
      resultsContainer.innerHTML = "<p>No products found</p>"; // Display message if no products found
      return;
    }

    // Iterate over fetched products and create HTML elements to display them
    products.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.classList.add("product");
      productElement.innerHTML = `
          <h2>${product.title}</h2>
          <img class="product img" src="${product.imageUrl}" alt="${product.title}">
          <div>Rating: ${product.rating}</div>
          <div>Reviews: ${product.reviewCount}</div>
        `;
      resultsContainer.appendChild(productElement);
    });
  }
});