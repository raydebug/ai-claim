console.log("Popup script loaded.");

document.addEventListener('DOMContentLoaded', function() {
  // In-memory store, will be populated from chrome.storage
  let claims = [];
  let allClaimData = {}; // To store all receipts, e.g., {"Claim A": [receipt1, receipt2]}

  // DOM Elements
  const receiptUpload = document.getElementById('receiptUpload');
  const uploadButton = document.getElementById('uploadButton');
  const ocrProgress = document.getElementById('ocrProgress');
  const ocrResult = document.getElementById('ocrResult');

  const newClaimNameInput = document.getElementById('newClaimName');
  const createClaimButton = document.getElementById('createClaimButton');
  const claimSelector = document.getElementById('claimSelector');

  const vendorNameInput = document.getElementById('vendorName');
  const receiptDateInput = document.getElementById('receiptDate');
  const totalAmountInput = document.getElementById('totalAmount');
  const invoiceNumberInput = document.getElementById('invoiceNumber');
  const saveDetailsButton = document.getElementById('saveDetailsButton');

  const receiptList = document.getElementById('receiptList'); // For displaying receipts
  const exportDataButton = document.getElementById('exportDataButton');

  function updateClaimSelector() {
    const currentSelectedValue = claimSelector.value;
    claimSelector.innerHTML = '<option value="">-- Select a Claim --</option>';
    claims.forEach(claimName => {
      const option = document.createElement('option');
      option.value = claimName;
      option.textContent = claimName;
      claimSelector.appendChild(option);
    });
    if (claims.includes(currentSelectedValue)) {
      claimSelector.value = currentSelectedValue;
    }
    displayReceiptsForSelectedClaim(); // Update receipt list when claims change / selection might change
  }

  function displayReceiptsForSelectedClaim() {
    receiptList.innerHTML = ''; // Clear current list
    const selectedClaim = claimSelector.value;
    if (selectedClaim && allClaimData[selectedClaim]) {
      allClaimData[selectedClaim].forEach((receipt, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Receipt ${index + 1}: ${receipt.vendorName || 'N/A'} - ${receipt.receiptDate || 'N/A'} - $${receipt.totalAmount || '0.00'}`;

        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'View Details';
        detailsButton.style.marginLeft = '10px';
        detailsButton.onclick = function() {
            // Simple alert for now, could populate a modal or dedicated area
            alert(`Details for Receipt ${index + 1}:\nVendor: ${receipt.vendorName}\nDate: ${receipt.receiptDate}\nAmount: $${receipt.totalAmount}\nInvoice #: ${receipt.invoiceNumber}\nFile: ${receipt.originalFileName}\nSaved: ${new Date(receipt.savedTimestamp).toLocaleString()}\n\nOCR Text:\n${receipt.ocrTextContent}`);
        };
        listItem.appendChild(detailsButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.marginLeft = '5px';
        deleteButton.onclick = function() {
          deleteReceipt(selectedClaim, index);
        };
        listItem.appendChild(deleteButton);
        receiptList.appendChild(listItem);
      });
    }
  }

  function deleteReceipt(claimName, receiptIndex) {
    if (allClaimData[claimName] && allClaimData[claimName][receiptIndex]) {
      if (confirm(`Are you sure you want to delete receipt ${receiptIndex + 1} from ${claimName}?`)) {
        allClaimData[claimName].splice(receiptIndex, 1); // Remove the receipt

        // Optional: If the claim has no more receipts, remove the claim itself
        // if (allClaimData[claimName].length === 0) {
        //   console.log(`Claim "${claimName}" is now empty. Removing claim.`);
        //   delete allClaimData[claimName];
        //   claims = claims.filter(c => c !== claimName);
        //   chrome.storage.local.set({ claims: claims }, function() { // Update claims in storage
        //     if (chrome.runtime.lastError) console.error("Error updating claims array in storage:", chrome.runtime.lastError);
        //     else console.log("Claims array updated in storage after deleting empty claim.");
        //   });
        // }

        chrome.storage.local.set({ allClaimData: allClaimData }, function() {
          if (chrome.runtime.lastError) {
            console.error("Error deleting receipt from allClaimData:", chrome.runtime.lastError);
            alert("Error deleting receipt. Check console.");
          } else {
            console.log('Receipt deleted and allClaimData updated in storage.');
            displayReceiptsForSelectedClaim(); // Refresh the list
            // updateClaimSelector(); // Call this if you implement auto-deletion of empty claims and modified 'claims' array
            alert("Receipt deleted successfully.");
          }
        });
      }
    }
  }

  // Load claims and all data on startup
  chrome.storage.local.get(['claims', 'allClaimData'], function(result) {
    if (chrome.runtime.lastError) {
        console.error("Error loading data from storage:", chrome.runtime.lastError);
        alert("Error loading data. Check console.");
        return;
    }
    if (result.claims) {
      claims = result.claims;
    }
    if (result.allClaimData) {
      allClaimData = result.allClaimData;
    }
    updateClaimSelector();
    console.log('Loaded claims:', claims);
    console.log('Loaded allClaimData:', allClaimData);
  });

  claimSelector.addEventListener('change', displayReceiptsForSelectedClaim);

  if (createClaimButton) {
    createClaimButton.addEventListener('click', function() {
      const newName = newClaimNameInput.value.trim();
      if (newName === "") {
        alert("Please enter a name for the new claim.");
        return;
      }
      if (claims.includes(newName)) {
        alert("A claim with this name already exists.");
      } else {
        claims.push(newName);
        claims.sort();
        chrome.storage.local.set({ claims: claims }, function() {
          if (chrome.runtime.lastError) {
            console.error("Error saving new claim name:", chrome.runtime.lastError);
            alert("Error saving new claim. Check console.");
            // Revert in-memory change if save failed
            claims = claims.filter(c => c !== newName);
          } else {
            console.log('Claims saved to storage.');
            updateClaimSelector();
            claimSelector.value = newName;
            newClaimNameInput.value = "";
            alert(`Claim "${newName}" created, selected, and saved.`);
          }
        });
      }
    });
  }

  if (saveDetailsButton) {
    saveDetailsButton.addEventListener('click', function() {
      const selectedClaim = claimSelector.value;
      if (!selectedClaim) {
        alert("Please select or create a claim before saving details.");
        return;
      }

      const claimDetails = {
        vendorName: vendorNameInput.value,
        receiptDate: receiptDateInput.value,
        totalAmount: totalAmountInput.value,
        invoiceNumber: invoiceNumberInput.value,
        originalFileName: receiptUpload.files.length > 0 && receiptUpload.files[0] ? receiptUpload.files[0].name : "N/A",
        ocrTextContent: ocrResult.querySelector('pre') ? ocrResult.querySelector('pre').textContent : "N/A",
        savedTimestamp: new Date().toISOString()
      };

      // Validate required fields before saving
      if (!claimDetails.vendorName || !claimDetails.receiptDate || !claimDetails.totalAmount) {
        alert("Please fill in at least Vendor Name, Date, and Total Amount.");
        return;
      }

      // Retrieve current data, update, then save back
      // No need to call chrome.storage.local.get here if allClaimData is kept up-to-date in memory
      // This simplifies logic and reduces storage calls if popup remains open.
      // However, for robustness if multiple popups could exist or background script modifies, fetching is safer.
      // For this extension, assuming single popup context, using in-memory allClaimData is fine.

      if (!allClaimData[selectedClaim]) {
        allClaimData[selectedClaim] = [];
      }
      allClaimData[selectedClaim].push(claimDetails);

      chrome.storage.local.set({ allClaimData: allClaimData }, function() {
        if (chrome.runtime.lastError) {
          console.error("Error saving claim details:", chrome.runtime.lastError);
          alert("Error saving details. Check console.");
          // Revert in-memory change if save failed
          allClaimData[selectedClaim].pop();
          if (allClaimData[selectedClaim].length === 0) delete allClaimData[selectedClaim];
        } else {
          console.log(`Details for Claim "${selectedClaim}" saved:`, claimDetails);
          alert("Claim details saved successfully!");
          displayReceiptsForSelectedClaim(); // Refresh the list for the current claim

          // Clear the form fields after saving
          vendorNameInput.value = '';
          receiptDateInput.value = '';
          totalAmountInput.value = '';
          invoiceNumberInput.value = '';
          ocrResult.innerHTML = ''; // Clear OCR text
          if(receiptUpload.files.length > 0) receiptUpload.value = ''; // Clear file input if a file was selected
        }
      });
    });
  }

  // --- OCR and Prefill Logic (from previous steps) ---
  function parseAndPrefillFields(ocrText, fileName) {
    if (!ocrText) return;
    console.log(`Attempting to parse OCR text from ${fileName}`);

    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.? \d{1,2},? \d{2,4}|(\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?,? \d{2,4})/i;
    const dateMatch = ocrText.match(dateRegex);
    if (dateMatch && dateMatch[0]) {
      try {
        const parsedDate = new Date(dateMatch[0].replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$2/$1/$3'));
        if (!isNaN(parsedDate)) {
             receiptDateInput.value = parsedDate.toISOString().split('T')[0];
        } else {
            console.warn("Could not parse date after initial match:", dateMatch[0]);
        }
      } catch (e) { console.warn("Error parsing date:", dateMatch[0], e); }
    }

    const totalRegex = /(?:total|amount due|balance|payment)[\s:]*(?:[\$€£]?\s*(\d+\.\d{2})|(\d+,\d{2})[\s€]?)/i;
    const totalMatch = ocrText.match(totalRegex);
    if (totalMatch) {
      let amount = totalMatch[1] || totalMatch[2];
      if (amount) {
        amount = amount.replace(',', '.');
        totalAmountInput.value = parseFloat(amount).toFixed(2);
      }
    }

    const invoiceRegex = /(?:invoice|document|order|receipt)\s*(?:number|#|no\.?)\s*[:\-]?\s*([a-z0-9\-]+)/i;
    const invoiceMatch = ocrText.match(invoiceRegex);
    if (invoiceMatch && invoiceMatch[1]) {
      invoiceNumberInput.value = invoiceMatch[1].toUpperCase();
    }

    console.log("Prefill attempt complete for " + fileName);
  }

  if (uploadButton) {
    uploadButton.addEventListener('click', async function() {
      if (receiptUpload.files.length === 0) {
        alert("Please select one or more image files (JPG, PNG).");
        return;
      }

      ocrProgress.innerHTML = "";
      ocrResult.innerHTML = "";

      vendorNameInput.value = "";
      receiptDateInput.value = "";
      totalAmountInput.value = "";
      invoiceNumberInput.value = "";

      const file = receiptUpload.files[0];

      if (!file.type.startsWith('image/')) {
        ocrResult.innerHTML += `<p>Skipping non-image file: ${file.name}. Please select an image.</p>`;
        return;
      }

      ocrProgress.innerHTML += `<p>Processing ${file.name}... </p>`;

      try {
        const fileProgressElement = document.createElement('p');
        fileProgressElement.textContent = `Extracting text from ${file.name}... please wait.`;
        ocrProgress.appendChild(fileProgressElement);

        const { data: { text } } = await Tesseract.recognize(
          file, 'eng',
          {
            logger: m => {
              console.log(m);
              if (m.status === 'recognizing text') {
                const progress = (m.progress * 100).toFixed(2);
                fileProgressElement.textContent = `Extracting text from ${file.name}... ${progress}%`;
              }
            }
          }
        );

        fileProgressElement.remove();
        ocrResult.innerHTML += `<h3>OCR Result for ${file.name}:</h3><pre>${text}</pre>`;
        parseAndPrefillFields(text, file.name);

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        ocrResult.innerHTML += `<p>Error processing ${file.name}. Check console for details.</p>`;
        const fileProgressElement = ocrProgress.querySelector('p'); // Attempt to find it if error occurred early
        if (fileProgressElement && fileProgressElement.textContent.includes(file.name)) {
          fileProgressElement.remove();
        }
      }

      const generalProgressMessages = ocrProgress.querySelectorAll('p');
      generalProgressMessages.forEach(p => {
          if (p.textContent.startsWith("Processing ${file.name}") && !p.textContent.includes("... please wait.")) {
              p.remove();
          }
      });
      if (ocrProgress.textContent.trim() === "") {
        ocrProgress.innerHTML = "<p>File processed.</p>";
      }
    });
  } else {
    console.error("Upload button not found.");
  }

  if (exportDataButton) {
    exportDataButton.addEventListener('click', function() {
      chrome.storage.local.get(['claims', 'allClaimData'], function(result) {
        if (chrome.runtime.lastError) {
          console.error("Error retrieving data for export:", chrome.runtime.lastError);
          alert("Could not retrieve data for export. Check console.");
          return;
        }

        const claimsToExport = result.claims || [];
        const allClaimDataToExport = result.allClaimData || {};

        if (claimsToExport.length === 0 && Object.keys(allClaimDataToExport).length === 0) {
          alert("No data to export.");
          return;
        }

        const exportData = {
          exportedClaimsList: claimsToExport,
          exportedClaimDetails: allClaimDataToExport,
          exportTimestamp: new Date().toISOString()
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `insurance_claims_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); // Required for Firefox
        a.click();
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url);

        alert("Data export initiated.");
      });
    });
  }
});
