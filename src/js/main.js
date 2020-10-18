"use strict";

const isProdFlag = true;

let priceSymbol = '';
let daysBack = '100';
let timeWaiting = 0;
let timeWaitingInterval = null;

const table = document.querySelector('.js-fa-table');
const alert = document.querySelector('.js-fa-alert');
const formInputs = document.querySelectorAll('.js-fa-input');
const indicator = document.querySelector('.js-fa-indicator');
const movingAvarageElement = document.querySelector('.js-fa-moving-avarage');


const  headers = new Headers()
headers.append('Authorization', `Basic ${btoa('desktopapp:Pa55word')}`)

function getURL(data) {
    return new Promise((resolve) => {
        let url = `https://webservice.gvsi.com/query/json/GetDaily/tradedatetimegmt/open/high/low/close/volume?pricesymbol="${data.priceSymbol.toUpperCase()}"&daysBack=${data.daysBack}`

        if (!isProdFlag) {
            url = './js/dummyData.json';
        }
        
        resolve(url)
    })
}

function displaySections(data) {
    return new Promise(resolve => {
        movingAvarageElement.disabled = '';
        hideSection(alert);
        hideSection(indicator);
        showSection(table);
        resetIntervals();
        resolve();
    })
}

function updateView(data, days) {
    return new Promise(resolve => {
        formatDate(data)
        generateTableRow(data, days);
        resetIntervals();
        resolve(data);
    })
}



async function fetchingData(data) {
    let url = await getURL(data);
    
    let response = await fetch(url, {method:'GET', headers: headers})
    
    if (!response.ok) {
        indicator.querySelector('.js-fa-indicator-message').innerHTML = 'Symbol is not correct, check symbol input field!';
        indicator.querySelector('.js-fa-indicator-message').classList.remove('is-hidden');
        indicator.querySelector('.js-fa-indicator-cta').classList.remove('is-hidden');
        throw new Error('Failed to fetch data!');
    }
    
    let json = await response.json();
    
    await displaySections(json.results.items)
    
    let tableData = await updateView(json.results.items, data.daysBack)
    
    if (data.isMovingAvarage) {
        generateMovingAvarage(tableData, data.daysBack);
    }
    
    return json;

}

function generateTableRow(itemsArray, days) {
    table.querySelector('.js-fa-table-body').innerHTML = '';

    if (!isProdFlag) {
        itemsArray = itemsArray.slice(-days);
    }

    let row = '';
    loopEach(itemsArray, (element,index) => {
        row += `<div class="fa-table__item">`;
        row += `<div class="fa-table__item-data">${index + 1}</div>`;
        row += `<div class="fa-table__item-data">${element.tradedatetimegmt}</div>`;
        row += `<div class="fa-table__item-data">${element.open}</div>`;
        row += `<div class="fa-table__item-data">${element.high}</div>`;
        row += `<div class="fa-table__item-data">${element.low}</div>`;
        row += `<div class="fa-table__item-data">${element.close}</div>`;
        row += `<div class="fa-table__item-data">${element.volume}</div>`;
        row += `</div>`;
    })

    table.querySelector('.js-fa-table-body').innerHTML = row;
}

function generateMovingAvarage(data, days) {
    let items = data;
    if (!isProdFlag) {
        items = data.slice(-days);
    }
    let sum = 0;
    let result = 0;
    let tableItem = document.createElement('div');
    tableItem.classList.add('fa-table__item', 'fa-table__item--total');
    let row = '';


    loopEach(items, element => {
        sum += element.close
    })

    result = sum / days;

    row += `<div class="fa-table__item-data">Moving Avarage</div>`;
    row += `<div class="fa-table__item-data">${result.toFixed(2)}</div>`;
    row += `<div class="fa-table__item-data"></div>`;

    tableItem.innerHTML = row;

    table.querySelector('.js-fa-table-body').appendChild(tableItem);

}

function requestTimeWaiting() {
    timeWaiting += 1;
    if (timeWaiting > 2) {
        if (indicator.querySelector('.js-fa-indicator-message').innerHTML === '') {
            indicator.querySelector('.js-fa-indicator-message').innerHTML = 'Fetching data will take a while... Please wait, or cancel and go back.'
        }
        indicator.querySelector('.js-fa-indicator-message').classList.remove('is-hidden');
        indicator.querySelector('.js-fa-indicator-cta').classList.remove('is-hidden');
    }
}

function onCancelRequest() {
    resetIntervals();
    hideSection(indicator);
}

function resetIntervals() {
    timeWaiting = 0;
    clearInterval(timeWaitingInterval);
    indicator.querySelector('.js-fa-indicator-message').classList.add('is-hidden');
    indicator.querySelector('.js-fa-indicator-cta').classList.add('is-hidden');
}

function onChangeInput(ev) {
    let input = ev.target
    
    if (input.id === 'fa-options') {
        movingAvarageElement.value = '';
        priceSymbol = input.value;

        if (priceSymbol.trim(' ').length < 1) {
            return;
        }

        showSection(indicator);
        timeWaitingInterval = setInterval(requestTimeWaiting, 1000);
        
        fetchingData({priceSymbol: priceSymbol, daysBack: '100'});
    
    }
        
    if (input.id === 'fa-moving-avarage') {
        showSection(indicator);
        timeWaitingInterval = setInterval(requestTimeWaiting, 1000);

        fetchingData({priceSymbol: priceSymbol, daysBack: input.value, isMovingAvarage: true});
    }

}

// Helper Functions
function formatDate(data) {
    loopEach(data, element => {
        if (element.tradedatetimegmt) {
            element.tradedatetimegmt = element.tradedatetimegmt.split(' ')[0]
        }
    })
}

function loopEach(items, callback) {
    items.forEach(callback);
}

function showSection(section) {
    section.classList.remove('is-hidden')
}
function hideSection(section) {
    section.classList.add('is-hidden')
}

// Event Listeners
loopEach(formInputs, element => {
    element.addEventListener('change', onChangeInput, false);
})
indicator.querySelector('.js-fa-indicator-button').addEventListener('click', onCancelRequest, false);
