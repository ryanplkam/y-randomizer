const loadingContainer = document.querySelector('.loading-container');
const loadingDiv = loadingContainer.querySelector('.loading-div');
const button = document.querySelector('button');
const typedTextLink = document.querySelector('#typed-link')
const typedText = typedTextLink.querySelector('#typed');

// Utility
var parseHTML = function(str) {
  var tmp = document.implementation.createHTMLDocument();
  tmp.body.innerHTML = str;
  return tmp.body.children;
};

function selectRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function selectRandomSubset(list, subsetLength) {
    let randomSubset = [];
    for (i=0;i<subsetLength;i++) {
        randomSubset.push(selectRandom(list));
    }
    return randomSubset;
}

// Store random companies info
var randomCompanies = [];

// Main
function main(callback) {
    requestCrossDomain("http://www.yclist.com", function(data) {

        // Parse nodes into HTML and get the one for the companies
        var jsonNodes = [...parseHTML(data.query.results.result)];
        var companiesNode = jsonNodes.filter(node => node.id == "companies")[0];

        // Filter for companies that have a website
        var companies = [...companiesNode.querySelectorAll('tr')].filter(company => company.classList.length > 0);
        var validCompanies = companies.filter(company => company.querySelector('td:nth-child(3) a'))

        // Store relevant company data in arrays
        var companies = []
        validCompanies.forEach(company => {
            var name = company.querySelector('td:nth-child(2)').innerHTML;
            var url = company.querySelector('td:nth-child(3) a').href;
            companies.push({name, url})
        })

        // Store URLS of all companies in an array (for main button)
        var companiesUrls = companies.map(company => company.url);

        // Bind main click handler
        button.addEventListener('click', () => window.open(selectRandom(companiesUrls)));

        // Store random companies and store their names in an array for Typed.js
        randomCompanies = selectRandomSubset(companies, 100);
        // console.table(randomCompanies)
        var randomCompanyNames = randomCompanies.map(company => company.name);

        // Initialize typed.js
        var typed = new Typed('#typed', {
            strings: randomCompanyNames,
            typeSpeed: 65,
            backSpeed: 20,
            startDelay: 600, // Matches CSS transition property
            backDelay: 2750,
            loop: true,
            loopCount: Infinity,
            showCursor: true
        })

        // Run callback
        callback();
    });
};

// Cross domain scraping via YQL
function requestCrossDomain(site, callback) {
    let yql = `select * from htmlstring where url='${site}' AND xpath='//div'`; 
    let restUrl = `http://query.yahooapis.com/v1/public/yql?q=${encodeURIComponent(yql)}&_maxage=3600&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`;

    fetch(restUrl)
    .then(function(response) {
        if (response.status !== 200) {
            console.log(`Looks like there was a problem: Status code: ${response.status}`);
            return;
        }
        response.json().then(function(data) {
            callback(data);
        })
    })
}

// Load screen helpers
var activateLoadingScreen = () => loadingDiv.classList.add('loading-active');

var deactivateLoadingScreen = () => {
    loadingContainer.setAttribute('style', 'opacity: 0;');
    setTimeout(() => loadingContainer.setAttribute('style', 'display: none;'), 600);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initiate loading screen
    activateLoadingScreen();
    // Run main function and deactivate loading screen on completion
    main(deactivateLoadingScreen);
})


// Boolean to track whether typing or backspacing
let typing = false;
// Start the index at -1
let currentCompanyIndex = -1;

// Create observer
var mutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(mutation => {

        // Do nothing unless it's the first character of the word
        if (typedText.innerHTML.length !== 1) return;
        typing = !typing;
        if (typing) {

            // Increment the counter starting over from 0 once end reached
            currentCompanyIndex === (randomCompanies.length - 1) ? currentCompanyIndex = 0 : currentCompanyIndex += 1;

            // Update link to the current company
            let currentCompany = randomCompanies[currentCompanyIndex];
            typedTextLink.href = currentCompany.url;

            // console.log(`${currentCompanyIndex}:`, currentCompany)

        };
    });
});

// Observe the typed.js element
mutationObserver.observe(typedText, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
});