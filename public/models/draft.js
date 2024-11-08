const playerList = document.getElementById('player-list'); // Define playerList here

document.addEventListener('DOMContentLoaded', function () {
    initializeDraft();
});

document.addEventListener('DOMContentLoaded', function () {
    const numTeams = parseInt(localStorage.getItem('numTeams') || 10); // Default to 10 if not set
    const draftGrid = document.getElementById('draft-grid');
    const teamsHeader = document.getElementById('teams-header');

    // Ensure elements exist before proceeding
    if (!teamsHeader || !draftGrid) {
        console.error('Missing required elements for draft display');
        return;
    }

    // Set the number of teams as a CSS variable to control grid columns
    document.documentElement.style.setProperty('--num-teams', numTeams);

    // Display team headers above the draft grid
    teamsHeader.innerHTML = ''; // Clear any existing team headers
    teamsHeader.style.gridTemplateColumns = `repeat(${numTeams}, minmax(100px, 1fr))`;
    for (let i = 1; i <= numTeams; i++) {
        const teamHeader = document.createElement('div');
        teamHeader.classList.add('team-header');
        teamHeader.textContent = `Team ${i}`;
        teamsHeader.appendChild(teamHeader);
    }

    // Create grid for rounds and teams
    draftGrid.innerHTML = ''; // Clear any existing draft grid content
    draftGrid.style.gridTemplateColumns = `repeat(${numTeams}, minmax(100px, 1fr))`;
    for (let round = 1; round <= 15; round++) { // Assuming 15 rounds
        for (let team = 1; team <= numTeams; team++) {
            const pickSlot = document.createElement('div');
            pickSlot.classList.add('draft-slot');
            pickSlot.dataset.round = round;
            pickSlot.dataset.team = team;
            draftGrid.appendChild(pickSlot);
        }
    }

    initializeDraft();
});

function initializeDraft() {
    const draftSettings = JSON.parse(localStorage.getItem('draftSettings'));
    const numTeams = parseInt(localStorage.getItem('numTeams') || 10); // Default to 10 if not set
    const numRounds = draftSettings ? draftSettings.num_rounds : 15; // Default to 15 rounds

    const teamsHeader = document.getElementById('teams-header');
    const draftGrid = document.getElementById('draft-grid');

    // Ensure elements exist
    if (!teamsHeader || !draftGrid) {
        console.error('Missing required elements for draft display');
        return;
    }

    // Set CSS variable for grid column count
    document.documentElement.style.setProperty('--num-teams', numTeams);

    // Populate the team headers
    teamsHeader.innerHTML = ''; // Clear existing headers
    teamsHeader.style.gridTemplateColumns = `repeat(${numTeams}, 1fr)`;
    for (let i = 1; i <= numTeams; i++) {
        const teamHeader = document.createElement('div');
        teamHeader.classList.add('team-header');
        teamHeader.textContent = `Team ${i}`;
        teamsHeader.appendChild(teamHeader);
    }

    // Populate the draft grid
    draftGrid.innerHTML = ''; // Clear existing grid content
    draftGrid.style.gridTemplateColumns = `repeat(${numTeams}, 1fr)`;

    for (let round = 1; round <= numRounds; round++) {
        for (let team = 1; team <= numTeams; team++) {
            const pickSlot = document.createElement('div');
            pickSlot.classList.add('draft-slot');
            pickSlot.dataset.round = round;
            pickSlot.dataset.team = team;
            draftGrid.appendChild(pickSlot);
        }
    }

    fetchPlayers();
}

function displayDraftOrder(numRounds) {
    const draftOrder = document.getElementById('draft-order');
    if (!draftOrder) {
        console.error('Missing draft order element');
        return;
    }

    const numTeams = parseInt(localStorage.getItem('numTeams') || 10);
    draftOrder.innerHTML = ''; // Clear any existing draft order

    const draftBoard = document.createElement('div');
    draftBoard.classList.add('draft-board');

    // Create header row with team names
    const headerRow = document.createElement('div');
    headerRow.classList.add('draft-row');
    for (let i = 1; i <= numTeams; i++) {
        const teamHeader = document.createElement('div');
        teamHeader.classList.add('draft-cell', 'team-header');
        teamHeader.textContent = `Team ${i}`;
        headerRow.appendChild(teamHeader);
    }
    draftBoard.appendChild(headerRow);

    // Create pick slots for each round
    for (let round = 1; round <= numRounds; round++) {
        const roundRow = document.createElement('div');
        roundRow.classList.add('draft-row');
        for (let team = 1; team <= numTeams; team++) {
            const pickCell = document.createElement('div');
            pickCell.classList.add('draft-cell');
            pickCell.dataset.team = team;
            pickCell.dataset.round = round;
            roundRow.appendChild(pickCell);
        }
        draftBoard.appendChild(roundRow);
    }

    draftOrder.appendChild(draftBoard); // Append the draft board to the container
}
async function fetchPlayers() {
    try {
        const response = await fetch('http://localhost:3000/api/players');
        const data = await response.json();
        players = data.players;
        players.sort((a, b) => a.id - b.id); // Sort players by id
        displayPlayers();
    } catch (error) {
        console.error('Error fetching players:', error);
    }
}

function displayPlayers(filteredPlayers = players) {
    playerList.innerHTML = ''; // Clear player list before adding new players
    filteredPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.classList.add('player-card', 'player-row');

        playerCard.innerHTML = `
            <div class="player-rank">${player.id}.</div>
            <img src="../images/${player.name.replace(/\s+/g, '-')}.png" alt="${player.name}" class="player-image-high-quality">
            <div class="player-info">
                <span class="player-name">${player.name}</span>
                <span class="player-position-team">${player.position} | ${player.team}</span>
                <span class="player-points">${player.projectedPoints.ppr} PPR</span>
            </div>
            <button class="draft-button">Draft</button>
        `;

        playerCard.querySelector('.draft-button').addEventListener('click', () => draftPlayer(player));
        playerList.appendChild(playerCard);
    });
}

function draftPlayer(player) {
    const currentTeam = teams[currentPickIndex % teams.length];
    currentTeam.roster.push(player);
    players = players.filter(p => p.id !== player.id); // Remove from draft pool for this session only

    const round = Math.floor(currentPickIndex / teams.length) + 1;
    const team = (currentPickIndex % teams.length) + 1;
    const draftSlot = document.querySelector(`.draft-slot[data-round="${round}"][data-team="${team}"]`);

    if (draftSlot) {
        draftSlot.textContent = `${player.name} (${player.position})`;
        draftSlot.classList.add('drafted');
    }

    displayPlayers();
    currentPickIndex++;
    displayRosters();
}

function autoDraft(team) {
    if (players.length === 0) return;
    const bestPlayer = players.shift();
    team.roster.push(bestPlayer);

    const round = Math.floor(currentPickIndex / teams.length) + 1;
    const teamIndex = currentPickIndex % teams.length;
    const pickCell = document.querySelector(`.draft-cell[data-team-index="${teamIndex}"][data-round="${round}"]`);
    if (pickCell) {
        pickCell.textContent = `${bestPlayer.name} (${bestPlayer.position})`;
        pickCell.classList.add('drafted');
    }

    displayPlayers();
    displayRosters();
}

function displayRosters() {
    rosterList.innerHTML = ''; // Clear current roster display
    teams.forEach(team => {
        const teamDiv = document.createElement('div');
        teamDiv.innerHTML = `<h3>${team.name}</h3>`;
        const rosterUl = document.createElement('ul');

        const groupedPlayers = groupPlayersByPosition(team.roster);
        Object.keys(groupedPlayers).forEach(position => {
            const positionLi = document.createElement('li');
            positionLi.innerHTML = `<strong>${position}:</strong> ${groupedPlayers[position].map(p => p.name).join(', ')}`;
            rosterUl.appendChild(positionLi);
        });

        teamDiv.appendChild(rosterUl);
        rosterList.appendChild(teamDiv);
    });
}

function groupPlayersByPosition(roster) {
    return roster.reduce((acc, player) => {
        if (!acc[player.position]) {
            acc[player.position] = [];
        }
        acc[player.position].push(player);
        return acc;
    }, {});
}
