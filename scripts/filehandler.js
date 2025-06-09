/* filehandler.js */

let selectedFile;
let resultJSON;
let optionPriceMap = {
  /*
  "Option1Name" : {
    index: ,
    optionChoices: [...],
    optionChoicesPriceMap: {"optionChoice1Name":price, ...},
  },
  "Option2Name"
  */
};

$(document).ready(function () {
  //const fileInput = $('#fileInput');
  const fileInput = document.querySelector('#fileInput');
  const dropZone = document.querySelector('#drop-zone');
  fileInput.style.display = "none";

  dropZone.ondragover = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('hover');
  };

  dropZone.ondragleave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('hover');
  };

  dropZone.ondrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('hover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Update drop zone text
      dropZone.innerHTML = `${files[0].name}`;
      // Parse CSV file
      parseCSVtoJSON(files[0]);
    }
  };

  dropZone.onclick = (e) => {
    console.log("DROP ZONE CLICKED")
    fileInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  fileInput.onclick = (e) => {
    console.log("FILE INPUT CLICKED")
  }

  fileInput.onchange = (e) => {
    const files = fileInput.files;
    if (files.length > 0) {
      // Update drop zone text
      dropZone.innerHTML = `File Uploaded: ${files[0].name}`;
      // Parse CSV file
      parseCSVtoJSON(files[0]);
    }
  };

});



/* ----------------------------- HANDLER FUNCTIONS -------------------------- */

function parseCSVtoJSON(csvFile) {
  Papa.parse(csvFile, {
    complete: function(result) {
      selectedFile = csvFile;
      resultJSON = result;
      buildPriceInputTable(resultJSON.data);
    }
  });
}

function buildPriceInputTable(resultData) {
  // Max number of options on Wix
  const maxOptions = 6;
  const headerRow = resultData[0];

  // Product Name
  let prodName = resultData[1][2];

  // Reset optionPriceMap
  optionPriceMap = {};

  for (var i=1; i<=maxOptions; i++) {
    let currProdOptionNum = `productOptionName${i}`;
    let currIndex = headerRow.indexOf(currProdOptionNum);
    let currProdOptionName = resultData[1][currIndex];
    if (currProdOptionName !== "") {
      // Split option choice into array
      let optionChoices = resultData[1][currIndex+2];
      let optionChoicesArr = resultData[1][currIndex+2].split(";");
      let optionChoicesPriceMap = {};
      optionChoicesArr.forEach(optionChoice => {
        optionChoicesPriceMap[optionChoice] = 0;
      }); // TODO: find/calculate current prices and store them in map
      // Instantiate optionPriceMap entry
      optionPriceMap[currProdOptionName] = {
        index: currIndex,
        optionChoices: optionChoicesArr,
        optionChoicesPriceMap: optionChoicesPriceMap,
      };
    }
    else {
      break;
    }
  }

  let priceGridHeader = document.querySelector("#price-grid-header");
  let productName = document.querySelector("#product-name");
  let exportButton = document.querySelector("#export-button");

  let priceStringContainer = document.querySelector(".price-string-container");
  let priceStringInput = document.querySelector("#price-string-input");
  let priceStringButton = document.querySelector("#enter-price-string-button");
  let resetButton = document.querySelector("#reset-button");

  let priceGrid = document.querySelector("#price-grid");

  productName.innerHTML = prodName;
  productName.classList.remove("hidden");
  exportButton.classList.remove("hidden");
  priceGrid.innerHTML = ""; // Reset grid
  priceGrid.classList.remove("hidden");
  priceStringContainer.classList.remove("hidden");

  let numCols = Object.entries(optionPriceMap).length; // number of options
  let numRows = 0; // number of choices for option with most choices
  // Find num rows
  for (const optionName of Object.keys(optionPriceMap)) {
    numRows = Math.max(numRows, optionPriceMap[optionName]["optionChoices"].length)
  }

  // Build table grid of text fields for pricing info
  for (const optionName of Object.keys(optionPriceMap)) {
    // Instantiate option containers, each column
    let optionContainerDiv = document.createElement("div");
    optionContainerDiv.classList.add("option-container");
    //optionContainerDiv.style.width = `max(200px, ${(100/numCols)}%)`
    let optionTitleDiv = document.createElement("h4");
    optionTitleDiv.innerHTML = optionName;
    optionContainerDiv.appendChild(optionTitleDiv);
    let optionChoicesArr = optionPriceMap[optionName]["optionChoices"];
    // Add title and input field for each choice, for each option
    optionChoicesArr.forEach(optionChoice => {
      let optionChoiceContainerDiv = document.createElement("div");
      optionChoiceContainerDiv.classList.add("option-choice-container");
      let optionChoiceTitleDiv = document.createElement("div");
      optionChoiceTitleDiv.innerHTML = optionChoice;
      let optionChoiceInput = document.createElement('input');
      optionChoiceInput.setAttribute('type', 'text');
      optionChoiceInput.setAttribute('placeholder', '0.00');
      optionChoiceInput.id = `priceInput_${optionName}_${optionChoice}`;
      optionChoiceInput.oninput = (e) => {
        validatePriceInput(e, optionChoiceInput);
      }
      optionChoiceContainerDiv.appendChild(optionChoiceTitleDiv);
      optionChoiceContainerDiv.appendChild(optionChoiceInput);
      optionContainerDiv.appendChild(optionChoiceContainerDiv);
    });
    priceGrid.appendChild(optionContainerDiv);
  }

  // Optional price string input and submit button
  priceStringButton.onclick = (e) => {
    processPriceString(e, priceStringInput);
  };

  // Reset button handler
  resetButton.onclick = (e) => {
    resetPriceGrid();
  }

  // Initilize grid size. Add resize event listener
  resizeGrid();
  document.body.onresize = (e) => {
    resizeGrid();
  };
}

function isValidPrice(valueStr) {
  return /^-?\d*\.?\d*$/.test(valueStr);
}

// Ensure each input field is a decimal price (can be negative)
function validatePriceInput(e, input) {
  const value = input.value;
  if (!isValidPrice(value)) {
    input.value = value.slice(0, -1);
  }
}

// Validate and generate table from price string
function processPriceString(e, priceStringInput) {
  if (priceStringInput.value === "") {
    return;
  }
  let inputPriceStr = priceStringInput.value.replace(/\s+/g,""); // remove whitespace
  let priceArray = inputPriceStr.split(",");
  let invalidPrices = "";
  priceArray.forEach(priceStr => {
    if (!isValidPrice(priceStr)) {
      invalidPrices += `${priceStr}, `;
    }
  });
  // Alert message if any invalid prices
  if (invalidPrices) {
    alert(`Invalid prices: ${invalidPrices}`)
  }
  else {
    populatePriceInputs(priceArray);
  }
}

// Populate all price inputs from optional price string input
function populatePriceInputs(priceArr) {
  let inputs = document.querySelectorAll('input');
  let priceIter = 0;
  inputs.forEach(input => {
    let idComponents = input.id.split("_");
    if (idComponents[0] === "priceInput" && priceIter < priceArr.length) {
      input.value = priceArr[priceIter];
      priceIter++;
    }
  });
}

function resetPriceGrid() {
  let inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    let idComponents = input.id.split("_");
    if (idComponents[0] === "priceInput") {
      input.value = "";
    }
  });
}

// Compile Price Data, Export CSV
let exportButton = document.querySelector("#export-button");
exportButton.onclick = (e) => {
  exportFileHandler(e);
}

function exportFileHandler(e) {
  // On button click,
  // 1. get price input fields
  // 2. update optionChoicePrices array in optionPriceMap (?)
  // 3. update values in resultData (JSON/Array from CSV)
  // 4. Unparse data to CSV file
  // 5. Download new CSV (!!!)

  // Get price input fields, update optionChoicePrices array in optionPriceMap
  let inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    let idComponents = input.id.split("_");
    if (idComponents[0] === "priceInput") {
      let optionName = idComponents[1];
      let optionChoiceName = idComponents[2];
      let optionChoicePrice = input.value;
      // Update optionPriceMap
      optionPriceMap[optionName].optionChoicesPriceMap[optionChoiceName] = optionChoicePrice;
    }
  });

  // Update values in resultJSON.data (JSON/Array from CSV)
  let numVariants = 1;

  for (const optionName of Object.keys(optionPriceMap)) {
    numVariants = numVariants * optionPriceMap[optionName]["optionChoices"].length;
  }

  for (var i=0; i<numVariants; i++) {
    let variantRow = i+2;
    // Calculate Price Sum, iterate over options and variant choices
    let priceSum = 0.0;
    for (const optionName of Object.keys(optionPriceMap)) {
      let optionIndex = optionPriceMap[optionName].index;
      let selectedChoice = resultJSON.data[variantRow][optionIndex+2];
      let choicePrice = optionPriceMap[optionName].optionChoicesPriceMap[selectedChoice];
      if (choicePrice) {
        priceSum += parseFloat(choicePrice);
      }
    }
    // Add price sums to resultData JSON
    if (priceSum > 0) {
      resultJSON.data[variantRow][9] = priceSum;
    }
    // TESTING: PALETA VARIANT PRICE CHECK
    /*if (priceSum !== parseFloat(resultJSON.data[variantRow][9])) {
      console.log(variantRow)
      console.log(`Calc price: ${priceSum}, List price: ${parseFloat(resultJSON.data[variantRow][9])}`)
    }*/
    // ,100,100,100,100,100,100,100,100,100,100,100,100,200,,180,480,,160,250,350,,480
  }

  // Export CSV
  let newCSV = Papa.unparse(resultJSON.data);
  // Download file
  var csvData = new Blob([newCSV], {type: 'text/csv;charset=utf-8;'});
  var csvURL =  null;
  if (navigator.msSaveBlob) {
    csvURL = navigator.msSaveBlob(csvData, 'download.csv');
  }
  else {
    csvURL = window.URL.createObjectURL(csvData);
  }
  // Create temp link, simulate click to download
  var tempLink = document.createElement('a');
  tempLink.href = csvURL;
  tempLink.setAttribute('download', 'download.csv');
  tempLink.click();

  /*Papa.unparse(resultJSON.data, {
    complete: function(newCSV) {
      console.log("UNPARSE COMPLETE!")
      // Download file
      const url = URL.createObjectURL(newCSV);
      const a = document.createElement('a');
      a.href = url;
      a.download = newCSV.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });*/

}

function resizeGrid() {
  let optionContainerDivs = document.querySelectorAll(".option-container");
  let priceGrid = document.querySelector("#price-grid");
  let gridWidth = priceGrid.getBoundingClientRect().width;
  let numCols = Object.entries(optionPriceMap).length;
  let minColSize = 200; // pixels
  console.log(gridWidth)
  console.log(minColSize)
  console.log(gridWidth / minColSize)
  // Set column width as fraction of grid width such that
  let maxColsPerRow = Math.max(1, Math.min(numCols, Math.floor(gridWidth / minColSize)));
  optionContainerDivs.forEach(div => {
    div.style.width = `calc(${(100/maxColsPerRow)}% - ${12}px)`
    //div.style.width = `${(92/maxColsPerRow)}%`
  });
}





//
