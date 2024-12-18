const API = 'b3abc62e1a62742f1512030784447781';
const TODAY = new Date();
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
let user;

function changeType(type) {
    let chartType = document.getElementById("chart-type");
    switch (type) {
        case "Artistas":
            chartType.textContent = "ARTISTAS";
            document.getElementById("artists-chart").hidden = false;
            document.getElementById("albums-chart").hidden = true;
            document.getElementById("songs-chart").hidden = true;
            break;
    
        case "Albuns":
            chartType.textContent = "ÁLBUNS";
            document.getElementById("artists-chart").hidden = true;
            document.getElementById("albums-chart").hidden = false;
            document.getElementById("songs-chart").hidden = true;
            break;

        case "Musicas":
            chartType.textContent = "MÚSICAS";
            document.getElementById("artists-chart").hidden = true;
            document.getElementById("albums-chart").hidden = true;
            document.getElementById("songs-chart").hidden = false;
            break;
    }
}

function quickChangeType() {
    switch (document.getElementById("chart-type").textContent) {
        case "ARTISTAS":
            changeType("Albuns");
            break;
    
        case "ÁLBUNS":
            changeType("Musicas");
            break;

        case "MÚSICAS":
            changeType("Artistas");
            break;
    }
}

function changePeriodInput(type) {
    switch (type) {
        case "Semanal":
            document.getElementById("week-input-div").hidden = false;
            document.getElementById("month-input-div").hidden = true;
            document.getElementById("year-input-div").hidden = true;
            break;
    
        case "Mensal":
            document.getElementById("week-input-div").hidden = true;
            document.getElementById("month-input-div").hidden = false;
            document.getElementById("year-input-div").hidden = true;
            break;

        case "Anual":
            document.getElementById("week-input-div").hidden = true;
            document.getElementById("month-input-div").hidden = true;
            document.getElementById("year-input-div").hidden = false;
            break;
    }
}

function cleanChildren(id) {
    let element = document.getElementById(id);
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

Date.prototype.getWeek = function() {
    let date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    let week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getWeekMonday(year, week) {
    const jan4 = new Date(year, 0, 4); 
    const daysToAdd = (week - 1) * 7; 
    const startDate = new Date(jan4.getTime() + daysToAdd * 24 * 60 * 60 * 1000); 
  
    const dayOfWeek = startDate.getDay(); 
    if (dayOfWeek !== 1) { 
        startDate.setDate(startDate.getDate() - (dayOfWeek - 1)); 
    }
  
    return startDate;
  }

async function getuser() {
    user = document.getElementById("user").value;
    try {
        let accCreation;
        let weekInput = document.getElementById("week-input");
        let monthInput = document.getElementById("month-input");
        const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${user}&api_key=${API}&format=json`);
        const data = await response.json();
        accCreation = new Date(data.user.registered.unixtime * 1000)
        document.getElementById("chart-info").hidden = false;
        document.getElementsByTagName("fieldset")[0].disabled = false;
        document.getElementsByTagName("fieldset")[1].disabled = false;
        changeType('Artistas');
        changePeriodInput('Semanal');

        // trocar pfp
        document.getElementById('chart-logo').src = data.user.image[2]["#text"];

        // limitar max e min de semanas
        weekInput.min = accCreation.getFullYear() + "-W" + accCreation.getWeek();
        weekInput.max = TODAY.getFullYear() + "-W" + TODAY.getWeek();


        // limitar max e min de meses
        let accMonth = accCreation.getMonth() + 1;
        let curMonth = TODAY.getMonth() + 1;

        if (accCreation.getMonth() < 9) {
            accMonth = "0" + (accCreation.getMonth() + 1);
        }

        if (TODAY.getMonth().length < 9) {
            curMonth = "0" + (TODAY.getMonth() + 1);
        }

        monthInput.min = accCreation.getFullYear() + "-" + accMonth;
        monthInput.max = TODAY.getFullYear() + "-" + curMonth;

        // pegar anos
        cleanChildren("year-select");
        for (let i = TODAY.getFullYear(); i >= accCreation.getFullYear(); i--) {
            let option = document.createElement("option");
            option.value = "" + i + "";
            option.textContent = i;
            document.getElementById("year-select").appendChild(option);

        
        }
    } catch (error) {
        alert("Erro: " + error);
    }
}

async function printCharts(from, to) {
    let tr, num, mainInfo, subInfo;
    let getChart = ["getweeklyartistchart", "getweeklyalbumchart", "getweeklytrackchart", "artists-chart", "albums-chart", "songs-chart"];
    try {
        for (let x = 0; x < 3; x++) {
            const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.${getChart[x]}&user=${user}&from=${from}&to=${to}&limit=10&api_key=${API}&format=json`);
            const data = await response.json();

            // build chart
            for (let i = 0; i < 10; i++) {
                tr = document.createElement("tr");
                num = document.createElement("td");
                num.textContent = i + 1;
                mainInfo = document.createElement("td");

                // print the main info & artist name
                if (x == 0) {
                    mainInfo.textContent = data.weeklyartistchart.artist[i].name;

                } else if (x == 1) {
                    mainInfo.textContent = data.weeklyalbumchart.album[i].name;
                    subInfo = document.createElement("p");
                    subInfo.textContent = data.weeklyalbumchart.album[i].artist["#text"];
                    mainInfo.appendChild(subInfo);

                } else if (x == 2) {
                    mainInfo.textContent = data.weeklytrackchart.track[i].name;
                    subInfo = document.createElement("p");
                    subInfo.textContent = data.weeklytrackchart.track[i].artist["#text"];
                    mainInfo.appendChild(subInfo);
                }

                tr.appendChild(num);
                tr.appendChild(mainInfo);
                document.getElementById(getChart[x + 3]).appendChild(tr);
            }
        }
    } catch(error) {
        alert("ERRO: " + error);
    }
}

function updateCharts(period) {
    let input, firstDay, lastDay;
    cleanChildren('artists-chart');
    cleanChildren('albums-chart');
    cleanChildren('songs-chart');

    switch (period) {
        case "Anual":
            input = document.getElementById("year-select").value;
            firstDay = new Date(input, 0, 1);
            lastDay = new Date(input, 11, 31, 23, 59, 59);
            printCharts(firstDay.getTime() / 1000, lastDay.getTime() / 1000);
            document.getElementById("chart-period").textContent = "ANUAL";
            document.getElementById("chart-time").textContent = firstDay.getFullYear();
            break;

        case "Mensal":
            input = document.getElementById("month-input").value.split('-');
            firstDay = new Date(input[0], input[1] - 1, 1);
            lastDay = new Date(input[0], input[1], 0, 23, 59, 59);
            printCharts(firstDay.getTime() / 1000, lastDay.getTime() / 1000);
            document.getElementById("chart-period").textContent = "MENSAL";
            document.getElementById("chart-time").textContent = MONTHS[input[1] - 1] + " de " + firstDay.getFullYear();
            break;

        case "Semanal":
            input = document.getElementById("week-input").value.split('-W');
            firstDay = getWeekMonday(input[0], input[1]);
            lastDay = new Date(firstDay.getTime() + 604799000);
            printCharts(firstDay.getTime() / 1000, lastDay.getTime() / 1000);
            document.getElementById("chart-period").textContent = "SEMANAL";
            document.getElementById("chart-time").textContent = firstDay.toLocaleDateString("en-GB") + " - " + lastDay.toLocaleDateString("en-GB");
            break;
    }

    document.getElementById("chart-info").scrollIntoView({behavior: "smooth"});
}

function darkMode() {
    document.getElementById("chart-info").classList.toggle("darkMode")
}

let logoIsToggled = false;
function toggleLogo() {
    logoIsToggled = !logoIsToggled;
    if (logoIsToggled) {
        document.getElementById("chart-logo").hidden = false;
    } else {
        document.getElementById("chart-logo").hidden = true;
    }
}

function changeGradient() {
    let color1 = document.getElementById("gradientColor1").value;
    let color2 = document.getElementById("gradientColor2").value;
    let angle = document.getElementById("gradientAngle").value;

    if (angle.length > 1) {
        angle = angle;
    } else {
        angle = Math.random() * 360;
    }

    if (color1.length > 2 && color2.length > 2) {
        color1 = ", " + color1;
        color2 = ", " + color2;
        document.getElementsByTagName("body")[0].style.backgroundImage = "linear-gradient(" + angle + "deg" + color1 + color2 + ")";
    } else {
        alert("Você tem que colocar cores no formato HEX, o ângulo não é necessário (caso não coloque um valor aleatório vai ser escolhido).");
    }
}