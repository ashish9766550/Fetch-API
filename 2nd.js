// --- Global Constants and DOM Selections ---
// This BASE_URL is now adjusted to the true base path for ExchangeRate-API.com
// The API key and 'latest' endpoint will be appended to this.
const BASE_URL = `https://v6.exchangerate-api.com/v6/`; 

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg"); 

const API_KEY = "YOUR_API_KEY"; 


// --- Populate Dropdowns and Set Initial Selections ---
for (let select of dropdowns) {
 
  for (let currencyCode of Object.keys(countryList)) { 
    let newOption = document.createElement("option");
    newOption.innerText = currencyCode; // Display currency code (e.g., USD)
    newOption.value = currencyCode;     // Set option value to currency code

    // Set default selected options based on dropdown name
    if (select.name === "from" && currencyCode === "USD") {
      newOption.selected = true;
    } else if (select.name === "to" && currencyCode === "INR") {
      newOption.selected = true;
    }
    select.append(newOption); // Add the option to the select element
  }

  // Add event listener to update flag image when selection changes
  select.addEventListener("change", (evt) => {
    updateFlag(evt.target); // 
  });
}

// --- Initial Flag Load on Page Load ---
// This ensures that the flags are displayed correctly when the page first loads,
// based on the default selected options in the dropdowns.
window.addEventListener("load", () => {
    updateFlag(fromCurr); // Update flag for the 'from' dropdown
    updateFlag(toCurr);   // Update flag for the 'to' dropdown
});


// --- Function to Update Flag Images ---
const updateFlag = (element) => {
  let currentCurrencyCode = element.value; // Get the selected currency code (e.g., "USD")
  let countryAlpha2Code = countryList[currentCurrencyCode]; // Get the 2-letter country code from your countryList

  // Only proceed if a valid 2-letter country code is found
  if (countryAlpha2Code) {
    let newlink = `https://flagsapi.com/${countryAlpha2Code}/flat/64.png`; // Construct flag image URL
    let img = element.parentElement.querySelector("img"); // Find the <img> tag in the parent element (.select-container)
    if (img) { // Check if img element actually exists
      img.src = newlink; // Set the source of the image to the new flag URL
    } else {
      console.warn("Image element not found for flag update:", element.name);
    }
  } else {
    console.warn(`No 2-letter country code found in countryList for currency: ${currentCurrencyCode}`);
    // Optionally, set a default placeholder image or hide the flag if not found
  }
};


// --- Button Click Event Listener for Currency Conversion ---
btn.addEventListener("click", async (evt) => {
  evt.preventDefault(); // Prevent the default form submission behavior (page reload)

  let amountInput = document.querySelector(".amount input");
  let amountval = amountInput.value;

  // Validate amount input: ensure it's not empty and at least 1
  if (amountval === "" || amountval < 1) {
    amountval = 1;
    amountInput.value = "1"; // Set input value to "1" if invalid
  }

  const baseCurrency = fromCurr.value;  // Get the currency code from the 'from' dropdown
  const targetCurrency = toCurr.value; // Get the currency code from the 'to' dropdown

  // --- Crucial Change for ExchangeRate-API.com ---
  // The 'urlObject' variable name is kept as requested,
  // but its value is now a *string* representing the full API endpoint URL,
  // because ExchangeRate-API.com uses path parameters (API key, endpoint, base currency).
  // The `new URL()` constructor and `searchParams.append` were removed here
  // because they are designed for query parameters (`?key=value`) and not for building paths (`/segment/segment`).
  const urlObject = `${BASE_URL}${API_KEY}/latest/${baseCurrency}`; 
  // Example constructed URL: https://v6.exchangerate-api.com/v6/2db80056d952c87d39d88967/latest/USD


  // --- Make the API Call ---
  try {
    // The fetch function now directly uses the 'urlObject' string.
    const response = await fetch(urlObject); 

    // --- Error Handling for API Response ---
    // Check if the HTTP response status is OK (200-299 range)
    if (!response.ok) {
      const errorData = await response.json(); // API often sends error details in JSON
      console.error(`API Error! Status: ${response.status}`, errorData);
      msg.innerText = `Error: ${errorData["error-type"] || 'Failed to fetch exchange rate.'}`;
      return; // Stop execution if there's an HTTP error
    }

    const data = await response.json(); // Parse the JSON response body

    console.log("ExchangeRate-API Response:", data); // Log the full API response for debugging

    // --- Process the API Response ---
    // Check if the API response indicates success and contains the conversion rates for the target currency
    if (data.result === "success" && data.conversion_rates && data.conversion_rates[targetCurrency] !== undefined) {
      const exchangeRate = data.conversion_rates[targetCurrency]; // Get the specific exchange rate
      const convertedAmount = (amountval * exchangeRate).toFixed(2); // Calculate and format to 2 decimal places

      // Update the message display with the conversion result
      msg.innerText = `${amountval} ${baseCurrency} = ${convertedAmount} ${targetCurrency}`;
    } else {
      // Handle cases where conversion data is not available or API reports failure
      msg.innerText = "Conversion data not available for this pair. Check API status or supported currencies.";
      console.error("API response missing expected data or failed:", data);
    }

  } catch (error) {
    // Catch network errors (e.g., no internet connection) or other unexpected issues
    console.error("Network or unexpected error during fetch:", error);
    msg.innerText = "An unexpected error occurred. Please check your internet connection or try again.";
  }
});
