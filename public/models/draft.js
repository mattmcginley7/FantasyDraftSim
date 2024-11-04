document.addEventListener('DOMContentLoaded', function () {
    // Retrieve draft settings from localStorage
    const draftSettings = JSON.parse(localStorage.getItem('draftSettings'));
    if (!draftSettings) {
        console.error('Draft settings not found');
        return; // Exit if draft settings are not available
    }

    console.log('Draft settings loaded:', draftSettings);

    // Elements references from draft.html
    const draftOrder = document.getElementById('draft-order');
    const playerList = document.getElementById('player-list');
    const rosterList = document.getElementById('roster-list');
    const positionFilter = document.getElementById('position-filter');

    let players = [];
    let teams = [];
    let currentPickIndex = 0;

    initializeDraft();

    function initializeDraft() {
        // Create teams based on the number of teams in the settings
        teams = [];
        for (let i = 1; i <= draftSettings.num_teams; i++) {
            teams.push({ name: `Team ${i}`, roster: [] });
        }

        console.log('Teams initialized:', teams);

        // Display draft order
        displayDraftOrder();

        // Fetch players
        fetchPlayers();

        // Set up event listener for filtering players by position
        if (positionFilter) {
            positionFilter.addEventListener('change', filterPlayers);
        }
    }

    // Display draft order in a board format
    function displayDraftOrder() {
        draftOrder.innerHTML = ''; // Clear any existing draft order
        const draftBoard = document.createElement('div');
        draftBoard.classList.add('draft-board');

        // Create header row with team names
        const headerRow = document.createElement('div');
        headerRow.classList.add('draft-row');
        teams.forEach(team => {
            const teamHeader = document.createElement('div');
            teamHeader.classList.add('draft-cell', 'team-header');
            teamHeader.textContent = team.name;
            headerRow.appendChild(teamHeader);
        });
        draftBoard.appendChild(headerRow);

        // Create pick slots for each round
        for (let round = 1; round <= draftSettings.num_rounds; round++) {
            const roundRow = document.createElement('div');
            roundRow.classList.add('draft-row');
            teams.forEach((team, index) => {
                const pickCell = document.createElement('div');
                pickCell.classList.add('draft-cell');
                pickCell.dataset.teamIndex = index;
                pickCell.dataset.round = round;
                roundRow.appendChild(pickCell);
            });
            draftBoard.appendChild(roundRow);
        }

        draftOrder.appendChild(draftBoard); // Append the draft board to the container
    }

    // Fetch players from JSON file
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


    // Display players in individual rows
    function displayPlayers(filteredPlayers = players) {
        playerList.innerHTML = ''; // Clear player list
        filteredPlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.classList.add('player-card', 'player-row');

            playerCard.innerHTML = `
            <div class="player-rank">${player.id}.</div>
            <div class="player-info">
                <img src="../images/${player.name.replace(/\s+/g, '-')}.png" alt="${player.name}" class="player-image-small">
                <div class="player-details">
                    <span class="player-name">${player.name}</span>
                    <span class="player-position-team">${player.position} | ${player.team}</span>
                </div>
            </div>
            <div class="player-points">${player.projectedPoints.ppr} PPR</div>
            <div class="draft-button-container">
                <button class="draft-button">Draft</button>
            </div>
        `;

            playerCard.querySelector('.draft-button').addEventListener('click', () => draftPlayer(player));
            playerList.appendChild(playerCard);
        });
    }

    // Filter players by position when dropdown changes
    function filterPlayers() {
        const position = positionFilter.value;
        const filteredPlayers = position === 'ALL' ? players : players.filter(p => p.position === position);
        displayPlayers(filteredPlayers);
    }

    // Draft a player manually
    function draftPlayer(player) {
        const currentTeam = teams[currentPickIndex % teams.length];
        currentTeam.roster.push(player);
        players = players.filter(p => p.id !== player.id);

        // Update draft board with the drafted player
        const round = Math.floor(currentPickIndex / teams.length) + 1;
        const teamIndex = currentPickIndex % teams.length;
        const pickCell = draftOrder.querySelector(`.draft-cell[data-team-index="${teamIndex}"][data-round="${round}"]`);
        if (pickCell) {
            pickCell.textContent = `${player.name} (${player.position})`;
            pickCell.classList.add('drafted');
        }

        // Mark player as drafted and update the display
        displayPlayers();
        displayRosters();

        // Move to the next pick
        currentPickIndex++;

        // Auto draft for other teams if it's not the user's turn
        while (currentPickIndex % teams.length !== draftSettings.user_pick - 1) {
            autoDraft(teams[currentPickIndex % teams.length]);
            currentPickIndex++;
        }
    }

    // Automatically draft a player for non-user teams
    function autoDraft(team) {
        if (players.length === 0) return;
        const bestPlayer = players.shift(); // Pick the highest-ranked player
        team.roster.push(bestPlayer);

        // Update draft board
        const round = Math.floor(currentPickIndex / teams.length) + 1;
        const teamIndex = currentPickIndex % teams.length;
        const pickCell = draftOrder.querySelector(`.draft-cell[data-team-index="${teamIndex}"][data-round="${round}"]`);
        if (pickCell) {
            pickCell.textContent = `${bestPlayer.name} (${bestPlayer.position})`;
            pickCell.classList.add('drafted');
        }

        // Update the player list and rosters
        displayPlayers();
        displayRosters();
    }

    // Display team rosters
    function displayRosters() {
        rosterList.innerHTML = ''; // Clear current roster display
        teams.forEach(team => {
            const teamDiv = document.createElement('div');
            teamDiv.innerHTML = `<h3>${team.name}</h3>`;
            const rosterUl = document.createElement('ul');

            // Group players by their positions
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

    // Helper function to group players by position
    function groupPlayersByPosition(roster) {
        return roster.reduce((acc, player) => {
            if (!acc[player.position]) {
                acc[player.position] = [];
            }
            acc[player.position].push(player);
            return acc;
        }, {});
    }
});
