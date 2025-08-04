// Get references to UI elements
let connectButton = document.getElementById('connectBtn');

// 
let timer;
let timeSet = 10; // 30 seconds
let timeLeft = timeSet
const timeDisplay = document.getElementById('time');
const startStopButton = document.getElementById('startStopButton');
const removeReadingButton = document.getElementById('removeReadingButton');
const readingsTable = document.getElementById('readingsTable');
const calculateButton = document.getElementById('calculateButton');
const plantDropdown = document.getElementById('plantDropdown');
const calculate_url = document.getElementById('calculate_url');
const fertilizer_suggestions = document.getElementById('fertilizer_suggestions');
const suggestions = document.getElementById('suggestions');

let is_connected = false;

let receive_data = [];
disconnected();
// Connect to the device on Connect button click or if it connected disconnect it

connectButton.addEventListener('click', function () {
    if (is_connected == false) {

        connect();

    } else {
        disconnect();
        is_connected = false;
        connectButton.textContent = "Connect"
        disconnected();
    }
});



// Handle form submit event
// sendForm.addEventListener('submit', function (event) {
//     event.preventDefault(); // Prevent form sending
//     send(inputField.value); // Send text field contents
//     inputField.value = '';  // Zero text field
//     inputField.focus();     // Focus on text field
// });

// Launch Bluetooth device chooser and connect to the selected

// Selected device object cache
let deviceCache = null;

// Launch Bluetooth device chooser and connect to the selected
function connect() {
    log(['success', 'checks']);
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
        then(device => connectDeviceAndCacheCharacteristic(device)).
        then(characteristic => startNotifications(characteristic)).
        catch(error => log(['success', error]));
}

function requestBluetoothDevice() {
    log(['success', 'Requesting bluetooth device...']);

    return navigator.bluetooth.requestDevice({
        filters: [{ services: [0xFFE0] }],
    }).
        then(device => {
            log(['success', '"' + device.name + '" bluetooth device selected']);
            deviceCache = device;
            deviceCache.addEventListener('gattserverdisconnected',
                handleDisconnection);

            return deviceCache;
        });
}
function handleDisconnection(event) {
    let device = event.target;

    log(['error', '"' + device.name +
        '" bluetooth device disconnected, trying to reconnect...']);

    connectDeviceAndCacheCharacteristic(device).
        then(characteristic => startNotifications(characteristic)).
        catch(error => log(['error', error]));
}
let characteristicCache = null;
// Connect to the device specified, get service and characteristic
function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    log(['success', 'Connecting to GATT server...']);

    return device.gatt.connect().
        then(server => {
            log(['success', 'GATT server connected, getting service...']);

            return server.getPrimaryService(0xFFE0);
        }).
        then(service => {
            log(['success', 'Service found, getting characteristic...']);

            return service.getCharacteristic(0xFFE1);
        }).
        then(characteristic => {
            log(['success', 'Characteristic found']);
            characteristicCache = characteristic;

            return characteristicCache;
        });
}

// Enable the characteristic changes notification
function startNotifications(characteristic) {
    log(['success', 'Starting notifications...']);

    return characteristic.startNotifications().
        then(() => {
            log(['success', 'Notifications started']);
            is_connected = true;
            connectButton.textContent = "Disconnect"
            connected();
            characteristic.addEventListener('characteristicvaluechanged',
                handleCharacteristicValueChanged);
        });
}

// Output to terminal
function log(data, type = '') {
    // Command: toastr[data[0]](`${data[1]}`);
}

// Disconnect from the connected device
function disconnect() {
    if (deviceCache) {
        log(['error', 'Disconnecting from "' + deviceCache.name + '" bluetooth device...']);
        deviceCache.removeEventListener('gattserverdisconnected',
            handleDisconnection);

        if (deviceCache.gatt.connected) {
            deviceCache.gatt.disconnect();
            log(['error', '"' + deviceCache.name + '" bluetooth device disconnected']);
        }
        else {
            log(['error', '"' + deviceCache.name +
                '" bluetooth device is already disconnected']);
        }
    }
    // Added condition
    if (characteristicCache) {
        characteristicCache.removeEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
        characteristicCache = null;
    }


    deviceCache = null;
}
// Intermediate buffer for incoming data
let readBuffer = '';
// Data receiving
function handleCharacteristicValueChanged(event) {
    let value = new TextDecoder("utf-8").decode(event.target.value);
    console.log(value);
    receive(value);
    // for (let c of value) {
    //     if (c === '\n') {
    //         let data = readBuffer.trim();
    //         readBuffer = '';

    //         if (data) {
    //             receive(data);
    //         }
    //     }
    //     else {
    //         readBuffer += c;
    //     }
    // }
}

function receive(data) {
    receive_data.push(data);
}


function send(data) {
    data = String(data);

    if (!data || !characteristicCache) {
        return;
    }

    data += '\n';

    if (data.length > 20) {
        let chunks = data.match(/(.|[\r\n]){1,20}/g);

        writeToCharacteristic(characteristicCache, chunks[0]);

        for (let i = 1; i < chunks.length; i++) {
            setTimeout(() => {
                writeToCharacteristic(characteristicCache, chunks[i]);
            }, i * 100);
        }
    }
    else {
        writeToCharacteristic(characteristicCache, data);
    }

    // log(data, 'out');
}

function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
}

// code for reading values
startStopButton.addEventListener('click', () => {
    if (startStopButton.textContent === 'Start') {
        send("1")
        startTimer();
    } else {
        send("0")
        stopTimer();
    }
});

function connected() {
    startStopButton.disabled = false;
    removeReadingButton.disabled = false;
    calculateButton.disabled = false
    plantDropdown.disabled = false;

}

function disconnected() {
    startStopButton.disabled = true;
    removeReadingButton.disabled = true;
    calculateButton.disabled = true;
    plantDropdown.disabled = true;

}

function addRow(measurement) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>New Reading</td>
        <td class="measurement status-indicator" data-status="High" data-measurement="${measurement}">measured</td>
    `;
    readingsTable.appendChild(newRow);
};

async function calculate() {
    trs = readingsTable.getElementsByClassName('measurement');
    trs_len = trs.length;
    measurement = [0, 0, 0];
    for (tr of trs) {
        values = (tr.dataset.measurement).split(",");
        measurement[0] += Number(values[0])
        measurement[1] += Number(values[1])
        measurement[2] += Number(values[2])

    }
    n = measurement[0] / trs_len;
    p = measurement[1] / trs_len;
    k = measurement[2] / trs_len;
    plant_id = plantDropdown.value;
    url = calculate_url.dataset.url.replace('--n', n).replace('--p', p).replace('--k', k).replace('--plant_id', plant_id);
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok) {
        document.getElementById("n").textContent = data.n;
        document.getElementById("p").textContent = data.p;
        document.getElementById("k").textContent = data.k;

        document.getElementById("n").dataset.status = data.n;
        document.getElementById("p").dataset.status = data.p;
        document.getElementById("k").dataset.status = data.k;

        fertilizer_suggestions.innerHTML = ""
        console.log("start")
        console.log(fertilizer_suggestions.innerHTML)
        fertilizer_suggestions.insertAdjacentHTML('beforeend', data.fertilizer_suggestions);

        suggestions.innerHTML = ""

        for (title of Object.keys(data.suggestions)) {
            newHtml = `<h5>${title}</h5>
                        <p>${data.suggestions[title]}</p>`;

            suggestions.insertAdjacentHTML('beforeend', newHtml);
        }

    }


}

removeReadingButton.addEventListener('click', () => {
    if (readingsTable.rows.length > 0) {
        readingsTable.deleteRow(-1);
    }
});

calculateButton.addEventListener('click', calculate);
plantDropdown.addEventListener('change', calculate)

function startTimer() {
    startStopButton.textContent = 'Stop';
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            addRow(receive_data[receive_data.length - 1])
            send("0");
            send("0");
            startStopButton.textContent = 'Start';
            timeLeft = timeSet;
            timeDisplay.textContent = `0:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
            return;
        }
        timeLeft -= 1;
        timeDisplay.textContent = `0:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
    startStopButton.textContent = 'Start';
    timeLeft = timeSet
    timeDisplay.textContent = `0:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
}
